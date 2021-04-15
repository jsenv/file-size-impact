const enDecimalFormatter = new Intl.NumberFormat("en", { style: "decimal" })

const formatSize = (sizeNumber, { diff = false, unit = false } = {}) => {
  const sizeNumberAbsolute = Math.abs(sizeNumber)
  let sizeString = enDecimalFormatter.format(sizeNumberAbsolute)

  if (diff) {
    if (sizeNumber < 0) {
      sizeString = `-${sizeString}`
    } else if (sizeNumber > 0) {
      sizeString = `+${sizeString}`
    }
  }

  if (unit) {
    if (sizeNumberAbsolute === 0) {
    } else if (sizeNumberAbsolute === 1) {
      sizeString = `${sizeString} byte`
    } else if (sizeNumberAbsolute > 1) {
      sizeString = `${sizeString} bytes`
    }
  }

  return sizeString
}

export const jsenvCommentParameters = {
  formatGroupSummary: ({ groupName, groupImpactCount, groupLength }) => {
    return `${groupName} (${groupImpactCount}/${groupLength})`
  },
  formatHiddenImpactSummary: ({ groupHiddenImpactCount }) => {
    return `Hidden (${groupHiddenImpactCount})`
  },
  formatFileRelativeUrl: (fileRelativeUrl) => fileRelativeUrl,
  maxRowsPerTable: 600,
  fileRelativeUrlMaxLength: 100,
  formatFileCell: ({ fileRelativeUrlFormatted, event }) => {
    if (event === "added") {
      return `${fileRelativeUrlFormatted}[new]`
    }
    if (event === "deleted") {
      return `<del>${fileRelativeUrlFormatted}</del>`
    }
    return fileRelativeUrlFormatted
  },
  /*
  - when modified
  623.43KB (+370B / +0.06%)
  - when added
  100b (+100b, +100%)
  - when deleted
  0 (-100b, -100%)
  */
  formatFileSizeImpactCell: (fileImpact, sizeName) => {
    const event = fileImpact.event

    if (event === "added") {
      const sizeBeforeMerge = 0
      const sizeAfterMerge = fileImpact.afterMerge.sizeMap[sizeName]
      return formatSizeImpact({
        sizeBeforeMerge,
        sizeAfterMerge,
      })
    }

    if (event === "deleted") {
      const sizeBeforeMerge = fileImpact.beforeMerge.sizeMap[sizeName]
      const sizeAfterMerge = 0
      return formatSizeImpact({
        sizeBeforeMerge,
        sizeAfterMerge,
      })
    }

    const sizeBeforeMerge = fileImpact.beforeMerge.sizeMap[sizeName]
    const sizeAfterMerge = fileImpact.afterMerge.sizeMap[sizeName]
    return formatSizeImpact({
      sizeBeforeMerge,
      sizeAfterMerge,
    })
  },
  formatTotalFileSizeImpactCell: ({ totalSizeBeforeMerge, totalSizeAfterMerge }) => {
    return formatSizeImpact({
      sizeBeforeMerge: totalSizeBeforeMerge,
      sizeAfterMerge: totalSizeAfterMerge,
    })
  },
  formatSize,
}

const formatSizeImpact = ({ sizeBeforeMerge, sizeAfterMerge }) => {
  const sizeAfterMergeFormatted = formatSize(sizeAfterMerge, { unit: true })

  const sizeDiff = sizeAfterMerge - sizeBeforeMerge
  const sizeDiffFormatted = formatSize(sizeDiff, { diff: true, unit: true })

  const sizeDiffRatio =
    sizeBeforeMerge === 0 ? 1 : sizeAfterMerge === 0 ? -1 : sizeBeforeMerge / sizeDiff
  const sizeDiffAsPercentage = sizeDiffRatio * 100
  const sizeDiffAsPercentageFormatted = `${sizeDiffAsPercentage < 0 ? `-` : "+"}${limitDecimals(
    sizeDiffAsPercentage,
    2,
  )}`

  return `${sizeAfterMergeFormatted} (${sizeDiffFormatted} / ${sizeDiffAsPercentageFormatted})`
}

const limitDecimals = (number, decimalCount = 2) => {
  const multiplier = Math.pow(10, decimalCount)
  return Math.round(number * multiplier) / multiplier
}
