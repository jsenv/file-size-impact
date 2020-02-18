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

export const generateSnapshotFile = async ({
  cancellationToken = createCancellationTokenForProcess(),
  logLevel,
  projectDirectoryUrl,
  directorySizeTrackingConfig = jsenvDirectorySizeTrackingConfig,
  snapshotFileRelativeUrl = "./filesize-snapshot.json",

  manifest = true,
  manifestFileRelativeUrl = "./manifest.json",
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
}) => {
  const directoryFileReport = {}
  try {
    await collectFiles({
      directoryUrl,
      specifierMetaMap,
      predicate: (meta) => meta.track === true,
      matchingFileOperation: async ({ relativeUrl, fileStats }) => {
        if (!fileStats.isFile()) {
          return
        }
        if (manifest && relativeUrl === manifestFileRelativeUrl) {
          return
        }
        const fileUrl = resolveUrl(relativeUrl, directoryUrl)
        const fileContent = await readFile(fileUrl)
        const hash = bufferToEtag(Buffer.from(fileContent))

        directoryFileReport[relativeUrl] = {
          size: fileStats.size,
          hash,
        }
      },
    })
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
