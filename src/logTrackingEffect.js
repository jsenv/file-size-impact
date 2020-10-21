import { assertAndNormalizeDirectoryUrl } from "@jsenv/util"
import { applyTrackingConfig } from "./internal/applyTrackingConfig.js"

export const logTrackingEffect = async ({
  projectDirectoryUrl,
  trackingConfig,
  manifestConfig,
  maxFileDisplayed = 30,
}) => {
  projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)

  const groupTrackingResults = await applyTrackingConfig(trackingConfig, {
    projectDirectoryUrl,
    manifestConfig,
  })

  Object.keys(groupTrackingResults).forEach((groupTrackingName) => {
    logGroupTrackingEffect(groupTrackingResults[groupTrackingName], groupTrackingName, {
      maxFileDisplayed,
    })
  })
}

const logGroupTrackingEffect = (groupTrackingResult, groupTrackingName) => {
  console.log(`
${groupTrackingName}
---------------------
[tracked]
${formatTrackedLog(groupTrackingResult.trackedMetaMap)}

[ignored]
${formatIgnoredLog(groupTrackingResult.ignoredMetaMap)}

[manifest]
${formatManifestLog(groupTrackingResult.manifestMetaMap)}`)
}

const formatTrackedLog = (trackedMetaMap, { maxFileDisplayed }) => {
  const trackedRelativeUrls = Object.keys(trackedMetaMap)

  if (trackedRelativeUrls.length > maxFileDisplayed) {
    const remaining = trackedRelativeUrls.length - maxFileDisplayed
    return `${trackedRelativeUrls.slice(0, maxFileDisplayed).join(`
`)}
... ${remaining} more ...`
  }
  return trackedRelativeUrls.join(`
`)
}

const formatIgnoredLog = (ignoredMetaMap, { maxFileDisplayed }) => {
  const ignoredRelativeUrls = Object.keys(ignoredMetaMap)

  if (ignoredRelativeUrls.length > maxFileDisplayed) {
    const remaining = ignoredRelativeUrls.length - maxFileDisplayed
    return `${ignoredRelativeUrls.slice(0, maxFileDisplayed).join(`
`)}
... ${remaining} more ...`
  }
  return ignoredRelativeUrls.join(`
`)
}

const formatManifestLog = (manifestMetaMap, { maxFileDisplayed }) => {
  const manifestRelativeUrls = Object.keys(manifestMetaMap)

  if (manifestRelativeUrls.length > maxFileDisplayed) {
    const remaining = manifestRelativeUrls.length - maxFileDisplayed
    return `${manifestRelativeUrls.slice(0, maxFileDisplayed).join(`
`)}
... ${remaining} more ...`
  }
  return manifestRelativeUrls.join(`
`)
}
