import { writeFile, resolveUrl } from "@jsenv/util"
import { jsenvFormatSize } from "../src/internal/comment/jsenvFormatSize.js"
import { formatComment } from "../src/internal/comment/formatComment.js"

const generateComment = (data) =>
  formatComment({
    pullRequestBase: "base",
    pullRequestHead: "head",
    formatSize: jsenvFormatSize,
    commentSections: {
      overallSizeImpact: true,
      detailedSizeImpact: true,
      cacheImpact: true,
    },
    generatedByLink: true,
    ...data,
  })

const examples = {
  "basic example": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "a", sizeMap: { none: 100 } },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "b", sizeMap: { none: 110 } },
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
            sizeMap: { none: 100, gzip: 20, brotli: 18 },
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "b",
            sizeMap: { none: 110, gzip: 22, brotli: 19 },
          },
        },
      },
    },
  }),
  "no changes": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "a", sizeMap: { none: 110 } },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "a", sizeMap: { none: 110 } },
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
  "changes impact cancels each other": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/file-a.js": {
            hash: "hash1",
            sizeMap: { none: 10 },
          },
          "dist/file-b.js": {
            hash: "hash3",
            sizeMap: { none: 15 },
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/file-a.js": {
            hash: "hash2",
            sizeMap: { none: 15 },
          },
          "dist/file-b.js": {
            hash: "hash4",
            sizeMap: { none: 10 },
          },
        },
      },
    },
  }),
  "introduce gzip": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "a",
            sizeMap: {
              none: 100,
            },
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "b",
            sizeMap: {
              none: 110,
              gzip: 10,
            },
          },
        },
      },
    },
  }),
  "remove gzip": generateComment({
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "a",
            sizeMap: {
              none: 100,
              gzip: 10,
            },
          },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": {
            hash: "b",
            sizeMap: {
              none: 110,
            },
          },
        },
      },
    },
  }),
  "multiple + gzip + brotli": generateComment({
    baseSnapshot: {
      "dist/commonjs": {
        fileMap: {
          "dist/commonjs/bar.js": {
            hash: "a",
            sizeMap: {
              none: 100,
              gzip: 10,
              brotli: 9,
            },
          },
          "dist/commonjs/hello.js": {
            hash: "a",
            sizeMap: {
              none: 167000,
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
              none: 100,
              gzip: 10,
              brotli: 9,
            },
          },
          "dist/systemjs/hello.js": {
            hash: "a",
            sizeMap: {
              none: 167000,
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
              none: 120,
              gzip: 12,
              brotli: 11,
            },
          },
          "dist/commonjs/hello.js": {
            hash: "b",
            sizeMap: {
              none: 187000,
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
              none: 120,
              gzip: 12,
              brotli: 11,
            },
          },
          "dist/systemjs/hello.js": {
            hash: "b",
            sizeMap: {
              none: 187000,
              gzip: 1800,
              brotli: 1700,
            },
          },
        },
      },
    },
  }),
  "overall size disabled, detailed size enabled, cache disabled": generateComment({
    commentSections: { detailedSizeImpact: true },
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "a", sizeMap: { none: 100 } },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "b", sizeMap: { none: 110 } },
        },
      },
    },
  }),
  "detailed size enabled, overall size enabled, cache disabled": generateComment({
    commentSections: { detailedSizeImpact: true, overallSizeImpact: true },
    baseSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "a", sizeMap: { none: 100 } },
        },
      },
    },
    afterMergeSnapshot: {
      dist: {
        fileMap: {
          "dist/bar.js": { hash: "b", sizeMap: { none: 110 } },
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
