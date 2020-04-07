import { sumSize } from "./helper.js"

export const renderDirectoryImpact = (
  directoryComparison,
  { directoryRelativeUrl, pullRequestBase, pullRequestHead, formatSize },
) => {
  const directoryImpact = directoryComparisonToDirectoryImpact(directoryComparison)
  const noChanges = Object.keys(directoryImpact.directoryHeadSizeMap).length === 0

  return `
  <h3>Directory impact</h3>
  ${
    noChanges
      ? `<p>Pull request changes have no impact on <code>${directoryRelativeUrl}</code>.</p>`
      : `<p>Impact of changes on <code>${directoryRelativeUrl}</code> size in bytes.</p>
  ${renderDirectoryImpactTable(directoryImpact, {
    pullRequestBase,
    pullRequestHead,
    formatSize,
  })}`
  }`
}

const directoryComparisonToDirectoryImpact = (directoryComparison) => {
  const directoryBaseSizeMap = {}
  const directoryHeadSizeMap = {}
  Object.keys(directoryComparison).forEach((fileRelativeUrl) => {
    const { base, head } = directoryComparison[fileRelativeUrl]
    if (base) {
      const baseSizeMap = base.sizeMap
      Object.keys(baseSizeMap).forEach((key) => {
        directoryBaseSizeMap[key] = sumSize(baseSizeMap, directoryBaseSizeMap, key)
      })
    }
    if (head) {
      const headSizeMap = head.sizeMap
      Object.keys(headSizeMap).forEach((key) => {
        directoryHeadSizeMap[key] = sumSize(headSizeMap, directoryHeadSizeMap, key)
      })
    }
  })
  return {
    directoryBaseSizeMap,
    directoryHeadSizeMap,
  }
}

const renderDirectoryImpactTable = (
  directoryImpact,
  { pullRequestBase, pullRequestHead, formatSize },
) => {
  const noneOnly = analyseNoneOnly(directoryImpact)

  const headerCells = [
    ...(noneOnly ? [] : ["<th nowrap>Transform</th>"]),
    `<th nowrap>Diff</th>`,
    `<th nowrap><code>${pullRequestBase}</code></th>`,
    `<th nowrap><code>${pullRequestHead}</code></th>`,
  ]

  return `<table>
    <thead>
      <tr>
        ${headerCells.join(`
        `)}
      </tr>
    </thead>
    <tbody>
      ${renderDirectoryImpactTableBody(directoryImpact, { noneOnly, formatSize })}
    </tbody>
  </table>`
}

const analyseNoneOnly = (directoryImpact) => {
  const { directoryHeadSizeMap } = directoryImpact
  return `none` in directoryHeadSizeMap && Object.keys(directoryHeadSizeMap).length === 1
}

const renderDirectoryImpactTableBody = (directoryImpact, { noneOnly, formatSize }) => {
  const { directoryBaseSizeMap, directoryHeadSizeMap } = directoryImpact

  const lines = Object.keys(directoryHeadSizeMap).map((sizeName) => {
    const cells = [
      ...(noneOnly ? [] : [`<td nowrap>${sizeName}</td>`]),
      renderDirectoryDiffCell({
        directoryBaseSizeMap,
        directoryHeadSizeMap,
        sizeName,
        formatSize,
      }),
      renderDirectoryBaseCell({
        directoryBaseSizeMap,
        sizeName,
        formatSize,
      }),
      renderDirectoryHeadCell({
        directoryHeadSizeMap,
        sizeName,
        formatSize,
      }),
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

const renderDirectoryDiffCell = ({
  directoryBaseSizeMap,
  directoryHeadSizeMap,
  sizeName,
  formatSize,
}) => {
  if (sizeName in directoryBaseSizeMap && sizeName in directoryHeadSizeMap) {
    return `<td nowrap>${formatSize(
      directoryHeadSizeMap[sizeName] - directoryBaseSizeMap[sizeName],
      {
        diff: true,
      },
    )}</td>`
  }
  return `<td nowrap>---</td>`
}

const renderDirectoryBaseCell = ({ directoryBaseSizeMap, sizeName, formatSize }) => {
  if (sizeName in directoryBaseSizeMap) {
    return `<td nowrap>${formatSize(directoryBaseSizeMap[sizeName])}</td>`
  }
  return `<td nowrap>---</td>`
}

const renderDirectoryHeadCell = ({ directoryHeadSizeMap, sizeName, formatSize }) => {
  if (sizeName in directoryHeadSizeMap) {
    return `<td nowrap>${formatSize(directoryHeadSizeMap[sizeName])}</td>`
  }
  return `<td nowrap>---</td>`
}
