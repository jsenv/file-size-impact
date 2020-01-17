const {
  reportSizeImpactIntoGithubPullRequest,
} = require("@jsenv/github-pull-request-filesize-impact")
const { projectDirectoryUrl } = require("../jsenv.config.js")

reportSizeImpactIntoGithubPullRequest({
  logLevel: "debug",
  projectDirectoryUrl,
  baseSnapshotFileRelativeUrl: process.argv[2],
  headSnapshotFileRelativeUrl: process.argv[3],
  generatedByLink: false,
})
