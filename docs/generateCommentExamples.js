import { writeFile, resolveUrl } from "@jsenv/util"
import { generatePullRequestCommentString } from "../src/internal/generatePullRequestCommentString.js"

const examples = {
  "multiple + gzip + brotli": generatePullRequestCommentString({
    pullRequestBase: "base",
    pullRequestHead: "head",
    snapshotComparison: {
      "dist/commonjs": {
        "bar.js": {
          base: {
            size: 100,
            gzipSize: 10,
            brotliSize: 9,
            hash: "a",
          },
          head: null,
        },
        "foo.js": {
          base: null,
          head: {
            size: 120,
            gzipSize: 12,
            brotliSize: 11,
            hash: "a",
          },
        },
        "hello.js": {
          base: {
            size: 167,
            gzipSize: 16,
            brotliSize: 15,
            hash: "a",
          },
          head: {
            size: 187,
            gzipSize: 18,
            brotliSize: 17,
            hash: "b",
          },
        },
      },
      "dist/systemjs": {
        "bar.js": {
          base: {
            size: 100,
            gzipSize: 10,
            brotliSize: 9,
            hash: "a",
          },
          head: null,
        },
        "foo.js": {
          base: null,
          head: {
            size: 120,
            gzipSize: 12,
            brotliSize: 11,
            hash: "a",
          },
        },
        "hello.js": {
          base: {
            size: 167,
            gzipSize: 16,
            brotliSize: 15,
            hash: "a",
          },
          head: {
            size: 187,
            gzipSize: 18,
            brotliSize: 17,
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

writeFile(exampleFileUrl, exampleFileContent)
