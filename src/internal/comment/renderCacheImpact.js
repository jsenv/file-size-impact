export const renderCacheImpactDescription = (cacheImpact) => {
  const cacheImpactCount = Object.keys(cacheImpact).length
  return `<p>${formulateFileQuantity(
    cacheImpactCount,
  )} in returning users cache will be invalidated</p>`
}

const formulateFileQuantity = (count) => {
  return count === 1 ? `1 file` : `${count} files`
}

export const renderCacheImpactTable = (
  cacheImpactOnGroup,
  { transformations, formatSize, maxLinePerTable },
) => {
  return `<table>
    <thead>
      ${renderCacheImpactTableHeader(transformations)}
    </thead>
    <tbody>
      ${renderCacheImpactTableBody(cacheImpactOnGroup, {
        transformations,
        formatSize,
        maxLinePerTable,
      })}
    </tbody>
    <tfoot>
      ${renderCacheImpactTableFooter(cacheImpactOnGroup, { transformations, formatSize })}
    </tfoot>
  </table>`
}

const renderCacheImpactTableHeader = (transformations) => {
  const headerCells = [
    `<th nowrap>File</th>`,
    ...Object.keys(transformations).map((sizeName) => `<th nowrap>${sizeName}</th>`),
    `<th nowrap>Event</th>`,
  ]

  return `<tr>
        ${headerCells.join(`
        `)}
      </tr>`
}

const renderCacheImpactTableBody = (
  cacheImpactOnGroup,
  { transformations, formatSize, maxLinesPerTable },
) => {
  const lines = []
  const sizeNames = Object.keys(transformations)

  const renderSize = (file, sizeName) => {
    const afterMergeSizeMap = file.afterMerge.sizeMap
    if (sizeName in afterMergeSizeMap) {
      return formatSize(afterMergeSizeMap[sizeName])
    }
    return `---`
  }

  const files = Object.keys(cacheImpactOnGroup)
  const fileCount = files.length
  let filesShown
  if (fileCount > maxLinesPerTable) {
    filesShown = files.slice(0, maxLinesPerTable)
  } else {
    filesShown = files
  }
  Object.keys(cacheImpactOnGroup).forEach((fileRelativePath) => {
    const file = cacheImpactOnGroup[fileRelativePath]
    const cells = [
      `<td nowrap>${fileRelativePath}</td>`,
      ...sizeNames.map((sizeName) => `<td nowrap>${renderSize(file, sizeName)}</td>`),
      `<td nowrap>${file.event}</td>`,
    ]
    lines.push(`
        ${cells.join(`
        `)}`)
  })
  if (filesShown !== files) {
    lines.push(`
        <tr>
          <td colspan="3" align="center">... ${fileCount - maxLinesPerTable} more ...</td>
        </tr>`)
  }

  if (lines.length === 0) return ""
  return `<tr>${lines.join(`
      </tr>
      <tr>`)}
      </tr>`
}

const renderCacheImpactTableFooter = (cacheImpactOnGroup, { transformations, formatSize }) => {
  const renderTotal = (sizeName) => {
    return Object.keys(cacheImpactOnGroup).reduce((previous, fileRelativePath) => {
      const fileImpact = cacheImpactOnGroup[fileRelativePath]
      const afterMergeSizeMap = fileImpact.afterMerge.sizeMap
      if (sizeName in afterMergeSizeMap) {
        return previous + afterMergeSizeMap[sizeName]
      }
      return previous
    }, 0)
  }

  const footerCells = [
    `<td nowrap><strong>Total</strong></td>`,
    ...Object.keys(transformations).map(
      (sizeName) => `<td nowrap>${formatSize(renderTotal(sizeName))}</td>`,
    ),
    `<td nowrap></td>`,
  ]

  return `<tr>
        ${footerCells.join(`
        `)}
      </tr>`
}
