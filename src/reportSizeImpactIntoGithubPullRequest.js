import { createLogger } from "@jsenv/logger"
import { getPullRequestCommentMatching } from "./internal/getPullRequestCommentMatching.js"
import { createPullRequestComment } from "./internal/createPullRequestComment.js"
import { updatePullRequestComment } from "./internal/updatePullRequestComment.js"
import { generatePullRequestCommentString } from "./internal/generatePullRequestCommentString.js"
import { compareTwoSnapshots } from "./internal/compareTwoSnapshots.js"
import { normalizeDirectoryUrl } from "./internal/normalizeDirectoryUrl.js"
import { resolveUrl, urlToFilePath } from "./internal/urlUtils.js"
import { readFileContent } from "./internal/filesystemUtils.js"

const regexForMergingSizeImpact = /Merging .*? into .*? would .*? size/

export const reportSizeImpactIntoGithubPullRequest = async ({
  logLevel,
  projectDirectoryUrl,
  baseSnapshotFileRelativeUrl = "../base/file-size-snapshot.json",
  headSnapshotFileRelativeUrl = "../head/file-size-snapshot.json",
  formatSize,
  generatedByLink,
}) => {
  const logger = createLogger({ logLevel })

  projectDirectoryUrl = normalizeDirectoryUrl(projectDirectoryUrl)

  const {
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    pullRequestBase,
    pullRequestHead,
    githubToken,
  } = getOptionsFromGithubAction()

  const baseSnapshotFileUrl = resolveUrl(baseSnapshotFileRelativeUrl, projectDirectoryUrl)
  const headSnapshotFileUrl = resolveUrl(headSnapshotFileRelativeUrl, projectDirectoryUrl)
  const baseSnapshotFilePath = urlToFilePath(baseSnapshotFileUrl)
  const headSnapshotFilePath = urlToFilePath(headSnapshotFileUrl)

  logger.info(`
compare file snapshots
--- base snapshot file path ---
${baseSnapshotFilePath}
--- head snapshot file path ---
${headSnapshotFilePath}
`)
  const snapshotsPromise = Promise.all([
    readFileContent(baseSnapshotFilePath),
    readFileContent(headSnapshotFilePath),
  ])

  logger.info(
    `
search for existing comment inside pull request.
--- pull request url ---
${getPullRequestHref({
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
})}
`,
  )
  const existingCommentPromise = getPullRequestCommentMatching({
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    githubToken,
    regex: regexForMergingSizeImpact,
  })

  const [[baseSnapshotFileContent, headSnapshotFileContent], existingComment] = await Promise.all([
    snapshotsPromise,
    existingCommentPromise,
  ])

  const snapshotComparison = compareTwoSnapshots(
    JSON.parse(baseSnapshotFileContent),
    JSON.parse(headSnapshotFileContent),
  )

  const pullRequestCommentString = generatePullRequestCommentString({
    pullRequestBase,
    pullRequestHead,
    snapshotComparison,
    formatSize,
    generatedByLink,
  })

  if (!pullRequestCommentString) {
    logger.warn(`
aborting because the pull request comment would be empty.
May happen whem a snapshot file is empty for instance
`)
  }

  if (existingComment) {
    logger.info(`comment found, updating it
--- comment href ---
${existingComment.html_url}`)
    const comment = await updatePullRequestComment({
      githubToken,
      repositoryOwner,
      repositoryName,
      pullRequestNumber,
      commentId: existingComment.id,
      commentBody: pullRequestCommentString,
    })
    logger.info(`comment updated at ${existingComment.html_url}`)
    return comment
  }

  logger.info(`comment not found, creating a comment`)
  const comment = await createPullRequestComment({
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    githubToken,
    commentBody: pullRequestCommentString,
  })
  logger.info(`comment created at ${comment.html_url}`)
  return comment
}

const getOptionsFromGithubAction = () => {
  const eventName = process.env.GITHUB_EVENT_NAME
  if (!eventName) {
    throw new Error(`missing process.env.GITHUB_EVENT_NAME, we are not in a github action`)
  }
  if (eventName !== "pull_request") {
    throw new Error(`getOptionsFromGithubAction must be called only in a pull request action`)
  }

  const githubRepository = process.env.GITHUB_REPOSITORY
  if (!githubRepository) {
    throw new Error(`missing process.env.GITHUB_REPOSITORY`)
  }

  const [repositoryOwner, repositoryName] = githubRepository.split("/")

  const githubRef = process.env.GITHUB_REF
  if (!githubRef) {
    throw new Error(`missing process.env.GITHUB_REF`)
  }
  const pullRequestNumber = githubRefToPullRequestNumber(githubRef)
  if (!pullRequestNumber) {
    throw new Error(`cannot get pull request number from process.env.GITHUB_REF
--- process.env.GITHUB_REF ---
${githubRef}`)
  }

  const githubBaseRef = process.env.GITHUB_BASE_REF
  if (!githubBaseRef) {
    throw new Error(`missing process.env.GITHUB_BASE_REF`)
  }
  const pullRequestBase = githubBaseRef

  const githubHeadRef = process.env.GITHUB_HEAD_REF
  if (!githubHeadRef) {
    throw new Error(`missing process.env.GITHUB_HEAD_REF`)
  }
  const pullRequestHead = githubHeadRef

  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    throw new Error(`missing process.env.GITHUB_TOKEN`)
  }

  return {
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    pullRequestBase,
    pullRequestHead,
    githubToken,
  }
}

const githubRefToPullRequestNumber = () => {
  const ref = process.env.GITHUB_REF
  const pullPrefix = "refs/pull/"
  const pullRequestNumberStartIndex = ref.indexOf(pullPrefix)
  if (pullRequestNumberStartIndex === -1) return undefined
  const afterPull = ref.slice(pullRequestNumberStartIndex + pullPrefix.length)
  const slashAfterPullIndex = afterPull.indexOf("/")
  if (slashAfterPullIndex === -1) return undefined
  const pullRequestNumberString = afterPull.slice(0, slashAfterPullIndex)
  return Number(pullRequestNumberString)
}

const getPullRequestHref = ({ repositoryOwner, repositoryName, pullRequestNumber }) =>
  `https://github.com/${repositoryOwner}/${repositoryName}/pull/${pullRequestNumber}`