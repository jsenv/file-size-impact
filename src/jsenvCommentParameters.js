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
  formatFileSizeImpactCell: ({ fileSizeImpact, fileSizeAfterMerge }) => {
    const fileSizeImpactFormatted = formatSize(fileSizeImpact, { diff: true })
    const fileSizeAfterMergeFormatted = formatSize(fileSizeAfterMerge)

    return `${fileSizeImpactFormatted} (${fileSizeAfterMergeFormatted})`
  },
  formatSize,
}
