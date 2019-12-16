const { generateSnapshotFile } = require("@jsenv/github-pull-request-filesize-impact")
const { projectDirectoryUrl } = require("../jsenv.config.js")

generateSnapshotFile({
  projectDirectoryUrl,
  fileRelativeUrl: process.argv[2],
})
