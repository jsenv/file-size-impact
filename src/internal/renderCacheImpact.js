import { isChanged } from "./helper.js"

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
  let uncompressedBytesOutdated = 0
  let gzipBytesOutdated = 0
  let brotliBytesOutdated = 0
  let fileChangedCount = 0
  Object.keys(directoryComparison).forEach((fileRelativeUrl) => {
    const { base, head } = directoryComparison[fileRelativeUrl]
    if (isChanged({ base, head })) {
      fileChangedCount++
      uncompressedBytesOutdated += base.size
      gzipBytesOutdated += base.gzipSize
      brotliBytesOutdated += base.brotliSize
    }
  })
  return {
    fileChangedCount,
    uncompressedBytesOutdated,
    gzipBytesOutdated,
    brotliBytesOutdated,
  }
}

const renderCacheImpactTable = (cacheImpact, { formatSize }) => {
  return `<table>
    <thead>
      <tr>
        <th nowrap>Cache impact</th>
        <th nowrap>Bytes outdated</th>
      </tr>
    </thead>
    <tbody>
      ${renderCacheImpactTableBody(cacheImpact, { formatSize })}
    </tbody>
  </table>`
}

const renderCacheImpactTableBody = (cacheImpact, { formatSize }) => {
  const { uncompressedBytesOutdated, gzipBytesOutdated, brotliBytesOutdated } = cacheImpact

  const lines = [
    { name: "uncompressed", bytesOutdated: uncompressedBytesOutdated },
    { name: "gzip", bytesOutdated: gzipBytesOutdated },
    { name: "brotli", bytesOutdated: brotliBytesOutdated },
  ].map(({ name, bytesOutdated }) => {
    return `
        <td nowrap>${name}</td>
        <td nowrap>${formatSize(bytesOutdated)}</td>`
  })

  return `<tr>${lines.join(`
      </tr>
      <tr>`)}
      </tr>`
}
