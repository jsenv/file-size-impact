export const renderSizeImpactTable = (
  fileByFileImpact,
  { cacheImpact, transformations, formatSize, maxLinePerTable },
) => {
  const table = `<table>
    <thead>
      ${renderSizeImpactTableHeader(transformations)}
    </thead>
    <tbody>
      ${renderSizeImpactTableBody(fileByFileImpact, {
        cacheImpact,
        transformations,
        formatSize,
        maxLinePerTable,
      })}
    </tbody>
    <tfoot>
      ${renderSizeImpactTableFooter(fileByFileImpact, {
        cacheImpact,
        transformations,
        formatSize,
      })}
    </tfoot>
  </table>`

  return table
}

const renderSizeImpactTableHeader = (transformations) => {
  const lines = []
  const headerLine = [
    `<th nowrap>File</th>`,
    ...Object.keys(transformations).map((sizeName) => `<th nowrap>${sizeName}</th>`),
    `<th nowrap>Event</th>`,
  ]
  lines.push(headerLine)

  return renderTableLines(lines)
}

const renderSizeImpactTableBody = (
  fileByFileImpact,
  { transformations, formatSize, maxLinesPerTable },
) => {
  const lines = []
  const sizeNames = Object.keys(transformations)

  const renderDiffCell = (fileImpact, sizeName) => {
    const sizeImpact = getNamedSizeImpact(fileImpact, sizeName)
    const sizeAfterMerge = getNamedSizeAfterMerge(fileImpact, sizeName)

    return `${formatSize(sizeImpact, { diff: true })} (${formatSize(sizeAfterMerge)})`
  }

  const files = Object.keys(fileByFileImpact)
  const fileCount = files.length
  let filesShown
  if (fileCount > maxLinesPerTable) {
    filesShown = files.slice(0, maxLinesPerTable)
  } else {
    filesShown = files
  }
  filesShown.forEach((fileRelativePath) => {
    const fileImpact = fileByFileImpact[fileRelativePath]
    const line = [
      `<td nowrap>${fileRelativePath}${
        fileImpact.participatesToCacheImpact ? `<sup>*</sup>` : ""
      }</td>`,
      ...sizeNames.map((sizeName) => `<td nowrap>${renderDiffCell(fileImpact, sizeName)}</td>`),
      `<td nowrap>${fileImpact.event}</td>`,
    ]
    lines.push(line)
  })
  if (filesShown !== files) {
    lines.push([`<td colspan="3" align="center">... ${fileCount - maxLinesPerTable} more ...</td>`])
  }

  return renderTableLines(lines)
}

const getNamedSizeImpact = (fileImpact, sizeName) => {
  const sizeImpactMap = fileImpact.sizeImpactMap
  const sizeImpact = sizeImpactMap[sizeName]
  return sizeImpact
}

const getNamedSizeAfterMerge = (fileImpact, sizeName) => {
  if (fileImpact.event === "deleted") return 0
  const afterMergeSizeMap = fileImpact.afterMerge.sizeMap
  const sizeAfterMerge = afterMergeSizeMap[sizeName]
  return sizeAfterMerge
}

const renderSizeImpactTableFooter = (
  fileByFileImpact,
  { cacheImpact, transformations, formatSize },
) => {
  const footerLines = []

  const totalSizeImpactLine = [
    `<td nowrap><strong>Total size impact</strong></td>`,
    ...Object.keys(transformations).map(
      (sizeName) =>
        `<td nowrap>${renderTotalSizeImpact(fileByFileImpact, sizeName, { formatSize })}</td>`,
    ),
    `<td nowrap></td>`,
  ]
  footerLines.push(totalSizeImpactLine)

  if (cacheImpact) {
    const totalCacheImpactLine = [
      `<td nowrap><strong>Total cache impact<sup>*</sup></strong></td>`,
      ...Object.keys(transformations).map(
        (sizeName) => `<td nowrap>${renderTotalCacheImpact(fileByFileImpact, sizeName)}</td>`,
      ),
      `<td nowrap></td>`,
    ]
    footerLines.push(totalCacheImpactLine)
  }

  return renderTableLines(footerLines)
}

const renderTotalSizeImpact = (fileByFileImpact, sizeName, { formatSize }) => {
  const total = Object.keys(fileByFileImpact).reduce(
    (previous, fileRelativePath) => {
      const fileImpact = fileByFileImpact[fileRelativePath]

      const fileSizeImpact = getNamedSizeImpact(fileImpact, sizeName)
      const totalSizeImpactPrevious = previous.totalSizeImpact
      const totalSizeImpact = totalSizeImpactPrevious + fileSizeImpact

      const fileSizeAfterMerge = getNamedSizeAfterMerge(fileImpact, sizeName)
      const totalSizeAfterMergePrevious = previous.totalSizeAfterMerge
      const totalSizeAfterMerge = totalSizeAfterMergePrevious + fileSizeAfterMerge

      return {
        totalSizeImpact,
        totalSizeAfterMerge,
      }
    },
    { totalSizeImpact: 0, totalSizeAfterMerge: 0 },
  )
  const { totalSizeImpact, totalSizeAfterMerge } = total
  return `${formatSize(totalSizeImpact, { diff: true })} (${formatSize(totalSizeAfterMerge)})`
}

const renderTotalCacheImpact = (fileByFileImpact, sizeName) => {
  return Object.keys(fileByFileImpact).reduce((previous, fileRelativePath) => {
    const fileImpact = fileByFileImpact[fileRelativePath]
    if (!fileImpact.participatesToCacheImpact) {
      return previous
    }

    const afterMergeSizeMap = fileImpact.afterMerge.sizeMap
    if (sizeName in afterMergeSizeMap) {
      return previous + afterMergeSizeMap[sizeName]
    }

    return previous
  }, 0)
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
