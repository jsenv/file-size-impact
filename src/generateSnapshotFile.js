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

  const snapshot = {}

  await Promise.all(
    directoryRelativeUrlArray.map(async (directoryRelativeUrl) => {
      let directoryManifest = null
      const directorySizeReport = {}
      const directoryUrl = resolveDirectoryUrl(directoryRelativeUrl, projectDirectoryUrl)
      const specifierMetaMap = metaMapToSpecifierMetaMap({
        track: directorySizeTrackingConfig[directoryRelativeUrl],
      })
      const directoryPath = urlToFilePath(directoryUrl)
      try {
        await collectFiles({
          directoryPath,
          specifierMetaMap,
          predicate: (meta) => meta.track === true,
          matchingFileOperation: async ({ relativeUrl, lstat }) => {
            if (!lstat.isFile()) {
              return
            }

            if (manifest && relativeUrl === manifestFilename) {
              const manifestFileUrl = resolveUrl(relativeUrl, directoryUrl)
              const manifestFileContent = await readFileContent(urlToFilePath(manifestFileUrl))
              directoryManifest = JSON.parse(manifestFileContent)
              return
            }

            directorySizeReport[relativeUrl] = lstat.size
          },
        })
      } catch (e) {
        if (e.code === "ENOENT" && e.path === directoryPath) {
          logger.warn(`${directoryPath} does not exists`)
        } else {
          throw e
        }
      }

      snapshot[directoryRelativeUrl] = {
        manifest: directoryManifest,
        sizeReport: directorySizeReport,
      }
    }),
  )

  const snapshotFileUrl = resolveUrl(snapshotFileRelativeUrl, projectDirectoryUrl)
  const snapshotFilePath = urlToFilePath(snapshotFileUrl)
  logger.info(`write snapshot file at ${snapshotFilePath}`)
  await writeFileContent(snapshotFilePath, JSON.stringify(snapshot, null, "  "))
}
