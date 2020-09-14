import { createLogger } from "@jsenv/logger"
import { assertAndNormalizeDirectoryUrl, bufferToEtag, resolveUrl, readFile } from "@jsenv/util"
import { createCancellationToken } from "@jsenv/cancellation"
import { applyTrackingConfig } from "./applyTrackingConfig.js"

export const generateSnapshot = async ({
  cancellationToken = createCancellationToken(),
  logLevel,
  projectDirectoryUrl,
  trackingConfig,
  manifestConfig,
  transformations,
}) => {
  const logger = createLogger({ logLevel })

  projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)

  const trackingNames = Object.keys(trackingConfig)
  if (trackingNames.length === 0) {
    logger.warn(`trackingConfig is empty`)
  }

  const groupTrackingResults = await applyTrackingConfig(trackingConfig, {
    cancellationToken,
    projectDirectoryUrl,
    manifestConfig,
  })
  const snapshot = {}
  await Promise.all(
    Object.keys(groupTrackingResults).map(async (trackingGroupName) => {
      const groupTrackingResult = groupTrackingResults[trackingGroupName]
      const groupSnapshot = await groupTrackingResultToGroupSnapshot(groupTrackingResult, {
        logger,
        projectDirectoryUrl,
        transformations,
      })
      snapshot[trackingGroupName] = groupSnapshot
    }),
  )
  const snapshotFileContent = JSON.stringify(snapshot, null, "  ")
  logger.debug(snapshotFileContent)
  return snapshot
}

const groupTrackingResultToGroupSnapshot = async (
  groupTrackingResult,
  { logger, projectDirectoryUrl, transformations },
) => {
  const manifestMap = {}
  const { manifestRelativeUrls } = groupTrackingResult
  await Promise.all(
    manifestRelativeUrls.map(async (manifestRelativeUrl) => {
      const manifestFileUrl = resolveUrl(manifestRelativeUrl, projectDirectoryUrl)
      manifestMap[manifestRelativeUrl] = await readManifest(manifestFileUrl)
    }),
  )

  const fileMap = {}
  const { matchingRelativeUrls } = groupTrackingResult
  // we use reduce and not Promise.all() because transformation can be expensive (gzip, brotli)
  // so we won't benefit from concurrency (it might even make things worse)
  await matchingRelativeUrls.reduce(async (previous, fileRelativeUrl) => {
    await previous
    const fileUrl = resolveUrl(fileRelativeUrl, projectDirectoryUrl)
    const fileContent = await readFile(fileUrl)
    const fileBuffer = Buffer.from(fileContent)
    const sizeMap = await getFileSizeMap(fileBuffer, { transformations, logger, fileUrl })
    const hash = bufferToEtag(fileBuffer)
    fileMap[fileRelativeUrl] = {
      sizeMap,
      hash,
    }
  }, Promise.resolve())

  return {
    manifestMap,
    fileMap,
  }
}

const getFileSizeMap = async (fileBuffer, { transformations, logger, fileUrl }) => {
  const sizeMap = {}
  await Object.keys(transformations).reduce(async (previous, sizeName) => {
    await previous
    const transform = transformations[sizeName]
    try {
      const transformResult = await transform(fileBuffer)
      sizeMap[sizeName] = Buffer.from(transformResult).length
    } catch (e) {
      logger.debug(`error while transforming ${fileUrl} with ${sizeName}.
--- error stack ---
${e.stack}`)
      sizeMap[sizeName] = "error"
    }
  }, Promise.resolve())
  return sizeMap
}

const readManifest = async (manifestFileUrl) => {
  const manifestFileContent = await readFile(manifestFileUrl)
  return JSON.parse(manifestFileContent)
}
