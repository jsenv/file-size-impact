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
        trackingConfig: {
          "**/*": true,
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
}

// pull request untracks a previously tracked directory
{
  const actual = compareTwoSnapshots(
    {
      dist: {
        sizeReport: {
          "file.js": 10,
        },
      },
      src: {
        sizeReport: {
          "file.js": 10,
        },
      },
    },
    {
      dist: {
        sizeReport: {
          "file.js": 20,
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
        },
        head: {
          relativeUrl: "file.js",
          size: 20,
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
        sizeReport: {
          "foo.js": 10,
          "bar.js": 20,
        },
        trackingConfig: {
          "foo.js": true,
          "bar.js": true,
        },
      },
    },
    {
      dist: {
        sizeReport: {
          "foo.js": 100,
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
        },
        head: {
          relativeUrl: "foo.js",
          size: 100,
        },
      },
    },
  }
  assert({ actual, expected })
}

// TODO: pull request tracks a previous untracked directory
// TODO: pull request tracks a previously untracked file
