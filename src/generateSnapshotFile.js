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
} from "@jsenv/util"
import { jsenvDirectorySizeTrackingConfig } from "./jsenvDirectorySizeTrackingConfig.js"

export const generateSnapshotFile = async ({
  logLevel,
  projectDirectoryUrl,
  directorySizeTrackingConfig = jsenvDirectorySizeTrackingConfig,
  snapshotFileRelativeUrl = "./filesize-snapshot.json",

  manifest = true,
  manifestFilename = "manifest.json",
}) => {
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

      const [directoryManifest, directoryFileReport] = await Promise.all([
        manifest
          ? readDirectoryManifest({
              logger,
              manifestFilename,
              directoryUrl,
            })
          : null,
        generateDirectoryFileReport({
          logger,
          directoryUrl,
          specifierMetaMap,
          manifest,
          manifestFilename,
        }),
      ])

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
}

const readDirectoryManifest = async ({ logger, manifestFilename, directoryUrl }) => {
  const manifestFileUrl = resolveUrl(manifestFilename, directoryUrl)
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
  manifestFilename,
}) => {
  const directoryFileReport = {}
  try {
    await collectFiles({
      directoryUrl,
      specifierMetaMap,
      predicate: (meta) => meta.track === true,
      matchingFileOperation: async ({ relativeUrl, lstat }) => {
        if (!lstat.isFile()) {
          return
        }
        if (manifest && relativeUrl === manifestFilename) {
          return
        }
        const fileUrl = resolveUrl(relativeUrl, directoryUrl)
        const fileContent = await readFile(fileUrl)
        const hash = bufferToEtag(Buffer.from(fileContent))

        directoryFileReport[relativeUrl] = {
          size: lstat.size,
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
