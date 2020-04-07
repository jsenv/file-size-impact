/**

This test is meant to work like this:

It read comment-example.md and ensure regenerating it gives the same output.
The goal is to force user to regenerate comment-example.md and ensure it looks correct before commiting it.

-> This is snapshot testing to force a human review when comment is modified.

*/

import { readFile, resolveUrl } from "@jsenv/util"
import { assert } from "@jsenv/assert"

const commentExampleFileUrl = resolveUrl("../../docs/comment-example.md", import.meta.url)
const expected = await readFile(commentExampleFileUrl)

const { promise } = await import("../../docs/generate-comment-example.js")
await promise
const actual = readFile(commentExampleFileUrl)
assert({ actual, expected })
