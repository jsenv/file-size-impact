import { assert } from "@jsenv/assert"
import { compareTwoSnapshots } from "../../src/internal/compareTwoSnapshots.js"

{
  const actual = compareTwoSnapshots(
    {
      dist: {
        manifest: {
          "dir/file.js": "dir/file.base.js",
          "old.js": "old.base.js",
        },
        trackingConfig: {
          "**/*": true,
        },
        report: {
          "dir/file.base.js": { size: 10, hash: "hash1" },
          "old.base.js": { size: 20, hash: "hash2" },
          "whatever.js": { size: 30, hash: "hash3" },
        },
      },
    },
    {
      dist: {
        manifest: {
          "dir/file.js": "dir/file.head.js",
          "new.js": "new.head.js",
        },
        trackingConfig: {
          "**/*": true,
        },
        report: {
          "dir/file.head.js": { size: 100, hash: "hash4" },
          "new.head.js": { size: 200, hash: "hash5" },
          "whatever.js": { size: 300, hash: "hash6" },
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
          hash: "hash1",
        },
        head: {
          relativeUrl: "dir/file.head.js",
          size: 100,
          hash: "hash4",
        },
      },
      "new.js": {
        base: null,
        head: {
          relativeUrl: "new.head.js",
          size: 200,
          hash: "hash5",
        },
      },
      "old.js": {
        base: {
          relativeUrl: "old.base.js",
          size: 20,
          hash: "hash2",
        },
        head: null,
      },
      "whatever.js": {
        base: {
          relativeUrl: "whatever.js",
          size: 30,
          hash: "hash3",
        },
        head: {
          relativeUrl: "whatever.js",
          size: 300,
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
        manifest: {
          "foo.html": "bar.html",
        },
        trackingConfig: {
          "foo.html": false,
        },
        report: {
          "whatever.js": { size: 10, hash: "hash" },
        },
      },
    },
    {
      dist: {
        manifest: {
          "foo.html": "bar.html",
        },
        trackingConfig: {
          "foo.html": false,
        },
        report: {
          "whatever.js": { size: 11, hash: "hash2" },
        },
      },
    },
  )
  const expected = {
    dist: {
      "whatever.js": {
        base: {
          relativeUrl: "whatever.js",
          size: 10,
          hash: "hash",
        },
        head: {
          relativeUrl: "whatever.js",
          size: 11,
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
        report: {
          "file.js": { size: 10, hash: "hash1" },
        },
      },
      src: {
        report: {
          "file.js": { size: 10, hash: "hash2" },
        },
      },
    },
    {
      dist: {
        report: {
          "file.js": { size: 20, hash: "hash3" },
        },
        trackingConfig: {
          "**/*": true,
        },
      },
    },
  )
  const expected = {
    dist: {
      "file.js": {
        base: {
          relativeUrl: "file.js",
          size: 10,
          hash: "hash1",
        },
        head: {
          relativeUrl: "file.js",
          size: 20,
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
        report: {
          "foo.js": { size: 10, hash: "hash1" },
          "bar.js": { size: 20, hash: "hash2" },
        },
        trackingConfig: {
          "foo.js": true,
          "bar.js": true,
        },
      },
    },
    {
      dist: {
        report: {
          "foo.js": { size: 100, hash: "hash3" },
        },
        trackingConfig: {
          "foo.js": true,
          "bar.js": false,
        },
      },
    },
  )
  const expected = {
    dist: {
      "foo.js": {
        base: {
          relativeUrl: "foo.js",
          size: 10,
          hash: "hash1",
        },
        head: {
          relativeUrl: "foo.js",
          size: 100,
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
        report: {
          "foo.js": { size: 10, hash: "hash1" },
        },
        trackingConfig: {
          "foo.js": true,
        },
      },
    },
    {
      "dist/systemjs": {
        report: {
          "foo.js": { size: 100, hash: "hash3" },
        },
        trackingConfig: {
          "foo.js": true,
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
          size: 100,
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
        report: {
          "foo.js": { size: 10, hash: "hash1" },
        },
        trackingConfig: {
          "bar.js": false,
          "foo.js": true,
        },
      },
    },
    {
      "dist/commonjs": {
        report: {
          "bar.js": { size: 100, hash: "hash2" },
          "foo.js": { size: 100, hash: "hash3" },
        },
        trackingConfig: {
          "bar.js": true,
          "foo.js": true,
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
          size: 100,
          hash: "hash2",
        },
      },
      "foo.js": {
        base: {
          relativeUrl: "foo.js",
          size: 10,
          hash: "hash1",
        },
        head: {
          relativeUrl: "foo.js",
          size: 100,
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
        report: {
          "foo.js": { size: 100, hash: "hash1" },
        },
        trackingConfig: {
          "foo.js": true,
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
          size: 100,
          hash: "hash1",
        },
      },
    },
  }
  assert({ actual, expected })
}
