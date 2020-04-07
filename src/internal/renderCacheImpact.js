import { isChanged, sumSize } from "./helper.js"

export const renderCacheImpact = (directoryComparison, { formatSize }) => {
  const cacheImpact = directoryComparisonToCacheImpact(directoryComparison, { formatSize })

  return `

  <h3>Cache impact</h3>
  <p>${renderCacheImpactDescription(cacheImpact)}</p>
  ${cacheImpact.fileChangedCount === 0 ? "" : renderCacheImpactTable(cacheImpact, { formatSize })}`
}

const renderCacheImpactDescription = ({ fileChangedCount }) => {
  if (fileChangedCount === 0) {
    return `No impact on your users cache because no file content has changed.`
  }
  if (fileChangedCount === 1) {
    return `1 file in your users cache is now outdated because its content have changed.`
  }
  return `${fileChangedCount} files in you users cache are now outdated because their content have changed.`
}

const directoryComparisonToCacheImpact = (directoryComparison) => {
  let fileChangedCount = 0
  const outdatedBytesMap = {}
  Object.keys(directoryComparison).forEach((fileRelativeUrl) => {
    const { base, head } = directoryComparison[fileRelativeUrl]
    if (isChanged({ base, head })) {
      fileChangedCount++
      Object.keys(base.sizeMap).forEach((key) => {
        outdatedBytesMap[key] = sumSize(base.sizeMap, outdatedBytesMap, key)
      })
    }
  })
  return {
    fileChangedCount,
    outdatedBytesMap,
  }
}

const renderCacheImpactTable = (cacheImpact, { formatSize }) => {
  return `<table>
    <thead>
      <tr>
        <th nowrap>Transform</th>
        <th nowrap>Bytes outdated</th>
      </tr>
    </thead>
    <tbody>
      ${renderCacheImpactTableBody(cacheImpact, { formatSize })}
    </tbody>
  </table>`
}

const renderCacheImpactTableBody = (cacheImpact, { formatSize }) => {
  const { outdatedBytesMap } = cacheImpact

  const lines = Object.keys(outdatedBytesMap).map((key) => {
    return `
        <td nowrap>${key}</td>
        <td nowrap>${formatSize(outdatedBytesMap[key])}</td>`
  })

  return `<tr>${lines.join(`
      </tr>
      <tr>`)}
      </tr>`
}
