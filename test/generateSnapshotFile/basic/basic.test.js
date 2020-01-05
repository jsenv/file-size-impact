import { assert } from "@jsenv/assert"
import { generateSnapshotFile } from "../../../index.js"
import { resolveUrl, urlToFilePath } from "../../../src/internal/urlUtils.js"
import { removeFile, readFileContent } from "../../../src/internal/filesystemUtils.js"

const testDirectoryUrl = import.meta.resolve("./")
const snapshotFileRelativeUrl = "snapshot.json"
const snapshotFileUrl = resolveUrl(snapshotFileRelativeUrl, testDirectoryUrl)
const snapshotFilePath = urlToFilePath(snapshotFileUrl)

await removeFile(snapshotFilePath)
await generateSnapshotFile({
  logLevel: "warn",
  projectDirectoryUrl: testDirectoryUrl,
  snapshotFileRelativeUrl,
  directorySizeTrackingConfig: {
    dist: {
      "./**/*.js": true,
    },
  },
})
const snapshotFileContent = await readFileContent(snapshotFilePath)
const actual = JSON.parse(snapshotFileContent)
const expected = {
  dist: {
    manifest: null,
    report: {
      "file.js": {
        size: 21,
        hash: '"15-OmSrCmxctJU4IRJ2apSp0zTITUI"',
      },
    },
    trackingConfig: {
      "./**/*.js": true,
    },
  },
}
assert({ actual, expected })
