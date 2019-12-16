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
  fileRelativeUrl = "./filesize-snapshot.json",
}) => {
  const logger = createLogger({ logLevel })

  projectDirectoryUrl = normalizeDirectoryUrl(projectDirectoryUrl)

  const snapshot = {}

  await Promise.all(
    Object.keys(directorySizeTrackingConfig).map(async (directoryRelativeUrl) => {
      const directorySnapshot = {}
      const directoryUrl = resolveDirectoryUrl(directoryRelativeUrl, projectDirectoryUrl)
      const specifierMetaMap = metaMapToSpecifierMetaMap({
        track: directorySizeTrackingConfig[directoryRelativeUrl].trackedFiles,
      })

      await collectFiles({
        directoryPath: urlToFilePath(directoryUrl),
        specifierMetaMap,
        predicate: (meta) => meta.track === true,
        matchingFileOperation: async ({ relativeUrl, lstat }) => {
          snapshot[relativeUrl] = {
            type: statsToType(lstat),
            size: lstat.size,
          }
        },
      })
      snapshot[directoryRelativeUrl] = directorySnapshot
    }),
  )

  const fileUrl = resolveUrl(fileRelativeUrl, projectDirectoryUrl)
  logger.info(`write filesize snapshot file at ${fileUrl}`)
  await writeFileContent(fileUrl, JSON.stringify(snapshot, null, "  "))
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
