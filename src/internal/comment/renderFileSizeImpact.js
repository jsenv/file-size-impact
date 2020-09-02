export const renderFileSizeImpact = (
  groupImpact,
  { transformations, formatSize, pullRequestHead, pullRequestBase, groupName },
) => {
  return `${renderFileSizeImpactDescription(groupImpact, {
    pullRequestHead,
    pullRequestBase,
    groupName,
  })}
  ${renderFileSizeImpactTable(groupImpact, { transformations, formatSize })}`
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
    const { size, diff } = fileImpactToSizeAndDiff(fileImpact, sizeName)
    return `${formatSize(size)} (${formatSize(diff, { diff: true })})`
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

const renderFileSizeImpactTableFooter = (fileByFileImpact, { transformations, formatSize }) => {
  const renderTotal = (sizeName) => {
    const total = Object.keys(fileByFileImpact).reduce(
      (previous, fileRelativePath) => {
        const previousSize = previous.size
        const previousDiff = previous.diff

        const fileImpact = fileByFileImpact[fileRelativePath]
        const { size, diff } = fileImpactToSizeAndDiff(fileImpact, sizeName)
        return { size: previousSize + size, diff: previousDiff + diff }
      },
      { size: 0, diff: 0 },
    )
    return `${formatSize(total.size)} (${formatSize(total.diff, { diff: true })})`
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

const fileImpactToSizeAndDiff = ({ event, base, afterMerge }, sizeName) => {
  if (event === "deleted") {
    const baseSizeMap = base.sizeMap
    if (sizeName in baseSizeMap) {
      return {
        size: 0,
        diff: -baseSizeMap[sizeName],
      }
    }
  }

  if (event === "added") {
    const afterMergeSizeMap = afterMerge.sizeMap
    if (sizeName in afterMergeSizeMap) {
      return {
        size: afterMergeSizeMap[sizeName],
        diff: afterMergeSizeMap[sizeName],
      }
    }
  }

  if (event === "modified") {
    const baseSizeMap = base.sizeMap
    const afterMergeSizeMap = afterMerge.sizeMap
    if (sizeName in baseSizeMap && sizeName in afterMergeSizeMap) {
      return {
        size: afterMergeSizeMap[sizeName],
        diff: afterMergeSizeMap[sizeName] - baseSizeMap[sizeName],
      }
    }
  }

  return { size: 0, diff: 0 }
}
