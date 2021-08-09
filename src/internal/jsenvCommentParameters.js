import { formatSize } from "./formatSize.js"

const jsenvFormatGroupSummary = ({ groupName, groupImpactCount, groupFileCount }) => {
  return `${groupName} (${groupImpactCount}/${groupFileCount})`
}

const jsenvFormatHiddenImpactSummary = ({ groupHiddenImpactCount }) => {
  return `Hidden (${groupHiddenImpactCount})`
}

const jsenvFormatFileRelativeUrl = (fileRelativeUrl) => {
  return fileRelativeUrl
}

const jsenvFormatFileCell = ({ fileRelativeUrlDisplayed, event }) => {
  if (event === "deleted") {
    return `<del>${fileRelativeUrlDisplayed}</del>`
  }
  return fileRelativeUrlDisplayed
}

/**
 * - added
 *   100b
 * - modified
 *   623.43KB (+370B / +0.06%)
 * - deleted
 *   0 (-100b)
 */
const jsenvFormatFileSizeImpactCell = (fileImpact, sizeName) => {
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
      showDiff: false,
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
      showDiffPercentage: false,
    })
  }

  const sizeBeforeMerge = beforeMerge.sizeMap[sizeName]
  const sizeAfterMerge = afterMerge.sizeMap[sizeName]
  return formatSizeImpact({
    sizeBeforeMerge,
    sizeAfterMerge,
  })
}

const jsenvFormatGroupSizeImpactCell = ({ groupSizeAfterMerge, groupSizeBeforeMerge }) => {
  return formatSizeImpact({
    sizeBeforeMerge: groupSizeBeforeMerge,
    sizeAfterMerge: groupSizeAfterMerge,
  })
}

const formatSizeImpact = ({
  sizeBeforeMerge,
  sizeAfterMerge,
  showDiff = true,
  showDiffPercentage = true,
}) => {
  const sizeAfterMergeFormatted = formatSize(sizeAfterMerge)
  if (!showDiff) {
    return sizeAfterMergeFormatted
  }

  const sizeDiff = sizeAfterMerge - sizeBeforeMerge
  const sizeDiffFormatted = formatSize(sizeDiff, { diff: true })

  if (!showDiffPercentage) {
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

export const jsenvCommentParameters = {
  filesOrdering: "size_impact",
  maxRowsPerTable: 600,
  fileRelativeUrlMaxLength: 100,
  formatGroupSummary: jsenvFormatGroupSummary,
  formatHiddenImpactSummary: jsenvFormatHiddenImpactSummary,
  formatFileRelativeUrl: jsenvFormatFileRelativeUrl,

  formatFileCell: jsenvFormatFileCell,
  formatFileSizeImpactCell: jsenvFormatFileSizeImpactCell,
  formatGroupSizeImpactCell: jsenvFormatGroupSizeImpactCell,
  shouldOpenGroupByDefault: () => false,
}
