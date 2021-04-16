import { createRequire } from "module"

const require = createRequire(import.meta.url)

// https://github.com/visionmedia/bytes.js/
const bytes = require("bytes")

const enDecimalFormatter = new Intl.NumberFormat("en", { style: "decimal" })

const formatSize = (sizeNumber, { diff = false, unit = false } = {}) => {
  const sizeNumberAbsolute = Math.abs(sizeNumber)

  let sizeString
  if (unit) {
    sizeString = bytes(sizeNumberAbsolute, { decimalPlaces: 2 })
  } else {
    sizeString = enDecimalFormatter.format(sizeNumberAbsolute)
  }

  if (diff) {
    if (sizeNumber < 0) {
      sizeString = `-${sizeString}`
    } else if (sizeNumber > 0) {
      sizeString = `+${sizeString}`
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
        // +100 % of something that was not here
        // makes no sense
        percentage: false,
      })
    }

    if (event === "deleted") {
      const sizeBeforeMerge = fileImpact.beforeMerge.sizeMap[sizeName]
      const sizeAfterMerge = 0
      return formatSizeImpact({
        sizeBeforeMerge,
        sizeAfterMerge,
        // -100% of the file kinda makes sense
        percentage: true,
      })
    }

    const sizeBeforeMerge = fileImpact.beforeMerge.sizeMap[sizeName]
    const sizeAfterMerge = fileImpact.afterMerge.sizeMap[sizeName]
    return formatSizeImpact({
      sizeBeforeMerge,
      sizeAfterMerge,
      percentage: true,
    })
  },
  formatGroupSizeImpactCell: ({ totalSizeBeforeMerge, totalSizeAfterMerge }) => {
    return formatSizeImpact({
      sizeBeforeMerge: totalSizeBeforeMerge,
      sizeAfterMerge: totalSizeAfterMerge,
      // If you add +2 bytes to a file of 20 bytes,
      // total percentage will display +10%.
      // It can be confusing.
      percentage: true,
    })
  },
  formatSize,
}

const formatSizeImpact = ({ sizeBeforeMerge, sizeAfterMerge, percentage }) => {
  const sizeAfterMergeFormatted = formatSize(sizeAfterMerge, { unit: true })

  const sizeDiff = sizeAfterMerge - sizeBeforeMerge
  const sizeDiffFormatted = formatSize(sizeDiff, { diff: true, unit: true })

  if (!percentage) {
    return `${sizeAfterMergeFormatted} (${sizeDiffFormatted})`
  }

  const sizeDiffRatio =
    sizeBeforeMerge === 0 ? 1 : sizeAfterMerge === 0 ? -1 : sizeDiff / sizeBeforeMerge
  const sizeDiffAsPercentage = sizeDiffRatio * 100
  const sizeDiffAsPercentageFormatted = `${sizeDiffAsPercentage < 0 ? `-` : "+"}${Math.abs(
    limitDecimals(sizeDiffAsPercentage, 2),
  )}%`

  return `${sizeAfterMergeFormatted} (${sizeDiffFormatted} / ${sizeDiffAsPercentageFormatted})`
}

const limitDecimals = (number, decimalCount = 2) => {
  const multiplier = Math.pow(10, decimalCount)
  return Math.round(number * multiplier) / multiplier
}
