import { createLogger } from "@jsenv/logger"
import {
  assertAndNormalizeDirectoryUrl,
  bufferToEtag,
  resolveUrl,
  urlToFileSystemPath,
  writeFile,
  readFile,
  metaMapToSpecifierMetaMap,
  collectFiles,
  catchCancellation,
  createCancellationTokenForProcess,
} from "@jsenv/util"
import { jsenvTrackingConfig } from "./jsenvTrackingConfig.js"
import { transform as noneTransform } from "./noneTransformation.js"

// update this when snapshot file format changes and is not retro compatible
const SNAPSHOT_VERSION = 1

export const generateSnapshotFile = async ({
  cancellationToken = createCancellationTokenForProcess(),
  logLevel,
  projectDirectoryUrl,
  trackingConfig = jsenvTrackingConfig,
  snapshotFileRelativeUrl = "./filesize-snapshot.json",
  manifestFilePattern = "./**/manifest.json",
  transformations = { none: noneTransform },
}) => {
  return catchCancellation(async () => {
    const logger = createLogger({ logLevel })

    projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)

    const trackingNames = Object.keys(trackingConfig)
    if (trackingNames.length === 0) {
      logger.warn(`trackingConfig is empty`)
    }

    const snapshotFileUrl = resolveUrl(snapshotFileRelativeUrl, projectDirectoryUrl)
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
        snapshot[trackingName] = {
          tracking,
          ...trackingResult,
        }
        cancellationToken.throwIfRequested()
      }),
    )

    logger.info(`write snapshot file at ${urlToFileSystemPath(snapshotFileUrl)}`)
    const versionnedSnapshot = {
      version: SNAPSHOT_VERSION,
      snapshot,
    }
    const snapshotFileContent = JSON.stringify(versionnedSnapshot, null, "  ")
    logger.debug(snapshotFileContent)
    await writeFile(snapshotFileUrl, snapshotFileContent)
  }).catch((e) => {
    // this is required to ensure unhandledRejection will still
    // set process.exitCode to 1 marking the process execution as errored
    // preventing further command to run
    process.exitCode = 1
    throw e
  })
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
