import { createDetailedMessage, createLogger } from "@jsenv/logger"
import { assertAndNormalizeDirectoryUrl, bufferToEtag, resolveUrl, readFile } from "@jsenv/util"

import { transform as rawTransform } from "./rawTransformation.js"
import { jsenvTrackingConfig } from "./jsenvTrackingConfig.js"
import { applyTrackingConfig } from "./internal/applyTrackingConfig.js"

export const getFileSizeReport = async ({
  cancellationToken,
  logLevel,
  projectDirectoryUrl,
  trackingConfig = jsenvTrackingConfig,
  manifestConfig = {
    "./dist/**/manifest.json": true,
  },
  transformations = { raw: rawTransform },
}) => {
  projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)

  const logger = createLogger({ logLevel })

  const trackingNames = Object.keys(trackingConfig)
  if (trackingNames.length === 0) {
    logger.warn(`trackingConfig is empty`)
  }

  const groupTrackingResults = await applyTrackingConfig(trackingConfig, {
    cancellationToken,
    projectDirectoryUrl,
    manifestConfig,
  })
  const groupNames = Object.keys(groupTrackingResults)
  const groups = {}

  // ensure keys order is the same as trackingConfig (despite Promise.all below)
  groupNames.forEach((groupName) => {
    groups[groupName] = null
  })
  await Promise.all(
    groupNames.map(async (groupName) => {
      const groupTrackingResult = groupTrackingResults[groupName]
      const groupReport = await groupTrackingResultToGroupReport(groupTrackingResult, {
        logger,
        projectDirectoryUrl,
        tracking: trackingConfig[groupName],
        transformations,
      })
      groups[groupName] = groupReport
    }),
  )

  const fileSizeReport = {
    transformationKeys: Object.keys(transformations),
    groups,
  }

  return fileSizeReport
}

const groupTrackingResultToGroupReport = async (
  groupTrackingResult,
  { logger, projectDirectoryUrl, tracking, transformations },
) => {
  const manifestMap = {}
  const { manifestMetaMap } = groupTrackingResult
  const manifestRelativeUrls = Object.keys(manifestMetaMap)
  await Promise.all(
    manifestRelativeUrls.map(async (manifestRelativeUrl) => {
      const manifestFileUrl = resolveUrl(manifestRelativeUrl, projectDirectoryUrl)
      manifestMap[manifestRelativeUrl] = await readManifest(manifestFileUrl)
    }),
  )

  const fileMap = {}
  const { trackedMetaMap } = groupTrackingResult
  const trackedRelativeUrls = Object.keys(trackedMetaMap)
  // we use reduce and not Promise.all() because transformation can be expensive (gzip, brotli)
  // so we won't benefit from concurrency (it might even make things worse)
  await trackedRelativeUrls.reduce(async (previous, fileRelativeUrl) => {
    await previous
    const fileUrl = resolveUrl(fileRelativeUrl, projectDirectoryUrl)
    const fileContent = await readFile(fileUrl)
    const fileBuffer = Buffer.from(fileContent)
    const sizeMap = await getFileSizeMap(fileBuffer, { transformations, logger, fileUrl })
    const hash = bufferToEtag(fileBuffer)
    fileMap[fileRelativeUrl] = {
      sizeMap,
      hash,
      meta: trackedMetaMap[fileRelativeUrl],
    }
  }, Promise.resolve())

  return {
    tracking,
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
      logger.error(
        createDetailedMessage(`error while transforming ${fileUrl} with ${sizeName}`, {
          "error stack": e.stack,
        }),
      )
      sizeMap[sizeName] = "error"
    }
  }, Promise.resolve())
  return sizeMap
}

const readManifest = async (manifestFileUrl) => {
  const manifestFileContent = await readFile(manifestFileUrl)
  return JSON.parse(manifestFileContent)
}
