// eslint-disable-next-line import/no-unresolved
const { generateSnapshotFile } = require("@jsenv/github-pull-request-filesize-impact")
const { projectDirectoryUrl } = require("../jsenv.config.js")

generateSnapshotFile({
  projectDirectoryUrl,
  snapshotFileRelativeUrl: process.argv[2],
})
