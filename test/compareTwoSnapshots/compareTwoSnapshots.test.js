import { assert } from "@jsenv/assert"
import { compareTwoSnapshots } from "../../src/internal/compareTwoSnapshots.js"

{
  const actual = compareTwoSnapshots(
    {
      dist: {
        tracking: {
          "**/*": true,
        },
        manifestMap: {
          "manifest.json": {
            "dir/file.js": "dir/file.base.js",
            "old.js": "old.base.js",
          },
        },
        fileMap: {
          "dir/file.base.js": { hash: "hash1" },
          "old.base.js": { hash: "hash2" },
          "whatever.js": { hash: "hash3" },
        },
      },
    },
    {
      dist: {
        tracking: {
          "**/*": true,
        },
        manifestMap: {
          "manifest.json": {
            "dir/file.js": "dir/file.head.js",
            "new.js": "new.head.js",
          },
        },
        fileMap: {
          "dir/file.head.js": { hash: "hash4" },
          "new.head.js": { hash: "hash5" },
          "whatever.js": { hash: "hash6" },
        },
      },
    },
  )
  const expected = {
    dist: {
      "dir/file.js": {
        base: {
          relativeUrl: "dir/file.base.js",
          hash: "hash1",
        },
        afterMerge: {
          relativeUrl: "dir/file.head.js",
          hash: "hash4",
        },
      },
      "new.js": {
        base: null,
        afterMerge: {
          relativeUrl: "new.head.js",
          hash: "hash5",
        },
      },
      "old.js": {
        base: {
          relativeUrl: "old.base.js",
          hash: "hash2",
        },
        afterMerge: null,
      },
      "whatever.js": {
        base: {
          relativeUrl: "whatever.js",
          hash: "hash3",
        },
        afterMerge: {
          relativeUrl: "whatever.js",
          hash: "hash6",
        },
      },
    },
  }
  assert({ actual, expected })
}

// mapped + ignored file
{
  const actual = compareTwoSnapshots(
    {
      dist: {
        tracking: {
          "foo.html": false,
        },
        manifestMap: {
          "manifest.json": {
            "foo.html": "bar.html",
          },
        },
        fileMap: {
          "whatever.js": { hash: "hash" },
        },
      },
    },
    {
      dist: {
        tracking: {
          "foo.html": false,
        },
        manifestMap: {
          "manifest.json": {
            "foo.html": "bar.html",
          },
        },
        fileMap: {
          "whatever.js": { hash: "hash2" },
        },
      },
    },
  )
  const expected = {
    dist: {
      "whatever.js": {
        base: {
          relativeUrl: "whatever.js",
          hash: "hash",
        },
        afterMerge: {
          relativeUrl: "whatever.js",
          hash: "hash2",
        },
      },
    },
  }
  assert({ actual, expected })
}
