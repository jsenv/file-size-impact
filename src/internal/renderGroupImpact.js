import { sumSize } from "./helper.js"

export const renderGroupImpact = (
  groupComparison,
  { groupName, pullRequestBase, pullRequestHead, formatSize },
) => {
  const groupImpact = groupComparisonToGroupImpact(groupComparison)
  const noChanges = Object.keys(groupImpact.groupHeadSizeMap).length === 0

  return `
  <h3>Group impact</h3>
  ${
    noChanges
      ? `<p>Pull request changes have no impact on <code>${groupName}</code>.</p>`
      : `<p>Impact of changes on <code>${groupName}</code> size in bytes.</p>
  ${renderGroupImpactBody(groupImpact, {
    pullRequestBase,
    pullRequestHead,
    formatSize,
  })}`
  }`
}

const groupComparisonToGroupImpact = (groupComparison) => {
  const groupBaseSizeMap = {}
  const groupHeadSizeMap = {}
  Object.keys(groupComparison).forEach((fileRelativeUrl) => {
    const { base, head } = groupComparison[fileRelativeUrl]
    if (base) {
      const baseSizeMap = base.sizeMap
      Object.keys(baseSizeMap).forEach((key) => {
        groupBaseSizeMap[key] = sumSize(baseSizeMap, groupBaseSizeMap, key)
      })
    }
    if (head) {
      const headSizeMap = head.sizeMap
      Object.keys(headSizeMap).forEach((key) => {
        groupHeadSizeMap[key] = sumSize(headSizeMap, groupHeadSizeMap, key)
      })
    }
  })
  return {
    groupBaseSizeMap,
    groupHeadSizeMap,
  }
}

const renderGroupImpactBody = (groupImpact, { pullRequestBase, pullRequestHead, formatSize }) => {
  const noneOnly = analyseNoneOnly(groupImpact)

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
      ${renderGroupImpactTableBody(groupImpact, { noneOnly, formatSize })}
    </tbody>
  </table>`
}

const analyseNoneOnly = (directoryImpact) => {
  const { groupHeadSizeMap } = directoryImpact
  return `none` in groupHeadSizeMap && Object.keys(groupHeadSizeMap).length === 1
}

const renderGroupImpactTableBody = (groupImpact, { noneOnly, formatSize }) => {
  const { groupBaseSizeMap, groupHeadSizeMap } = groupImpact

  const lines = Object.keys(groupHeadSizeMap).map((sizeName) => {
    const cells = [
      ...(noneOnly ? [] : [`<td nowrap>${sizeName}</td>`]),
      renderGroupDiffCell({
        groupBaseSizeMap,
        groupHeadSizeMap,
        sizeName,
        formatSize,
      }),
      renderGroupBaseCell({
        groupBaseSizeMap,
        sizeName,
        formatSize,
      }),
      renderGroupHeadCell({
        groupHeadSizeMap,
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

const renderGroupDiffCell = ({ groupBaseSizeMap, groupHeadSizeMap, sizeName, formatSize }) => {
  if (sizeName in groupBaseSizeMap && sizeName in groupHeadSizeMap) {
    return `<td nowrap>${formatSize(groupHeadSizeMap[sizeName] - groupBaseSizeMap[sizeName], {
      diff: true,
    })}</td>`
  }
  return `<td nowrap>---</td>`
}

const renderGroupBaseCell = ({ groupBaseSizeMap, sizeName, formatSize }) => {
  if (sizeName in groupBaseSizeMap) {
    return `<td nowrap>${formatSize(groupBaseSizeMap[sizeName])}</td>`
  }
  return `<td nowrap>---</td>`
}

const renderGroupHeadCell = ({ groupHeadSizeMap, sizeName, formatSize }) => {
  if (sizeName in groupHeadSizeMap) {
    return `<td nowrap>${formatSize(groupHeadSizeMap[sizeName])}</td>`
  }
  return `<td nowrap>---</td>`
}
