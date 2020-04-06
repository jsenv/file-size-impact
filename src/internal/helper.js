export const isNew = ({ base }) => !base

export const isDeleted = ({ base, head }) => base && !head

export const isChanged = ({ base, head }) => base && head && base.hash !== head.hash
