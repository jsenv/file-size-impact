import { writeFile, resolveUrl } from "@jsenv/util"
import { jsenvFormatSize } from "../src/internal/comment/jsenvFormatSize.js"
import { formatComment } from "../src/internal/comment/formatComment.js"

const generateComment = (data) => {
  const transformations = deduceTransformations(data)
  return formatComment({
    pullRequestBase: "base",
    pullRequestHead: "head",
    formatSize: jsenvFormatSize,
    transformations,
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
          "dist/bar.js": { hash: "a", sizeMap: { raw: 100 } },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "b", sizeMap: { raw: 110 } },
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
          },
        },
      },
    },
  }),
  "no changes": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "a", sizeMap: { raw: 110 } },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "a", sizeMap: { raw: 110 } },
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
          },
          "dist/file-b.js": {
            hash: "hash3",
            sizeMap: { raw: 15 },
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
          },
          "dist/file-b.js": {
            hash: "hash4",
            sizeMap: { raw: 10 },
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
          },
          "dist/commonjs/hello.js": {
            hash: "a",
            sizeMap: {
              raw: 167000,
              gzip: 1600,
              brotli: 1500,
            },
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
          },
          "dist/systemjs/hello.js": {
            hash: "a",
            sizeMap: {
              raw: 167000,
              gzip: 1600,
              brotli: 1500,
            },
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
          },
          "dist/commonjs/hello.js": {
            hash: "b",
            sizeMap: {
              raw: 187000,
              gzip: 1800,
              brotli: 1700,
            },
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
          },
          "dist/systemjs/hello.js": {
            hash: "b",
            sizeMap: {
              raw: 187000,
              gzip: 1800,
              brotli: 1700,
            },
          },
        },
      },
    },
  }),
  "cache impact + 1 cache impact": generateComment({
    cacheImpact: true,
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/foo.js": { hash: "a", sizeMap: { raw: 100 } },
          "dist/bar.js": { hash: "a", sizeMap: { raw: 100 } },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "b", sizeMap: { raw: 110 } },
        },
      },
    },
  }),
  "cache impact + no cache impact": generateComment({
    cacheImpact: true,
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "a", sizeMap: { raw: 100 } },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {},
      },
    },
  }),
  "cache impact + several cache impact": generateComment({
    cacheImpact: true,
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "a", sizeMap: { raw: 100 } },
          "dist/hello.js": { hash: "a", sizeMap: { raw: 100 } },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/foo.js": { hash: "a", sizeMap: { raw: 100 } },
          "dist/bar.js": { hash: "b", sizeMap: { raw: 110 } },
          "dist/hello.js": { hash: "b", sizeMap: { raw: 110 } },
        },
      },
    },
  }),
  "detailed impact": generateComment({
    detailedSizeImpact: true,
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "a", sizeMap: { raw: 100 } },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "b", sizeMap: { raw: 110 } },
        },
      },
    },
  }),
  "detailed impact + groups + gzip + brotli": generateComment({
    detailedSizeImpact: true,
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
          },
          "dist/commonjs/hello.js": {
            hash: "a",
            sizeMap: {
              raw: 167000,
              gzip: 1600,
              brotli: 1500,
            },
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
          },
          "dist/systemjs/hello.js": {
            hash: "a",
            sizeMap: {
              raw: 167000,
              gzip: 1600,
              brotli: 1500,
            },
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
          },
          "dist/commonjs/hello.js": {
            hash: "b",
            sizeMap: {
              raw: 187000,
              gzip: 1800,
              brotli: 1700,
            },
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
          },
          "dist/systemjs/hello.js": {
            hash: "b",
            sizeMap: {
              raw: 187000,
              gzip: 1800,
              brotli: 1700,
            },
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
