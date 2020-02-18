# github-pull-request-filesize-impact

Monitor pull request impact on file sizes.

[![github package](https://img.shields.io/github/package-json/v/jsenv/jsenv-github-pull-request-filesize-impact.svg?label=package&logo=github)](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact/packages)
[![npm package](https://img.shields.io/npm/v/@jsenv/github-pull-request-filesize-impact.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/github-pull-request-filesize-impact)
[![workflow status](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact/workflows/ci/badge.svg)](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact/actions?workflow=ci)
[![codecov](https://codecov.io/gh/jsenv/jsenv-github-pull-request-filesize-impact/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-github-pull-request-filesize-impact)

# Table of contents

- [Presentation](#Presentation)
- [Installation](#Installation)
- [Usage inside github workflow](#Usage-inside-github-workflow)
- [Usage outside github workflow](#Usage-outside-github-workflow)
- [generateSnapshotFile](#generateSnapshotFile)
  - [projectDirectoryUrl](#projectDirectoryUrl)
  - [logLevel](#loglevel)
  - [directorySizeTrackingConfig](#directorySizeTrackingConfig)
  - [manifest](#manifest)
- [reportSizeImpactIntoGithubPullRequest](#reportSizeImpactIntoGithubPullRequest)
  - [projectDirectoryUrl](#projectDirectoryUrl)
  - [logLevel](#loglevel)
  - [baseSnapshotFileRelativeUrl](#baseSnapshotFileRelativeUrl)
  - [headSnapshotFileRelativeUrl](#headSnapshotFileRelativeUrl)
  - [formatSize](#formatsize)
  - [generatedByLink](#generatedByLink)

# Presentation

`@jsenv/github-pull-request-filesize-impact` comment your pull request on github to see the impact of changes on specific file sizes.

The screenshot below shows how it is integrated to a github pull request.

![screenshot of pull request comment](./docs/screenshot-of-pull-request-comment.png)

# Installation

```console
npm install --save-dev @jsenv/github-pull-request-filesize-impact@2.5.0
```

# Usage inside github workflow

You can see how this can be integrated in a github workflow at
— see [.github/workflows/ci.yml#pull-request-size-impact](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact/blob/6edbd6f7b32d10f674140c45d14946765955598f/.github/workflows/ci.yml#L39)

# Usage outside github workflow

You can set process.env variables required by `reportSizeImpactIntoGithubPullRequest` yourself to use it outside a github workflow.

The code below shows what process.env should exists to use `reportSizeImpactIntoGithubPullRequest`.

```js
const {
  reportSizeImpactIntoGithubPullRequest,
} = require("@jsenv/github-pull-request-filesize-impact")

const githubToken = "github-personnal-access-token"
const githubRepository = "repository-owner/repository-name"
const pullRequestNumber = 1
const pullRequestRef = "pr-name"

process.env.GITHUB_EVENT_NAME = "pull_request"
process.env.GITHUB_REPOSITORY = githubRepository
process.env.GITHUB_REF = `refs/pull/${pullRequestNumber}/merge`
process.env.GITHUB_BASE_REF = "master"
process.env.GITHUB_HEAD_REF = pullRequestRef
process.env.GITHUB_TOKEN = githubToken

reportSizeImpactIntoGithubPullRequest({
  projectDirectoryUrl: __dirname,
})
```

If you where inside travis you would write `process.env.GITHUB_REPOSITORY = process.env.TRAVIS_REPO_SLUG`. As documented in https://docs.travis-ci.com/user/environment-variables/#default-environment-variables

The exact code to write is up to you according to your execution environment.

Also be sure `githubToken` has the right to read/write comments on issues.

# generateSnapshotFile

`generateSnapshotFile` is an async function analysing file sizes per directory and saving the result into a json file.

```js
import { generateSnapshotFile } from "@jsenv/github-pull-request-filesize-impact"

await generateSnapshotFile({
  projectDirectoryUrl: "file:///directory",
  directorySizeTrackingConfig: {
    dist: {
      "./**/*.js": true,
    },
  },
  snapshotFileRelativeUrl: "./size-snapshot.json",
})
```

— source code at [src/generateSnapshotFile.js](./src/generateSnapshotFile.js).

## projectDirectoryUrl

`projectDirectoryUrl` parameter is a string leading to your project root directory. This parameter is **required**.

## logLevel

`logLevel` parameter controls verbosity of logs during the function execution.

The list of available logLevel values can be found on [@jsenv/logger documentation](https://github.com/jsenv/jsenv-logger#list-of-log-levels)

## directorySizeTrackingConfig

`directorySizeTrackingConfig` parameter is an object used to configure directories and files you want to track. This parameter is optional with a default value exported in [src/jsenvDirectorySizeTrackingConfig.js](../src/jsenvDirectorySizeTrackingConfig.js)

`directorySizeTrackingConfig` keys are urls relative to your `projectDirectoryUrl`. These relative urls leads to the directory you want to track.
`directorySizeTrackingConfig` values are `specifierMetaMap` as documented in https://github.com/jsenv/jsenv-url-meta#normalizespecifiermetamap.

For every directory you track there will be a corresponding line in the generated pull request comment as visible in [docs/comment-example.md](./docs/comment-example.md)

## manifest

`manifest` parameter is a boolean controlling if a manifest json file will be taken into account when generating snapshot. This parameter is optional with a default value of `true`.

Manifest where introduced by webpack in https://github.com/danethurber/webpack-manifest-plugin. There is the equivalent for rollup at https://github.com/shuizhongyueming/rollup-plugin-output-manifest.

The concept is to be able to remap generated file like `file.4798774987w97er984798.js` back to `file.js`.

Without this, comparison of directories accross branches would consider generated files as always new because of their dynamic names.

## manifestFileRelativeUrl

`manifestFileRelativeUrl` parameter is a string used to find the manifest json file. This parameter is optional with a default value of `"./manifest.json"`.

# reportSizeImpactIntoGithubPullRequest

`reportSizeImpactIntoGithubPullRequest` is an async function comparing two directory snapshots and commenting a github pull request with the comparison result.

```js
import { reportSizeImpactIntoGithubPullRequest } from "@jsenv/github-pull-request-filesize-impact"

await reportSizeImpactIntoGithubPullRequest({
  projectDirectoryUrl: "file:///directory",
  baseSnapshotFileRelativeUrl: "../snapshot.base.json",
  headSnapshotFileRelativeUrl: "../snapshot.head.json",
  logLevel: "info",
  generatedByLink: true,
})
```

— source code at [src/reportSizeImpactIntoGithubPullRequest.js](./src/reportSizeImpactIntoGithubPullRequest.js).

## baseSnapshotFileRelativeUrl

`baseSnapshotFileRelativeUrl` parameter is a string leading to the base snapshot file. This parameter is **required**.

## headSnapshotFileRelativeUrl

`headSnapshotFileRelativeUrl` parameter is a string leading to the head snapshot file. This parameter is **required**.

## formatSize

`formatSize` parameter controls the display of file size. This parameter is optionnal, the default value doing an english formatting of a number. Check source code if you want to pass a custom function.

## generatedByLink

`generatedByLink` parameter controls if pull request comment contains a generated by message. This parameter is optionnal and enabled by default. This parameter allows someone to understand where the pull request message comes from.
