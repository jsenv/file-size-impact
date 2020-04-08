import { isNew, isDeleted, isChanged } from "./helper.js"

export const renderFileByFileImpact = (
  groupComparison,
  { groupName, pullRequestBase, pullRequestHead, formatSize },
) => {
  const filesImpact = groupComparisonToFilesImpact(groupComparison)
  const noImpact = Object.keys(filesImpact).length === 0
  return `
  <h3>File by file impact</h3>
  ${
    noImpact
      ? `<p>Pull request changes have no impact on <code>${groupName}</code> files.</p>`
      : renderFileByFileTable(filesImpact, { pullRequestBase, pullRequestHead, formatSize })
  }`
}

const groupComparisonToFilesImpact = (groupComparison) => {
  const filesImpact = {}
  Object.keys(groupComparison).forEach((fileRelativeUrl) => {
    const { base, head } = groupComparison[fileRelativeUrl]

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

const renderFileByFileTable = (filesImpact, { pullRequestBase, pullRequestHead, formatSize }) => {
  const noneOnly = analyseNoneOnly(filesImpact)

  const headerCells = [
    `<th nowrap>File</th>`,
    ...(noneOnly ? [] : ["<th nowrap>Transform</th>"]),
    `<th nowrap>Diff</th>`,
    `<th nowrap><code>${pullRequestBase}</code></th>`,
    `<th nowrap><code>${pullRequestHead}</code></th>`,
    `<th nowrap>Event</th>`,
  ]

  return `<table>
    <thead>
      <tr>
        ${headerCells.join(`
        `)}
      </tr>
    </thead>
    <tbody>
      ${renderFilesTableBody(filesImpact, { noneOnly, formatSize })}
    </tbody>
  </table>`
}

const analyseNoneOnly = (filesImpact) => {
  const files = Object.keys(filesImpact)
  const firstFileWithHead = files.find((file) => {
    return Boolean(filesImpact[file].head)
  })
  if (firstFileWithHead) {
    const sizeMap = filesImpact[firstFileWithHead].head.sizeMap
    return "none" in sizeMap && Object.keys(sizeMap).length === 1
  }

  // we are guaranteed to have at least one base file otherwise the message saying
  // pull request have no impact would be displayed instead of the table.
  // There is one case where a transform would be ignored though:
  // A PR add a new transform and there 1+ deleted files, and zero created/changed files.
  // But that's kinda ok because we would only display that transform with --- everywhere
  // because base did'nt have this and file was deleted so head neither
  const firstFileWithBase = files.find((file) => {
    return Boolean(filesImpact[file].base)
  })
  const sizeMap = filesImpact[firstFileWithBase].base.sizeMap
  return "none" in sizeMap && Object.keys(sizeMap).length === 1
}

const renderFilesTableBody = (filesImpact, { noneOnly, formatSize }) => {
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
        ...(noneOnly ? [] : [`<td nowrap>${sizeName}</td>`]),
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
