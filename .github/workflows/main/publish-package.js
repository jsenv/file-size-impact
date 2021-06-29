import { publishPackage } from "@jsenv/package-publish"

publishPackage({
  projectDirectoryUrl: new URL("../../../", import.meta.url),
  registriesConfig: {
    "https://registry.npmjs.org": {
      token: process.env.NPM_TOKEN,
    },
  },
})
