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
  let uncompressedBytesLost = 0
  let gzipBytesLost = 0
  let brotliBytesLost = 0
  let fileChangedCount = 0
  Object.keys(directoryComparison).forEach((fileRelativeUrl) => {
    const { base, head } = directoryComparison[fileRelativeUrl]
    if (isChanged({ base, head })) {
      fileChangedCount++
      uncompressedBytesLost += base.size
      gzipBytesLost += base.gzipSize
      brotliBytesLost += base.brotliSize
    }
  })

  return { fileChangedCount, uncompressedBytesLost, gzipBytesLost, brotliBytesLost }
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
  const { size, gzipSize, brotliSize } = cacheImpact

  const lines = [
    { name: "uncompressed", size },
    { name: "gzip", size: gzipSize },
    { name: "brotli", size: brotliSize },
  ].map(({ name, size }) => {
    return `
        <td nowrap>${name}</td>
        <td nowrap>${formatSize(size)}</td>`
  })

  return `<tr>${lines.join(`
      </tr>
      <tr>`)}
      </tr>`
}
