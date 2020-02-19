import { generateSnapshotFile } from "@jsenv/github-pull-request-filesize-impact"

generateSnapshotFile({
  logLevel: "debug",
  projectDirectoryUrl: new URL("../../", import.meta.url),
  snapshotFileRelativeUrl: process.argv[2],
  directorySizeTrackingConfig: {
    "dist/commonjs": {
      "**/*": true,
      "**/*.map": false,
    },
  },
})
