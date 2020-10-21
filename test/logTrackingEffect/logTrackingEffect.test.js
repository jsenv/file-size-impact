import { resolveUrl } from "@jsenv/util"
import { logTrackingEffect } from "../../index.js"

const directoryUrl = resolveUrl("./", import.meta.url)

logTrackingEffect({
  projectDirectoryUrl: directoryUrl,
  trackingConfig: {
    "first group": {
      "./dist/**/*.js": true,
      "./dist/**/*.html": false,
      "./dist/directory/": false,
    },
    "second group": {
      "./dist-2/**/*.js": true,
    },
  },
  // maxFileDisplayed: 2,
})
