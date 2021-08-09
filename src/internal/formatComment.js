import { compareTwoFileSizeReports } from "./compareTwoFileSizeReports.js"
import { getSizeMaps } from "./getSizeMaps.js"
import { isAdded, isModified, isDeleted } from "./helper.js"
import { renderImpactTable } from "./renderImpactTable.js"
import { orderBySizeImpact } from "./orderBySizeImpact.js"

export const formatComment = ({
  pullRequestBase,
  pullRequestHead,
  beforeMergeFileSizeReport,
  afterMergeFileSizeReport,

  filesOrdering,
  maxRowsPerTable,
  fileRelativeUrlMaxLength,
  formatGroupSummary,
  formatHiddenImpactSummary,
  formatFileRelativeUrl,
  formatFileCell,
  formatFileSizeImpactCell,
  formatGroupSizeImpactCell,
  shouldOpenGroupByDefault,
}) => {
  const warnings = []
  const reportComparison = compareTwoFileSizeReports({
    afterMergeFileSizeReport,
    beforeMergeFileSizeReport,
  })
  const groupCount = Object.keys(reportComparison.groups).length

  if (groupCount === 0) {
    warnings.push(
      `**Warning:** Nothing is tracked. It happens when tracking config is an empty object.`,
    )
  }

  let body = renderCommentBody({
    pullRequestBase,
    pullRequestHead,
    reportComparison,

    filesOrdering,
    maxRowsPerTable,
    fileRelativeUrlMaxLength,
    formatGroupSummary,
    formatHiddenImpactSummary,
    formatFileRelativeUrl,
    formatFileCell,
    formatFileSizeImpactCell,
    formatGroupSizeImpactCell,
    shouldOpenGroupByDefault,
  })

  body = `<h4 id="file-size-impact">File size impact</h4>

${body}`

  return { warnings, body }
}

const renderCommentBody = ({
  pullRequestBase,
  pullRequestHead,
  reportComparison,

  filesOrdering,
  fileRelativeUrlMaxLength,
  maxRowsPerTable,
  formatGroupSummary,
  formatHiddenImpactSummary,
  formatFileRelativeUrl,
  formatFileCell,
  formatFileSizeImpactCell,
  formatGroupSizeImpactCell,
  shouldOpenGroupByDefault,
}) => {
  const overallImpactInfo = {}

  const renderGroup = (
    groupMessage,
    {
      groupName,
      groupComparison,
      groupFileCount,
      groupImpactCount,
      fileByFileImpact,
      groupHiddenImpactCount,
      fileByFileImpactHidden,
    },
  ) => {
    const groupSummary = formatGroupSummary({
      groupName,
      groupImpactCount,
      groupFileCount,
    })
    const groupShouldBeOpenByDefault = shouldOpenGroupByDefault({
      groupName,
      groupComparison,
      groupFileCount,
      groupImpactCount,
      fileByFileImpact,
      groupHiddenImpactCount,
      fileByFileImpactHidden,
    })

    return renderDetails({
      open: groupShouldBeOpenByDefault,
      summary: groupSummary,
      content: groupMessage,
    })
  }

  const { transformationKeys } = reportComparison
  const groupMessages = Object.keys(reportComparison.groups).map((groupName) => {
    const groupComparison = reportComparison.groups[groupName]
    const groupFileImpactMap = groupComparison.fileImpactMap
    const groupFileCount = Object.keys(groupFileImpactMap).length
    let fileByFileImpact = {}
    let fileByFileImpactHidden = {}
    if (groupFileCount === 0) {
      return renderGroup(
        formulateEmptyGroupContent({
          groupName,
          groupConfig: groupComparison.tracking,
        }),
        {
          groupName,
          groupComparison,
          groupFileCount,
          groupImpactCount: 0,
          fileByFileImpact,
          groupHiddenImpactCount: 0,
          fileByFileImpactHidden,
        },
      )
    }

    const addImpact = (fileRelativeUrl, { event, beforeMerge, afterMerge }) => {
      const meta = event === "deleted" ? beforeMerge.meta : afterMerge.meta
      const impact = {
        event,
        beforeMerge,
        afterMerge,
      }

      const data = metaToData(meta, { fileRelativeUrl, event, beforeMerge, afterMerge })
      if (data.showSizeImpact) {
        if (!overallImpactInfo.hasOwnProperty(fileRelativeUrl)) {
          overallImpactInfo[fileRelativeUrl] = groupName
        }

        fileByFileImpact[fileRelativeUrl] = { ...impact, ...data }
      } else {
        fileByFileImpactHidden[fileRelativeUrl] = { ...impact, ...data }
      }
    }

    Object.keys(groupFileImpactMap).forEach((fileRelativeUrl) => {
      const { beforeMerge, afterMerge } = groupFileImpactMap[fileRelativeUrl]

      if (isAdded({ beforeMerge, afterMerge })) {
        addImpact(fileRelativeUrl, {
          event: "added",
          beforeMerge,
          afterMerge,
        })
        return
      }

      if (isDeleted({ beforeMerge, afterMerge })) {
        addImpact(fileRelativeUrl, {
          event: "deleted",
          beforeMerge,
          afterMerge,
        })
        return
      }

      if (isModified({ beforeMerge, afterMerge })) {
        addImpact(fileRelativeUrl, {
          event: "modified",
          beforeMerge,
          afterMerge,
        })
      }
    })

    if (filesOrdering === "size_impact") {
      fileByFileImpact = orderBySizeImpact(fileByFileImpact, reportComparison.transformationKeys)
      fileByFileImpactHidden = orderBySizeImpact(
        fileByFileImpactHidden,
        reportComparison.transformationKeys,
      )
    }

    const groupImpactCount = Object.keys(fileByFileImpact).length
    const groupHiddenImpactCount = Object.keys(fileByFileImpactHidden).length
    if (groupImpactCount === 0 && groupHiddenImpactCount === 0) {
      return renderGroup(`<p>No impact on files in ${groupName} group.</p>`, {
        groupName,
        groupComparison,
        groupFileCount,
        groupImpactCount,
        fileByFileImpact,
        groupHiddenImpactCount,
        fileByFileImpactHidden,
      })
    }

    const elements = [
      ...(groupImpactCount > 0
        ? [
            renderImpactTable(fileByFileImpact, {
              groupFileImpactMap,
              transformationKeys,
              fileRelativeUrlMaxLength,
              maxRowsPerTable,
              formatFileRelativeUrl,
              formatFileCell,
              formatFileSizeImpactCell,
              formatGroupSizeImpactCell,
            }),
          ]
        : []),
      ...(groupHiddenImpactCount > 0
        ? [
            renderDetails({
              summary: formatHiddenImpactSummary({ groupName, groupHiddenImpactCount }),
              content: renderImpactTable(fileByFileImpactHidden, {
                groupFileImpactMap,
                transformationKeys,
                fileRelativeUrlMaxLength,
                maxRowsPerTable,
                formatFileRelativeUrl,
                formatFileCell,
                formatFileSizeImpactCell,
                formatGroupSizeImpactCell,
              }),
            }),
          ]
        : []),
    ]

    return renderGroup(
      elements.join(`
`),
      {
        groupName,
        groupComparison,
        groupFileCount,
        groupImpactCount,
        fileByFileImpact,
        groupHiddenImpactCount,
        fileByFileImpactHidden,
      },
    )
  })

  const mergeImpact = formulateMergeImpact({ pullRequestHead, pullRequestBase, overallImpactInfo })
  if (groupMessages.length === 0) {
    return mergeImpact
  }

  return `${mergeImpact}
${groupMessages.join(`

`)}`
}

const formulateMergeImpact = ({ pullRequestBase, pullRequestHead, overallImpactInfo }) => {
  const overallImpact = formulateOverallImpact(overallImpactInfo)
  return `<p>Merging <em>${pullRequestHead}</em> into <em>${pullRequestBase}</em> will ${overallImpact}.</p>`
}

const formulateOverallImpact = (overallImpactInfo) => {
  let impactedFileCount = 0
  let impactedGroupCount = 0
  const impactedGroups = []
  Object.keys(overallImpactInfo).forEach((relativeUrl) => {
    const groupName = overallImpactInfo[relativeUrl]
    if (groupName) {
      impactedFileCount++
      if (!impactedGroups.includes(groupName)) {
        impactedGroups.push(groupName)
        impactedGroupCount++
      }
    }
  })

  if (impactedFileCount === 0) {
    return `not impact files in any group`
  }
  return `impact ${formulateFileQuantity(impactedFileCount)} in ${formulateGroupQuantity(
    impactedGroupCount,
  )}`
}

const formulateFileQuantity = (count) => {
  return count === 1 ? `1 file` : `${count} files`
}

const formulateGroupQuantity = (count) => {
  return count === 1 ? `1 group` : `${count} groups`
}

const metaToData = (meta, { fileRelativeUrl, event, beforeMerge, afterMerge }) => {
  if (typeof meta === "boolean") {
    return {
      showSizeImpact: true,
    }
  }

  if (typeof meta === "object") {
    const showSizeImpact = showSizeImpactGetter(meta, {
      fileRelativeUrl,
      event,
      beforeMerge,
      afterMerge,
    })
    const { formatFileRelativeUrl } = meta
    return {
      showSizeImpact,
      formatFileRelativeUrl,
    }
  }

  console.warn(`meta must be a boolean or an object, received ${meta} for ${fileRelativeUrl}`)
  return {
    showSizeImpact: Boolean(meta),
  }
}

const showSizeImpactGetter = (meta, { fileRelativeUrl, event, beforeMerge, afterMerge }) => {
  const { showSizeImpact } = meta

  if (typeof showSizeImpact === "undefined") {
    return true
  }

  if (typeof showSizeImpact === "boolean") {
    return showSizeImpact
  }

  if (typeof showSizeImpact === "function") {
    return showSizeImpact({
      fileRelativeUrl,
      event,
      ...getSizeMaps({ beforeMerge, afterMerge }),
    })
  }

  console.warn(
    `showSizeImpact must be a boolean or a function, received ${showSizeImpact} for ${fileRelativeUrl}`,
  )
  return true
}

const formulateEmptyGroupContent = ({ groupName, groupConfig }) => {
  return `<p>No file in ${groupName} group (see config below).</p>

\`\`\`json
${JSON.stringify(groupConfig, null, "  ")}
\`\`\`
`
}

const renderDetails = ({ summary, content, open = false, indent = 0 }) => {
  return `${" ".repeat(indent)}<details${open ? " open" : ""}>
${" ".repeat(indent + 2)}<summary>${summary}</summary>
${" ".repeat(indent + 2)}${content}
${" ".repeat(indent)}</details>`
}
