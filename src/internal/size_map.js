export const getSizeMapsOneFile = ({ sizeNames, beforeMerge, afterMerge }) => {
  const sizeMapBeforeMerge = {}
  const sizeMapAfterMerge = {}

  sizeNames.forEach((sizeName) => {
    if (beforeMerge === undefined) {
      sizeMapBeforeMerge[sizeName] = undefined
      sizeMapAfterMerge[sizeName] = afterMerge.sizeMap[sizeName]
    } else if (afterMerge === undefined) {
      sizeMapBeforeMerge[sizeName] = beforeMerge.sizeMap[sizeName]
      sizeMapAfterMerge[sizeName] = undefined
    } else {
      sizeMapBeforeMerge[sizeName] = beforeMerge.sizeMap[sizeName]
      sizeMapAfterMerge[sizeName] = afterMerge.sizeMap[sizeName]
    }
  })

  return {
    sizeMapBeforeMerge,
    sizeMapAfterMerge,
  }
}

export const getSizeMapsForManyFiles = ({ sizeNames, fileByFileImpact, files }) => {
  const sizeMapBeforeMerge = {}
  const sizeMapAfterMerge = {}

  sizeNames.forEach((sizeName) => {
    let sizeBeforeMerge = 0
    let sizeAfterMerge = 0
    files.forEach((fileRelativeUrl) => {
      const { sizeMapBeforeMerge, sizeMapAfterMerge } = fileByFileImpact[fileRelativeUrl]
      sizeBeforeMerge += sizeMapBeforeMerge[sizeName] || 0
      sizeAfterMerge += sizeMapAfterMerge[sizeName] || 0
    })
    sizeMapBeforeMerge[sizeName] = sizeBeforeMerge
    sizeMapAfterMerge[sizeName] = sizeAfterMerge
  })

  return {
    sizeMapBeforeMerge,
    sizeMapAfterMerge,
  }
}
