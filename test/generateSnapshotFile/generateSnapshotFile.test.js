import { assert } from "@jsenv/assert"
import { generateSnapshotFile } from "../../index.js"
import { resolveUrl, urlToFilePath } from "../../src/internal/urlUtils.js"
import { removeFile, readFileContent } from "../../src/internal/filesystemUtils.js"

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
    directory: {
      "./**/*.js": true,
    },
  },
})
const snapshotFileContent = await readFileContent(snapshotFilePath)
const actual = JSON.parse(snapshotFileContent)
const expected = {
  directory: {
    manifest: null,
    sizeReport: {
      "file.js": 21,
    },
  },
}
assert({ actual, expected })
