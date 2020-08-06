import { createLogger } from "@jsenv/logger"
import {
  assertAndNormalizeDirectoryUrl,
  bufferToEtag,
  resolveUrl,
  urlToFileSystemPath,
  readFile,
  metaMapToSpecifierMetaMap,
  collectFiles,
} from "@jsenv/util"
import { createCancellationToken } from "@jsenv/cancellation"

export const generateSnapshot = async ({
  cancellationToken = createCancellationToken(),
  logLevel,
  projectDirectoryUrl,
  trackingConfig,
  manifestFilePattern,
  transformations,
}) => {
  const logger = createLogger({ logLevel })

  projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)

  const trackingNames = Object.keys(trackingConfig)
  if (trackingNames.length === 0) {
    logger.warn(`trackingConfig is empty`)
  }

  const snapshot = {}

  // ensure snapshot keys order is the same as trackingConfig (despite Promise.all below)
  trackingNames.forEach((trackingName) => {
    snapshot[trackingName] = null
  })
  await Promise.all(
    trackingNames.map(async (trackingName) => {
      const tracking = trackingConfig[trackingName]
      const specifierMetaMap = metaMapToSpecifierMetaMap({
        track: tracking,
        ...(manifestFilePattern ? { manifest: { [manifestFilePattern]: true } } : {}),
      })

      const trackingResult = await applyTracking({
        logger,
        projectDirectoryUrl,
        specifierMetaMap,
        transformations,
      })
      snapshot[trackingName] = trackingResult
      cancellationToken.throwIfRequested()
    }),
  )

  const snapshotFileContent = JSON.stringify(snapshot, null, "  ")
  logger.debug(snapshotFileContent)
  return snapshot
}

const applyTracking = async ({
  logger,
  projectDirectoryUrl,
  specifierMetaMap,
  transformations,
}) => {
  const manifestMap = {}
  const fileMap = {}
  let files

  try {
    files = await collectFiles({
      directoryUrl: projectDirectoryUrl,
      specifierMetaMap,
      predicate: (meta) => meta.track === true || meta.manifest === true,
    })
  } catch (e) {
    const directoryPath = urlToFileSystemPath(projectDirectoryUrl)
    if (e.code === "ENOENT" && e.path === directoryPath) {
      logger.warn(`${directoryPath} does not exists`)
      return { fileMap, manifestMap }
    }
    throw e
  }

  // we use reduce and not Promise.all(files.map) because transformation can be expensive (gzip, brotli)
  // so we won't benefit from concurrency (it might even make things worse)
  await files.reduce(async (previous, { relativeUrl, meta }) => {
    await previous

    const fileUrl = resolveUrl(relativeUrl, projectDirectoryUrl)

    if (meta.manifest) {
      manifestMap[relativeUrl] = await readManifest(fileUrl)
      return
    }

    const fileContent = await readFile(fileUrl)
    const fileBuffer = Buffer.from(fileContent)
    const sizeMap = await getFileSizeMap(fileBuffer, { transformations, logger, fileUrl })
    const hash = bufferToEtag(fileBuffer)

    fileMap[relativeUrl] = {
      sizeMap,
      hash,
    }
  }, Promise.resolve())

  return { manifestMap, fileMap }
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
