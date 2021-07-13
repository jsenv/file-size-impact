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
    cacheImpact,
    formatCacheImpactCell,
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
        cacheImpact,
        formatCacheImpactCell,
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
    ]
    lines.push(line)
  })
  if (filesShown !== files) {
    lines.push([`<td colspan="3" align="center">... ${fileCount - maxRowsPerTable} more ...</td>`])
  }

  return renderTableLines(lines)
}

const fileAbstractRelativeUrlFromFileImpact = ({ beforeMerge, afterMerge }) => {
  if (afterMerge) {
    return afterMerge.manifestKey || afterMerge.relativeUrl
  }
  return beforeMerge.manifestKey || beforeMerge.relativeUrl
}

const renderSizeImpactTableFooter = (
  fileByFileImpact,
  {
    groupComparison,
    transformations,
    formatGroupSizeImpactCell,
    cacheImpact,
    formatCacheImpactCell,
  },
) => {
  const footerLines = []

  const groupSizeImpactLine = [
    `<td nowrap><strong>Whole group</strong></td>`,
    ...Object.keys(transformations).map(
      (sizeName) => `<td nowrap>${formatGroupSizeImpactCell(groupComparison, sizeName)}</td>`,
    ),
  ]
  footerLines.push(groupSizeImpactLine)

  if (cacheImpact) {
    const cacheImpactLine = [
      `<td nowrap><strong>Cache impact</strong></td>`,
      ...Object.keys(transformations).map(
        (sizeName) => `<td nowrap>${formatCacheImpactCell(fileByFileImpact, sizeName)}</td>`,
      ),
    ]
    footerLines.push(cacheImpactLine)
  }

  return renderTableLines(footerLines)
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
