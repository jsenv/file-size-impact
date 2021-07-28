import { assert } from "@jsenv/assert"

import { formatSize } from "@jsenv/file-size-impact/src/internal/formatSize.js"

{
  const actual = formatSize(1048074.24)
  const expected = `1.05 MB`
  assert({ actual, expected })
}
