import { isNew, isDeleted, isChanged } from "./helper.js"

export const renderFilesImpact = (
  directoryComparison,
  { directoryRelativeUrl, pullRequestBase, pullRequestHead, formatSize },
) => {
  const filesImpact = directoryComparisonToFilesImpact(directoryComparison)
  const noImpact = Object.keys(filesImpact).length === 0
  return `<h3>File by file impact</h3>
${
  noImpact
    ? `Pull request changes have no impact on ${directoryRelativeUrl} files.`
    : renderFilesImpactTable(filesImpact, { pullRequestBase, pullRequestHead, formatSize })
}`
}

const renderFilesImpactTable = (filesImpact, { pullRequestBase, pullRequestHead, formatSize }) => {
  return `
  <table>
    <thead>
      <tr>
        <th nowrap>file</th>
        <th nowrap>diff</th>
        <th nowrap><code>${pullRequestBase}</code></th>
        <th nowrap><code>${pullRequestHead}</code></th>
        <th nowrap>event</th>
      </tr>
    </thead>
    <tbody>
      ${renderFilesTableBody(filesImpact, formatSize)}
    </tbody>
  </table>`
}

const renderFilesTableBody = (filesImpact, formatSize) => {
  const lines = Object.keys(filesImpact).map((fileRelativePath) => {
    const fileImpact = filesImpact[fileRelativePath]

    return `
        <td nowrap>${renderFile(fileRelativePath)}</td>
        <td nowrap>${renderFileDiff(fileImpact, formatSize)}</td>
        <td nowrap>${renderFileBaseSize(fileImpact, formatSize)}</td>
        <td nowrap>${renderFileHeadSize(fileImpact, formatSize)}</td>
        <td nowrap>${renderFileEvent(fileImpact)}</td>`
  })

  if (lines.length === 0) return ""

  return `<tr>${lines.join(`
      </tr>
      <tr>`)}
      </tr>`
}

const directoryComparisonToFilesImpact = (directoryComparison) => {
  const filesImpact = {}
  Object.keys(directoryComparison).forEach((fileRelativeUrl) => {
    const { base, head } = directoryComparison[fileRelativeUrl]

    if (isNew({ base, head })) {
      // if (head.size === 0) return
      filesImpact[fileRelativeUrl] = {
        base,
        head,
        event: "created",
      }
      return
    }

    if (isDeleted({ base, head })) {
      // if (base.size === 0) return
      filesImpact[fileRelativeUrl] = {
        base,
        head,
        event: "deleted",
      }
      return
    }

    if (isChanged({ base, head })) {
      filesImpact[fileRelativeUrl] = {
        base,
        head,
        event: "changed",
      }
    }
  })
  return filesImpact
}

const renderFile = (fileRelativePath) => {
  return `${fileRelativePath}
<br />gzip
<br />brotli`
}

const renderFileDiff = ({ event, base, head }, formatSize) => {
  let uncompressedDiff
  let gzipDiff
  let brotliDiff

  if (event === "deleted") {
    uncompressedDiff = -base.size
    gzipDiff = -base.gzipSize
    brotliDiff = -base.brotliSize
  } else if (event === "added") {
    uncompressedDiff = -head.size
    gzipDiff = -head.gzipSize
    brotliDiff = -head.brotliSize
  } else {
    uncompressedDiff = head.size - base.size
    gzipDiff = head.gzipSize - base.gzipSize
    brotliDiff = head.brotliSize - base.brotliSize
  }

  return `${formatSize(uncompressedDiff, { diff: true })}
<br />${formatSize(gzipDiff, { diff: true })}
<br />${formatSize(brotliDiff, { diff: true })}`
}

const renderFileBaseSize = ({ event, base }, formatSize) => {
  if (event === "added") {
    return "---"
  }
  return `${formatSize(base.size)}
<br />${formatSize(base.gzipSize)}
<br />${formatSize(base.brotliSize)}`
}

const renderFileHeadSize = ({ event, head }, formatSize) => {
  if (event === "deleted") {
    return "---"
  }
  return `${formatSize(head.size)}
<br />${formatSize(head.gzipSize)}
<br />${formatSize(head.brotliSize)}`
}

const renderFileEvent = ({ event }) => event
