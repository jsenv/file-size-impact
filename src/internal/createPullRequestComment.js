// https://developer.github.com/v3/issues/comments/#edit-a-comment
const fetch = import.meta.require("node-fetch")

export const createPullRequestComment = async ({
  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  commentBody,
}) => {
  let createPullRequestCommentResponse
  try {
    createPullRequestCommentResponse = await genericCreatePullRequestComment({
      githubToken,
      repositoryOwner,
      repositoryName,
      pullRequestNumber,
      commentBody,
    })
  } catch (e) {
    throw createErrorWhileCreatingPullRequestComment({
      error: e,
      pullRequestNumber,
      repositoryName,
      repositoryOwner,
    })
  }
  if (createPullRequestCommentResponse.status !== 201) {
    throw createUnexpectedResponseForCreatePullRequestComment({
      response: createPullRequestCommentResponse,
      responseBodyAsJson: await createPullRequestCommentResponse.json(),
    })
  }

  const comment = await createPullRequestCommentResponse.json()
  return comment
}

const genericCreatePullRequestComment = async ({
  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  commentBody,
}) => {
  const body = JSON.stringify({ body: commentBody })
  const response = await fetch(
    `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`,
    {
      headers: {
        "authorization": `token ${githubToken}`,
        "content-length": Buffer.byteLength(body),
      },
      method: "POST",
      body,
    },
  )
  return response
}

const createErrorWhileCreatingPullRequestComment = ({
  error,
  pullRequestNumber,
  repositoryName,
  repositoryOwner,
}) =>
  new Error(`error while creating pull request comment.
error: ${error.stack}
pull request number: ${pullRequestNumber}
repository name: ${repositoryName}
repository owner: ${repositoryOwner}`)

const createUnexpectedResponseForCreatePullRequestComment = ({ response, responseBodyAsJson }) =>
  new Error(`create pull request comment failed: response status should be 201.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
