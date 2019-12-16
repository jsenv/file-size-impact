# Github pull request filesize impact

[![github package](https://img.shields.io/github/package-json/v/jsenv/jsenv-github-pull-request-filesize-impact.svg?label=package&logo=github)](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact/packages)
[![npm package](https://img.shields.io/npm/v/@jsenv/github-pull-request-filesize-impact.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/github-pull-request-filesize-impact)
[![workflow status](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact/workflows/ci/badge.svg)](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact/actions?workflow=ci)
[![codecov](https://codecov.io/gh/jsenv/jsenv-github-pull-request-filesize-impact/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-github-pull-request-filesize-impact)

## Table of contents

- [Presentation](#Presentation)
- [Usage](#Usage)
- [Usage outside github workflow](#usage-outside-github-workflow)

## Presentation

`@jsenv/github-pull-request-filesize-impact` comment your pull request on github to see the impact of changes on a folder size.

The screenshot below was taken inside a githug pull request to give you a better idea of the final result.

![screenshot of pull request comment](./docs/screenshot-of-pull-request-comment.png)

There is also a comment example visible at [./docs/comment-example.md](./docs/comment-example.md)

## Usage

Waiting for a proper documentation you can check `pull request size impact` step in [.github/workflows/ci.yml](./.github/workflows/ci.yml)

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
  projectDirectoryUrl: __dirname,
})
```

Be sure `githubToken` has the right to read/write comments on issues.

The rest of the configuration is up to you depending on your continuous environment.
