import { assert } from "@jsenv/assert"
import { resolveUrl, ensureEmptyDirectory, writeFile, writeDirectory } from "@jsenv/util"
import { createCancellationToken } from "@jsenv/cancellation"

import { generateSnapshot } from "../../src/internal/generateSnapshot.js"
import { raw } from "../../index.js"

const transformations = { raw }
const tempDirectoryUrl = resolveUrl("./temp/", import.meta.url)
const test = (params) => {
  return generateSnapshot({
    cancellationToken: createCancellationToken(),
    ...params,
  })
}

// .js + .js.map without manifest
{
  await ensureEmptyDirectory(tempDirectoryUrl)
  const fileUrl = resolveUrl("dist/file.js", tempDirectoryUrl)
  const fileMapUrl = resolveUrl("dist/file.js.map", tempDirectoryUrl)
  await writeFile(fileUrl, `console.log("hello")`)
  await writeFile(fileMapUrl, `{ "file": "foo" }`)

  const actual = await test({
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
          sizeMap: { raw: 20 },
          hash: '"14-qK8urhYN/nZoik6niqmvkolkCK0"',
          meta: true,
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

  const actual = await test({
    logLevel: "warn",
    projectDirectoryUrl: tempDirectoryUrl,
    trackingConfig: {
      dist: {
        "./dist/**/*": {
          showSizeImpact: () => true,
        },
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
          sizeMap: { raw: 20 },
          hash: '"14-qK8urhYN/nZoik6niqmvkolkCK0"',
          meta: {
            showSizeImpact: () => true,
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

  const actual = await test({
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
