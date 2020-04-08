import { writeFile, resolveUrl } from "@jsenv/util"
import { jsenvFormatSize } from "../src/internal/jsenvFormatSize.js"
import { generatePullRequestCommentString } from "../src/internal/generatePullRequestCommentString.js"

const generateComment = (data) =>
  generatePullRequestCommentString({
    pullRequestBase: "base",
    pullRequestHead: "head",
    formatSize: jsenvFormatSize,
    commentSections: { groupImpact: true, fileByFileImpact: true, cacheImpact: true },
    ...data,
  })

const examples = {
  "basic example": generateComment({
    baseVersionnedSnapshot: {
      snapshot: {
        dist: {
          fileMap: {
            "dist/bar.js": { hash: "a", sizeMap: { none: 100 } },
          },
        },
      },
    },
    headVersionnedSnapshot: {
      snapshot: {
        dist: {
          fileMap: {
            "dist/bar.js": { hash: "b", sizeMap: { none: 110 } },
          },
        },
      },
    },
  }),
  "no changes": generateComment({
    baseVersionnedSnapshot: {
      snapshot: {
        dist: {
          fileMap: {
            "dist/bar.js": { hash: "a", sizeMap: { none: 110 } },
          },
        },
      },
    },
    headVersionnedSnapshot: {
      snapshot: {
        dist: {
          fileMap: {
            "dist/bar.js": { hash: "a", sizeMap: { none: 110 } },
          },
        },
      },
    },
  }),
  "changes impact cancels each other": generateComment({
    baseVersionnedSnapshot: {
      snapshot: {
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
    },
    headVersionnedSnapshot: {
      snapshot: {
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
    },
  }),
  "introduce gzip": generateComment({
    baseVersionnedSnapshot: {
      snapshot: {
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
    },
    headVersionnedSnapshot: {
      snapshot: {
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
    },
  }),
  "remove gzip": generateComment({
    baseVersionnedSnapshot: {
      snapshot: {
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
    },
    headVersionnedSnapshot: {
      snapshot: {
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
    },
  }),
  "multiple + gzip + brotli": generateComment({
    baseVersionnedSnapshot: {
      snapshot: {
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
    },
    headVersionnedSnapshot: {
      snapshot: {
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
    },
  }),
  "group disabled, filebyfile enabled, cache disabled": generateComment({
    commentSections: { fileByFileImpact: true },
    baseVersionnedSnapshot: {
      snapshot: {
        dist: {
          fileMap: {
            "dist/bar.js": { hash: "a", sizeMap: { none: 100 } },
          },
        },
      },
    },
    headVersionnedSnapshot: {
      snapshot: {
        dist: {
          fileMap: {
            "dist/bar.js": { hash: "b", sizeMap: { none: 110 } },
          },
        },
      },
    },
  }),
  "filebyfile enabled, group enabled, cache disabled": generateComment({
    commentSections: { fileByFileImpact: true, groupImpact: true },
    baseVersionnedSnapshot: {
      snapshot: {
        dist: {
          fileMap: {
            "dist/bar.js": { hash: "a", sizeMap: { none: 100 } },
          },
        },
      },
    },
    headVersionnedSnapshot: {
      snapshot: {
        dist: {
          fileMap: {
            "dist/bar.js": { hash: "b", sizeMap: { none: 110 } },
          },
        },
      },
    },
  }),
  "base missing warning": generateComment({
    baseVersionnedSnapshot: {},
    headVersionnedSnapshot: {
      snapshot: {
        dist: {
          fileMap: {
            "dist/bar.js": { hash: "b", sizeMap: { none: 110 } },
          },
        },
      },
    },
  }),
  "empty warning": generateComment({
    baseVersionnedSnapshot: {
      snapshot: {},
    },
    headVersionnedSnapshot: {
      snapshot: {},
    },
  }),
  "base version too different warning": generateComment({
    baseVersionnedSnapshot: {
      version: 1,
      snapshot: {
        dist: {
          fileMap: {
            "dist/bar.js": { hash: "a", sizeMap: { none: 100 } },
          },
        },
      },
    },
    headVersionnedSnapshot: {
      version: 2,
      snapshot: {
        dist: {
          fileMap: {
            "dist/bar.js": { hash: "b", sizeMap: { none: 110 } },
          },
        },
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

export const promise = writeFile(
  exampleFileUrl,
  `${exampleFileContent}
`,
)
