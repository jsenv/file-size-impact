import { formatSize } from "./internal/formatSize.js"

export const logFileSizeReport = (fileSizeReport) => {
  const { groups } = fileSizeReport

  const groupMessages = Object.keys(groups).map((groupName) => {
    const files = groups[groupName]

    const fileMessages = Object.keys(files).map((fileRelativeUrl) => {
      const file = files[fileRelativeUrl]
      const { sizeMap } = file
      const sizeNames = Object.keys(sizeMap)
      if (sizeNames.length === 1) {
        return `${file}: ${formatSize(sizeMap[sizeNames[0]])}`
      }
      const sizesFormatted = sizeNames.map((sizeName) => {
        return `${sizeName}: ${formatSize(sizeMap[sizeName])}`
      })

      return `${file}: { ${sizesFormatted.join(`,`)} }`
    })

    return `${groupName}
---------------------
${fileMessages.join(`
`)}`
  })

  const message = groupMessages.join(`
`)

  console.log(message)
}
