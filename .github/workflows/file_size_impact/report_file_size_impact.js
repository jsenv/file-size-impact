import { reportFileSizeImpact, raw, gzip, brotli, readGitHubWorkflowEnv } from "../../../index.js"

reportFileSizeImpact({
  ...readGitHubWorkflowEnv(),
  logLevel: "debug",
  buildCommand: "npm pack",
  trackingConfig: {
    "npm tarball": {
      "./jsenv-file-size-impact-*.tgz": true,
    },
  },
  transformations: { raw, gzip, brotli },
})
