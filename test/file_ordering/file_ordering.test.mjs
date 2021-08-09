import { assert } from "@jsenv/assert"

import { orderBySizeImpact } from "@jsenv/file-size-impact/src/internal/orderBySizeImpact.js"

{
  const fileByFileImpact = {
    "size_same.js": {
      event: "modified",
      beforeMerge: {
        sizeMap: { raw: 100 },
      },
      afterMerge: {
        sizeMap: { raw: 100 },
      },
    },
    "size_decreases.js": {
      event: "modified",
      beforeMerge: {
        sizeMap: { raw: 100 },
      },
      afterMerge: {
        sizeMap: { raw: 90 },
      },
    },
    "size_increases.js": {
      event: "modified",
      beforeMerge: {
        sizeMap: { raw: 100 },
      },
      afterMerge: {
        sizeMap: { raw: 110 },
      },
    },
  }
  const fileByFileImpactOrdered = orderBySizeImpact(fileByFileImpact, ["raw"])
  const actual = Object.keys(fileByFileImpactOrdered)
  const expected = ["size_increases.js", "size_decreases.js", "size_same.js"]
  assert({ actual, expected })
}
