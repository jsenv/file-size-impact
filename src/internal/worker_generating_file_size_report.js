import { parentPort } from "node:worker_threads"

parentPort.once("message", async ({ fileSizeModuleUrl }) => {
  const { generateFileSizeReport } = await import(fileSizeModuleUrl)

  if (typeof generateFileSizeReport !== "function") {
    throw new TypeError(
      `generateFileSizeReport export must be a function, got ${generateFileSizeReport}`,
    )
  }

  const fileSizeReport = await generateFileSizeReport()

  parentPort.postMessage({
    fileSizeReport,
  })
})
