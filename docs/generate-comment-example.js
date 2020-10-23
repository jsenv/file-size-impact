import { writeFile, resolveUrl } from "@jsenv/util"
import { jsenvCommentParameters } from "@jsenv/file-size-impact/src/jsenvCommentParameters.js"
import { formatComment } from "@jsenv/file-size-impact/src/internal/comment/formatComment.js"

const generateComment = (data) => {
  const transformations = deduceTransformations(data)
  return formatComment({
    pullRequestBase: "base",
    pullRequestHead: "head",
    transformations,
    ...jsenvCommentParameters,
    ...data,
  })
}

const deduceTransformations = ({ baseSnapshot, afterMergeSnapshot }) => {
  const baseKeys = Object.keys(baseSnapshot)
  if (baseKeys.length) {
    const baseFirstGroup = baseSnapshot[baseKeys[0]]
    const baseFileMap = baseFirstGroup.fileMap
    const files = Object.keys(baseFileMap)
    if (files.length) {
      return baseFileMap[files[0]].sizeMap
    }
  }

  const afterMergeKeys = Object.keys(afterMergeSnapshot)
  if (afterMergeKeys.length) {
    const afterMergeFirstGroup = afterMergeSnapshot[afterMergeKeys[0]]
    const afterMergeFileMap = afterMergeFirstGroup.fileMap
    const files = Object.keys(afterMergeFileMap)
    if (files.length) {
      return afterMergeFileMap[files[0]].sizeMap
    }
  }

  return {}
}

const examples = {
  "basic example": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "a",
            sizeMap: { raw: 100 },
            meta: true,
          },
          "dist/foo.js": {
            hash: "a",
            sizeMap: { raw: 100 },
            meta: true,
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "b",
            sizeMap: { raw: 110 },
            meta: true,
          },
          "dist/foo.js": {
            hash: "b",
            sizeMap: { raw: 115 },
            meta: true,
          },
        },
      },
    },
  }),
  "basic example + gzip + brotli": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "a",
            sizeMap: { raw: 100, gzip: 20, brotli: 18 },
            meta: true,
          },
          "dist/foo.js": {
            hash: "a",
            sizeMap: { raw: 100, gzip: 20, brotli: 18 },
            meta: true,
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "b",
            sizeMap: { raw: 110, gzip: 22, brotli: 19 },
            meta: true,
          },
          "dist/foo.js": {
            hash: "b",
            sizeMap: { raw: 115, gzip: 24, brotli: 21 },
            meta: true,
          },
        },
      },
    },
  }),
  "no changes": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "a",
            sizeMap: { raw: 110 },
            meta: true,
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "a",
            sizeMap: { raw: 110 },
            meta: true,
          },
        },
      },
    },
  }),
  "no files": generateComment({
    trackingConfig: {
      dist: {
        "*/**": false,
      },
    },
    baseSnapshot: {
      dist: {
        fileMap: {},
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {},
      },
    },
  }),
  "changes cancels each other": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/file-a.js": {
            hash: "hash1",
            sizeMap: { raw: 10 },
            meta: true,
          },
          "dist/file-b.js": {
            hash: "hash3",
            sizeMap: { raw: 15 },
            meta: true,
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/file-a.js": {
            hash: "hash2",
            sizeMap: { raw: 15 },
            meta: true,
          },
          "dist/file-b.js": {
            hash: "hash4",
            sizeMap: { raw: 10 },
            meta: true,
          },
        },
      },
    },
  }),
  "two groups + gzip + brotli": generateComment({
    baseSnapshot: {
      "dist/commonjs": {
        fileMap: {
          "dist/commonjs/bar.js": {
            hash: "a",
            sizeMap: {
              raw: 100,
              gzip: 10,
              brotli: 9,
            },
            meta: true,
          },
          "dist/commonjs/hello.js": {
            hash: "a",
            sizeMap: {
              raw: 167000,
              gzip: 1600,
              brotli: 1500,
            },
            meta: true,
          },
        },
      },
      "dist/systemjs": {
        fileMap: {
          "dist/systemjs/bar.js": {
            hash: "a",
            sizeMap: {
              raw: 100,
              gzip: 10,
              brotli: 9,
            },
            meta: true,
          },
          "dist/systemjs/hello.js": {
            hash: "a",
            sizeMap: {
              raw: 167000,
              gzip: 1600,
              brotli: 1500,
            },
            meta: true,
          },
        },
      },
    },
    afterMergeSnapshot: {
      "dist/commonjs": {
        fileMap: {
          "dist/commonjs/foo.js": {
            hash: "a",
            sizeMap: {
              raw: 120,
              gzip: 12,
              brotli: 11,
            },
            meta: true,
          },
          "dist/commonjs/hello.js": {
            hash: "b",
            sizeMap: {
              raw: 187000,
              gzip: 1800,
              brotli: 1700,
            },
            meta: true,
          },
        },
      },
      "dist/systemjs": {
        fileMap: {
          "dist/systemjs/foo.js": {
            hash: "a",
            sizeMap: {
              raw: 120,
              gzip: 12,
              brotli: 11,
            },
            meta: true,
          },
          "dist/systemjs/hello.js": {
            hash: "b",
            sizeMap: {
              raw: 187000,
              gzip: 1800,
              brotli: 1700,
            },
            meta: true,
          },
        },
      },
    },
  }),
  "zero size impact": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "a",
            sizeMap: { raw: 300 },
            meta: true,
          },
          "dist/foo.js": {
            hash: "a",
            sizeMap: { raw: 2500 },
            meta: true,
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "b",
            sizeMap: { raw: 315 },
            meta: true,
          },
          "dist/foo.js": {
            hash: "b",
            sizeMap: { raw: 2500 },
            meta: true,
          },
        },
      },
    },
  }),
  "zero size impact and cacheImpact enabled": generateComment({
    cacheImpact: true,
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "a",
            sizeMap: { raw: 300 },
            meta: true,
          },
          "dist/foo.js": {
            hash: "a",
            sizeMap: { raw: 2500 },
            meta: true,
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "b",
            sizeMap: { raw: 315 },
            meta: true,
          },
          "dist/foo.js": {
            hash: "b",
            sizeMap: { raw: 2500 },
            meta: true,
          },
        },
      },
    },
  }),
  "cache impact + several cache impact": generateComment({
    cacheImpact: true,
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "a",
            sizeMap: { raw: 100 },
            meta: true,
          },
          "dist/hello.js": {
            hash: "a",
            sizeMap: { raw: 100 },
            meta: true,
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/foo.js": {
            hash: "a",
            sizeMap: { raw: 100 },
            meta: true,
          },
          "dist/bar.js": {
            hash: "b",
            sizeMap: { raw: 110 },
            meta: true,
          },
          "dist/hello.js": {
            hash: "b",
            sizeMap: { raw: 110 },
            meta: true,
          },
        },
      },
    },
  }),
  "size impact 0/1": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "a",
            sizeMap: { raw: 100 },
            meta: true,
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "b",
            sizeMap: { raw: 101 },
            meta: {
              showSizeImpact: ({ sizeImpactMap }) => Math.abs(sizeImpactMap.raw) > 10,
            },
          },
        },
      },
    },
  }),
  "size impact 1/2": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "a",
            sizeMap: { raw: 100 },
            meta: true,
          },
          "dist/foo.js": {
            hash: "a",
            sizeMap: { raw: 101 },
            meta: true,
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "b",
            sizeMap: { raw: 101 },
            meta: {
              showSizeImpact: ({ sizeImpactMap }) => Math.abs(sizeImpactMap.raw) > 10,
            },
          },
          "dist/foo.js": {
            hash: "b",
            sizeMap: { raw: 115 },
            meta: true,
          },
        },
      },
    },
  }),
  "empty warning": generateComment({
    baseSnapshot: {},
    afterMergeSnapshot: {},
  }),
}

const exampleFileUrl = resolveUrl("./comment-example.md", import.meta.url)
const exampleFileContent = Object.keys(examples).map((exampleName) => {
  return `# ${exampleName}

${examples[exampleName]}`
}).join(`

`)

export const promise = writeFile(
  exampleFileUrl,
  `${exampleFileContent}
`,
)
