import { reportFileSizeImpact, none, gzip, brotli, readGithubWorkflowEnv } from "../../index.js"

reportFileSizeImpact({
  ...readGithubWorkflowEnv(),
  logLevel: "debug",
  buildCommand: "npm run dist",
  trackingConfig: {
    "dist/commonjs": {
      "./dist/commonjs/**/*": true,
      "./dist/commonjs/**/*.map": false,
    },
  },
  transformations: { none, gzip, brotli },
})
