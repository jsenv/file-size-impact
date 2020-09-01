import { isModified, isAdded, renderEachGroup } from "./helper.js"

export const renderCacheImpact = ({
  trackingConfig,
  transformations,
  snapshotComparison,
  formatSize,
}) => {
  const overallCacheImpact = snapshotComparisonToOverallCacheImpact(snapshotComparison)
  const overallCacheImpactCount = Object.keys(overallCacheImpact).reduce((previous, groupName) => {
    const cacheImpactOnGroup = overallCacheImpact[groupName]
    return previous + Object.keys(cacheImpactOnGroup).length
  }, 0)
  const cacheDetails = renderEachGroup(
    (groupComparison, groupName) => {
      return renderCacheImpactGroup(overallCacheImpact[groupName], {
        groupName,
        transformations,
        formatSize,
      })
    },
    { snapshotComparison, trackingConfig },
  )

  return `<details>
  <summary>Cache impact (${overallCacheImpactCount})</summary>
  ${cacheDetails}
</details>`
}

const snapshotComparisonToOverallCacheImpact = (snapshotComparison) => {
  const overallCacheImpact = {}

  Object.keys(snapshotComparison).forEach((groupName) => {
    const groupComparison = snapshotComparison[groupName]
    overallCacheImpact[groupName] = groupComparisonToCacheImpactOnGroup(groupComparison)
  })

  return overallCacheImpact
}

const groupComparisonToCacheImpactOnGroup = (groupComparison) => {
  const cacheImpactOnGroup = {}
  Object.keys(groupComparison).forEach((fileRelativePath) => {
    const fileImpact = groupComparison[fileRelativePath]
    if (isAdded(fileImpact)) {
      cacheImpactOnGroup[fileRelativePath] = fileImpact
    }
    if (isModified(fileImpact)) {
      cacheImpactOnGroup[fileRelativePath] = fileImpact
    }
  })
  return cacheImpactOnGroup
}

const renderCacheImpactGroup = (cacheImpactOnGroup, { groupName, transformations, formatSize }) => {
  const cacheImpactCount = Object.keys(cacheImpactOnGroup).length
  return `<h5>${groupName} (${cacheImpactCount})</h5>

${renderCacheImpactDescription(cacheImpactOnGroup, { groupName })}

${renderCacheImpactTable(cacheImpactOnGroup, { transformations, formatSize })}`
}

const renderCacheImpactDescription = (cacheImpactOnGroup, { groupName }) => {
  return `  <p>${renderCacheImpactLeftPart(
    cacheImpactOnGroup,
  )} in ${groupName} group -> ${renderCacheImpactRightPart(cacheImpactOnGroup)}</p>`
}

const renderCacheImpactLeftPart = (cacheImpactOnGroup) => {
  let addedCount = 0
  let modifiedCount = 0
  Object.keys(cacheImpactOnGroup).forEach((fileRelativePath) => {
    if (isModified(cacheImpactOnGroup[fileRelativePath])) {
      modifiedCount++
    } else {
      addedCount++
    }
  })

  if (modifiedCount === 0 && addedCount === 0) {
    return `No file modified or added`
  }
  if (addedCount === 0) {
    return renderModifiedMessage(modifiedCount)
  }
  if (modifiedCount === 0) {
    return renderAddedMessage(addedCount)
  }
  return `${renderAddedMessage(addedCount)} and ${renderModifiedMessage(modifiedCount)}`
}

const renderModifiedMessage = (modifiedCount) => {
  if (modifiedCount === 1) {
    return `1 file modified`
  }
  if (modifiedCount > 1) {
    return `${modifiedCount} files modified`
  }
  return ""
}

const renderAddedMessage = (addedCount) => {
  if (addedCount === 1) {
    return `1 file added`
  }
  if (addedCount > 1) {
    return `${addedCount} files added`
  }
  return ""
}

const renderCacheImpactRightPart = (cacheImpactOnGroup) => {
  const cacheImpactCount = Object.keys(cacheImpactOnGroup).length
  if (cacheImpactCount === 0) {
    return `no impact on cache.`
  }
  if (cacheImpactCount === 1) {
    return `1 file to download for a returning user.`
  }
  return `${cacheImpactCount} files to download for a returning user.`
}

const renderCacheImpactTable = (cacheImpactOnGroup, { transformations, formatSize }) => {
  return `
  <table>
    <thead>
      ${renderCacheImpactTableHeader(transformations)}
    </thead>
    <tbody>
      ${renderCacheImpactTableBody(cacheImpactOnGroup, { transformations, formatSize })}
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
    `<th nowrap>Reason</th>`,
  ]

  return `<tr>
      ${headerCells.join(`
      `)}
    </tr>`
}

const renderCacheImpactTableBody = (cacheImpactOnGroup, { transformations, formatSize }) => {
  const lines = []
  const sizeNames = Object.keys(transformations)

  const renderSize = (file, sizeName) => {
    const afterMergeSizeMap = file.afterMerge.sizeMap
    if (sizeName in afterMergeSizeMap) {
      return formatSize(afterMergeSizeMap[sizeName])
    }
    return `---`
  }

  Object.keys(cacheImpactOnGroup).forEach((fileRelativePath) => {
    const file = cacheImpactOnGroup[fileRelativePath]
    const cells = [
      `<td nowrap>${fileRelativePath}</td>`,
      ...sizeNames.map((sizeName) => `<td nowrap>${renderSize(file, sizeName)}</td>`),
      `<td nowrap>${isModified(file) ? "modified" : "added"}</td>`,
    ]
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
    `<td nowrap>---</td>`,
  ]

  return `<tr>
      ${footerCells.join(`
      `)}
    </tr>`
}
