import { assert } from "@jsenv/assert"

import { orderBySizeImpact } from "@jsenv/file-size-impact/src/internal/orderBySizeImpact.js"

{
  const fileByFileImpact = {
    "size_same.js": {
      sizeImpactMap: { raw: 0 },
    },
    "size_decreases.js": {
      sizeImpactMap: { raw: -10 },
    },
    "size_increases.js": {
      sizeImpactMap: { raw: +10 },
    },
  }
  const fileByFileImpactOrdered = orderBySizeImpact(fileByFileImpact, ["raw"])
  const actual = Object.keys(fileByFileImpactOrdered)
  const expected = ["size_increases.js", "size_decreases.js", "size_same.js"]
  assert({ actual, expected })
}
