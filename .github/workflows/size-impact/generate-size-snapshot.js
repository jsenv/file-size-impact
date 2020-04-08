import { generateSnapshotFile } from "@jsenv/github-pull-request-filesize-impact"
import { projectDirectoryUrl } from "../../../jsenv.config.js"

generateSnapshotFile({
  logLevel: "debug",
  projectDirectoryUrl,
  snapshotFileRelativeUrl: process.argv[2],
  trackingConfig: {
    "dist/commonjs": {
      "./dist/commonjs/**/*": true,
      "./dist/commonjs/**/*.map": false,
    },
  },
})
