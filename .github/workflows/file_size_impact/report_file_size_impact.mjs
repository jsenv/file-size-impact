import { reportFileSizeImpact, readGitHubWorkflowEnv } from "@jsenv/file-size-impact"

reportFileSizeImpact({
  ...readGitHubWorkflowEnv(),
  logLevel: "debug",
  buildCommand: "npm pack",
})
