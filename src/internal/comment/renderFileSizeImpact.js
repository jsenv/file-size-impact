import { groupComparisonToFileByFileImpact, renderEachGroup } from "./helper.js"

export const renderFileSizeImpact = ({
  trackingConfig,
  transformations,
  snapshotComparison,
  formatSize,
}) => {
  return renderEachGroup(
    (groupComparison, groupName) => {
      return renderGroup(groupComparison, { groupName, transformations, formatSize })
    },
    { snapshotComparison, trackingConfig },
  )
}

const renderGroup = (groupComparison, { groupName, transformations, formatSize }) => {
  const fileByFileImpact = groupComparisonToFileByFileImpact(groupComparison)
  const impactCount = Object.keys(fileByFileImpact).length
  const noImpact = impactCount === 0
  if (noImpact) {
    return `<h5>${groupName} (0)</h5>`
  }

  return `<h5>${groupName} (${impactCount})</h5>
${renderFileSizeImpactTable(fileByFileImpact, { transformations, formatSize })}`
}

const renderFileSizeImpactTable = (fileByFileImpact, { transformations, formatSize }) => {
  return `<table>
  <thead>
    ${renderFileSizeImpactTableHeader(transformations)}
  </thead>
  <tbody>
    ${renderFileSizeImpactTableBody(fileByFileImpact, { transformations, formatSize })}
  </tbody>
  <tfoot>
    ${renderFileSizeImpactTableFooter(fileByFileImpact, { transformations, formatSize })}
  </tfoot>
</table>`
}

const renderFileSizeImpactTableHeader = (transformations) => {
  const headerCells = [
    `<th nowrap>File</th>`,
    ...Object.keys(transformations).map((sizeName) => `<th nowrap>${sizeName}</th>`),
    `<th nowrap>Reason</th>`,
  ]

  return `<tr>
      ${headerCells.join(`
      `)}
    </tr>`
}

const renderFileSizeImpactTableBody = (fileByFileImpact, { transformations, formatSize }) => {
  const lines = []
  const sizeNames = Object.keys(transformations)

  const renderDiffCell = ({ event, base, afterMerge }, sizeName) => {
    if (event === "deleted") {
      const baseSizeMap = base.sizeMap
      if (sizeName in baseSizeMap) {
        return formatSize(-baseSizeMap[sizeName], { diff: true })
      }
      return `---`
    }

    if (event === "added") {
      const afterMergeSizeMap = afterMerge.sizeMap
      if (sizeName in afterMergeSizeMap) {
        return formatSize(afterMergeSizeMap[sizeName], { diff: true })
      }
      return `---`
    }

    const baseSizeMap = base.sizeMap
    const afterMergeSizeMap = afterMerge.sizeMap
    if (sizeName in baseSizeMap && sizeName in afterMergeSizeMap) {
      return formatSize(afterMergeSizeMap[sizeName] - baseSizeMap[sizeName], {
        diff: true,
      })
    }
    return `---`
  }

  Object.keys(fileByFileImpact).forEach((fileRelativePath) => {
    const fileImpact = fileByFileImpact[fileRelativePath]
    const cells = [
      `<td nowrap>${fileRelativePath}</td>`,
      ...sizeNames.map((sizeName) => `<td nowrap>${renderDiffCell(fileImpact, sizeName)}</td>`),
      `<td nowrap>${fileImpact.event}</td>`,
    ].filter((cell) => cell.length > 0)
    lines.push(
      `
        ${cells.join(`
        `)}`,
    )
  })

  if (lines.length === 0) return ""
  return `<tr>${lines.join(`
      </tr>
      <tr>`)}
      </tr>`
}

const renderFileSizeImpactTableFooter = (fileByFileImpact, { transformations, formatSize }) => {
  const renderTotal = (sizeName) => {
    return Object.keys(fileByFileImpact).reduce((previous, fileRelativePath) => {
      const fileImpact = fileByFileImpact[fileRelativePath]
      const { event, base, afterMerge } = fileImpact

      if (event === "added") {
        const afterMergeSizeMap = afterMerge.sizeMap
        if (sizeName in afterMergeSizeMap) {
          return previous + afterMergeSizeMap[sizeName]
        }
        return previous
      }
      if (event === "deleted") {
        const baseSizeMap = base.sizeMap
        if (sizeName in baseSizeMap) {
          return previous - baseSizeMap[sizeName]
        }
        return previous
      }

      const baseSizeMap = base.sizeMap
      const afterMergeSizeMap = afterMerge.sizeMap
      if (sizeName in baseSizeMap && sizeName in afterMergeSizeMap) {
        return previous + (afterMergeSizeMap[sizeName] - baseSizeMap[sizeName])
      }
      return previous
    }, 0)
  }

  const footerCells = [
    `<td nowrap><strong>Total</strong></td>`,
    ...Object.keys(transformations).map(
      (sizeName) => `<td nowrap>${formatSize(renderTotal(sizeName), { diff: true })}</td>`,
    ),
    `<td nowrap>---</td>`,
  ]

  return `<tr>
      ${footerCells.join(`
      `)}
    </tr>`
}
