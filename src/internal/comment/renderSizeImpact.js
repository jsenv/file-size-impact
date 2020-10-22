export const renderSizeImpactDescription = (sizeImpacts, groupName) => {
  const sizeImpactCount = Object.keys(sizeImpacts).length
  if (sizeImpactCount === 1) {
    return `<p>1 file size impact in ${groupName} group.</p>`
  }
  return `<p>${sizeImpactCount} files size impact in ${groupName} group.</p>`
}

export const renderSizeImpactTable = (
  groupImpact,
  { transformations, formatSize, maxLinePerTable },
) => {
  return `<table>
    <thead>
      ${renderSizeImpactTableHeader(transformations)}
    </thead>
    <tbody>
      ${renderSizeImpactTableBody(groupImpact, {
        transformations,
        formatSize,
        maxLinePerTable,
      })}
    </tbody>
    <tfoot>
      ${renderSizeImpactTableFooter(groupImpact, { transformations, formatSize })}
    </tfoot>
  </table>`
}

const renderSizeImpactTableHeader = (transformations) => {
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

const renderSizeImpactTableBody = (
  groupImpact,
  { transformations, formatSize, maxLinesPerTable },
) => {
  const lines = []
  const sizeNames = Object.keys(transformations)

  const renderDiffCell = (fileImpact, sizeName) => {
    const sizeImpact = getNamedSizeImpact(fileImpact, sizeName)
    const sizeAfterMerge = getNamedSizeAfterMerge(fileImpact, sizeName)

    return `${formatSize(sizeImpact, { diff: true })} (${formatSize(sizeAfterMerge)})`
  }

  const files = Object.keys(groupImpact)
  const fileCount = files.length
  let filesShown
  if (fileCount > maxLinesPerTable) {
    filesShown = files.slice(0, maxLinesPerTable)
  } else {
    filesShown = files
  }
  filesShown.forEach((fileRelativePath) => {
    const fileImpact = groupImpact[fileRelativePath]
    const cells = [
      `<td nowrap>${fileRelativePath}</td>`,
      ...sizeNames.map((sizeName) => `<td nowrap>${renderDiffCell(fileImpact, sizeName)}</td>`),
      `<td nowrap>${fileImpact.event}</td>`,
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

const renderSizeImpactTableFooter = (fileByFileImpact, { transformations, formatSize }) => {
  const renderTotal = (sizeName) => {
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

  const footerCells = [
    `<td nowrap><strong>Total size impact</strong></td>`,
    ...Object.keys(transformations).map((sizeName) => `<td nowrap>${renderTotal(sizeName)}</td>`),
    `<td nowrap></td>`,
  ]

  return `<tr>
        ${footerCells.join(`
        `)}
      </tr>`
}
