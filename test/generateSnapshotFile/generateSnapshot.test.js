import { assert } from "@jsenv/assert"
import { resolveUrl, ensureEmptyDirectory, writeFile, writeDirectory } from "@jsenv/util"
import { generateSnapshot } from "../../src/internal/generateSnapshot.js"
import { none } from "../../index.js"

const transformations = { none }
const tempDirectoryUrl = resolveUrl("./temp/", import.meta.url)

// .js + .js.map without manifest
{
  await ensureEmptyDirectory(tempDirectoryUrl)
  const fileUrl = resolveUrl("dist/file.js", tempDirectoryUrl)
  const fileMapUrl = resolveUrl("dist/file.js.map", tempDirectoryUrl)
  await writeFile(fileUrl, `console.log("hello")`)
  await writeFile(fileMapUrl, `{ "file": "foo" }`)

  const actual = await generateSnapshot({
    logLevel: "warn",
    projectDirectoryUrl: tempDirectoryUrl,
    trackingConfig: {
      dist: {
        "./dist/**/*.js": true,
      },
    },
    transformations,
  })
  const expected = {
    dist: {
      manifestMap: {},
      fileMap: {
        "dist/file.js": {
          sizeMap: { none: 20 },
          hash: '"14-qK8urhYN/nZoik6niqmvkolkCK0"',
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

  const actual = await generateSnapshot({
    logLevel: "warn",
    projectDirectoryUrl: tempDirectoryUrl,
    trackingConfig: {
      dist: {
        "./dist/**/*": true,
      },
    },
    transformations,
    manifestConfig: {
      "./**/manifest.json": true,
    },
  })
  const expected = {
    dist: {
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
  }
  assert({ actual, expected })
}

// an empty directory
{
  await ensureEmptyDirectory(tempDirectoryUrl)
  const directoryUrl = resolveUrl("dist", tempDirectoryUrl)
  await writeDirectory(directoryUrl)

  const actual = await generateSnapshot({
    logLevel: "warn",
    projectDirectoryUrl: tempDirectoryUrl,
    trackingConfig: {
      dist: {
        "./dist/**/*.js": true,
      },
    },
    transformations,
  })
  const expected = {
    dist: {
      manifestMap: {},
      fileMap: {},
    },
  }
  assert({ actual, expected })
}
