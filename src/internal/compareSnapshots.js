import { metaMapToSpecifierMetaMap } from "@jsenv/url-meta"
import { matchAllFileInsideFolder } from "@dmail/filesystem-matching"

export const compareTwoFolders = async (leftFolderPath, rightFolderPath, trackingMetaMap) => {
  const [leftFolderStructure, rightFolderStructure] = await Promise.all([
    parseFolderStructure(leftFolderPath, trackingMetaMap),
    parseFolderStructure(rightFolderPath, trackingMetaMap),
  ])

  const diffDescription = {}
  const leftFolderRelativePathArray = Object.keys(leftFolderStructure)
  const rightFolderRelativePathArray = Object.keys(rightFolderStructure)

  leftFolderRelativePathArray.forEach((relativePath) => {
    if (rightFolderRelativePathArray.includes(relativePath)) {
      diffDescription[relativePath] = {
        leftInfo: leftFolderStructure[relativePath],
        rightInfo: rightFolderStructure[relativePath],
      }
    } else {
      diffDescription[relativePath] = {
        leftInfo: leftFolderStructure[relativePath],
        rightInfo: null,
      }
    }
  })
  rightFolderRelativePathArray.forEach((relativePath) => {
    if (!leftFolderRelativePathArray.includes(relativePath)) {
      diffDescription[relativePath] = {
        leftInfo: null,
        rightInfo: rightFolderStructure[relativePath],
      }
    }
  })

  return sortFolderStructure(diffDescription)
}

const parseFolderStructure = async (folderPath, trackingMetaMap) => {
  const folderStructure = {}

  const specifierMetaMap = metaMapToSpecifierMetaMap({
    track: trackingMetaMap,
  })

  await matchAllFileInsideFolder({
    folderPath,
    specifierMetaMap,
    predicate: (meta) => meta.track === true,
    matchingFileOperation: async ({ relativePath, lstat }) => {
      folderStructure[relativePath] = {
        type: statsToType(lstat),
        size: lstat.size,
      }
    },
  })

  return folderStructure
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

const sortFolderStructure = (folderStructure) => {
  const relativePathSortedArray = Object.keys(folderStructure).sort(compareLengthOrLocaleCompare)
  const folderStructureSorted = {}
  relativePathSortedArray.forEach((relativePath) => {
    folderStructureSorted[relativePath] = folderStructure[relativePath]
  })
  return folderStructureSorted
}

const compareLengthOrLocaleCompare = (a, b) => {
  return b.length - a.length || a.localeCompare(b)
}
