import { createRequire } from "module"

const require = createRequire(import.meta.url)

// https://github.com/visionmedia/bytes.js/
const bytes = require("bytes")

const enDecimalFormatter = new Intl.NumberFormat("en", { style: "decimal" })

export const jsenvCommentParameters = {
  formatGroupSummary: ({ groupName, groupImpactCount, groupFileCount }) => {
    return `${groupName} (${groupImpactCount}/${groupFileCount})`
  },
  formatHiddenImpactSummary: ({ groupHiddenImpactCount }) => {
    return `Hidden (${groupHiddenImpactCount})`
  },
  formatFileRelativeUrl: (fileRelativeUrl) => fileRelativeUrl,
  maxRowsPerTable: 600,
  fileRelativeUrlMaxLength: 100,
  formatFileCell: ({ fileRelativeUrlDisplayed, event }) => {
    if (event === "added") {
      return `${fileRelativeUrlDisplayed}[new]`
    }
    if (event === "deleted") {
      return `<del>${fileRelativeUrlDisplayed}</del>`
    }
    return fileRelativeUrlDisplayed
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
    const { beforeMerge, afterMerge } = fileImpact

    // added
    if (!beforeMerge) {
      const sizeBeforeMerge = 0
      const sizeAfterMerge = afterMerge.sizeMap[sizeName]
      return formatSizeImpact({
        sizeBeforeMerge,
        sizeAfterMerge,
        // +100 % of something that was not here
        // makes no sense
        percentage: false,
      })
    }

    // deleted
    if (!afterMerge) {
      const sizeBeforeMerge = beforeMerge.sizeMap[sizeName]
      const sizeAfterMerge = 0
      return formatSizeImpact({
        sizeBeforeMerge,
        sizeAfterMerge,
        // -100% of the file kinda makes sense
        percentage: true,
      })
    }

    const sizeBeforeMerge = beforeMerge.sizeMap[sizeName]
    const sizeAfterMerge = afterMerge.sizeMap[sizeName]
    return formatSizeImpact({
      sizeBeforeMerge,
      sizeAfterMerge,
      percentage: true,
    })
  },
  formatGroupSizeImpactCell: (groupComparison, sizeName) => {
    const { groupSizeBeforeMerge, groupSizeAfterMerge } = computeGroupImpact(
      groupComparison,
      sizeName,
    )
    return formatSizeImpact({
      sizeBeforeMerge: groupSizeBeforeMerge,
      sizeAfterMerge: groupSizeAfterMerge,
      percentage: true,
    })
  },
  formatCacheImpactCell: (fileByFileImpact, sizeName) => {
    const { totalBytesToDownload } = computeCacheImpact(fileByFileImpact, sizeName)
    return formatSize(totalBytesToDownload, { unit: true })
  },
  shouldOpenGroupByDefault: () => false,
}

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

const computeGroupImpact = (groupComparison, sizeName) => {
  const groupImpact = Object.keys(groupComparison).reduce(
    (previous, fileRelativeUrl) => {
      const fileImpact = groupComparison[fileRelativeUrl]
      const { beforeMerge, afterMerge } = fileImpact
      // added
      if (!beforeMerge) {
        const sizeAfterMerge = afterMerge.sizeMap[sizeName]
        return {
          groupSizeBeforeMerge: previous.groupSizeBeforeMerge,
          groupSizeAfterMerge: previous.groupSizeAfterMerge + sizeAfterMerge,
        }
      }

      // removed
      if (!afterMerge) {
        const sizeBeforeMerge = beforeMerge.sizeMap[sizeName]
        return {
          groupSizeBeforeMerge: previous.groupSizeBeforeMerge + sizeBeforeMerge,
          groupSizeAfterMerge: previous.groupSizeAfterMerge,
        }
      }

      // modified or not, does not matter
      const sizeBeforeMerge = beforeMerge.sizeMap[sizeName]
      const sizeAfterMerge = afterMerge.sizeMap[sizeName]
      return {
        groupSizeBeforeMerge: previous.groupSizeBeforeMerge + sizeBeforeMerge,
        groupSizeAfterMerge: previous.groupSizeAfterMerge + sizeAfterMerge,
      }
    },
    {
      groupSizeBeforeMerge: 0,
      groupSizeAfterMerge: 0,
    },
  )
  return groupImpact
}

const computeCacheImpact = (fileByFileImpact, sizeName) => {
  // bytes to download is added file or modified file bytes
  const totalBytesToDownload = Object.keys(fileByFileImpact).reduce((previous, fileRelativeUrl) => {
    const fileImpact = fileByFileImpact[fileRelativeUrl]
    const { afterMerge } = fileImpact
    // removed
    if (!afterMerge) {
      return previous
    }
    return previous + afterMerge.sizeMap[sizeName]
  }, 0)
  return { totalBytesToDownload }
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
