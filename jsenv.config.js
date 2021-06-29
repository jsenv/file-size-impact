/*
 *
 * This file exports configuration reused by jsenv scripts such as
 *
 * script/test/test.js
 * script/build/build.js
 *
 * Read more at https://github.com/jsenv/jsenv-core#jsenvconfigjs
 *
 */

export const projectDirectoryUrl = String(new URL("./", import.meta.url))
