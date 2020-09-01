import { renderEachGroup, isAdded, isModified, isDeleted } from "./helper.js"

export const renderDetailedSizeImpact = ({
  pullRequestBase,
  snapshotComparison,
  trackingConfig,
  transformations,
  formatSize,
}) => {
  const overallDetailedSizeImpact = snapshotComparisonToOverallDetailedSizeImpact(
    snapshotComparison,
  )
  const overallDetailedSizeImpactCount = Object.keys(overallDetailedSizeImpact).reduce(
    (previous, groupName) => {
      const detailedSizeImpactOnGroup = overallDetailedSizeImpact[groupName]
      return previous + Object.keys(detailedSizeImpactOnGroup).length
    },
    0,
  )
  const detailedSizeImpactBody = renderEachGroup(
    (groupComparison, groupName) => {
      return renderDetailedSizeGroup(overallDetailedSizeImpact[groupName], {
        pullRequestBase,
        groupName,
        transformations,
        formatSize,
      })
    },
    { snapshotComparison, trackingConfig },
  )

  return `<details>
  <summary>Detailed size impact (${overallDetailedSizeImpactCount})</summary>
  ${detailedSizeImpactBody}
</details>`
}

const snapshotComparisonToOverallDetailedSizeImpact = (snapshotComparison) => {
  const overallDetailedSizeImpact = {}

  Object.keys(snapshotComparison).forEach((groupName) => {
    const groupComparison = snapshotComparison[groupName]
    overallDetailedSizeImpact[groupName] = groupComparisonToDetailedSizeImpactOnGroup(
      groupComparison,
    )
  })

  return overallDetailedSizeImpact
}

const groupComparisonToDetailedSizeImpactOnGroup = (groupComparison) => {
  const detailedSizeImpactOnGroup = {}
  Object.keys(groupComparison).forEach((fileRelativePath) => {
    const fileImpact = groupComparison[fileRelativePath]
    if (isAdded(fileImpact)) {
      detailedSizeImpactOnGroup[fileRelativePath] = { ...fileImpact, event: "added" }
    }
    if (isDeleted(fileImpact)) {
      detailedSizeImpactOnGroup[fileRelativePath] = { ...fileImpact, event: "deleted" }
    }
    if (isModified(fileImpact)) {
      detailedSizeImpactOnGroup[fileRelativePath] = { ...fileImpact, event: "modified" }
    }
  })
  return detailedSizeImpactOnGroup
}

const renderDetailedSizeGroup = (
  detailedSizeImpactOnGroup,
  { groupName, pullRequestBase, transformations, formatSize },
) => {
  return `<h5>${groupName}</h5>
  ${renderDetailedSizeTable(detailedSizeImpactOnGroup, {
    pullRequestBase,
    transformations,
    formatSize,
  })}`
}

const renderDetailedSizeTable = (
  detailedSizeImpactOnGroup,
  { pullRequestBase, transformations, formatSize },
) => {
  return `<table>
    <thead>
      ${renderDetailedSizeImpactTableHeader({ pullRequestBase, transformations })}
    </thead>
    <tbody>
      ${renderDetailedSizeImpactTableBody(detailedSizeImpactOnGroup, {
        transformations,
        formatSize,
      })}
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

const renderDetailedSizeImpactTableBody = (
  detailedSizeImpactOnGroup,
  { transformations, formatSize },
) => {
  const lines = []
  const singleSize = Object.keys(transformations).length === 1

  Object.keys(detailedSizeImpactOnGroup).forEach((fileRelativePath) => {
    const fileImpact = detailedSizeImpactOnGroup[fileRelativePath]
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
