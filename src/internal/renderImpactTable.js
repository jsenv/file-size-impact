export const renderImpactTable = (
  fileByFileImpact,
  {
    groupComparison,
    transformations,
    fileRelativeUrlMaxLength,
    maxRowsPerTable,
    formatFileRelativeUrl,
    formatFileCell,
    formatFileSizeImpactCell,
    formatGroupSizeImpactCell,
  },
) => {
  const table = `<table>
    <thead>
      ${renderSizeImpactTableHeader(transformations)}
    </thead>
    <tbody>
      ${renderSizeImpactTableBody(fileByFileImpact, {
        transformations,
        maxRowsPerTable,
        fileRelativeUrlMaxLength,
        formatFileRelativeUrl,
        formatFileCell,
        formatFileSizeImpactCell,
      })}
    </tbody>
    <tfoot>
      ${renderSizeImpactTableFooter(fileByFileImpact, {
        groupComparison,
        transformations,
        formatGroupSizeImpactCell,
      })}
    </tfoot>
  </table>`

  return table
}

const renderSizeImpactTableHeader = (transformations) => {
  const lines = []
  const headerLine = [
    `<th nowrap>File</th>`,
    ...Object.keys(transformations).map(
      (sizeName) => `<th nowrap>${sizeName === "raw" ? `new size` : `new ${sizeName} size`}</th>`,
    ),
    `<th></th>`,
  ]
  lines.push(headerLine)

  return renderTableLines(lines)
}

const renderSizeImpactTableBody = (
  fileByFileImpact,
  {
    transformations,
    maxRowsPerTable,
    fileRelativeUrlMaxLength,
    formatFileRelativeUrl,
    formatFileCell,
    formatFileSizeImpactCell,
  },
) => {
  const lines = []
  const sizeNames = Object.keys(transformations)

  const renderDiffCell = (fileImpact, sizeName) => {
    const fileSizeImpactCellFormatted = formatFileSizeImpactCell(fileImpact, sizeName)
    return fileSizeImpactCellFormatted
  }

  const files = Object.keys(fileByFileImpact)
  const fileCount = files.length
  let filesShown
  if (fileCount > maxRowsPerTable) {
    filesShown = files.slice(0, maxRowsPerTable)
  } else {
    filesShown = files
  }
  filesShown.forEach((fileRelativeUrl) => {
    const fileImpact = fileByFileImpact[fileRelativeUrl]
    const fileAbstractRelativeUrl = fileAbstractRelativeUrlFromFileImpact(fileImpact)
    const fileRelativeUrlFormatted = (fileImpact.formatFileRelativeUrl || formatFileRelativeUrl)(
      fileAbstractRelativeUrl,
    )
    const fileRelativeUrlDisplayed = truncateFileRelativeUrl(
      fileRelativeUrlFormatted,
      fileRelativeUrlMaxLength,
    )
    const fileCellFormatted = formatFileCell({
      fileRelativeUrl,
      fileRelativeUrlDisplayed,
      ...fileImpact,
    })
    const line = [
      `<td nowrap>${fileCellFormatted}</td>`,
      ...sizeNames.map((sizeName) => `<td nowrap>${renderDiffCell(fileImpact, sizeName)}</td>`),
      `<td>${renderEmojiCellContent(fileImpact)}</td>`,
    ]
    lines.push(line)
  })
  if (filesShown !== files) {
    const columnCount =
      // file name
      1 +
      // all sizes
      sizeNames.length +
      // emoji column
      1
    lines.push([
      `<td colspan="${columnCount}" align="center">... ${
        fileCount - maxRowsPerTable
      } more ...</td>`,
    ])
  }

  return renderTableLines(lines)
}

const renderEmojiCellContent = (fileImpact) => {
  const { event } = fileImpact

  if (event === "added") {
    return ":new:"
  }

  if (event === "deleted") {
    return ""
  }

  const { afterMerge, beforeMerge } = fileImpact
  const afterMergeSizeMap = afterMerge.sizeMap
  const beforeMergeSizeMap = beforeMerge.sizeMap
  const sizeNames = Object.keys(afterMergeSizeMap)
  const sizeName = sizeNames[sizeNames.length - 1]
  const afterMergeSize = afterMergeSizeMap[sizeName]
  const beforeMergeSize = beforeMergeSizeMap[sizeName]
  const delta = afterMergeSize - beforeMergeSize
  if (delta === 0) {
    return ":ghost:"
  }

  if (delta > 0) {
    return ":arrow_upper_right:"
  }

  return ":arrow_lower_right:"
}

const renderGroupEmojiCellContent = ({ groupSizeAfterMerge, groupSizeBeforeMerge }) => {
  const delta = groupSizeAfterMerge - groupSizeBeforeMerge
  if (delta === 0) {
    return ":ghost:"
  }

  if (delta > 0) {
    return ":arrow_upper_right:"
  }

  return ":arrow_lower_right:"
}

const fileAbstractRelativeUrlFromFileImpact = ({ beforeMerge, afterMerge }) => {
  if (afterMerge) {
    return afterMerge.manifestKey || afterMerge.relativeUrl
  }
  return beforeMerge.manifestKey || beforeMerge.relativeUrl
}

const renderSizeImpactTableFooter = (
  fileByFileImpact,
  { groupComparison, transformations, formatGroupSizeImpactCell },
) => {
  const footerLines = []

  const sizeNames = Object.keys(transformations)
  const lastSizeName = sizeNames[sizeNames.length - 1]

  const groupImpacts = {}
  sizeNames.forEach((sizeName) => {
    groupImpacts[sizeName] = computeGroupImpact(groupComparison, sizeName)
  })

  const groupSizeImpactLine = [
    `<td nowrap><strong>Whole group</strong></td>`,
    ...sizeNames.map(
      (sizeName) => `<td nowrap>${formatGroupSizeImpactCell(groupImpacts[sizeName])}</td>`,
    ),
    `<td>${renderGroupEmojiCellContent(groupImpacts[lastSizeName])}</td>`,
  ]
  footerLines.push(groupSizeImpactLine)

  return renderTableLines(footerLines)
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

const truncateFileRelativeUrl = (fileRelativeUrl, fileRelativeUrlMaxLength) => {
  const length = fileRelativeUrl.length
  const extraLength = length - fileRelativeUrlMaxLength
  if (extraLength > 0) {
    return `…${fileRelativeUrl.slice(extraLength)}`
  }
  return fileRelativeUrl
}

const renderTableLines = (lines, { indentCount = 3, indentSize = 2 } = {}) => {
  if (lines.length === 0) {
    return ""
  }

  const cellLeftSpacing = indent(indentCount + 1, indentSize)
  const lineLeftSpacing = indent(indentCount, indentSize)

  return `<tr>${lines.map(
    (cells) => `
${cellLeftSpacing}${cells.join(`
${cellLeftSpacing}`)}`,
  ).join(`
${lineLeftSpacing}</tr>
${lineLeftSpacing}<tr>`)}
${lineLeftSpacing}</tr>`
}

const indent = (count, size) => ` `.repeat(size * count)
