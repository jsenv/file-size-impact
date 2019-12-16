import { createLogger } from "@jsenv/logger"
import { metaMapToSpecifierMetaMap } from "@jsenv/url-meta"
import { collectFiles } from "@jsenv/file-collector"
import { resolveUrl, resolveDirectoryUrl, urlToFilePath } from "./internal/urlUtils.js"
import { writeFileContent } from "./internal/filesystemUtils.js"
import { normalizeDirectoryUrl } from "./internal/normalizeDirectoryUrl.js"
import { jsenvDirectorySizeTrackingConfig } from "./jsenvDirectorySizeTrackingConfig.js"

export const generateSnapshotFile = async ({
  logLevel,
  projectDirectoryUrl,
  directorySizeTrackingConfig = jsenvDirectorySizeTrackingConfig,
  snapshotFileRelativeUrl = "./filesize-snapshot.json",
}) => {
  const logger = createLogger({ logLevel })

  projectDirectoryUrl = normalizeDirectoryUrl(projectDirectoryUrl)

  const snapshot = {}

  await Promise.all(
    Object.keys(directorySizeTrackingConfig).map(async (directoryRelativeUrl) => {
      const directorySnapshot = {}
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
            directorySnapshot[relativeUrl] = {
              type: statsToType(lstat),
              size: lstat.size,
            }
          },
        })
      } catch (e) {
        if (e.code === "ENOENT" && e.path === directoryPath) {
          logger.warn(`${directoryPath} does not exists`)
        } else {
          throw e
        }
      }

      snapshot[directoryRelativeUrl] = directorySnapshot
    }),
  )

  const snapshotFileUrl = resolveUrl(snapshotFileRelativeUrl, projectDirectoryUrl)
  const snapshotFilePath = urlToFilePath(snapshotFileUrl)
  logger.info(`write snapshot file at ${snapshotFilePath}`)
  await writeFileContent(snapshotFilePath, JSON.stringify(snapshot, null, "  "))
}

const statsToType = (stats) => {
  if (stats.isFile()) return "file"
  if (stats.isDirectory()) return "directory"
  if (stats.isSymbolicLink()) return "symbolic-link"
  if (stats.isFIFO()) return "fifo"
  if (stats.isSocket()) return "socket"
  if (stats.isCharacterDevice()) return "character-device"
  if (stats.isBlockDevice()) return "block-device"
  return "unknown type"
}
