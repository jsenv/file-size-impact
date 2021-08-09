export const getSizeMaps = ({ beforeMerge, afterMerge }) => {
  // added
  if (!beforeMerge) {
    const sizeMapBeforeMerge = null
    const sizeMapAfterMerge = afterMerge.sizeMap
    const sizeImpactMap = {}
    Object.keys(sizeMapAfterMerge).forEach((sizeName) => {
      sizeImpactMap[sizeName] = sizeMapAfterMerge[sizeName]
    })
    return {
      sizeMapBeforeMerge,
      sizeMapAfterMerge,
      sizeImpactMap,
    }
  }

  // deleted
  if (!afterMerge) {
    const sizeMapBeforeMerge = beforeMerge.sizeMap
    const sizeMapAfterMerge = null
    const sizeImpactMap = {}
    Object.keys(sizeMapBeforeMerge).forEach((sizeName) => {
      sizeImpactMap[sizeName] = -sizeMapBeforeMerge[sizeName]
    })
    return {
      sizeMapBeforeMerge,
      sizeMapAfterMerge,
      sizeImpactMap,
    }
  }

  const sizeMapBeforeMerge = beforeMerge.sizeMap
  const sizeMapAfterMerge = afterMerge.sizeMap
  const sizeImpactMap = {}
  Object.keys(sizeMapAfterMerge).forEach((sizeName) => {
    sizeImpactMap[sizeName] = sizeMapAfterMerge[sizeName] - sizeMapBeforeMerge[sizeName]
  })
  return {
    sizeMapBeforeMerge,
    sizeMapAfterMerge,
    sizeImpactMap,
  }
}
