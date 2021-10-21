import { generateFileSizeReport } from "@jsenv/file-size-impact"

export const fileSizeReport = await generateFileSizeReport({
  log: process.argv.includes("--log"),
  projectDirectoryUrl: new URL("../../", import.meta.url),
  trackingConfig: {
    "example files": {
      "./dist/**/*.js": true,
    },
  },
})
