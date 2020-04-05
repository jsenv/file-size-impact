import { reportSizeImpactIntoGithubPullRequest } from "@jsenv/github-pull-request-filesize-impact"
import { projectDirectoryUrl } from "../../../jsenv.config.js"

reportSizeImpactIntoGithubPullRequest({
  logLevel: "debug",
  projectDirectoryUrl,
  baseSnapshotFileRelativeUrl: process.argv[2],
  headSnapshotFileRelativeUrl: process.argv[3],
  generatedByLink: false,
})
