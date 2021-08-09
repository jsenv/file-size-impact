import { uploadCoverage } from "@jsenv/codecov-upload"

import * as jsenvConfig from "../../jsenv.config.mjs"

uploadCoverage({
  ...jsenvConfig,
})
