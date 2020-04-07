import { isNew, isDeleted, isChanged } from "./helper.js"

export const renderFilesImpact = (
  directoryComparison,
  { directoryRelativeUrl, pullRequestBase, pullRequestHead, formatSize },
) => {
  const filesImpact = directoryComparisonToFilesImpact(directoryComparison)
  const noImpact = Object.keys(filesImpact).length === 0
  return `
  <h3>File by file impact</h3>
${
  noImpact
    ? `Pull request changes have no impact on <code>${directoryRelativeUrl}</code> files.`
    : renderFilesImpactTable(filesImpact, { pullRequestBase, pullRequestHead, formatSize })
}`
}

const renderFilesImpactTable = (filesImpact, { pullRequestBase, pullRequestHead, formatSize }) => {
  return `  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>Transform</th>
        <th nowrap>Diff</th>
        <th nowrap><code>${pullRequestBase}</code></th>
        <th nowrap><code>${pullRequestHead}</code></th>
        <th nowrap>Event</th>
      </tr>
    </thead>
    <tbody>
      ${renderFilesTableBody(filesImpact, formatSize)}
    </tbody>
  </table>`
}

const renderFilesTableBody = (filesImpact, formatSize) => {
  const lines = []

  Object.keys(filesImpact).forEach((fileRelativePath) => {
    const fileImpact = filesImpact[fileRelativePath]
    const { event, base, head } = fileImpact

    const keys = Object.keys((head || base).sizeMap)
    keys.forEach((sizeName, index) => {
      const rowSpan = index === 0 ? keys.length : 1
      const merged = index > 0
      const cells = [
        renderFileCell({ rowSpan, merged, fileRelativePath }),
        `<td nowrap>${sizeName}</td>`,
        renderDiffCell({ event, sizeName, base, head, formatSize }),
        renderBaseCell({ rowSpan, merged, event, sizeName, base, formatSize }),
        renderHeadCell({ rowSpan, merged, event, sizeName, head, formatSize }),
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

const directoryComparisonToFilesImpact = (directoryComparison) => {
  const filesImpact = {}
  Object.keys(directoryComparison).forEach((fileRelativeUrl) => {
    const { base, head } = directoryComparison[fileRelativeUrl]

    if (isNew({ base, head })) {
      filesImpact[fileRelativeUrl] = {
        base,
        head,
        event: "created",
      }
      return
    }

    if (isDeleted({ base, head })) {
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

const renderFileCell = ({ rowSpan, merged, fileRelativePath }) => {
  return merged ? "" : `<td nowrap rowspan="${rowSpan}">${fileRelativePath}</td>`
}

const renderDiffCell = ({ event, sizeName, base, head, formatSize }) => {
  if (event === "deleted") {
    const baseSizeMap = base.sizeMap
    if (sizeName in baseSizeMap) {
      return `<td nowrap>${formatSize(-baseSizeMap[sizeName], { diff: true })}</td>`
    }
    return `<td nowrap>---</td>`
  }

  if (event === "created") {
    const headSizeMap = head.sizeMap
    if (sizeName in headSizeMap) {
      return `<td nowrap>${formatSize(headSizeMap[sizeName], { diff: true })}</td>`
    }
    return `<td nowrap>---</td>`
  }

  const baseSizeMap = base.sizeMap
  const headSizeMap = head.sizeMap
  if (sizeName in baseSizeMap && sizeName in headSizeMap) {
    return `<td nowrap>${formatSize(headSizeMap[sizeName] - base.sizeMap[sizeName], {
      diff: true,
    })}</td>`
  }
  return `<td nowrap>---</td>`
}

const renderBaseCell = ({ event, sizeName, base, formatSize }) => {
  if (event === "created") {
    return `<td nowrap>---</td>`
  }
  const baseSizeMap = base.sizeMap
  if (sizeName in baseSizeMap) {
    return `<td nowrap>${formatSize(baseSizeMap[sizeName])}</td>`
  }
  return `<td nowrap>---</td>`
}

const renderHeadCell = ({ event, sizeName, head, formatSize }) => {
  if (event === "deleted") {
    return `<td nowrap>---</td>`
  }
  const headSizeMap = head.sizeMap
  if (sizeName in headSizeMap) {
    return `<td nowrap>${formatSize(headSizeMap[sizeName])}</td>`
  }
  return `<td nowrap>---</td>`
}

const renderEventCell = ({ event, rowSpan, merged }) => {
  return merged ? "" : `<td nowrap rowspan="${rowSpan}">${event}</td>`
}
