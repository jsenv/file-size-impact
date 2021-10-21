import { formatSize } from "./formatSize.js"

export const formatFileSizeReportForLog = (fileSizeReport) => {
  const { groups } = fileSizeReport

  const groupMessages = Object.keys(groups).map((groupName) => {
    const { fileMap } = groups[groupName]

    const fileMessages = Object.keys(fileMap).map((fileRelativeUrl) => {
      const file = fileMap[fileRelativeUrl]
      const { sizeMap } = file
      const sizeNames = Object.keys(sizeMap)
      if (sizeNames.length === 1) {
        return `${fileRelativeUrl}: ${formatSize(sizeMap[sizeNames[0]])}`
      }

      const sizesFormatted = sizeNames.map((sizeName) => {
        return `${sizeName}: ${formatSize(sizeMap[sizeName])}`
      })
      return `${fileRelativeUrl}: { ${sizesFormatted.join(`, `)} }`
    })

    return `${groupName}
---------------------
${fileMessages.join(`
`)}`
  })

  const message = `
${groupMessages.join(`

`)}
`

  return message
}
