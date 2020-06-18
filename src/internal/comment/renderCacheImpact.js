import { sumSize } from "./helper.js"

export const renderCacheImpact = (fileByFileImpact, { groupName, formatSize }) => {
  const cacheImpact = fileByFileImpactToCacheImpact(fileByFileImpact)

  return `
  <h6>Impact on <bold>${groupName}</bold> files cache</h6>
  <p>${renderCacheImpactDescription(cacheImpact)}</p>${
    cacheImpact.fileChangedCount === 0 ? "" : renderCacheImpactTable(cacheImpact, { formatSize })
  }`
}

const fileByFileImpactToCacheImpact = (fileByFileImpact) => {
  let fileChangedCount = 0
  const outdatedBytesMap = {}

  Object.keys(fileByFileImpact).forEach((fileRelativeUrl) => {
    const { event, base } = fileByFileImpact[fileRelativeUrl]
    if (event === "changed") {
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

const renderCacheImpactDescription = ({ fileChangedCount }) => {
  if (fileChangedCount === 0) {
    return `No impact on your users cache because no file content has changed.`
  }
  if (fileChangedCount === 1) {
    return `1 file in your users cache is now outdated because its content have changed.`
  }
  return `${fileChangedCount} files in you users cache are now outdated because their content have changed.`
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
