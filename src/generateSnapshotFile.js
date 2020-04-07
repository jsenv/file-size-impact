import { createLogger } from "@jsenv/logger"
import {
  assertAndNormalizeDirectoryUrl,
  bufferToEtag,
  resolveUrl,
  resolveDirectoryUrl,
  urlToFileSystemPath,
  writeFile,
  readFile,
  metaMapToSpecifierMetaMap,
  collectFiles,
  catchCancellation,
  createCancellationTokenForProcess,
  urlToRelativeUrl,
} from "@jsenv/util"
import { jsenvDirectorySizeTrackingConfig } from "./jsenvDirectorySizeTrackingConfig.js"
import { transform as noneTransform } from "./noneTransformation.js"

export const generateSnapshotFile = async ({
  cancellationToken = createCancellationTokenForProcess(),
  logLevel,
  projectDirectoryUrl,
  directorySizeTrackingConfig = jsenvDirectorySizeTrackingConfig,
  snapshotFileRelativeUrl = "./filesize-snapshot.json",

  manifest = true,
  manifestFileRelativeUrl = "./manifest.json",
  transformations = { none: noneTransform },
}) => {
  return catchCancellation(async () => {
    const logger = createLogger({ logLevel })

    projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)

    const directoryRelativeUrlArray = Object.keys(directorySizeTrackingConfig)
    if (directoryRelativeUrlArray.length === 0) {
      logger.warn(`directorySizeTrackingConfig is empty`)
    }

    const snapshotFileUrl = resolveUrl(snapshotFileRelativeUrl, projectDirectoryUrl)

    const snapshot = {}

    await Promise.all(
      directoryRelativeUrlArray.map(async (directoryRelativeUrl) => {
        const directoryUrl = resolveDirectoryUrl(directoryRelativeUrl, projectDirectoryUrl)
        const directoryTrackingConfig = directorySizeTrackingConfig[directoryRelativeUrl]
        const specifierMetaMap = metaMapToSpecifierMetaMap({
          track: directoryTrackingConfig,
        })

        const manifestFileUrl = resolveUrl(manifestFileRelativeUrl, directoryUrl)
        // ensure manifestFileRelativeUrl is normalized
        manifestFileRelativeUrl = urlToRelativeUrl(manifestFileUrl, directoryUrl)

        const [directoryManifest, directoryFileReport] = await Promise.all([
          manifest
            ? readDirectoryManifest({
                logger,
                manifestFileUrl,
              })
            : null,
          generateDirectoryFileReport({
            logger,
            directoryUrl,
            specifierMetaMap,
            manifest,
            manifestFileRelativeUrl,
            transformations,
          }),
        ])

        cancellationToken.throwIfRequested()

        snapshot[directoryRelativeUrl] = {
          manifest: directoryManifest,
          report: directoryFileReport,
          trackingConfig: directoryTrackingConfig,
        }
      }),
    )

    logger.info(`write snapshot file at ${urlToFileSystemPath(snapshotFileUrl)}`)
    const snapshotFileContent = JSON.stringify(snapshot, null, "  ")
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

const readDirectoryManifest = async ({ logger, manifestFileUrl }) => {
  try {
    const manifestFileContent = await readFile(manifestFileUrl)
    return JSON.parse(manifestFileContent)
  } catch (e) {
    if (e && e.code === "ENOENT") {
      logger.debug(`manifest file not found at ${urlToFileSystemPath(manifestFileUrl)}`)
      return null
    }
    throw e
  }
}

const generateDirectoryFileReport = async ({
  logger,
  directoryUrl,
  specifierMetaMap,
  manifest,
  manifestFileRelativeUrl,
  transformations,
}) => {
  const directoryFileReport = {}
  try {
    const files = await collectFiles({
      directoryUrl,
      specifierMetaMap,
      predicate: (meta) => meta.track === true,
    })

    // we use reduce and not Promise.all(files.map) because transformation can be expensive (gzip, brotli)
    // so we won't benefit from concurrency (it might even make things worse)
    await files.reduce(async (previous, { relativeUrl, fileStats }) => {
      await previous

      if (!fileStats.isFile()) {
        return
      }
      if (manifest && relativeUrl === manifestFileRelativeUrl) {
        return
      }

      const fileUrl = resolveUrl(relativeUrl, directoryUrl)
      const fileContent = await readFile(fileUrl)
      const fileBuffer = Buffer.from(fileContent)

      const sizeMap = {}
      await Object.keys(transformations).reduce(async (previous, key) => {
        await previous
        const transform = transformations[key]
        try {
          const transformResult = await transform(fileBuffer)
          sizeMap[key] = Buffer.from(transformResult).length
        } catch (e) {
          logger.debug(`error while transforming ${fileUrl} with ${key}.
--- error stack ---
${e.stack}`)
          sizeMap[key] = "error"
        }
      }, Promise.resolve())

      const hash = bufferToEtag(fileBuffer)

      directoryFileReport[relativeUrl] = {
        sizeMap,
        hash,
      }
    }, Promise.resolve())
  } catch (e) {
    const directoryPath = urlToFileSystemPath(directoryUrl)
    if (e.code === "ENOENT" && e.path === directoryPath) {
      logger.warn(`${directoryPath} does not exists`)
      return directoryFileReport
    }
    throw e
  }

  return directoryFileReport
}
