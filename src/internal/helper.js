export const isNew = ({ base }) => !base

export const isDeleted = ({ base, head }) => base && !head

export const isChanged = ({ base, head }) => base && head && base.hash !== head.hash

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
