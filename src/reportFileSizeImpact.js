import { createLogger } from "@jsenv/logger"
import { createOperation } from "@jsenv/cancellation"
import {
  assertAndNormalizeDirectoryUrl,
  urlToFileSystemPath,
  wrapExternalFunction,
  createCancellationTokenForProcess,
} from "@jsenv/util"
import {
  getPullRequest,
  getPullRequestCommentMatching,
  postPullRequestComment,
  patchPullRequestComment,
} from "./internal/github/pull-requests.js"
import { exec } from "./internal/exec.js"
import { HEADER, formatComment } from "./internal/comment/formatComment.js"
import { jsenvFormatSize } from "./internal/comment/jsenvFormatSize.js"
import { generateSnapshotFile } from "./internal/generateSnapshotFile.js"
import { jsenvTrackingConfig } from "./jsenvTrackingConfig.js"
import { transform as noneTransform } from "./noneTransformation.js"

export const reportFileSizeImpact = async ({
  cancellationToken = createCancellationTokenForProcess(),
  logLevel,
  projectDirectoryUrl,
  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  installCommand = "npm install",
  buildCommand = "npm run build",

  trackingConfig = jsenvTrackingConfig,
  manifestFilePattern = "./**/manifest.json",
  transformations = { none: noneTransform },

  formatSize = jsenvFormatSize,
  commentSections = {
    overallSizeImpact: true,
    detailedSizeImpact: true,
    cacheImpact: true,
  },
  generatedByLink = true,
}) => {
  return wrapExternalFunction(
    async () => {
      projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)
      if (typeof githubToken !== "string") {
        throw new TypeError(`githubToken must be a string but received ${githubToken}`)
      }
      if (typeof repositoryOwner !== "string") {
        throw new TypeError(`repositoryOwner must be a string but received ${repositoryOwner}`)
      }
      if (typeof repositoryName !== "string") {
        throw new TypeError(`repositoryName must be a string but received ${repositoryName}`)
      }
      pullRequestNumber = String(pullRequestNumber)
      if (typeof pullRequestNumber !== "string") {
        throw new TypeError(`pullRequestNumber must be a string but received ${pullRequestNumber}`)
      }
      if (typeof installCommand !== "string") {
        throw new TypeError(`installCommand must be a string but received ${installCommand}`)
      }

      const logger = createLogger({ logLevel })
      logger.debug(`projectDirectoryUrl: ${projectDirectoryUrl}`)

      logger.debug(
        `get pull request ${getPullRequestUrl({
          repositoryOwner,
          repositoryName,
          pullRequestNumber,
        })}`,
      )
      const pullRequest = await getPullRequest(
        { repositoryOwner, repositoryName, pullRequestNumber },
        { cancellationToken, githubToken },
      )
      const pullRequestBase = pullRequest.base.ref
      const pullRequestHead = pullRequest.head.ref

      let headRef
      if (pullRequest.base.repo.full_name === pullRequest.head.repo.full_name) {
        headRef = pullRequestHead
      } else {
        const isInsideGithubWorkflow = Boolean(process.env.GITHUB_EVENT_NAME)
        if (isInsideGithubWorkflow) {
          // warn about
          // https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token#permissions-for-the-github_token
          logger.warn(
            `pull request comes from a fork, github token is likely going to be unauthorized to post comment`,
          )
        }
        // https://github.community/t/checkout-a-branch-from-a-fork/276/2
        headRef = `refs/pull/${pullRequestNumber}/merge`
      }

      logger.debug(
        `searching comment in pull request ${getPullRequestUrl({
          repositoryOwner,
          repositoryName,
          pullRequestNumber,
        })}`,
      )
      const existingComment = await createOperation({
        cancellationToken,
        start: () =>
          getPullRequestCommentMatching(
            ({ body }) => body.includes(HEADER),
            {
              repositoryOwner,
              repositoryName,
              pullRequestNumber,
            },
            { cancellationToken, githubToken },
          ),
      })
      if (existingComment) {
        logger.debug(`comment found at ${existingComment.html_url}.`)
      } else {
        logger.debug(`comment not found`)
      }

      const patchOrPostComment = async (commentBody) => {
        if (existingComment) {
          if (existingComment.body === commentBody) {
            // maybe users will think
            // "hey my comment was not edited, the workflow have failed ?"
            // but because github will not put the "edited" label if
            // comment body are exactly the same it means
            // our comment should contains something unique to the run
            // maybe the head commit sha in comment as below
            // <!-- head-commit-sha=${pullRequest.head.sha} -->
            logger.info(`skipping comment updated because existing comment body is the same`)
            return existingComment
          }
          logger.info(`updating comment at ${existingComment.html_url}`)
          const comment = await patchPullRequestComment(
            existingComment.id,
            commentBody,
            {
              repositoryOwner,
              repositoryName,
              pullRequestNumber,
            },
            {
              cancellationToken,
              githubToken,
            },
          )
          logger.info("comment updated")
          return comment
        }

        logger.info(`creating comment`)
        const comment = await postPullRequestComment(
          commentBody,
          {
            repositoryOwner,
            repositoryName,
            pullRequestNumber,
          },
          {
            cancellationToken,
            githubToken,
          },
        )
        logger.info(`comment created at ${comment.html_url}`)
        return comment
      }

      const execCommandInProjectDirectory = (command) => {
        logger.info(`> ${command}`)
        return exec(command, {
          cwd: urlToFileSystemPath(projectDirectoryUrl),
        })
      }

      let baseSnapshot
      try {
        await execCommandInProjectDirectory(
          `git fetch --no-tags --prune --depth=1 origin ${pullRequestBase}`,
        )
        await execCommandInProjectDirectory(`git checkout origin/${pullRequestBase}`)
        await execCommandInProjectDirectory(installCommand)
        await execCommandInProjectDirectory(buildCommand)
        baseSnapshot = await generateSnapshotFile({
          cancellationToken,
          logLevel,
          projectDirectoryUrl,
          trackingConfig,
          manifestFilePattern,
          transformations,
        })
      } catch (error) {
        logger.error(error.stack)
        const comment = await patchOrPostComment(`${HEADER}

---

**Error:** Error while trying to generate a snapshot for ${pullRequestBase}.

<pre>${error.stack}</pre>

---`)

        return { error, comment }
      }

      let afterMergeSnapshot
      try {
        await execCommandInProjectDirectory(`git fetch --no-tags --prune origin ${headRef}`)
        /*
        When this is running in a pull request opened from a fork
        the following happens:
        - it works as expected
        - git throw an error: Refusing to merge unrelated histories.
        git merge accepts an --allow-unrelated-histories flag.
        https://github.com/git/git/blob/master/Documentation/RelNotes/2.9.0.txt#L58-L68
        But when using it git complains that it does not know who we are
        and asks for git config email.

        For now this work with fork but sometimes it does not.
        If one day fork becomes supported by github action or someone is running
        this code against forks from an other CI this needs to be fixed
        */
        await execCommandInProjectDirectory(`git merge FETCH_HEAD`)
        await execCommandInProjectDirectory(installCommand)
        await execCommandInProjectDirectory(buildCommand)
        afterMergeSnapshot = await generateSnapshotFile({
          cancellationToken,
          logLevel,
          projectDirectoryUrl,
          trackingConfig,
          manifestFilePattern,
          transformations,
        })
      } catch (error) {
        logger.error(error.stack)
        const comment = await patchOrPostComment(`${HEADER}

---

**Error:** Error while trying to generate a snapshot for ${pullRequestHead} merge into ${pullRequestBase}.

<pre>${error.stack}</pre>

---`)

        return { error, comment }
      }

      const comment = await patchOrPostComment(
        formatComment({
          pullRequestBase,
          pullRequestHead,
          trackingConfig,
          baseSnapshot,
          afterMergeSnapshot,
          formatSize,
          commentSections,
          generatedByLink,
        }),
      )

      return { comment }
    },
    { catchCancellation: true, unhandledRejectionStrict: true },
  )
}

const getPullRequestUrl = ({ repositoryOwner, repositoryName, pullRequestNumber }) =>
  `https://github.com/${repositoryOwner}/${repositoryName}/pull/${pullRequestNumber}`
