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
import { generateSnapshot } from "./internal/generateSnapshot.js"
import { jsenvTrackingConfig } from "./jsenvTrackingConfig.js"
import { transform as noneTransform } from "./noneTransformation.js"

export const reportFileSizeImpact = async ({
  cancellationToken = createCancellationTokenForProcess(),
  logLevel,
  commandLogs = false,

  projectDirectoryUrl,
  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  installCommand = "npm install",
  buildCommand = "npm run-script build",

  trackingConfig = jsenvTrackingConfig,
  manifestConfig = {
    "./dist/**/manifest.json": true,
  },
  transformations = { none: noneTransform },

  formatSize = jsenvFormatSize,
  commentSections = {
    overallSizeImpact: true,
    detailedSizeImpact: true,
    cacheImpact: true,
  },
  runLink,
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

      const isFork = pullRequest.base.repo.full_name !== pullRequest.head.repo.full_name

      let headRef
      if (isFork) {
        // https://github.community/t/checkout-a-branch-from-a-fork/276/2
        headRef = `refs/pull/${pullRequestNumber}/merge`

        const isInGithubWorkflow = Boolean(process.env.GITHUB_EVENT_NAME)
        if (isInGithubWorkflow) {
          const isInPullRequestWorkflow = process.env.GITHUB_EVENT_NAME === "pull_request"
          if (isInPullRequestWorkflow) {
            logger.warn(
              `pull request comes from a fork, github token will not be authorized to post comment.
See https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token#permissions-for-the-github_token.
To allow pull request from forks to run, enable pull_request_target.
See https://github.blog/2020-08-03-github-actions-improvements-for-fork-and-pull-request-workflows/#improvements-for-public-repository-forks`,
            )
          }
        }
      } else {
        headRef = pullRequestHead
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
        /*
        I predict myself or others would assume the impact failed if a comment
        is not labelled as edited in github ui.
        Even if conceptually the comment was not edited because the content is the same.

        To ensure github ui shows comment as edited let's put
        a comment with pull request head commit sha in the message body.
        And let's put it all the time as it might be a valuable information
        */
        commentBody = `<!-- head-commit-sha=${pullRequest.head.sha} -->
${commentBody}
${renderGeneratedBy({ runLink })}`

        if (existingComment) {
          if (existingComment.body === commentBody) {
            logger.info(` existing comment body is the same -> skip comment PATCH`)
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
          onLog: (string) => {
            if (commandLogs) {
              logger.info(string)
            }
          },
          onErrorLog: (string) => logger.error(string),
        })
      }

      const ensuteGitConfig = async (name, valueIfMissing) => {
        try {
          await execCommandInProjectDirectory(`git config ${name}`)
          return () => {}
        } catch (e) {
          await execCommandInProjectDirectory(`git config ${name} "${valueIfMissing}"`)
          return async () => {
            await execCommandInProjectDirectory(`git config --unset ${name}`)
          }
        }
      }

      const ensureGitUserEmail = () => ensuteGitConfig("user.email", "you@example.com")
      const ensureGitUserName = () => ensuteGitConfig("user.name", "Your Name")

      const fetchRef = async (ref) => {
        // cannot use depth=1 arg otherwise git merge might have merge conflicts
        await execCommandInProjectDirectory(`git fetch --no-tags --prune origin ${ref}`)
      }

      let baseSnapshot
      try {
        await fetchRef(pullRequestBase)
        await execCommandInProjectDirectory(`git checkout origin/${pullRequestBase}`)
        await execCommandInProjectDirectory(installCommand)
        await execCommandInProjectDirectory(buildCommand)
        baseSnapshot = await generateSnapshot({
          cancellationToken,
          logLevel,
          projectDirectoryUrl,
          trackingConfig,
          manifestConfig,
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
        // buildCommand might generate files that could conflict when doing the merge
        // reset to avoid potential merge conflicts
        await execCommandInProjectDirectory(`git reset --hard origin/${pullRequestBase}`)
        await fetchRef(headRef)
        // ensure there is user.email + user.name required to perform git merge command
        // without them git would complain that it does not know who we are
        const restoreGitUserEmail = await ensureGitUserEmail()
        const restoreGitUserName = await ensureGitUserName()
        await execCommandInProjectDirectory(`git merge FETCH_HEAD --allow-unrelated-histories`)
        await restoreGitUserEmail()
        await restoreGitUserName()
        await execCommandInProjectDirectory(installCommand)
        await execCommandInProjectDirectory(buildCommand)
        afterMergeSnapshot = await generateSnapshot({
          cancellationToken,
          logLevel,
          projectDirectoryUrl,
          trackingConfig,
          manifestConfig,
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
        }),
      )

      return { comment }
    },
    { catchCancellation: true, unhandledRejectionStrict: true },
  )
}

const getPullRequestUrl = ({ repositoryOwner, repositoryName, pullRequestNumber }) =>
  `https://github.com/${repositoryOwner}/${repositoryName}/pull/${pullRequestNumber}`

const renderGeneratedBy = ({ runLink }) => {
  return `<sub>
  Generated by ${renderSelfLink()}${renderRunLink(runLink)}
</sub>`
}

const renderSelfLink = () => {
  return `<a href="https://github.com/jsenv/jsenv-file-size-impact">file size impact</a>`
}

const renderRunLink = (runLink) => {
  if (!runLink) return ``

  if (typeof runLink !== "object") {
    console.warn(
      `runLink ignored because it should be an object with {url, text}, received ${runLink}`,
    )
    return ""
  }

  return ` during <a href="${runLink.url}">${runLink.text}</a>`
}
