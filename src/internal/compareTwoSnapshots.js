import { compareFilePath } from "@jsenv/file-collector"

export const compareTwoSnapshots = (baseSnapshot, headSnapshot) => {
  const comparison = {}
  Object.keys(baseSnapshot).forEach((directoryRelativeUrl) => {
    comparison[directoryRelativeUrl] = compareDirectorySnapshot(
      baseSnapshot[directoryRelativeUrl],
      headSnapshot[directoryRelativeUrl],
    )
  })
  return comparison
}

const compareDirectorySnapshot = (baseSnapshot, headSnapshot) => {
  const snapshotComparison = {}

  const baseManifest = baseSnapshot.manifest || {}
  const headManifest = headSnapshot.manifest || {}
  const baseSizeReport = baseSnapshot.sizeReport
  const headSizeReport = headSnapshot.sizeReport
  const baseMappings = manifestToMappings(baseManifest)
  const headMappings = manifestToMappings(headManifest)

  const added = (relativeUrl, headRelativeUrl) => {
    snapshotComparison[relativeUrl] = {
      base: null,
      head: {
        relativeUrl: headRelativeUrl,
        size: headSizeReport[headRelativeUrl],
      },
    }
  }
  const removed = (relativeUrl, baseRelativeUrl) => {
    snapshotComparison[relativeUrl] = {
      base: {
        relativeUrl: baseRelativeUrl,
        size: baseSizeReport[baseRelativeUrl],
      },
      head: null,
    }
  }
  const updated = (relativeUrl, baseRelativeUrl, headRelativeUrl) => {
    snapshotComparison[relativeUrl] = {
      base: {
        relativeUrl: baseRelativeUrl,
        size: baseSizeReport[baseRelativeUrl],
      },
      head: {
        relativeUrl: headRelativeUrl,
        size: headSizeReport[headRelativeUrl],
      },
    }
  }

  Object.keys(baseSizeReport).forEach((baseRelativeUrl) => {
    if (baseRelativeUrl in baseMappings) {
      const baseRelativeUrlMapped = baseMappings[baseRelativeUrl]
      if (baseRelativeUrlMapped in headManifest) {
        const headRelativeUrl = headManifest[baseRelativeUrlMapped]
        updated(baseRelativeUrlMapped, baseRelativeUrl, headRelativeUrl)
      } else if (baseRelativeUrl in headSizeReport) {
        updated(baseRelativeUrlMapped, baseRelativeUrl, baseRelativeUrl)
      } else {
        removed(baseRelativeUrlMapped, baseRelativeUrl)
      }
    } else if (baseRelativeUrl in headSizeReport) {
      updated(baseRelativeUrl, baseRelativeUrl, baseRelativeUrl)
    } else {
      removed(baseRelativeUrl, baseRelativeUrl)
    }
  })
  Object.keys(headSizeReport).forEach((headRelativeUrl) => {
    if (headRelativeUrl in headMappings) {
      const headRelativeUrlMapped = headMappings[headRelativeUrl]
      if (headRelativeUrlMapped in baseManifest) {
        // the mapping should be the same and already found while iterating
        // baseSizeReport, otherwise it means the mappings
        // of heads and base are different right ?
        const baseRelativeUrl = baseManifest[headRelativeUrlMapped]
        updated(headRelativeUrlMapped, baseRelativeUrl, headRelativeUrl)
      } else if (headRelativeUrl in baseSizeReport) {
        updated(headRelativeUrlMapped, headRelativeUrl, headRelativeUrl)
      } else {
        added(headRelativeUrlMapped, headRelativeUrl)
      }
    } else if (headRelativeUrl in baseSizeReport) {
      updated(headRelativeUrl, headRelativeUrl, headRelativeUrl)
    } else {
      added(headRelativeUrl, headRelativeUrl)
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
  const relativeUrlSortedArray = Object.keys(directoryStructure).sort(compareFilePath)
  const directoryStructureSorted = {}
  relativeUrlSortedArray.forEach((relativeUrl) => {
    directoryStructureSorted[relativeUrl] = directoryStructure[relativeUrl]
  })
  return directoryStructureSorted
}
