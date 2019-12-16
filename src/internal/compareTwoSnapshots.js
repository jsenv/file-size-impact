export const compareTwoSnapshots = async (baseSnapshot, headSnapshot) => {
  const snapshotComparison = {}
  const baseRelativeUrlArray = Object.keys(baseSnapshot)
  const headRelativeUrlArray = Object.keys(headSnapshot)

  baseRelativeUrlArray.forEach((relativeUrl) => {
    if (headRelativeUrlArray.includes(relativeUrl)) {
      snapshotComparison[relativeUrl] = {
        base: baseSnapshot[relativeUrl],
        head: headSnapshot[relativeUrl],
      }
    } else {
      snapshotComparison[relativeUrl] = {
        base: baseSnapshot[relativeUrl],
        head: null,
      }
    }
  })
  headRelativeUrlArray.forEach((relativeUrl) => {
    if (!baseRelativeUrlArray.includes(relativeUrl)) {
      snapshotComparison[relativeUrl] = {
        base: null,
        head: headSnapshot[relativeUrl],
      }
    }
  })

  return sortDirectoryStructure(snapshotComparison)
}

const sortDirectoryStructure = (directoryStructure) => {
  const relativeUrlSortedArray = Object.keys(directoryStructure).sort(compareLengthOrLocaleCompare)
  const directoryStructureSorted = {}
  relativeUrlSortedArray.forEach((relativeUrl) => {
    directoryStructureSorted[relativeUrl] = directoryStructure[relativeUrl]
  })
  return directoryStructureSorted
}

const compareLengthOrLocaleCompare = (a, b) => {
  return b.length - a.length || a.localeCompare(b)
}
