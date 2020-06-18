import { resolveUrl, comparePathnames, urlToRelativeUrl } from "@jsenv/util"

export const compareTwoSnapshots = (baseSnapshot, afterMergeSnapshot) => {
  const comparison = {}
  Object.keys(afterMergeSnapshot).forEach((group) => {
    // || {} exists in case group was not tracked in base branch
    // and is now tracked in head branch.
    // compareTwoGroups will handle the empty object and consider everything as added
    const baseGroup = baseSnapshot[group] || {}
    const afterMergeGroup = afterMergeSnapshot[group]
    comparison[group] = compareTwoGroups(baseGroup, afterMergeGroup)
  })
  return comparison
}

const compareTwoGroups = (baseGroup, afterMergeGroup) => {
  const groupComparison = {}

  const baseManifestMap = baseGroup.manifestMap || {}
  const afterMergeManifestMap = afterMergeGroup.manifestMap || {}
  const baseFileMap = baseGroup.fileMap || {}
  const afterMergeFileMap = afterMergeGroup.fileMap || {}
  const baseMappings = manifestToMappings(baseManifestMap)
  const afterMergeMappings = manifestToMappings(afterMergeManifestMap)

  const added = (relativeUrl, afterMergeRelativeUrl) => {
    groupComparison[relativeUrl] = {
      base: null,
      afterMerge: {
        relativeUrl: afterMergeRelativeUrl,
        ...afterMergeFileMap[afterMergeRelativeUrl],
      },
    }
  }
  const removed = (relativeUrl, baseRelativeUrl) => {
    groupComparison[relativeUrl] = {
      base: {
        relativeUrl: baseRelativeUrl,
        ...baseFileMap[baseRelativeUrl],
      },
      afterMerge: null,
    }
  }
  const updated = (relativeUrl, baseRelativeUrl, afterMergeRelativeUrl) => {
    groupComparison[relativeUrl] = {
      base: {
        relativeUrl: baseRelativeUrl,
        ...baseFileMap[baseRelativeUrl],
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
      const baseRelativeUrl = getRenamedRelativeUrl(originalAfterMergeRelativeUrl, baseMappings)
      if (baseRelativeUrl) {
        // the mapping should be the same and already found while iterating
        // baseReport, otherwise it means the mappings
        // afterMerge and base are different right ?
        updated(originalAfterMergeRelativeUrl, baseRelativeUrl, afterMergeRelativeUrl)
      } else if (afterMergeRelativeUrl in baseFileMap) {
        updated(originalAfterMergeRelativeUrl, afterMergeRelativeUrl, afterMergeRelativeUrl)
      } else {
        added(originalAfterMergeRelativeUrl, afterMergeRelativeUrl)
      }
    } else if (afterMergeRelativeUrl in baseFileMap) {
      updated(afterMergeRelativeUrl, afterMergeRelativeUrl, afterMergeRelativeUrl)
    } else {
      added(afterMergeRelativeUrl, afterMergeRelativeUrl)
    }
  })

  Object.keys(baseFileMap).forEach((baseRelativeUrl) => {
    const originalBaseRelativeUrl = getOriginalRelativeUrl(baseRelativeUrl, baseMappings)
    if (originalBaseRelativeUrl) {
      const afterMergeRelativeUrl = getRenamedRelativeUrl(
        originalBaseRelativeUrl,
        afterMergeMappings,
      )
      if (afterMergeRelativeUrl) {
        updated(originalBaseRelativeUrl, baseRelativeUrl, afterMergeRelativeUrl)
      } else if (baseRelativeUrl in afterMergeFileMap) {
        updated(originalBaseRelativeUrl, baseRelativeUrl, baseRelativeUrl)
      } else {
        removed(originalBaseRelativeUrl, baseRelativeUrl)
      }
    } else if (baseRelativeUrl in afterMergeFileMap) {
      updated(baseRelativeUrl, baseRelativeUrl, baseRelativeUrl)
    } else {
      removed(baseRelativeUrl, baseRelativeUrl)
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
