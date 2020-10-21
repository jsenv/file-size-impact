export const renderFileSizeImpact = (
  { impactTracked, impactExcluded },
  { transformations, formatSize, pullRequestHead, pullRequestBase, groupName },
) => {
  let message = `${renderFileSizeImpactDescription(impactTracked, {
    pullRequestHead,
    pullRequestBase,
    groupName,
  })}`

  const impactTrackedCount = Object.keys(impactTracked).length
  if (impactTrackedCount > 0) {
    message = `${message}
  ${renderFileSizeImpactTable(impactTracked, { transformations, formatSize })}`
  }

  const impactExcludedCount = Object.keys(impactExcluded).length
  if (impactExcludedCount > 0) {
    message = `${message}
  ${renderExcludedFileSizeImpact(impactExcluded, { transformations, formatSize })}`
  }

  return message
}

const renderFileSizeImpactDescription = (
  groupImpact,
  { pullRequestHead, pullRequestBase, groupName },
) => {
  const impactCount = Object.keys(groupImpact).length
  return `<p>Merging ${pullRequestHead} into ${pullRequestBase} will impact ${
    impactCount === 1 ? "1 file" : `${impactCount} files`
  } in ${groupName} group.</p>`
}

const renderFileSizeImpactTable = (groupImpact, { transformations, formatSize }) => {
  return `<table>
    <thead>
      ${renderFileSizeImpactTableHeader(transformations)}
    </thead>
    <tbody>
      ${renderFileSizeImpactTableBody(groupImpact, { transformations, formatSize })}
    </tbody>
    <tfoot>
      ${renderFileSizeImpactTableFooter(groupImpact, { transformations, formatSize })}
    </tfoot>
  </table>`
}

const renderFileSizeImpactTableHeader = (transformations) => {
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

const renderFileSizeImpactTableBody = (groupImpact, { transformations, formatSize }) => {
  const lines = []
  const sizeNames = Object.keys(transformations)

  const renderDiffCell = (fileImpact, sizeName) => {
    const sizeImpact = getFileNamedSizeImpact(fileImpact, sizeName)
    const sizeAfterMerge = getFileNamedSizeAfterMerge(fileImpact, sizeName)

    return `${formatSize(sizeImpact, { diff: true })} (${formatSize(sizeAfterMerge)})`
  }

  Object.keys(groupImpact).forEach((fileRelativePath) => {
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

  if (lines.length === 0) return ""
  return `<tr>${lines.join(`
      </tr>
      <tr>`)}
      </tr>`
}

const getFileNamedSizeImpact = (fileImpact, sizeName) => {
  const sizeImpactMap = fileImpact.sizeImpactMap
  const sizeImpact = sizeImpactMap[sizeName]
  return sizeImpact
}

const getFileNamedSizeAfterMerge = (fileImpact, sizeName) => {
  if (fileImpact.event === "deleted") return 0
  const afterMergeSizeMap = fileImpact.afterMerge.sizeMap
  const sizeAfterMerge = afterMergeSizeMap[sizeName]
  return sizeAfterMerge
}

const renderFileSizeImpactTableFooter = (fileByFileImpact, { transformations, formatSize }) => {
  const renderTotal = (sizeName) => {
    const total = Object.keys(fileByFileImpact).reduce(
      (previous, fileRelativePath) => {
        const fileImpact = fileByFileImpact[fileRelativePath]

        const fileSizeImpact = getFileNamedSizeImpact(fileImpact, sizeName)
        const totalSizeImpactPrevious = previous.totalSizeImpact
        const totalSizeImpact = totalSizeImpactPrevious + fileSizeImpact

        const fileSizeAfterMerge = getFileNamedSizeAfterMerge(fileImpact, sizeName)
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
    `<td nowrap><strong>Total</strong></td>`,
    ...Object.keys(transformations).map((sizeName) => `<td nowrap>${renderTotal(sizeName)}</td>`),
    `<td nowrap></td>`,
  ]

  return `<tr>
        ${footerCells.join(`
        `)}
      </tr>`
}

const renderExcludedFileSizeImpact = (impactExcluded, { transformations, formatSize }) => {
  const impactExcludedCount = Object.keys(impactExcluded).length
  return `<details>
    <summary>Show excluded ${
      impactExcludedCount === 1 ? "impact" : "impacts"
    } (${impactExcludedCount})</summary>
    ${renderFileSizeImpactTable(impactExcluded, { transformations, formatSize })}
  </details>`
}
