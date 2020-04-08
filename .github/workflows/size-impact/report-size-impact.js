import { reportSizeImpactIntoGithubPullRequest } from "../../../index.js"
import { projectDirectoryUrl } from "../../../jsenv.config.js"

reportSizeImpactIntoGithubPullRequest({
  logLevel: "debug",
  projectDirectoryUrl,
  baseSnapshotFileRelativeUrl: process.argv[2],
  headSnapshotFileRelativeUrl: process.argv[3],
  generatedByLink: true,
})
