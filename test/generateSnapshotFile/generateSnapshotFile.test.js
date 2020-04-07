import { assert } from "@jsenv/assert"
import { resolveUrl, ensureEmptyDirectory, readFile, writeFile, writeDirectory } from "@jsenv/util"
import { generateSnapshotFile } from "../../index.js"

const tempDirectoryUrl = resolveUrl("./temp/", import.meta.url)

{
  await ensureEmptyDirectory(tempDirectoryUrl)
  const fileUrl = resolveUrl("dist/file.js", tempDirectoryUrl)
  const fileMapUrl = resolveUrl("dist/file.js.map", tempDirectoryUrl)
  await writeFile(fileUrl, `console.log("hello")`)
  await writeFile(fileMapUrl, `{ "file": "foo" }`)
  const snapshotFileRelativeUrl = "./snapshot.json"
  const snapshotFileUrl = resolveUrl(snapshotFileRelativeUrl, tempDirectoryUrl)

  await generateSnapshotFile({
    logLevel: "warn",
    projectDirectoryUrl: tempDirectoryUrl,
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
    version: 1,
    snapshot: {
      dist: {
        manifest: null,
        report: {
          "file.js": {
            sizeMap: { none: 20 },
            hash: '"14-qK8urhYN/nZoik6niqmvkolkCK0"',
          },
        },
        trackingConfig: {
          "./**/*.js": true,
        },
      },
    },
  }
  assert({ actual, expected })
}

{
  await ensureEmptyDirectory(tempDirectoryUrl)
  const fileUrl = resolveUrl("dist/file.hash.js", tempDirectoryUrl)
  const manifestUrl = resolveUrl("dist/manifest.json", tempDirectoryUrl)
  await writeFile(fileUrl, `console.log("hello")`)
  await writeFile(manifestUrl, `{ "file.js": "file.hash.js" }`)
  const snapshotFileRelativeUrl = "./snapshot.json"
  const snapshotFileUrl = resolveUrl(snapshotFileRelativeUrl, tempDirectoryUrl)

  await generateSnapshotFile({
    logLevel: "warn",
    projectDirectoryUrl: tempDirectoryUrl,
    snapshotFileRelativeUrl,
    directorySizeTrackingConfig: {
      dist: {
        "./**/*": true,
      },
    },
  })
  const snapshotFileContent = await readFile(snapshotFileUrl)
  const actual = JSON.parse(snapshotFileContent)
  const expected = {
    version: 1,
    snapshot: {
      dist: {
        manifest: {
          "file.js": "file.hash.js",
        },
        report: {
          "file.hash.js": {
            sizeMap: { none: 20 },
            hash: '"14-qK8urhYN/nZoik6niqmvkolkCK0"',
          },
        },
        trackingConfig: {
          "./**/*": true,
        },
      },
    },
  }
  assert({ actual, expected })
}

// an empty directory
{
  await ensureEmptyDirectory(tempDirectoryUrl)
  const directoryUrl = resolveUrl("dist", tempDirectoryUrl)
  await writeDirectory(directoryUrl)
  const snapshotFileRelativeUrl = "./snapshot.json"
  const snapshotFileUrl = resolveUrl(snapshotFileRelativeUrl, tempDirectoryUrl)

  await generateSnapshotFile({
    logLevel: "warn",
    projectDirectoryUrl: tempDirectoryUrl,
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
    version: 1,
    snapshot: {
      dist: {
        manifest: null,
        report: {},
        trackingConfig: {
          "./**/*.js": true,
        },
      },
    },
  }
  assert({ actual, expected })
}
