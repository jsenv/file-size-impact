import { generateSnapshotFile, none, gzip, brotli } from "../../../index.js"
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
  transformations: { none, gzip, brotli },
})
