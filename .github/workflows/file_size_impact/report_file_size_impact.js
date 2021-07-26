import { reportFileSizeImpact, raw, gzip, brotli, readGitHubWorkflowEnv } from "../../../index.js"

reportFileSizeImpact({
  ...readGitHubWorkflowEnv(),
  logLevel: "debug",
  buildCommand: "npm run dist",
  trackingConfig: {
    "some files": {
      "./index.js": true,
      "./src/reportFileSizeImpact.js": true,
    },
  },
  transformations: { raw, gzip, brotli },
})
