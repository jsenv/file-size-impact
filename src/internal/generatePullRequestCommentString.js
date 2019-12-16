const enDecimalFormatter = new Intl.NumberFormat("en", { style: "decimal" })

const formatSizeFallback = (size) => `${enDecimalFormatter.format(size)} bytes`

export const generatePullRequestCommentString = ({
  pullRequestBase,
  pullRequestHead,
  snapshotComparison,
  formatSize = formatSizeFallback,
  // this is to inform someone wondering where this message comes from
  // do not confuse this with advertising
  // if you don't like it, you can pass this option to false
  generatedByLink = true,
}) => {
  const directoryMessages = Object.keys(snapshotComparison).map((directoryRelativeUrl) => {
    const directoryComparison = snapshotComparison[directoryRelativeUrl]
    const sizeImpactMap = {}
    let sizeImpact = 0
    let hasSizeImpact = false
    Object.keys(directoryComparison).forEach((relativeUrl) => {
      const { base, head } = directoryComparison[relativeUrl]

      // added
      if (!base && head.type === "file") {
        const baseSize = 0
        const headSize = head.size
        const diffSize = headSize - baseSize
        if (diffSize) {
          sizeImpactMap[relativeUrl] = {
            why: "removed",
            baseSize,
            headSize,
            diffSize,
          }
          hasSizeImpact = true
          sizeImpact += diffSize
        }
      }
      // removed
      else if (base && base.type === "file" && !head) {
        const baseSize = base.size
        const headSize = 0
        const diffSize = headSize - baseSize
        if (diffSize) {
          sizeImpactMap[relativeUrl] = {
            why: "removed",
            baseSize,
            headSize,
            diffSize,
          }
          hasSizeImpact = true
          sizeImpact += diffSize
        }
      }
      // changed
      else if (base && base.type === "file" && head && head.type === "file") {
        const baseSize = base.size
        const headSize = head.size
        const diffSize = headSize - baseSize
        if (diffSize) {
          sizeImpactMap[relativeUrl] = {
            why: "changed",
            baseSize,
            headSize,
            diffSize,
          }
          hasSizeImpact = true
          sizeImpact += diffSize
        }
      }
    })

    const sizeImpactText = generateSizeImpactText({
      directoryRelativeUrl,
      formatSize,
      sizeImpact,
    })

    return `<details>
  <summary>Merging <code>${pullRequestHead}</code> into <code>${pullRequestBase}</code> would ${sizeImpactText}</summary>
${generateSizeImpactDetails({
  pullRequestBase,
  pullRequestHead,
  formatSize,
  sizeImpactMap,
  hasSizeImpact,
})}
</details>`
  })

  if (directoryMessages.length === 0) return null

  return `
${directoryMessages.join(`

`)}${
    generatedByLink
      ? `

<sub>Generated by [github pull request filesize impact](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact)</sub>`
      : ""
  }`
}

const generateSizeImpactDetails = ({
  pullRequestBase,
  pullRequestHead,
  formatSize,
  sizeImpactMap,
  hasSizeImpact,
}) => {
  if (hasSizeImpact) {
    return generateSizeImpactTable({ pullRequestBase, pullRequestHead, formatSize, sizeImpactMap })
  }
  return `
changes are not affecting file sizes.`
}

const generateSizeImpactTable = ({
  pullRequestBase,
  pullRequestHead,
  formatSize,
  sizeImpactMap,
}) => `
file | size on \`${pullRequestBase}\` | size on \`${pullRequestHead}\`| effect
---- | ----------- | --------------------- | ----------
${Object.keys(sizeImpactMap).map((relativePath) => {
  const sizeImpact = sizeImpactMap[relativePath]

  return [
    relativePath,
    generateBaseCellText({ formatSize, sizeImpact }),
    generateHeadCellText({ formatSize, sizeImpact }),
    generateImpactCellText({ formatSize, sizeImpact }),
  ].join("|")
}).join(`
`)}`

const generateBaseCellText = ({ formatSize, sizeImpact: { baseSize } }) => {
  return formatSize(baseSize)
}

const generateHeadCellText = ({ formatSize, sizeImpact: { headSize, why } }) => {
  if (why === "added") {
    return `${formatSize(headSize)} (added)`
  }
  if (why === "removed") {
    return `${formatSize(headSize)} (removed)`
  }
  return formatSize(headSize)
}

const generateImpactCellText = ({ formatSize, sizeImpact: { diffSize } }) => {
  if (diffSize > 0) return `+${formatSize(diffSize)}`
  if (diffSize < 0) return `-${formatSize(Math.abs(diffSize))}`
  return "same"
}

const generateSizeImpactText = ({ directoryRelativeUrl, formatSize, sizeImpact }) => {
  if (sizeImpact === 0) {
    return `<b>not impact</b> <code>${directoryRelativeUrl}</code> size.`
  }
  if (sizeImpact < 0) {
    return `<b>decrease</b> <code>${directoryRelativeUrl}</code> size by ${formatSize(
      Math.abs(sizeImpact),
    )}.`
  }
  return `<b>increase</b> <code>${directoryRelativeUrl}</code> size by ${formatSize(sizeImpact)}.`
}