import { resolveUrl, urlToRelativeUrl } from "@jsenv/filesystem"

export const manifestToMappings = (manifestMap) => {
  const mappings = {}
  Object.keys(manifestMap).forEach((manifestRelativeUrl) => {
    const manifest = manifestMap[manifestRelativeUrl]
    const manifestAbstractUrl = resolveUrl(manifestRelativeUrl, ABSTRACT_DIRECTORY_URL)
    Object.keys(manifest).forEach((manifestKey) => {
      const manifestValue = manifest[manifestKey]
      const manifestKeyAsAbstractUrl = resolveUrl(manifestKey, manifestAbstractUrl)
      const manifestValueAsAbstractUrl = resolveUrl(manifestValue, manifestAbstractUrl)
      const manifestKeyAsRelativeUrl = urlToRelativeUrl(
        manifestKeyAsAbstractUrl,
        ABSTRACT_DIRECTORY_URL,
      )
      const manifestValueAsRelativeUrl = urlToRelativeUrl(
        manifestValueAsAbstractUrl,
        ABSTRACT_DIRECTORY_URL,
      )
      mappings[manifestKeyAsRelativeUrl] = manifestValueAsRelativeUrl
    })
  })
  return mappings
}

const ABSTRACT_DIRECTORY_URL = "file:///directory/"

export const manifestKeyFromRelativeUrl = (relativeUrl, mappings) => {
  return Object.keys(mappings).find((keyCandidate) => {
    return mappings[keyCandidate] === relativeUrl
  })
}
