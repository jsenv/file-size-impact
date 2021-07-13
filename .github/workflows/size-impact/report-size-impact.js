import { reportFileSizeImpact, raw, gzip, brotli, readGitHubWorkflowEnv } from "../../../index.js"

reportFileSizeImpact({
  ...readGitHubWorkflowEnv(),
  logLevel: "debug",
  buildCommand: "npm run dist",
  trackingConfig: {
    "dist/commonjs": {
      "./dist/commonjs/**/*": true,
      "./dist/commonjs/**/*.map": false,
    },
  },
  transformations: { raw, gzip, brotli },
})
