import { reportFileSizeImpact, readGitHubWorkflowEnv } from "@jsenv/file-size-impact"

await reportFileSizeImpact({
  ...readGitHubWorkflowEnv(),
  logLevel: "debug",
  buildCommand: null,
  fileSizeModulePath: "./script/file_size/generate_file_size_report.mjs",
})
