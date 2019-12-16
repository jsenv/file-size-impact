// import { assert } from '@jsenv/assert'
import { reportSizeImpactIntoGithubPullRequest } from "../index.js"
// eslint-disable-next-line import/no-unresolved
import value from "../../secrets.json"

const testDirectoryUrl = import.meta.resolve("./")

process.env.GITHUB_EVENT_NAME = "pull_request"
process.env.GITHUB_REPOSITORY = "jsenv/github-pull-request-filesize-impact"
process.env.GITHUB_REF = "refs/pull/1/merge"
process.env.GITHUB_BASE_REF = "master"
process.env.GITHUB_HEAD_REF = "size-reporting"
process.env.GITHUB_TOKEN = value.GITHUB_TOKEN_FOR_DMAIL_BOT

reportSizeImpactIntoGithubPullRequest({
  projectDirectoryUrl: `${testDirectoryUrl}/project`,
})
