export const renderDetailedSizeImpact = (
  fileByFileImpact,
  { groupName, pullRequestBase, formatSize },
) => {
  return `
  <h6>Detailed impact on <bold>${groupName}</bold> files size</h6>
  ${renderFileByFileTable(fileByFileImpact, {
    pullRequestBase,
    formatSize,
  })}`
}

const renderFileByFileTable = (filesImpact, { pullRequestBase, formatSize }) => {
  const noneOnly = analyseNoneOnly(filesImpact)

  const headerCells = [
    `<th nowrap>File</th>`,
    ...(noneOnly ? [] : ["<th nowrap>Transform</th>"]),
    `<th nowrap>Diff</th>`,
    `<th nowrap>${pullRequestBase}</th>`,
    `<th nowrap>after merge</th>`,
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
  const firstFileWithAfterMerge = files.find((file) => {
    return Boolean(filesImpact[file].afterMerge)
  })
  if (firstFileWithAfterMerge) {
    const sizeMap = filesImpact[firstFileWithAfterMerge].afterMerge.sizeMap
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
    const { event, base, afterMerge } = fileImpact

    const keys = Object.keys((afterMerge || base).sizeMap)
    keys.forEach((sizeName, index) => {
      const rowSpan = index === 0 ? keys.length : 1
      const merged = index > 0
      const cells = [
        renderFileCell({ rowSpan, merged, fileRelativePath }),
        ...(noneOnly ? [] : [`<td nowrap>${sizeName}</td>`]),
        renderDiffCell({ event, sizeName, base, afterMerge, formatSize }),
        renderBaseCell({ rowSpan, merged, event, sizeName, base, formatSize }),
        renderAfterMergeCell({ rowSpan, merged, event, sizeName, afterMerge, formatSize }),
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

const renderDiffCell = ({ event, sizeName, base, afterMerge, formatSize }) => {
  if (event === "deleted") {
    const baseSizeMap = base.sizeMap
    if (sizeName in baseSizeMap) {
      return `<td nowrap>${formatSize(-baseSizeMap[sizeName], { diff: true })}</td>`
    }
    return `<td nowrap>---</td>`
  }

  if (event === "created") {
    const afterMergeSizeMap = afterMerge.sizeMap
    if (sizeName in afterMergeSizeMap) {
      return `<td nowrap>${formatSize(afterMergeSizeMap[sizeName], { diff: true })}</td>`
    }
    return `<td nowrap>---</td>`
  }

  const baseSizeMap = base.sizeMap
  const afterMergeSizeMap = afterMerge.sizeMap
  if (sizeName in baseSizeMap && sizeName in afterMergeSizeMap) {
    return `<td nowrap>${formatSize(afterMergeSizeMap[sizeName] - base.sizeMap[sizeName], {
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

const renderAfterMergeCell = ({ event, sizeName, afterMerge, formatSize }) => {
  if (event === "deleted") {
    return `<td nowrap>---</td>`
  }
  const afterMergeSizeMap = afterMerge.sizeMap
  if (sizeName in afterMergeSizeMap) {
    return `<td nowrap>${formatSize(afterMergeSizeMap[sizeName])}</td>`
  }
  return `<td nowrap>---</td>`
}

const renderEventCell = ({ event, rowSpan, merged }) => {
  return merged ? "" : `<td nowrap rowspan="${rowSpan}">${event}</td>`
}
