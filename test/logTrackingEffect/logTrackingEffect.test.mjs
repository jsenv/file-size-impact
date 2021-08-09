import { resolveUrl } from "@jsenv/util"

import { logTrackingEffect } from "@jsenv/file-size-impact"

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
