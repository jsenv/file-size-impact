import { writeFile, resolveUrl } from "@jsenv/util"
import { generatePullRequestCommentString } from "../src/internal/generatePullRequestCommentString.js"

const examples = {
  "basic": generatePullRequestCommentString({
    pullRequestBase: "base",
    pullRequestHead: "head",
    snapshotComparison: {
      dist: {
        "bar.js": {
          base: {
            sizeMap: {
              none: 100,
            },
            hash: "a",
          },
          head: {
            sizeMap: {
              none: 110,
            },
            hash: "b",
          },
        },
      },
    },
  }),
  "introduce gzip": generatePullRequestCommentString({
    pullRequestBase: "base",
    pullRequestHead: "head",
    snapshotComparison: {
      dist: {
        "bar.js": {
          base: {
            sizeMap: {
              none: 100,
            },
            hash: "a",
          },
          head: {
            sizeMap: {
              none: 110,
              gzip: 10,
            },
            hash: "b",
          },
        },
      },
    },
  }),
  "remove gzip": generatePullRequestCommentString({
    pullRequestBase: "base",
    pullRequestHead: "head",
    snapshotComparison: {
      dist: {
        "bar.js": {
          base: {
            sizeMap: {
              none: 100,
              gzip: 10,
            },
            hash: "a",
          },
          head: {
            sizeMap: {
              none: 110,
            },
            hash: "b",
          },
        },
      },
    },
  }),
  "multiple + gzip + brotli": generatePullRequestCommentString({
    pullRequestBase: "base",
    pullRequestHead: "head",
    snapshotComparison: {
      "dist/commonjs": {
        "bar.js": {
          base: {
            sizeMap: {
              none: 100,
              gzip: 10,
              brotli: 9,
            },
            hash: "a",
          },
          head: null,
        },
        "foo.js": {
          base: null,
          head: {
            sizeMap: {
              none: 120,
              gzip: 12,
              brotli: 11,
            },
            hash: "a",
          },
        },
        "hello.js": {
          base: {
            sizeMap: {
              none: 167000,
              gzip: 1600,
              brotli: 1500,
            },
            hash: "a",
          },
          head: {
            sizeMap: {
              none: 187000,
              gzip: 1800,
              brotli: 1700,
            },
            hash: "b",
          },
        },
      },
      "dist/systemjs": {
        "bar.js": {
          base: {
            sizeMap: {
              none: 100,
              gzip: 10,
              brotli: 9,
            },
            hash: "a",
          },
          head: null,
        },
        "foo.js": {
          base: null,
          head: {
            sizeMap: {
              none: 120,
              gzip: 12,
              brotli: 11,
            },
            hash: "a",
          },
        },
        "hello.js": {
          base: {
            sizeMap: {
              none: 167000,
              gzip: 1600,
              brotli: 1500,
            },
            hash: "a",
          },
          head: {
            sizeMap: {
              none: 187000,
              gzip: 1800,
              brotli: 1700,
            },
            hash: "b",
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

writeFile(
  exampleFileUrl,
  `${exampleFileContent}
`,
)
