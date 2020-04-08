import { isChanged, sumSize } from "./helper.js"

export const renderCacheImpact = (groupComparison, { formatSize }) => {
  const cacheImpact = groupComparisonToCacheImpact(groupComparison, { formatSize })

  return `
  <h3>Cache impact</h3>
  <p>${renderCacheImpactDescription(cacheImpact)}</p>${
    cacheImpact.fileChangedCount === 0 ? "" : renderCacheImpactTable(cacheImpact, { formatSize })
  }`
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

const groupComparisonToCacheImpact = (groupComparison) => {
  let fileChangedCount = 0
  const outdatedBytesMap = {}

  Object.keys(groupComparison).forEach((fileRelativeUrl) => {
    const { base, head } = groupComparison[fileRelativeUrl]
    if (isChanged({ base, head })) {
      fileChangedCount++
      Object.keys(base.sizeMap).forEach((key) => {
        outdatedBytesMap[key] = sumSize(base.sizeMap, outdatedBytesMap, key)
      })
    }
  })

  Object.keys(groupComparison).find((fileRelativeUrl) => {
    const { head } = groupComparison[fileRelativeUrl]
    if (head) {
      // adds sizeName we becomes interested in indicating "---"
      Object.keys(head.sizeMap).forEach((sizeName) => {
        if (sizeName in outdatedBytesMap) return
        outdatedBytesMap[sizeName] = "---"
      })
      // remove sizeName that we are no longer interested in
      Object.keys(outdatedBytesMap).forEach((sizeName) => {
        if (sizeName in head.sizeMap) return
        delete outdatedBytesMap[sizeName]
      })
      return true
    }
    return false
  })

  return {
    fileChangedCount,
    outdatedBytesMap,
  }
}

const renderCacheImpactTable = (cacheImpact, { formatSize }) => {
  const noneOnly = analyseNoneOnly(cacheImpact)

  const headerCells = [
    ...(noneOnly ? [] : ["<th nowrap>Transform</th>"]),
    `<th nowrap>Bytes outdated</th>`,
  ]

  return `
  <table>
    <thead>
      <tr>
        ${headerCells.join(`
        `)}
      </tr>
    </thead>
    <tbody>
      ${renderCacheImpactTableBody(cacheImpact, { noneOnly, formatSize })}
    </tbody>
  </table>`
}

const analyseNoneOnly = (cacheImpact) => {
  const { outdatedBytesMap } = cacheImpact
  return `none` in outdatedBytesMap && Object.keys(outdatedBytesMap).length === 1
}

const renderCacheImpactTableBody = (cacheImpact, { noneOnly, formatSize }) => {
  const { outdatedBytesMap } = cacheImpact

  const lines = Object.keys(outdatedBytesMap).map((sizeName) => {
    const sizeValue = outdatedBytesMap[sizeName]
    const cells = [
      ...(noneOnly ? [] : [`<td nowrap>${sizeName}</td>`]),
      `<td nowrap>${formatSize(sizeValue)}</td>`,
    ]
    return `
        ${cells.join(`
        `)}`
  })

  return `<tr>${lines.join(`
      </tr>
      <tr>`)}
      </tr>`
}
