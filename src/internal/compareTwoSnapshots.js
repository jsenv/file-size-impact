import {
  resolveUrl,
  comparePathnames,
  metaMapToSpecifierMetaMap,
  urlToMeta,
  normalizeSpecifierMetaMap,
  urlToRelativeUrl,
} from "@jsenv/util"

export const compareTwoSnapshots = (baseSnapshot, headSnapshot) => {
  const comparison = {}
  Object.keys(headSnapshot).forEach((group) => {
    // || {} exists in case group was not tracked in base branch
    // and is now tracked in head branch.
    // compareTwoGroups will handle the empty object and consider everything as added
    const baseGroup = baseSnapshot[group] || {}
    const headGroup = headSnapshot[group]
    comparison[group] = compareTwoGroups(baseGroup, headGroup)
  })
  return comparison
}

const compareTwoGroups = (baseGroup, headGroup) => {
  const groupComparison = {}

  const baseManifestMap = baseGroup.manifestMap || {}
  const headManifestMap = headGroup.manifestMap || {}
  const baseFileMap = baseGroup.fileMap || {}
  const headFileMap = headGroup.fileMap || {}
  const baseMappings = manifestToMappings(baseManifestMap)
  const headMappings = manifestToMappings(headManifestMap)

  const added = (relativeUrl, headRelativeUrl) => {
    groupComparison[relativeUrl] = {
      base: null,
      head: {
        relativeUrl: headRelativeUrl,
        ...headFileMap[headRelativeUrl],
      },
    }
  }
  const removed = (relativeUrl, baseRelativeUrl) => {
    groupComparison[relativeUrl] = {
      base: {
        relativeUrl: baseRelativeUrl,
        ...baseFileMap[baseRelativeUrl],
      },
      head: null,
    }
  }
  const updated = (relativeUrl, baseRelativeUrl, headRelativeUrl) => {
    groupComparison[relativeUrl] = {
      base: {
        relativeUrl: baseRelativeUrl,
        ...baseFileMap[baseRelativeUrl],
      },
      head: {
        relativeUrl: headRelativeUrl,
        ...headFileMap[headRelativeUrl],
      },
    }
  }

  Object.keys(headFileMap).forEach((headRelativeUrl) => {
    const originalHeadRelativeUrl = getOriginalRelativeUrl(headRelativeUrl, headMappings)
    if (originalHeadRelativeUrl) {
      const baseRelativeUrl = getRenamedRelativeUrl(originalHeadRelativeUrl, baseMappings)
      if (baseRelativeUrl) {
        // the mapping should be the same and already found while iterating
        // baseReport, otherwise it means the mappings
        // of heads and base are different right ?
        updated(originalHeadRelativeUrl, baseRelativeUrl, headRelativeUrl)
      } else if (headRelativeUrl in baseFileMap) {
        updated(originalHeadRelativeUrl, headRelativeUrl, headRelativeUrl)
      } else {
        added(originalHeadRelativeUrl, headRelativeUrl)
      }
    } else if (headRelativeUrl in baseFileMap) {
      updated(headRelativeUrl, headRelativeUrl, headRelativeUrl)
    } else {
      added(headRelativeUrl, headRelativeUrl)
    }
  })

  // const fileIsTrackedInBase = trackingConfigToPredicate(baseSnapshot.tracking)
  const fileIsTrackedInHead = trackingToPredicate(headGroup.tracking)

  Object.keys(baseFileMap).forEach((baseRelativeUrl) => {
    if (!fileIsTrackedInHead(baseRelativeUrl)) {
      // head tracking config is not interested into this file anymore
      return
    }

    const originalBaseRelativeUrl = getOriginalRelativeUrl(baseRelativeUrl, baseMappings)
    if (originalBaseRelativeUrl) {
      const headRelativeUrl = getRenamedRelativeUrl(originalBaseRelativeUrl, headMappings)
      if (headRelativeUrl) {
        updated(originalBaseRelativeUrl, baseRelativeUrl, headRelativeUrl)
      } else if (baseRelativeUrl in headFileMap) {
        updated(originalBaseRelativeUrl, baseRelativeUrl, baseRelativeUrl)
      } else {
        removed(originalBaseRelativeUrl, baseRelativeUrl)
      }
    } else if (baseRelativeUrl in headFileMap) {
      updated(baseRelativeUrl, baseRelativeUrl, baseRelativeUrl)
    } else {
      removed(baseRelativeUrl, baseRelativeUrl)
    }
  })

  return sortFileStructure(groupComparison)
}

const trackingToPredicate = (tracking) => {
  const directoryUrl = "file:///directory/"
  const specifierMetaMap = normalizeSpecifierMetaMap(
    metaMapToSpecifierMetaMap({
      track: tracking,
    }),
    directoryUrl,
  )
  return (relativeUrl) => {
    return urlToMeta({
      url: resolveUrl(relativeUrl, directoryUrl),
      specifierMetaMap,
    }).track
  }
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
