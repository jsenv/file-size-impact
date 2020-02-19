import { generateSnapshotFile } from "@jsenv/github-pull-request-filesize-impact"
import { projectDirectoryUrl } from "../jsenv.config.js"

generateSnapshotFile({
  projectDirectoryUrl,
  snapshotFileRelativeUrl: process.argv[2],
  directorySizeTrackingConfig: {
    "dist/commonjs": {
      "**/*": true,
      "**/*.map": false,
    },
  },
})
