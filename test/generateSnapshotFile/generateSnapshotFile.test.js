import { assert } from "@jsenv/assert"
import { resolveUrl, ensureEmptyDirectory, readFile, writeFile, writeDirectory } from "@jsenv/util"
import { generateSnapshotFile } from "../../index.js"

const tempDirectoryUrl = resolveUrl("./temp/", import.meta.url)

// .js + .js.map without manifest
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
    trackingConfig: {
      dist: {
        "./dist/**/*.js": true,
      },
    },
  })
  const snapshotFileContent = await readFile(snapshotFileUrl)
  const actual = JSON.parse(snapshotFileContent)
  const expected = {
    version: 1,
    snapshot: {
      dist: {
        tracking: {
          "./dist/**/*.js": true,
        },
        manifestMap: {},
        fileMap: {
          "dist/file.js": {
            sizeMap: { none: 20 },
            hash: '"14-qK8urhYN/nZoik6niqmvkolkCK0"',
          },
        },
      },
    },
  }
  assert({ actual, expected })
}

// file hashed + manifest
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
    trackingConfig: {
      dist: {
        "./dist/**/*": true,
      },
    },
  })
  const snapshotFileContent = await readFile(snapshotFileUrl)
  const actual = JSON.parse(snapshotFileContent)
  const expected = {
    version: 1,
    snapshot: {
      dist: {
        tracking: {
          "./dist/**/*": true,
        },
        manifestMap: {
          "dist/manifest.json": {
            "file.js": "file.hash.js",
          },
        },
        fileMap: {
          "dist/file.hash.js": {
            sizeMap: { none: 20 },
            hash: '"14-qK8urhYN/nZoik6niqmvkolkCK0"',
          },
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
    trackingConfig: {
      dist: {
        "./dist/**/*.js": true,
      },
    },
  })
  const snapshotFileContent = await readFile(snapshotFileUrl)
  const actual = JSON.parse(snapshotFileContent)
  const expected = {
    version: 1,
    snapshot: {
      dist: {
        tracking: {
          "./dist/**/*.js": true,
        },
        manifestMap: {},
        fileMap: {},
      },
    },
  }
  assert({ actual, expected })
}
