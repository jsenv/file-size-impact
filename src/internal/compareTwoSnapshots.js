import {
  resolveUrl,
  comparePathnames,
  metaMapToSpecifierMetaMap,
  urlToMeta,
  normalizeSpecifierMetaMap,
} from "@jsenv/util"

export const compareTwoSnapshots = (baseSnapshot, headSnapshot) => {
  const comparison = {}
  Object.keys(headSnapshot).forEach((directoryRelativeUrl) => {
    comparison[directoryRelativeUrl] = compareDirectorySnapshot(
      baseSnapshot[directoryRelativeUrl],
      headSnapshot[directoryRelativeUrl],
    )
  })
  return comparison
}

const compareDirectorySnapshot = (baseSnapshot, headSnapshot) => {
  const snapshotComparison = {}

  if (!baseSnapshot) {
    // may happen when a key in directorySizeTrackingConfig was deleted
    // in that case we don't care about this directory anymore
    return snapshotComparison
  }

  const baseManifest = baseSnapshot.manifest || {}
  const headManifest = headSnapshot.manifest || {}
  const baseReport = baseSnapshot.report
  const headReport = headSnapshot.report
  const baseMappings = manifestToMappings(baseManifest)
  const headMappings = manifestToMappings(headManifest)

  const added = (relativeUrl, headRelativeUrl) => {
    snapshotComparison[relativeUrl] = {
      base: null,
      head: {
        relativeUrl: headRelativeUrl,
        ...headReport[headRelativeUrl],
      },
    }
  }
  const removed = (relativeUrl, baseRelativeUrl) => {
    snapshotComparison[relativeUrl] = {
      base: {
        relativeUrl: baseRelativeUrl,
        ...baseReport[baseRelativeUrl],
      },
      head: null,
    }
  }
  const updated = (relativeUrl, baseRelativeUrl, headRelativeUrl) => {
    snapshotComparison[relativeUrl] = {
      base: {
        relativeUrl: baseRelativeUrl,
        ...baseReport[baseRelativeUrl],
      },
      head: {
        relativeUrl: headRelativeUrl,
        ...headReport[headRelativeUrl],
      },
    }
  }

  Object.keys(headReport).forEach((headRelativeUrl) => {
    if (headRelativeUrl in headMappings) {
      const headRelativeUrlMapped = headMappings[headRelativeUrl]
      if (headRelativeUrlMapped in baseManifest) {
        // the mapping should be the same and already found while iterating
        // baseReport, otherwise it means the mappings
        // of heads and base are different right ?
        const baseRelativeUrl = baseManifest[headRelativeUrlMapped]
        updated(headRelativeUrlMapped, baseRelativeUrl, headRelativeUrl)
      } else if (headRelativeUrl in baseReport) {
        updated(headRelativeUrlMapped, headRelativeUrl, headRelativeUrl)
      } else {
        added(headRelativeUrlMapped, headRelativeUrl)
      }
    } else if (headRelativeUrl in baseReport) {
      updated(headRelativeUrl, headRelativeUrl, headRelativeUrl)
    } else {
      added(headRelativeUrl, headRelativeUrl)
    }
  })

  const headTrackingConfig = headSnapshot.trackingConfig
  const directoryUrl = "file:///directory/"
  const headSpecifierMetaMap = normalizeSpecifierMetaMap(
    metaMapToSpecifierMetaMap({
      track: headTrackingConfig,
    }),
    directoryUrl,
  )
  Object.keys(baseReport).forEach((baseRelativeUrl) => {
    const baseUrl = resolveUrl(baseRelativeUrl, directoryUrl)
    if (!urlToMeta({ url: baseUrl, specifierMetaMap: headSpecifierMetaMap }).track) {
      // head tracking config is not interested into this file anymore
      return
    }

    if (baseRelativeUrl in baseMappings) {
      const baseRelativeUrlMapped = baseMappings[baseRelativeUrl]
      if (baseRelativeUrlMapped in headManifest) {
        const headRelativeUrl = headManifest[baseRelativeUrlMapped]
        updated(baseRelativeUrlMapped, baseRelativeUrl, headRelativeUrl)
      } else if (baseRelativeUrl in headReport) {
        updated(baseRelativeUrlMapped, baseRelativeUrl, baseRelativeUrl)
      } else {
        removed(baseRelativeUrlMapped, baseRelativeUrl)
      }
    } else if (baseRelativeUrl in headReport) {
      updated(baseRelativeUrl, baseRelativeUrl, baseRelativeUrl)
    } else {
      removed(baseRelativeUrl, baseRelativeUrl)
    }
  })

  return sortDirectoryStructure(snapshotComparison)
}

const manifestToMappings = (manifest) => {
  const mappings = {}
  if (manifest) {
    Object.keys(manifest).forEach((originalRelativeUrl) => {
      mappings[manifest[originalRelativeUrl]] = originalRelativeUrl
    })
  }
  return mappings
}

const sortDirectoryStructure = (directoryStructure) => {
  const relativeUrlSortedArray = Object.keys(directoryStructure).sort(comparePathnames)
  const directoryStructureSorted = {}
  relativeUrlSortedArray.forEach((relativeUrl) => {
    directoryStructureSorted[relativeUrl] = directoryStructure[relativeUrl]
  })
  return directoryStructureSorted
}
