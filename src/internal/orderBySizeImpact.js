export const orderBySizeImpact = (fileByFileImpact, sizeNames) => {
  const impactOrderedBySizeImpact = {}
  const files = Object.keys(fileByFileImpact)
  const lastSizeName = sizeNames[sizeNames.length - 1]
  files.sort((leftFile, rightFile) => {
    const leftFileSizeImpact = sizeImpactFromFileImpact(fileByFileImpact[leftFile], lastSizeName)
    const rightFileSizeImpact = sizeImpactFromFileImpact(fileByFileImpact[rightFile], lastSizeName)
    if (leftFileSizeImpact === 0) {
      return 1
    }
    if (rightFileSizeImpact === 0) {
      return -1
    }
    if (leftFileSizeImpact < rightFileSizeImpact) {
      return 1
    }
    if (leftFileSizeImpact > rightFileSizeImpact) {
      return -1
    }
    return 0
  })
  files.forEach((file) => {
    impactOrderedBySizeImpact[file] = fileByFileImpact[file]
  })
  return impactOrderedBySizeImpact
}

const sizeImpactFromFileImpact = (fileImpact, sizeName) => {
  const { event } = fileImpact
  if (event === "added") {
    return fileImpact.afterMerge.sizeMap[sizeName]
  }
  if (event === "modified") {
    return fileImpact.afterMerge.sizeMap[sizeName] - fileImpact.beforeMerge.sizeMap[sizeName]
  }
  return -fileImpact.beforeMerge.sizeMap[sizeName]
}
