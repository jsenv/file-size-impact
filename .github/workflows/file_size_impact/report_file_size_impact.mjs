import { reportFileSizeImpact, readGitHubWorkflowEnv } from "@jsenv/file-size-impact"

reportFileSizeImpact({
  ...readGitHubWorkflowEnv(),
  logLevel: "debug",
  buildCommand: null,
  moduleGeneratingFileSizeReportRelativeUrl: "./script/file_size/generate_file_size_report.mjs",
})
