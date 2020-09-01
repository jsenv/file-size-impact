import { groupComparisonToFileByFileImpact, renderEachGroup } from "./helper.js"

export const renderDetailedSizeImpact = (
  pullRequestBase,
  pullRequestHead,
  snapshotComparison,
  trackingConfig,
  transformations,
  formatSize,
) => {
  return renderEachGroup(
    (groupComparison, groupName) => {
      return renderDetailedSizeGroup(groupComparison, {
        pullRequestBase,
        groupName,
        transformations,
        formatSize,
      })
    },
    { snapshotComparison, trackingConfig },
  )
}

const renderDetailedSizeGroup = (
  groupComparison,
  {
    // groupName,
    pullRequestBase,
    transformations,
    formatSize,
  },
) => {
  const fileByFileImpact = groupComparisonToFileByFileImpact(groupComparison)

  return `<h5>Detailed size impact (${Object.keys(fileByFileImpact).lenght})</h5>
  ${renderDetailedSizeTable(fileByFileImpact, {
    pullRequestBase,
    transformations,
    formatSize,
  })}`
}

const renderDetailedSizeTable = (
  fileByFileImpact,
  { pullRequestBase, transformations, formatSize },
) => {
  return `<table>
    <thead>
      ${renderDetailedSizeImpactTableHeader({ pullRequestBase, transformations })}
    </thead>
    <tbody>
      ${renderDetailedSizeImpactTableBody(fileByFileImpact, { transformations, formatSize })}
    </tbody>
  </table>`
}

const renderDetailedSizeImpactTableHeader = ({ pullRequestBase, transformations }) => {
  const singleSize = Object.keys(transformations).length === 1

  const headerCells = [
    `<th nowrap>File</th>`,
    ...(singleSize ? [] : ["<th nowrap>Transform</th>"]),
    `<th nowrap>Diff</th>`,
    `<th nowrap>${pullRequestBase}</th>`,
    `<th nowrap>after merge</th>`,
    `<th nowrap>Event</th>`,
  ]

  return `<tr>
        ${headerCells.join(`
        `)}
      </tr>`
}

const renderDetailedSizeImpactTableBody = (fileByFileImpact, { transformations, formatSize }) => {
  const lines = []
  const singleSize = Object.keys(transformations).length === 1

  Object.keys(fileByFileImpact).forEach((fileRelativePath) => {
    const fileImpact = fileByFileImpact[fileRelativePath]
    const { event, base, afterMerge } = fileImpact

    const keys = Object.keys((afterMerge || base).sizeMap)
    keys.forEach((sizeName, index) => {
      const rowSpan = index === 0 ? keys.length : 1
      const merged = index > 0
      const cells = [
        renderFileCell({ rowSpan, merged, fileRelativePath }),
        ...(singleSize ? [] : [`<td nowrap>${sizeName}</td>`]),
        renderDiffCell({ event, sizeName, base, afterMerge, formatSize }),
        renderBaseCell({ rowSpan, merged, event, sizeName, base, formatSize }),
        renderAfterMergeCell({ rowSpan, merged, event, sizeName, afterMerge, formatSize }),
        renderEventCell({ rowSpan, merged, event }),
      ].filter((cell) => cell.length > 0)
      lines.push(
        `
        ${cells.join(`
        `)}`,
      )
    })
  })

  if (lines.length === 0) return ""
  return `<tr>${lines.join(`
      </tr>
      <tr>`)}
      </tr>`
}

const renderFileCell = ({ rowSpan, merged, fileRelativePath }) => {
  return merged ? "" : `<td nowrap rowspan="${rowSpan}">${fileRelativePath}</td>`
}

const renderDiffCell = ({ event, sizeName, base, afterMerge, formatSize }) => {
  if (event === "deleted") {
    const baseSizeMap = base.sizeMap
    if (sizeName in baseSizeMap) {
      return `<td nowrap>${formatSize(-baseSizeMap[sizeName], { diff: true })}</td>`
    }
    return `<td nowrap>---</td>`
  }

  if (event === "added") {
    const afterMergeSizeMap = afterMerge.sizeMap
    if (sizeName in afterMergeSizeMap) {
      return `<td nowrap>${formatSize(afterMergeSizeMap[sizeName], { diff: true })}</td>`
    }
    return `<td nowrap>---</td>`
  }

  const baseSizeMap = base.sizeMap
  const afterMergeSizeMap = afterMerge.sizeMap
  if (sizeName in baseSizeMap && sizeName in afterMergeSizeMap) {
    return `<td nowrap>${formatSize(afterMergeSizeMap[sizeName] - base.sizeMap[sizeName], {
      diff: true,
    })}</td>`
  }
  return `<td nowrap>---</td>`
}

const renderBaseCell = ({ event, sizeName, base, formatSize }) => {
  if (event === "added") {
    return `<td nowrap>---</td>`
  }
  const baseSizeMap = base.sizeMap
  if (sizeName in baseSizeMap) {
    return `<td nowrap>${formatSize(baseSizeMap[sizeName])}</td>`
  }
  return `<td nowrap>---</td>`
}

const renderAfterMergeCell = ({ event, sizeName, afterMerge, formatSize }) => {
  if (event === "deleted") {
    return `<td nowrap>---</td>`
  }
  const afterMergeSizeMap = afterMerge.sizeMap
  if (sizeName in afterMergeSizeMap) {
    return `<td nowrap>${formatSize(afterMergeSizeMap[sizeName])}</td>`
  }
  return `<td nowrap>---</td>`
}

const renderEventCell = ({ event, rowSpan, merged }) => {
  return merged ? "" : `<td nowrap rowspan="${rowSpan}">${event}</td>`
}
