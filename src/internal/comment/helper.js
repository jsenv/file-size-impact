// https://gist.github.com/borekb/f83e48479aceaafa43108e021600f7e3
export const anchor = (text, id) => {
  return `<a href="#user-content-${id.replace()}">${text}<a>`
}

export const isNew = ({ base }) => !base

export const isDeleted = ({ base, afterMerge }) => base && !afterMerge

export const isChanged = ({ base, afterMerge }) =>
  base && afterMerge && base.hash !== afterMerge.hash

export const sumSize = (from, into, sizeName) => {
  if (sizeName in into) {
    const currentSize = into[sizeName]
    // This if exists because transform may fail sizeValue can be "error"
    // This case is handled like this: if a size is "error", the sum of all size is "error"
    // (Because sum of all size cannot be computed)
    if (typeof currentSize === "number") {
      return currentSize + from[sizeName]
    }
    return currentSize
  }
  return from[sizeName]
}
