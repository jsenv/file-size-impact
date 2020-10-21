import {
  urlToFileSystemPath,
  metaMapToSpecifierMetaMap,
  collectDirectoryMatchReport,
} from "@jsenv/util"
import { createCancellationToken } from "@jsenv/cancellation"

export const applyTrackingConfig = async (
  trackingConfig,
  { cancellationToken = createCancellationToken(), projectDirectoryUrl, manifestConfig },
) => {
  const result = {}
  const trackingNames = Object.keys(trackingConfig)
  // ensure keys order is the same as trackingConfig (despite Promise.all below)
  trackingNames.forEach((trackingName) => {
    result[trackingName] = null
  })
  await Promise.all(
    trackingNames.map(async (trackingName) => {
      const tracking = trackingConfig[trackingName]
      const groupTrackingResult = await applyTracking(tracking, {
        projectDirectoryUrl,
        manifestConfig,
      })
      result[trackingName] = groupTrackingResult
      cancellationToken.throwIfRequested()
    }),
  )
  return result
}

const applyTracking = async (tracking, { projectDirectoryUrl, manifestConfig }) => {
  const specifierMetaMap = metaMapToSpecifierMetaMap({
    track: tracking,
    ...(manifestConfig ? { manifest: manifestConfig } : {}),
  })

  let directoryMatchReport

  try {
    directoryMatchReport = await collectDirectoryMatchReport({
      directoryUrl: projectDirectoryUrl,
      specifierMetaMap,
      predicate: (meta) => Boolean(meta.track) || Boolean(meta.manifest),
    })
  } catch (e) {
    const directoryPath = urlToFileSystemPath(projectDirectoryUrl)
    if (e.code === "ENOENT" && e.path === directoryPath) {
      console.warn(`${directoryPath} does not exists`)
      return []
    }
    throw e
  }

  const { matchingArray, ignoredArray } = directoryMatchReport

  const trackedMetaMap = {}
  const ignoredMetaMap = {}
  const manifestMetaMap = {}
  ignoredArray.forEach(({ relativeUrl, meta }) => {
    ignoredMetaMap[meta] = relativeUrl
  })
  matchingArray.forEach(({ relativeUrl, meta }) => {
    if (meta.manifest) {
      manifestMetaMap[relativeUrl] = meta
    } else {
      trackedMetaMap[relativeUrl] = meta
    }
  })

  return {
    trackedMetaMap,
    ignoredMetaMap,
    manifestMetaMap,
  }
}
