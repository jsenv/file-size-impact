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
  const expected = `<details>
  <summary>Merging <code>head</code> into <code>base</code> will <strong>not impact</strong> <code>dist</code> overall size.</summary>
  <br />
  <blockquote>changes don't affect the overall size or cache.<blockquote>
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
  const expected = `<details>
  <summary>Merging <code>head</code> into <code>base</code> will <strong>not impact</strong> <code>dist</code> overall size.</summary>

  <br />
  <table>
    <thead>
    <tr>
      <td nowrap>event</td>
      <td nowrap>file</td>
      <td nowrap><code>base</code> size</td>
      <td nowrap><code>head</code> size</td>
      <td nowrap>size impact</td>
    </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>file-a.js</td>
        <td nowrap>content changed</td>
        <td nowrap>10 bytes</td>
        <td nowrap>15 bytes</td>
        <td nowrap>+5 bytes</td>
      </tr>
      <tr>
        <td nowrap>file-b.js</td>
        <td nowrap>content changed</td>
        <td nowrap>15 bytes</td>
        <td nowrap>10 bytes</td>
        <td nowrap>-5 bytes</td>
      </tr>
    </tbody>
  </table>

  <blockquote>
    <strong>Overall size impact:</strong> 0.<br />
    <strong>Cache impact:</strong> 2 files content changed, invalidating a total of 25 bytes.
  </blockquote>
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
  const expected = `<details>
  <summary>Merging <code>head</code> into <code>base</code> will <strong>decrease</strong> <code>dist</code> overall size by 5 bytes.</summary>
<br />
<table>
  <thead>
  <tr>
    <td nowrap>event</td>
    <td nowrap>file</td>
    <td nowrap><code>base</code> size</td>
    <td nowrap><code>head</code> size</td>
    <td nowrap>size impact</td>
  </tr>
  </thead>
  <tbody>
    <tr>
      <td nowrap>file-added.js</td>
      <td nowrap>file created</td>
      <td nowrap>---</td>
      <td nowrap>10 bytes</td>
      <td nowrap>+10 bytes</td>
    </tr>
    <tr>
      <td nowrap>file-removed.js</td>
      <td nowrap>file deleted</td>
      <td nowrap>20 bytes</td>
      <td nowrap>---</td>
      <td nowrap>-20 bytes</td>
    </tr>
    <tr>
      <td nowrap>file-updated.js</td>
      <td nowrap>content changed</td>
      <td nowrap>10 bytes</td>
      <td nowrap>15 bytes</td>
      <td nowrap>+5 bytes</td>
    </tr>
  </tbody>
</table>

<strong>Overall size impact:</strong> -5 bytes.<br />
<strong>Cache impact:</strong> 1 files content changed, invalidating a total of 10 bytes.
</details>`
  assert({ actual, expected })
}
