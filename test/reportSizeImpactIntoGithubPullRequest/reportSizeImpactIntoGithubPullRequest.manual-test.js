// import { assert } from '@jsenv/assert'
import { reportSizeImpactIntoGithubPullRequest } from "../../index.js"
// eslint-disable-next-line import/no-unresolved
import value from "../../secrets.json"

const testDirectoryUrl = import.meta.resolve("./")

process.env.GITHUB_EVENT_NAME = "pull_request"
process.env.GITHUB_REPOSITORY = "jsenv/jsenv-github-pull-request-filesize-impact"
process.env.GITHUB_REF = "refs/pull/5/merge"
process.env.GITHUB_BASE_REF = "master"
process.env.GITHUB_HEAD_REF = "doc"
process.env.GITHUB_TOKEN = value.GITHUB_TOKEN

reportSizeImpactIntoGithubPullRequest({
  logLevel: "debug",
  projectDirectoryUrl: testDirectoryUrl,
  baseSnapshotFileRelativeUrl: "base-snapshot.json",
  headSnapshotFileRelativeUrl: "head-snapshot.json",
})
