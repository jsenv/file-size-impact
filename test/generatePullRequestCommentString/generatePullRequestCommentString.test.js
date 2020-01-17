import { assert } from "@jsenv/assert"
import { generatePullRequestCommentString } from "../../src/internal/generatePullRequestCommentString.js"

// nothing changed
{
  const actual = generatePullRequestCommentString({
    pullRequestBase: "base",
    pullRequestHead: "head",
    snapshotComparison: {
      dist: {},
    },
    generatedByLink: false,
  })
  const expected = `
<details>
  <summary>Merging <code>head</code> into <code>base</code> will <b>not impact</b> <code>dist</code> overall size.</summary>
changes don't affect the overall size or cache.
</details>`
  assert({ actual, expected })
}

// updates cancels each other impacts
{
  const actual = generatePullRequestCommentString({
    pullRequestBase: "base",
    pullRequestHead: "head",
    snapshotComparison: {
      dist: {
        "file-a.js": {
          base: {
            size: 10,
            hash: "hash1",
          },
          head: {
            size: 15,
            hash: "hash2",
          },
        },
        "file-b.js": {
          base: {
            size: 15,
            hash: "hash3",
          },
          head: {
            size: 10,
            hash: "hash4",
          },
        },
      },
    },
    generatedByLink: false,
  })
  const expected = `
<details>
  <summary>Merging <code>head</code> into <code>base</code> will <b>not impact</b> <code>dist</code> overall size.</summary>
<br />

event | file | size&nbsp;on&nbsp;\`base\` | size&nbsp;on&nbsp;\`head\` | size&nbsp;impact
--- | --- | --- | --- | ---
content&nbsp;changed | file-a.js | 10 bytes | 15 bytes | +5 bytes
content&nbsp;changed | file-b.js | 15 bytes | 10 bytes | -5 bytes

**Overall size impact:** 0.<br />
**Cache impact:** 2 files content changed, invalidating a total of 25 bytes.
</details>`
  assert({ actual, expected })
}

// added, removed, updated
{
  const actual = generatePullRequestCommentString({
    pullRequestBase: "base",
    pullRequestHead: "head",
    snapshotComparison: {
      dist: {
        "file-added.js": {
          base: null,
          head: {
            size: 10,
            hash: "hash1",
          },
        },
        "file-removed.js": {
          base: {
            size: 20,
            hash: "hash2",
          },
          head: null,
        },
        "file-updated.js": {
          base: {
            size: 10,
            hash: "hash3",
          },
          head: {
            size: 15,
            hash: "hash4",
          },
        },
      },
    },
    generatedByLink: false,
  })
  const expected = `
<details>
  <summary>Merging <code>head</code> into <code>base</code> will <b>decrease</b> <code>dist</code> overall size by 5 bytes.</summary>
<br />

event | file | size&nbsp;on&nbsp;\`base\` | size&nbsp;on&nbsp;\`head\` | size&nbsp;impact
--- | --- | --- | --- | ---
file&nbsp;created | file-added.js | --- | 10 bytes | +10 bytes
file&nbsp;deleted | file-removed.js | 20 bytes | --- | -20 bytes
content&nbsp;changed | file-updated.js | 10 bytes | 15 bytes | +5 bytes

**Overall size impact:** -5 bytes.<br />
**Cache impact:** 1 files content changed, invalidating a total of 10 bytes.
</details>`
  assert({ actual, expected })
}
