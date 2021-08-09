/**

Two things happens here:

The script generates ./importmap.dev.importmap file that will be used by ESLint
to resolve imports.

The script also update "paths" in ./jsconfig.json that will be used by VSCode
to resolve imports.

*/

import { getImportMapFromProjectFiles, writeImportMapFile } from "@jsenv/importmap-node-module"

import { projectDirectoryUrl } from "../../jsenv.config.mjs"

await writeImportMapFile(
  [
    getImportMapFromProjectFiles({
      projectDirectoryUrl,
      runtime: "node",
      dev: true,
    }),
  ],
  {
    projectDirectoryUrl,
    importMapFileRelativeUrl: "./importmap.dev.importmap",
    jsConfigFile: true,
  },
)
