export const renderImpactTable = (
  fileByFileImpact,
  {
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
    ...Object.keys(transformations).map((sizeName) => `<th nowrap>${sizeName} size</th>`),
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
    const fileRelativeUrlFormatted = truncateFileRelativeUrl(
      (fileImpact.formatFileRelativeUrl || formatFileRelativeUrl)(fileRelativeUrl),
      fileRelativeUrlMaxLength,
    )
    const fileCellFormatted = formatFileCell({
      fileRelativeUrl,
      fileRelativeUrlFormatted,
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

const renderSizeImpactTableFooter = (
  fileByFileImpact,
  { transformations, formatGroupSizeImpactCell },
) => {
  const footerLines = []

  const totalSizeImpactLine = [
    `<td nowrap><strong>Total group size</strong></td>`,
    ...Object.keys(transformations).map(
      (sizeName) =>
        `<td nowrap>${renderGroupSizeImpact(fileByFileImpact, sizeName, {
          formatGroupSizeImpactCell,
        })}</td>`,
    ),
  ]
  footerLines.push(totalSizeImpactLine)

  return renderTableLines(footerLines)
}

const getNamedSizeBeforeMerge = (fileImpact, sizeName) => {
  if (fileImpact.event === "added") return 0
  const beforeMergeSizeMap = fileImpact.beforeMerge.sizeMap
  const sizeBeforeMerge = beforeMergeSizeMap[sizeName]
  return sizeBeforeMerge
}

const getNamedSizeAfterMerge = (fileImpact, sizeName) => {
  if (fileImpact.event === "deleted") return 0
  const afterMergeSizeMap = fileImpact.afterMerge.sizeMap
  const sizeAfterMerge = afterMergeSizeMap[sizeName]
  return sizeAfterMerge
}

const getNamedSizeImpact = (fileImpact, sizeName) => {
  const sizeImpactMap = fileImpact.sizeImpactMap
  const sizeImpact = sizeImpactMap[sizeName]
  return sizeImpact
}

const renderGroupSizeImpact = (fileByFileImpact, sizeName, { formatGroupSizeImpactCell }) => {
  const total = Object.keys(fileByFileImpact).reduce(
    (previous, fileRelativePath) => {
      const fileImpact = fileByFileImpact[fileRelativePath]

      const fileSizeBeforeMerge = getNamedSizeBeforeMerge(fileImpact, sizeName)
      const totalSizeBeforeMergePrevious = previous.totalSizeBeforeMerge
      const totalSizeBeforeMerge = totalSizeBeforeMergePrevious + fileSizeBeforeMerge

      const fileSizeAfterMerge = getNamedSizeAfterMerge(fileImpact, sizeName)
      const totalSizeAfterMergePrevious = previous.totalSizeAfterMerge
      const totalSizeAfterMerge = totalSizeAfterMergePrevious + fileSizeAfterMerge

      const fileSizeImpact = getNamedSizeImpact(fileImpact, sizeName)
      const totalSizeImpactPrevious = previous.totalSizeImpact
      const totalSizeImpact = totalSizeImpactPrevious + fileSizeImpact

      if (fileSizeImpact === 0) {
        return previous
      }

      return {
        totalSizeBeforeMerge,
        totalSizeAfterMerge,
        totalSizeImpact,
      }
    },
    {
      totalSizeBeforeMerge: 0,
      totalSizeAfterMerge: 0,
      totalSizeImpact: 0,
    },
  )
  const { totalSizeBeforeMerge, totalSizeAfterMerge, totalSizeImpact } = total
  return formatGroupSizeImpactCell({
    totalSizeBeforeMerge,
    totalSizeAfterMerge,
    totalSizeImpact,
  })
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
