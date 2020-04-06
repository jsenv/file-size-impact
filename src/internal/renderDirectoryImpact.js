export const renderDirectoryImpact = (
  directoryComparison,
  { directoryRelativeUrl, pullRequestBase, pullRequestHead, formatSize },
) => {
  return `
  <h3>Overall impact</h3>
  <p>Impact of changes on <code>${directoryRelativeUrl}</code> size in bytes.</p>
  ${renderDirectoryImpactTable(directoryComparison, {
    pullRequestBase,
    pullRequestHead,
    formatSize,
  })}`
}

const directoryComparisonToDirectoryImpact = (directoryComparison) => {
  let uncompressedBaseSize = 0
  let uncompressedHeadSize = 0
  let gzipBaseSize = 0
  let gzipHeadSize = 0
  let brotliBaseSize = 0
  let brotliHeadSize = 0

  Object.keys(directoryComparison).forEach((fileRelativeUrl) => {
    const { base, head } = directoryComparison[fileRelativeUrl]

    if (base) {
      uncompressedBaseSize += base.size
      gzipBaseSize += base.gzipSize
      brotliBaseSize += base.brotliSize
    }

    if (head) {
      uncompressedHeadSize += head.size
      gzipHeadSize += head.gzipSize
      brotliHeadSize += head.brotliSize
    }
  })

  return {
    uncompressed: { baseSize: uncompressedBaseSize, headSize: uncompressedHeadSize },
    gzip: { baseSize: gzipBaseSize, headSize: gzipHeadSize },
    brotli: { baseSize: brotliBaseSize, headSize: brotliHeadSize },
  }
}

const renderDirectoryImpactTable = (
  directoryComparison,
  { pullRequestBase, pullRequestHead, formatSize },
) => {
  const directoryImpact = directoryComparisonToDirectoryImpact(directoryComparison)

  return `<table>
    <thead>
      <tr>
        <th nowrap>Compression</th>
        <th nowrap>diff</th>
        <th nowrap><code>${pullRequestBase}</code></th>
        <th nowrap><code>${pullRequestHead}</code></th>
      </tr>
    </thead>
    <tbody>
      ${renderDirectoryImpactTableBody(directoryImpact, { formatSize })}
    </tbody>
  <table>`
}

const renderDirectoryImpactTableBody = (directoryImpact, { formatSize }) => {
  const { uncompressed, gzip, brotli } = directoryImpact

  const lines = [
    { name: "none", ...uncompressed },
    { name: "gzip", ...gzip },
    { name: "brotli", ...brotli },
  ].map(({ name, baseSize, headSize }) => {
    return `
        <td nowrap>${name}</td>
        <td nowrap>${formatSize(headSize - baseSize, { diff: true })}</td>
        <td nowrap>${formatSize(baseSize)}</td>
        <td nowrap>${formatSize(headSize)}</td>`
  })

  return `<tr>${lines.join(`
      </tr>
      <tr>`)}
      </tr>`
}
