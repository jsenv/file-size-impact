import { createLogger } from "@jsenv/logger"
import { metaMapToSpecifierMetaMap } from "@jsenv/url-meta"
import { collectFiles } from "@jsenv/file-collector"
import { resolveUrl, resolveDirectoryUrl, urlToFilePath } from "./internal/urlUtils.js"
import { writeFileContent, readFileContent } from "./internal/filesystemUtils.js"
import { normalizeDirectoryUrl } from "./internal/normalizeDirectoryUrl.js"
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

  projectDirectoryUrl = normalizeDirectoryUrl(projectDirectoryUrl)

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

      const [directoryManifest, directorySizeReport] = await Promise.all([
        manifest
          ? readDirectoryManifest({
              logger,
              manifestFilename,
              directoryUrl,
            })
          : null,
        generateDirectorySizeReport({
          logger,
          directoryUrl,
          specifierMetaMap,
          manifest,
          manifestFilename,
        }),
      ])

      snapshot[directoryRelativeUrl] = {
        manifest: directoryManifest,
        sizeReport: directorySizeReport,
        trackingConfig: directoryTrackingConfig,
      }
    }),
  )

  const snapshotFilePath = urlToFilePath(snapshotFileUrl)
  logger.info(`write snapshot file at ${snapshotFilePath}`)
  const snapshotFileContent = JSON.stringify(snapshot, null, "  ")
  logger.debug(snapshotFileContent)
  await writeFileContent(snapshotFilePath, snapshotFileContent)
}

const readDirectoryManifest = async ({ logger, manifestFilename, directoryUrl }) => {
  const manifestFileUrl = resolveUrl(manifestFilename, directoryUrl)
  const manifestFilePath = urlToFilePath(manifestFileUrl)
  try {
    const manifestFileContent = await readFileContent(manifestFilePath)
    return JSON.parse(manifestFileContent)
  } catch (e) {
    if (e && e.code === "ENOENT") {
      logger.debug(`manifest file not found at ${manifestFilePath}`)
      return null
    }
    throw e
  }
}

const generateDirectorySizeReport = async ({
  logger,
  directoryUrl,
  specifierMetaMap,
  manifest,
  manifestFilename,
}) => {
  const directoryPath = urlToFilePath(directoryUrl)
  const directorySizeReport = {}
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
        directorySizeReport[relativeUrl] = lstat.size
      },
    })
  } catch (e) {
    if (e.code === "ENOENT" && e.path === directoryPath) {
      logger.warn(`${directoryPath} does not exists`)
      return directorySizeReport
    }
    throw e
  }

  return directorySizeReport
}
