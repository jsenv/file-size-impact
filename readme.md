# Github pull request filesize impact

[![github package](https://img.shields.io/github/package-json/v/jsenv/jsenv-github-pull-request-filesize-impact.svg?label=package&logo=github)](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact/packages)
[![workflow status](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact/workflows/continuous%20testing/badge.svg)](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact/actions?workflow=continuous+testing)
[![codecov](https://codecov.io/gh/jsenv/jsenv-github-pull-request-filesize-impact/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-github-pull-request-filesize-impact)

## Table of contents

- [Installation](#installation)
  - [Step 1 - Install package](#step-1---install-package)
  - [Step 2 - Enable github actions](#step-2---enable-github-actions)
  - [Step 3 - Add script](#step-3---add-script)
  - [Step 4 - Add github workflow](#step-4---add-github-worflow)
- [Usage outside github workflow](#usage-outside-github-workflow)

## Introduction

`@jsenv/github-pull-request-filesize-impact` comment your pull request on github to see the impact of changes on a folder size.

The screenshot below was taken inside a githug pull request to give you a better idea of the final result.

![screenshot of pull request comment](./docs/screenshot-of-pull-request-comment.png)

There is also a comment example visible at [./docs/comment-example.md](./docs/comment-example.md)

## Installation

The steps below explains how to install continuous size reporting in your github repository relying on github actions.

### Step 1 - Install package

If you never installed a jsenv package, read [Installing a jsenv package](https://github.com/jsenv/jsenv-core/blob/master/docs/installing-jsenv-package.md#installing-a-jsenv-package) before going further.

This documentation is up-to-date with a specific version so prefer any of the following commands

```console
npm install --save-dev @jsenv/github-pull-request-filesize-impact@1.1.0
```

```console
yarn add --dev @jsenv/github-pull-request-filesize-impact@1.1.0
```

### Step 2 - Enable github actions

— see [https://github.com/features/actions](https://github.com/features/actions)

### Step 3 - Add script

In your project, create a file like [./script/report-size-impact/report-size-impact.js](./script/report-size-impact/report-size-impact.js)

You can put this file anywhere in your project because you will specify its location in the next step.

As you can see we are using a function named `reportSizeImpactIntoGithubPullRequest`.<br />
See [api documentation](./docs/api.md) to get more information about it.

### Step 4 - Add github worflow

In your project, create a worflow that looks like [./.github/workflows/github-pull-request-filesize-impact.yml](./.github/workflows/github-pull-request-filesize-impact.yml)

The worflow above assumes that:

- you want to watch size of `dist/**`
- `npm run dist` generates a fresh `dist/` folder
- the script is located at `./script/report-size-impact/report-size-impact.js`

Don't forget to change this to your own needs.

## Usage outside github workflow

You can use the following pattern to use this repository outside a github workflow like travis or jenkins.

```js
const {
  reportSizeImpactIntoGithubPullRequest,
} = require("@jsenv/github-pull-request-filesize-impact")

const githubToken = "github-personnal-access-token"
const githubRepository = "jsenv/repository-name"
const pullRequestNumber = 1
const pullRequestRef = "pr-name"

process.env.GITHUB_EVENT_NAME = "pull_request"
process.env.GITHUB_REPOSITORY = githubRepository
process.env.GITHUB_REF = `refs/pull/${pullRequestNumber}/merge`
process.env.GITHUB_BASE_REF = "master"
process.env.GITHUB_HEAD_REF = pullRequestRef
process.env.GITHUB_TOKEN = githubToken

reportSizeImpactIntoGithubPullRequest({
  projectPath: __dirname,
})
```

Be sure `githubToken` has the right to read/write comments on issues.

The rest of the configuration is up to you depending on your continuous environment.
