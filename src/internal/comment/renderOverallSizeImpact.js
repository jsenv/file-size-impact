import { sumSize } from "./helper.js"

export const renderOverallSizeImpact = (
  fileByFileImpact,
  { groupName, pullRequestBase, pullRequestHead, formatSize },
) => {
  return `
  <h6>Overall impact on <bold>${groupName}</bold> files size</h6>
  ${renderGroupBody(fileByFileImpact, { pullRequestBase, pullRequestHead, formatSize })}`
}

const renderGroupBody = (fileByFileImpact, { pullRequestBase, pullRequestHead, formatSize }) => {
  const overallImpact = fileByFileImpactToOverallImpact(fileByFileImpact)
  return renderGroupImpactBody(overallImpact, {
    pullRequestBase,
    pullRequestHead,
    formatSize,
  })
}

const fileByFileImpactToOverallImpact = (fileByFileImpact) => {
  const groupBaseSizeMap = {}
  const groupAfterMergeSizeMap = {}
  Object.keys(fileByFileImpact).forEach((fileRelativeUrl) => {
    const { base, afterMerge } = fileByFileImpact[fileRelativeUrl]
    if (base) {
      const baseSizeMap = base.sizeMap
      Object.keys(baseSizeMap).forEach((key) => {
        groupBaseSizeMap[key] = sumSize(baseSizeMap, groupBaseSizeMap, key)
      })
    }
    if (afterMerge) {
      const afterMergeSizeMap = afterMerge.sizeMap
      Object.keys(afterMergeSizeMap).forEach((key) => {
        groupAfterMergeSizeMap[key] = sumSize(afterMergeSizeMap, groupAfterMergeSizeMap, key)
      })
    }
  })
  return {
    groupBaseSizeMap,
    groupAfterMergeSizeMap,
  }
}

const renderGroupImpactBody = (groupImpact, { pullRequestBase, formatSize }) => {
  const noneOnly = analyseNoneOnly(groupImpact)

  const headerCells = [
    ...(noneOnly ? [] : ["<th nowrap>Transform</th>"]),
    `<th nowrap>Diff</th>`,
    `<th nowrap>${pullRequestBase}</th>`,
    `<th nowrap>after merge</th>`,
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
  const { groupAfterMergeSizeMap } = directoryImpact
  return `none` in groupAfterMergeSizeMap && Object.keys(groupAfterMergeSizeMap).length === 1
}

const renderGroupImpactTableBody = (groupImpact, { noneOnly, formatSize }) => {
  const { groupBaseSizeMap, groupAfterMergeSizeMap } = groupImpact

  const lines = Object.keys(groupAfterMergeSizeMap).map((sizeName) => {
    const cells = [
      ...(noneOnly ? [] : [`<td nowrap>${sizeName}</td>`]),
      renderGroupDiffCell({
        groupBaseSizeMap,
        groupAfterMergeSizeMap,
        sizeName,
        formatSize,
      }),
      renderGroupBaseCell({
        groupBaseSizeMap,
        sizeName,
        formatSize,
      }),
      renderGroupHeadCell({
        groupAfterMergeSizeMap,
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

const renderGroupDiffCell = ({
  groupBaseSizeMap,
  groupAfterMergeSizeMap,
  sizeName,
  formatSize,
}) => {
  if (sizeName in groupBaseSizeMap && sizeName in groupAfterMergeSizeMap) {
    return `<td nowrap>${formatSize(groupAfterMergeSizeMap[sizeName] - groupBaseSizeMap[sizeName], {
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

const renderGroupHeadCell = ({ groupAfterMergeSizeMap, sizeName, formatSize }) => {
  if (sizeName in groupAfterMergeSizeMap) {
    return `<td nowrap>${formatSize(groupAfterMergeSizeMap[sizeName])}</td>`
  }
  return `<td nowrap>---</td>`
}
