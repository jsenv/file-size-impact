import { getFileSizeReport, logFileSizeReport } from "@jsenv/file-size-impact"

const fileSizeReport = await getFileSizeReport({
  projectDirectoryUrl: new URL("./", import.meta.url),
  trackingConfig: {
    "first group": {
      "./dist/**/*.js": true,
      "./dist/**/*.html": false,
      "./dist/directory/": false,
    },
    "second group": {
      "./dist-2/**/*.js": true,
    },
  },
})

logFileSizeReport(fileSizeReport)
