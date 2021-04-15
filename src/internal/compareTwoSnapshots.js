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
  const afterMergeManifestMap = afterMergeGroup.manifestMap || {}
  const beforeMergeFileMap = beforeMergeGroup.fileMap || {}
  const afterMergeFileMap = afterMergeGroup.fileMap || {}
  const beforeMergeMappings = manifestToMappings(beforeMergeManifestMap)
  const afterMergeMappings = manifestToMappings(afterMergeManifestMap)

  const added = (relativeUrl, afterMergeRelativeUrl) => {
    groupComparison[relativeUrl] = {
      beforeMerge: null,
      afterMerge: {
        relativeUrl: afterMergeRelativeUrl,
        ...afterMergeFileMap[afterMergeRelativeUrl],
      },
    }
  }
  const removed = (relativeUrl, beforeMergeRelativeUrl) => {
    groupComparison[relativeUrl] = {
      beforeMerge: {
        relativeUrl: beforeMergeRelativeUrl,
        ...beforeMergeFileMap[beforeMergeRelativeUrl],
      },
      afterMerge: null,
    }
  }
  const updated = (relativeUrl, beforeMergeRelativeUrl, afterMergeRelativeUrl) => {
    groupComparison[relativeUrl] = {
      beforeMerge: {
        relativeUrl: beforeMergeRelativeUrl,
        ...beforeMergeFileMap[beforeMergeRelativeUrl],
      },
      afterMerge: {
        relativeUrl: afterMergeRelativeUrl,
        ...afterMergeFileMap[afterMergeRelativeUrl],
      },
    }
  }

  Object.keys(afterMergeFileMap).forEach((afterMergeRelativeUrl) => {
    const originalAfterMergeRelativeUrl = getOriginalRelativeUrl(
      afterMergeRelativeUrl,
      afterMergeMappings,
    )
    if (originalAfterMergeRelativeUrl) {
      const beforeMergeRelativeUrl = getRenamedRelativeUrl(
        originalAfterMergeRelativeUrl,
        beforeMergeMappings,
      )
      if (beforeMergeRelativeUrl) {
        // the mapping should be the same and already found while iterating
        // beforeMergeReport, otherwise it means the mappings
        // afterMerge and beforeMerge are different right ?
        updated(originalAfterMergeRelativeUrl, beforeMergeRelativeUrl, afterMergeRelativeUrl)
      } else if (afterMergeRelativeUrl in beforeMergeFileMap) {
        updated(originalAfterMergeRelativeUrl, afterMergeRelativeUrl, afterMergeRelativeUrl)
      } else {
        added(originalAfterMergeRelativeUrl, afterMergeRelativeUrl)
      }
    } else if (afterMergeRelativeUrl in beforeMergeFileMap) {
      updated(afterMergeRelativeUrl, afterMergeRelativeUrl, afterMergeRelativeUrl)
    } else {
      added(afterMergeRelativeUrl, afterMergeRelativeUrl)
    }
  })

  Object.keys(beforeMergeFileMap).forEach((beforeMergeRelativeUrl) => {
    const originalBeforeMergeRelativeUrl = getOriginalRelativeUrl(
      beforeMergeRelativeUrl,
      beforeMergeMappings,
    )
    if (originalBeforeMergeRelativeUrl) {
      const afterMergeRelativeUrl = getRenamedRelativeUrl(
        originalBeforeMergeRelativeUrl,
        afterMergeMappings,
      )
      if (afterMergeRelativeUrl) {
        updated(originalBeforeMergeRelativeUrl, beforeMergeRelativeUrl, afterMergeRelativeUrl)
      } else if (beforeMergeRelativeUrl in afterMergeFileMap) {
        updated(originalBeforeMergeRelativeUrl, beforeMergeRelativeUrl, beforeMergeRelativeUrl)
      } else {
        removed(originalBeforeMergeRelativeUrl, beforeMergeRelativeUrl)
      }
    } else if (beforeMergeRelativeUrl in afterMergeFileMap) {
      updated(beforeMergeRelativeUrl, beforeMergeRelativeUrl, beforeMergeRelativeUrl)
    } else {
      removed(beforeMergeRelativeUrl, beforeMergeRelativeUrl)
    }
  })

  return sortFileStructure(groupComparison)
}

const ABSTRACT_DIRECTORY_URL = "file:///directory/"

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

const getOriginalRelativeUrl = (relativeUrl, mappings) => {
  return relativeUrl in mappings ? mappings[relativeUrl] : null
}

const getRenamedRelativeUrl = (originalRelativeUrl, mappings) => {
  const relativeUrl = Object.keys(mappings).find((relativeUrlCandidate) => {
    const originalRelativeUrlCandidate = mappings[relativeUrlCandidate]
    return originalRelativeUrlCandidate === originalRelativeUrl
  })
  return relativeUrl
}

const sortFileStructure = (fileStructure) => {
  const relativeUrlSortedArray = Object.keys(fileStructure).sort(comparePathnames)
  const fileStructureSorted = {}
  relativeUrlSortedArray.forEach((relativeUrl) => {
    fileStructureSorted[relativeUrl] = fileStructure[relativeUrl]
  })
  return fileStructureSorted
}
