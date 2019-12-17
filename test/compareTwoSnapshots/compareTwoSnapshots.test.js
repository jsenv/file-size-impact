import { assert } from "@jsenv/assert"
import { compareTwoSnapshots } from "../../src/internal/compareTwoSnapshots.js"

const actual = compareTwoSnapshots(
  {
    dist: {
      manifest: {
        "dir/file.js": "dir/file.base.js",
        "old.js": "old.base.js",
      },
      sizeReport: {
        "dir/file.base.js": 10,
        "old.base.js": 20,
        "whatever.js": 30,
      },
    },
  },
  {
    dist: {
      manifest: {
        "dir/file.js": "dir/file.head.js",
        "new.js": "new.head.js",
      },
      sizeReport: {
        "dir/file.head.js": 100,
        "new.head.js": 200,
        "whatever.js": 300,
      },
    },
  },
)
const expected = {
  dist: {
    "dir/file.js": {
      base: {
        relativeUrl: "dir/file.base.js",
        size: 10,
      },
      head: {
        relativeUrl: "dir/file.head.js",
        size: 100,
      },
    },
    "new.js": {
      base: null,
      head: {
        relativeUrl: "new.head.js",
        size: 200,
      },
    },
    "old.js": {
      base: {
        relativeUrl: "old.base.js",
        size: 20,
      },
      head: null,
    },
    "whatever.js": {
      base: {
        relativeUrl: "whatever.js",
        size: 30,
      },
      head: {
        relativeUrl: "whatever.js",
        size: 300,
      },
    },
  },
}
assert({ actual, expected })
