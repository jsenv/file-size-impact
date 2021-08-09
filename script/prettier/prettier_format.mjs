import { formatWithPrettier } from "@jsenv/prettier-check-project"

import * as jsenvConfig from "../../jsenv.config.mjs"

formatWithPrettier({
  ...jsenvConfig,
})
