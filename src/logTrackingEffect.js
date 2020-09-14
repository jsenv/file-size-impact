import { assertAndNormalizeDirectoryUrl } from "@jsenv/util"
import { applyTrackingConfig } from "./internal/applyTrackingConfig.js"

export const logTrackingEffect = async ({
  projectDirectoryUrl,
  trackingConfig,
  manifestConfig,
}) => {
  projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)

  const groupTrackingResults = await applyTrackingConfig(trackingConfig, {
    projectDirectoryUrl,
    manifestConfig,
  })

  Object.keys(groupTrackingResults).forEach((groupTrackingName) => {
    logGroupTrackingEffect(groupTrackingResults[groupTrackingName], groupTrackingName)
  })
}

const logGroupTrackingEffect = (groupTrackingResult, groupTrackingName) => {
  console.log(`
${groupTrackingName}
---------------------
[matching]
${formatMatchingLog(groupTrackingResult.matchingRelativeUrls)}

[ignored]
${formatIgnoredLog(groupTrackingResult.ignoredRelativeUrls)}

[manifest]
${formatManifestLog(groupTrackingResult.manifestRelativeUrls)}`)
}

const MAX_FILE_DISPLAYED = 15

const formatMatchingLog = (matchingRelativeUrls) => {
  if (matchingRelativeUrls.length > MAX_FILE_DISPLAYED) {
    const remaining = matchingRelativeUrls.length - MAX_FILE_DISPLAYED
    return `${matchingRelativeUrls.slice(0, MAX_FILE_DISPLAYED).join(`
`)}
... ${remaining} more ...`
  }
  return matchingRelativeUrls.join(`
`)
}

const formatIgnoredLog = (ignoredRelativeUrls) => {
  if (ignoredRelativeUrls.length > MAX_FILE_DISPLAYED) {
    const remaining = ignoredRelativeUrls.length - MAX_FILE_DISPLAYED
    return `${ignoredRelativeUrls.slice(0, MAX_FILE_DISPLAYED).join(`
`)}
... ${remaining} more ...`
  }
  return ignoredRelativeUrls.join(`
`)
}

const formatManifestLog = (manifestRelativeUrls) => {
  if (manifestRelativeUrls.length > MAX_FILE_DISPLAYED) {
    const remaining = manifestRelativeUrls.length - MAX_FILE_DISPLAYED
    return `${manifestRelativeUrls.slice(0, MAX_FILE_DISPLAYED).join(`
`)}
... ${remaining} more ...`
  }
  return manifestRelativeUrls.join(`
`)
}
