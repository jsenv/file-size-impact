# Table of contents

- [reportFileSizeImpact](#reportFileSizeImpact)
  - [logLevel](#loglevel)
  - [projectDirectoryUrl](#projectDirectoryUrl)
  - [trackingConfig](#trackingConfig)
  - [transformations](#transformations)
  - [manifestFilePattern](#manifestFilePattern)
  - [commentSections](#commentSections)
  - [runLink](#runLink)
  - [formatSize](#formatSize)

# reportFileSizeImpact

`reportFileSizeImpact` is an async function that will generate file size impact analysis on a pull request and post a comment with the result of this analysis.

```js
import { reportFileSizeImpact, none } from "@jsenv/file-size-impact"

await reportFileSizeImpact({
  logLevel: "info",
  projectDirectoryUrl: "file:///directory",
  githubToken: "xxx",
  repositoryOwner: "jsenv",
  repositoryName: "jsenv-file-size-impact",
  pullRequestNumber: 10,
  installCommand: "npm install",
  buildCommand: "npm run build",
  trackingConfig: {
    "./dist/**/*.js": true,
  },
  manifestFilePattern: "./**/manifest.json",
  transformations: { none },
  commentSections: {
    overallSizeImpact: true,
    detailedSizeImpact: true,
    cacheImpact: true,
  },
  generatedByLink: true,
})
```

## logLevel

`logLevel` parameter controls verbosity of logs during the function execution.

The list of available logLevel values can be found on [@jsenv/logger documentation](https://github.com/jsenv/jsenv-logger#list-of-log-levels)

## projectDirectoryUrl

`projectDirectoryUrl` parameter is a string leading to your project root directory. This parameter is **required**.

## trackingConfig

`trackingConfig` parameter is an object used to configure group of files you want to track. This parameter is optional with a default value exported in [src/jsenvTrackingConfig.js](./src/jsenvTrackingConfig.js)

`trackingConfig` keys are group names that will appear in the generated comment.
`trackingConfig` values are `specifierMetaMap` as documented in https://github.com/jsenv/jsenv-url-meta#normalizespecifiermetamap.

For every group you track there will be a corresponding line in the generated pull request comment as visible in [docs/comment-example.md](./comment-example.md)

For example you can create two groups like this:

```js
const trackingConfig = {
  whatever: {
    "./dist/whatever/**/*.js": true,
  },
  dist: {
    "./dist/**/*.js": true,
    "./dist/whatever/**/*.js": false,
  },
}
```

And the generated comment will have two expandable section.

<details>
  <summary>whatever</summary>
  Analysis for files matching whatever group
</details>

<details>
  <summary>dist</summary>
  Analysis for files matching dist group
</details>

## transformations

`transformations` parameter is an object used to transform files content before computing their size. This parameter is optional with a default tracking file size without transformation called `none`.

You can use this parameter to track file size after gzip compression.

```js
import {
  reportFileSizeMergeImpact,
  readGithubWorkflowEnv,
  none,
  gzip,
  brotli,
} from "@jsenv/github-pull-request-filesize-impact"

reportFileSizeMergeImpact({
  ...readGithubWorkflowEnv(),
  transformations: { none, gzip, brotli },
})
```

And the pull request comment now contains gzip size. Check [docs/comment-example.md#basic-example--gzip--brotli](./comment-example.md#basic-example--gzip--brotli) to see how it looks like. `none`, `gzip` and `brotli` compression can be enabled this way.

It's also possible to control compression level.

```js
import { none, gzip } from "@jsenv/file-size-impact"

const transformations = {
  none,
  gzip7: (buffer) => gzip(buffer, { level: 7 }),
  gzip9: (buffer) => gzip(buffer, { level: 9 }),
}
```

Finally `transformations` can be used to add custom transformations.

```js
import { none, gzip } from "@jsenv/file-size-impact"

const transformations = {
  none,
  trim: (buffer) => String(buffer).trim(),
}
```

## manifestFilePattern

`manifestFilePattern` parameter is a string controlling if a manifest json file will be taken into account when generating snapshot. The parameter also control the name of the manifest file. This parameter is optional with a default value of `./**/manifest.json`.

Manifest where introduced by webpack in https://github.com/danethurber/webpack-manifest-plugin. There is the equivalent for rollup at https://github.com/shuizhongyueming/rollup-plugin-output-manifest.

The concept is to be able to remap generated file like `file.4798774987w97er984798.js` back to `file.js`.

Without this, comparison of directories accross branches would consider generated files as always new because of their dynamic names.

## commentSections

`commentSections` parameter is an object controlling which comment sections are enabled and their order. This parameter is optionnal and enable `groupImpact`, `fileByFileImpact` and `cacheImpact` section in that order. Check [docs/comment-example.md#basic-example](./comment-example.md#basic-example) to see the comment sections.

You can control sections order because it follow `commentSections` keys order. You can also control which section are enabled at all. For instance [docs/comment-example.md#overall-size-disabled-detailed-size-enabled-cache-disabled](./comment-example.md#overall-size-disabled-detailed-size-enabled-cache-disabled) can be generated by passing `commentSections` below.

```js
const commentSections = { detailedSizeImpact: true }
```

> This parameter could be an array. Using an object was decided in case each section becomes configurable in the future.

## runLink

TODO

## formatSize

`formatSize` parameter controls the display of file size. This parameter is optionnal, the default value doing an english formatting of a number. Check source code if you want to pass a custom function.
