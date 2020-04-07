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
    ? `Pull request changes have no impact on ${directoryRelativeUrl} files.`
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
  let diff
  if (event === "deleted") {
    diff = -base.sizeMap[sizeName]
  } else if (event === "created") {
    diff = head.sizeMap[sizeName]
  } else {
    diff = head.sizeMap[sizeName] - base.sizeMap[sizeName]
  }

  return `<td nowrap>${formatSize(diff, { diff: true })}</td>`
}

const renderBaseCell = ({ event, sizeName, base, formatSize }) => {
  if (event === "created") {
    return `<td nowrap>---</td>`
  }
  return `<td nowrap>${formatSize(base.sizeMap[sizeName])}</td>`
}

const renderHeadCell = ({ event, sizeName, head, formatSize }) => {
  if (event === "deleted") {
    return `<td nowrap>---</td>`
  }
  return `<td nowrap>${formatSize(head.sizeMap[sizeName])}</td>`
}

const renderEventCell = ({ event, rowSpan, merged }) => {
  return merged ? "" : `<td nowrap rowspan="${rowSpan}">${event}</td>`
}
