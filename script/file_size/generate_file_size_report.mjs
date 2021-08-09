import { getFileSizeReport, logFileSizeReport } from "@jsenv/file-size-impact"

export const generateFileSizeReport = async () => {
  return getFileSizeReport({
    projectDirectoryUrl: new URL("./", import.meta.url),
    trackingConfig: {
      "npm tarball": {
        "./jsenv-file-size-impact-*.tgz": true,
      },
    },
  })
}

const executeAndLog = process.argv.includes("--local")
if (executeAndLog) {
  const fileSizeReport = await generateFileSizeReport({
    runCount: 1,
    jsonFile: true,
    htmlFile: true,
  })
  logFileSizeReport(fileSizeReport)
}
