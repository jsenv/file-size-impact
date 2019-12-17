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
  <summary>Merging <code>head</code> into <code>base</code> would <b>not impact</b> <code>dist</code> size.</summary>

changes are not affecting file sizes.
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
          },
          head: {
            size: 15,
          },
        },
        "file-b.js": {
          base: {
            size: 15,
          },
          head: {
            size: 10,
          },
        },
      },
    },
    generatedByLink: false,
  })
  const expected = `
<details>
  <summary>Merging <code>head</code> into <code>base</code> would <b>not impact</b> <code>dist</code> size.</summary>

file | size on \`base\` | size on \`head\`| effect
---- | ----------- | --------------------- | ----------
file-a.js|10 bytes|15 bytes|+5 bytes
file-b.js|15 bytes|10 bytes|-5 bytes
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
          },
        },
        "file-removed.js": {
          base: {
            size: 20,
          },
          head: null,
        },
        "file-updated.js": {
          base: {
            size: 10,
          },
          head: {
            size: 15,
          },
        },
      },
    },
    generatedByLink: false,
  })
  const expected = `
<details>
  <summary>Merging <code>head</code> into <code>base</code> would <b>decrease</b> <code>dist</code> size by 5 bytes.</summary>

file | size on \`base\` | size on \`head\`| effect
---- | ----------- | --------------------- | ----------
file-added.js|0 bytes|10 bytes (removed)|+10 bytes
file-removed.js|20 bytes|0 bytes (removed)|-20 bytes
file-updated.js|10 bytes|15 bytes|+5 bytes
</details>`
  assert({ actual, expected })
}
