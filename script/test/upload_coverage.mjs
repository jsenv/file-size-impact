/*
 * This file is executed by "upload coverage" step in .github/workflows/main.yml
 */

import { uploadCoverage } from "@jsenv/codecov-upload"

import * as jsenvConfig from "../../jsenv.config.mjs"

uploadCoverage({
  ...jsenvConfig,
})
