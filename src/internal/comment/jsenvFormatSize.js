const enDecimalFormatter = new Intl.NumberFormat("en", { style: "decimal" })

export const jsenvFormatSize = (sizeNumber, { diff = false, unit = false } = {}) => {
  const sizeNumberAbsolute = Math.abs(sizeNumber)
  let sizeString = enDecimalFormatter.format(sizeNumberAbsolute)

  if (diff) {
    if (sizeNumber < 0) {
      sizeString = `-${sizeString}`
    } else if (sizeNumber > 0) {
      sizeString = `+${sizeString}`
    }
  }

  if (unit) {
    if (sizeNumberAbsolute === 0) {
    } else if (sizeNumberAbsolute === 1) {
      sizeString = `${sizeString} byte`
    } else if (sizeNumberAbsolute > 1) {
      sizeString = `${sizeString} bytes`
    }
  }

  return sizeString
}
