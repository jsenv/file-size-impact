// https://gist.github.com/borekb/f83e48479aceaafa43108e021600f7e3
export const anchor = (text, id) => {
  return `<a href="#user-content-${id.replace()}">${text}<a>`
}

export const isAdded = ({ base }) => !base

export const isDeleted = ({ base, afterMerge }) => base && !afterMerge

export const isModified = ({ base, afterMerge }) =>
  base && afterMerge && base.hash !== afterMerge.hash
