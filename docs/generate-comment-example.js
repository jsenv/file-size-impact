import { writeFile, resolveUrl } from "@jsenv/util"
import { jsenvCommentParameters } from "@jsenv/file-size-impact/src/jsenvCommentParameters.js"
import { formatComment } from "@jsenv/file-size-impact/src/internal/comment/formatComment.js"

const generateComment = (data) => {
  const transformations = deduceTransformations(data)
  return formatComment({
    pullRequestBase: "base",
    pullRequestHead: "head",
    cacheImpact: false,
    transformations,
    ...jsenvCommentParameters,
    ...data,
  })
}

const deduceTransformations = ({ beforeMergeSnapshot, afterMergeSnapshot }) => {
  const beforeMergeKeys = Object.keys(beforeMergeSnapshot)
  if (beforeMergeKeys.length) {
    const beforeMergeFirstGroup = beforeMergeSnapshot[beforeMergeKeys[0]]
    const beforeMergeFileMap = beforeMergeFirstGroup.fileMap
    const files = Object.keys(beforeMergeFileMap)
    if (files.length) {
      return beforeMergeFileMap[files[0]].sizeMap
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
    beforeMergeSnapshot: {
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
    beforeMergeSnapshot: {
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
    beforeMergeSnapshot: {
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
    beforeMergeSnapshot: {
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
    beforeMergeSnapshot: {
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
  "realist (two groups + gzip + partial)": generateComment({
    beforeMergeSnapshot: {
      "critical files": {
        fileMap: {
          "dist/foo.js": {
            hash: "a",
            sizeMap: {
              raw: 78450,
              gzip: 32569,
            },
            meta: true,
          },
          "dist/bar.js": {
            hash: "a",
            sizeMap: {
              raw: 45450,
              gzip: 23532,
            },
            meta: true,
          },
        },
      },
      "remaining files": {
        fileMap: {
          "dist/feature.js": {
            hash: "a",
            sizeMap: {
              raw: 17450,
              gzip: 9532,
            },
            meta: true,
          },
          "dist/a.js": {
            hash: "a",
            sizeMap: {
              raw: 17450,
              gzip: 9532,
            },
            meta: true,
          },
          "dist/b.js": {
            hash: "a",
            sizeMap: {
              raw: 17450,
              gzip: 9532,
            },
            meta: true,
          },
          "dist/c.js": {
            hash: "a",
            sizeMap: {
              raw: 17450,
              gzip: 9532,
            },
            meta: true,
          },
          "dist/d.js": {
            hash: "a",
            sizeMap: {
              raw: 17450,
              gzip: 9532,
            },
            meta: true,
          },
        },
      },
    },
    afterMergeSnapshot: {
      "critical files": {
        fileMap: {
          "dist/foo.js": {
            hash: "b",
            sizeMap: {
              raw: 85450,
              gzip: 36569,
            },
            meta: true,
          },
          "dist/bar.js": {
            hash: "a",
            sizeMap: {
              raw: 45450,
              gzip: 23532,
            },
            meta: true,
          },
        },
      },
      "remaining files": {
        fileMap: {
          "dist/feature.js": {
            hash: "b",
            sizeMap: {
              raw: 21560,
              gzip: 12472,
            },
            meta: true,
          },
          "dist/a.js": {
            hash: "a",
            sizeMap: {
              raw: 17450,
              gzip: 9532,
            },
            meta: true,
          },
          "dist/b.js": {
            hash: "a",
            sizeMap: {
              raw: 17450,
              gzip: 9532,
            },
            meta: true,
          },
          "dist/c.js": {
            hash: "a",
            sizeMap: {
              raw: 17450,
              gzip: 9532,
            },
            meta: true,
          },
          "dist/d.js": {
            hash: "a",
            sizeMap: {
              raw: 17450,
              gzip: 9532,
            },
            meta: true,
          },
        },
      },
    },
  }),
  "two groups + gzip + brotli": generateComment({
    beforeMergeSnapshot: {
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
    beforeMergeSnapshot: {
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
    beforeMergeSnapshot: {
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
    beforeMergeSnapshot: {
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
    beforeMergeSnapshot: {
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
    beforeMergeSnapshot: {
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
  "formating file relative url": generateComment({
    beforeMergeSnapshot: {
      dist: {
        fileMap: {
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
          "dist/foo.js": {
            hash: "b",
            sizeMap: { raw: 115 },
            meta: {
              formatFileRelativeUrl: (relativeUrl) => relativeUrl.slice("dist/".length),
            },
          },
        },
      },
    },
  }),
  "empty warning": generateComment({
    beforeMergeSnapshot: {},
    afterMergeSnapshot: {},
  }),
  "new file + showSizeImpact": generateComment({
    beforeMergeSnapshot: {
      dist: {
        fileMap: {},
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/foo.js": {
            hash: "a",
            sizeMap: { raw: 110 },
            meta: {
              showSizeImpact: () => true,
            },
          },
        },
      },
    },
  }),
  "deleted file + showSizeImpact": generateComment({
    beforeMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/foo.js": {
            hash: "a",
            sizeMap: { raw: 110 },
            meta: {
              showSizeImpact: () => true,
            },
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {},
      },
    },
  }),
}

const exampleFileUrl = resolveUrl("./comment-example.md", import.meta.url)
const exampleFileContent = Object.keys(examples).map((exampleName) => {
  return `# ${exampleName}

${examples[exampleName]}`
}).join(`

`)

await writeFile(
  exampleFileUrl,
  `${exampleFileContent}
`,
)
