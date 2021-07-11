import { resolveUrl, comparePathnames, urlToRelativeUrl } from "@jsenv/util"

export const compareTwoSnapshots = (beforeMergeSnapshot, afterMergeSnapshot) => {
  const comparison = {}
  Object.keys(afterMergeSnapshot).forEach((group) => {
    // || {} exists in case group was not tracked in base branch
    // and is now tracked in head branch.
    // compareTwoGroups will handle the empty object and consider everything as added
    const beforeMergeGroup = beforeMergeSnapshot[group] || {}
    const afterMergeGroup = afterMergeSnapshot[group]
    comparison[group] = compareTwoGroups(beforeMergeGroup, afterMergeGroup)
  })
  return comparison
}

const compareTwoGroups = (beforeMergeGroup, afterMergeGroup) => {
  const groupComparison = {}

  const beforeMergeManifestMap = beforeMergeGroup.manifestMap || {}
  const beforeMergeFileMap = beforeMergeGroup.fileMap || {}
  const beforeMergeMappings = manifestToMappings(beforeMergeManifestMap)
  const beforeMergeFileInfos = fileInfosFromFileMap(beforeMergeFileMap, beforeMergeMappings)

  const afterMergeManifestMap = afterMergeGroup.manifestMap || {}
  const afterMergeFileMap = afterMergeGroup.fileMap || {}
  const afterMergeMappings = manifestToMappings(afterMergeManifestMap)
  const afterMergeFileInfos = fileInfosFromFileMap(afterMergeFileMap, afterMergeMappings)

  const added = (afterMergeName, afterMergeInfo) => {
    groupComparison[afterMergeName] = {
      beforeMerge: null,
      afterMerge: afterMergeInfo,
    }
  }
  const updated = (beforeMergeName, beforeMergeInfo, afterMergeInfo) => {
    groupComparison[beforeMergeName] = {
      beforeMerge: beforeMergeInfo,
      afterMerge: afterMergeInfo,
    }
  }
  const removed = (beforeMergeName, beforeMergeInfo) => {
    groupComparison[beforeMergeName] = {
      beforeMerge: beforeMergeInfo,
      afterMerge: null,
    }
  }

  Object.keys(afterMergeFileInfos).forEach((afterMergeName) => {
    const afterMergeInfo = afterMergeFileInfos[afterMergeName]
    const beforeMergeInfo = beforeMergeFileInfos[afterMergeName]

    if (beforeMergeInfo) {
      updated(afterMergeName, beforeMergeInfo, afterMergeInfo)
    } else {
      added(afterMergeName, afterMergeInfo)
    }
  })
  Object.keys(beforeMergeFileInfos).forEach((beforeMergeName) => {
    const beforeMergeInfo = beforeMergeFileInfos[beforeMergeName]
    const afterMergeInfo = afterMergeFileInfos[beforeMergeName]

    if (afterMergeInfo) {
      // already handled by the previous loop
      // updated(beforeMergeName, beforeMergeInfo, afterMergeInfo)
    } else {
      removed(beforeMergeName, beforeMergeInfo)
    }
  })

  return sortFileStructure(groupComparison)
}

const ABSTRACT_DIRECTORY_URL = "file:///directory/"

const fileInfosFromFileMap = (fileMap, mappings) => {
  const fileInfos = {}
  Object.keys(fileMap).forEach((relativeUrl) => {
    const nameMapped = nameFromMappings(relativeUrl, mappings)
    const name = nameMapped || relativeUrl
    fileInfos[name] = {
      relativeUrl,
      ...fileMap[relativeUrl],
    }
  })
  return fileInfos
}

const manifestToMappings = (manifestMap) => {
  const mappings = {}
  Object.keys(manifestMap).forEach((manifestRelativeUrl) => {
    const manifest = manifestMap[manifestRelativeUrl]
    const manifestAbstractUrl = resolveUrl(manifestRelativeUrl, ABSTRACT_DIRECTORY_URL)
    Object.keys(manifest).forEach((originalFileManifestRelativeUrl) => {
      const fileManifestRelativeUrl = manifest[originalFileManifestRelativeUrl]

      const originalFileAbstractUrl = resolveUrl(
        originalFileManifestRelativeUrl,
        manifestAbstractUrl,
      )
      const fileAbstractUrl = resolveUrl(fileManifestRelativeUrl, manifestAbstractUrl)

      const fileRelativeUrl = urlToRelativeUrl(fileAbstractUrl, ABSTRACT_DIRECTORY_URL)
      const originalFileRelativeUrl = urlToRelativeUrl(
        originalFileAbstractUrl,
        ABSTRACT_DIRECTORY_URL,
      )
      mappings[fileRelativeUrl] = originalFileRelativeUrl
    })
  })
  return mappings
}

const nameFromMappings = (relativeUrl, mappings) => {
  return relativeUrl in mappings ? mappings[relativeUrl] : null
}

const sortFileStructure = (fileStructure) => {
  const relativeUrlSortedArray = Object.keys(fileStructure).sort(comparePathnames)
  const fileStructureSorted = {}
  relativeUrlSortedArray.forEach((relativeUrl) => {
    fileStructureSorted[relativeUrl] = fileStructure[relativeUrl]
  })
  return fileStructureSorted
}
