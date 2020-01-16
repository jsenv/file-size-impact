import { assert } from "@jsenv/assert"
import { resolveUrl, removeFileSystemNode, readFile } from "@jsenv/util"
import { generateSnapshotFile } from "../../../index.js"

const testDirectoryUrl = resolveUrl("./", import.meta.url)
const snapshotFileRelativeUrl = "snapshot.json"
const snapshotFileUrl = resolveUrl(snapshotFileRelativeUrl, testDirectoryUrl)

await removeFileSystemNode(snapshotFileUrl)
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
const snapshotFileContent = await readFile(snapshotFileUrl)
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
