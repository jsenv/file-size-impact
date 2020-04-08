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
        head: {
          relativeUrl: "dir/file.head.js",
          hash: "hash4",
        },
      },
      "new.js": {
        base: null,
        head: {
          relativeUrl: "new.head.js",
          hash: "hash5",
        },
      },
      "old.js": {
        base: {
          relativeUrl: "old.base.js",
          hash: "hash2",
        },
        head: null,
      },
      "whatever.js": {
        base: {
          relativeUrl: "whatever.js",
          hash: "hash3",
        },
        head: {
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
        head: {
          relativeUrl: "whatever.js",
          hash: "hash2",
        },
      },
    },
  }
  assert({ actual, expected })
}

// pull request untracks a previously tracked directory
{
  const actual = compareTwoSnapshots(
    {
      dist: {
        fileMap: {
          "file.js": { hash: "hash1" },
        },
      },
      src: {
        fileMap: {
          "file.js": { hash: "hash2" },
        },
      },
    },
    {
      dist: {
        tracking: {
          "**/*": true,
        },
        fileMap: {
          "file.js": { hash: "hash3" },
        },
      },
    },
  )
  const expected = {
    dist: {
      "file.js": {
        base: {
          relativeUrl: "file.js",
          hash: "hash1",
        },
        head: {
          relativeUrl: "file.js",
          hash: "hash3",
        },
      },
    },
  }
  assert({ actual, expected })
}

// pull request untracks a previously tracked file
{
  const actual = compareTwoSnapshots(
    {
      dist: {
        tracking: {
          "foo.js": true,
          "bar.js": true,
        },
        fileMap: {
          "foo.js": { hash: "hash1" },
          "bar.js": { hash: "hash2" },
        },
      },
    },
    {
      dist: {
        tracking: {
          "foo.js": true,
          "bar.js": false,
        },
        fileMap: {
          "foo.js": { hash: "hash3" },
        },
      },
    },
  )
  const expected = {
    dist: {
      "foo.js": {
        base: {
          relativeUrl: "foo.js",
          hash: "hash1",
        },
        head: {
          relativeUrl: "foo.js",
          hash: "hash3",
        },
      },
    },
  }
  assert({ actual, expected })
}

// pull request tracks a previously untracked directory
{
  const actual = compareTwoSnapshots(
    {
      "dist/commonjs": {
        tracking: {
          "foo.js": true,
        },
        fileMap: {
          "foo.js": { hash: "hash1" },
        },
      },
    },
    {
      "dist/systemjs": {
        tracking: {
          "foo.js": true,
        },
        fileMap: {
          "foo.js": { hash: "hash3" },
        },
      },
    },
  )
  const expected = {
    "dist/systemjs": {
      "foo.js": {
        base: null,
        head: {
          relativeUrl: "foo.js",
          hash: "hash3",
        },
      },
    },
  }
  assert({ actual, expected })
}

// pull request tracks a previously untracked file
{
  const actual = compareTwoSnapshots(
    {
      "dist/commonjs": {
        tracking: {
          "bar.js": false,
          "foo.js": true,
        },
        fileMap: {
          "foo.js": { hash: "hash1" },
        },
      },
    },
    {
      "dist/commonjs": {
        tracking: {
          "bar.js": true,
          "foo.js": true,
        },
        fileMap: {
          "bar.js": { hash: "hash2" },
          "foo.js": { hash: "hash3" },
        },
      },
    },
  )
  const expected = {
    "dist/commonjs": {
      "bar.js": {
        base: null,
        head: {
          relativeUrl: "bar.js",
          hash: "hash2",
        },
      },
      "foo.js": {
        base: {
          relativeUrl: "foo.js",
          hash: "hash1",
        },
        head: {
          relativeUrl: "foo.js",
          hash: "hash3",
        },
      },
    },
  }
  assert({ actual, expected })
}

// pull request is the first one (basesnapshot is {})
{
  const actual = compareTwoSnapshots(
    {},
    {
      "dist/global": {
        tracking: {
          "foo.js": true,
        },
        fileMap: {
          "foo.js": { hash: "hash1" },
        },
      },
    },
  )
  const expected = {
    "dist/global": {
      "foo.js": {
        base: null,
        head: {
          relativeUrl: "foo.js",
          hash: "hash1",
        },
      },
    },
  }
  assert({ actual, expected })
}
