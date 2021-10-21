import { generateFileSizeReport } from "@jsenv/file-size-impact"

await generateFileSizeReport({
  projectDirectoryUrl: new URL("./", import.meta.url),
  log: true,
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
})
