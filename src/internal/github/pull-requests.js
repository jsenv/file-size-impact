import { getGithubRessource, postGithubRessource, patchGithubRessource } from "./github-rest.js"

// https://developer.github.com/v3/pulls/#get-a-pull-request
export const getPullRequest = ({ repositoryOwner, repositoryName, pullRequestNumber }, options) =>
  getGithubRessource(
    `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/pulls/${pullRequestNumber}`,
    options,
  )

export const getPullRequestCommentMatching = async (
  predicate,
  { repositoryOwner, repositoryName, pullRequestNumber },
  options,
) => {
  const comments = await getGithubRessource(
    `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`,
    options,
  )
  return comments.find(predicate)
}

export const postPullRequestComment = (
  commentBody,
  { repositoryOwner, repositoryName, pullRequestNumber },
  options,
) => {
  return postGithubRessource(
    `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`,
    { body: commentBody },
    options,
  )
}

export const patchPullRequestComment = (
  commentId,
  commentBody,
  { repositoryOwner, repositoryName },
  options,
) => {
  return patchGithubRessource(
    `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/comments/${commentId}`,
    { body: commentBody },
    options,
  )
}
