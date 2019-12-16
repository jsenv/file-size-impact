import { dirname } from "path"
import { promisify } from "util"
import { unlink, mkdir, readFile, writeFile } from "fs"

const readFilePromisified = promisify(readFile)
export const readFileContent = async (filePath) => {
  const buffer = await readFilePromisified(filePath)
  return buffer.toString()
}

const writeFilePromisified = promisify(writeFile)
export const writeFileContent = async (filePath, content) => {
  await createFileDirectories(filePath)
  return writeFilePromisified(filePath, content)
}

export const removeFile = (filePath) =>
  new Promise((resolve, reject) => {
    unlink(filePath, (error) => {
      if (error) {
        if (error.code === "ENOENT") {
          resolve()
        } else {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  })

export const createFileDirectories = (filePath) => {
  return new Promise((resolve, reject) => {
    mkdir(dirname(filePath), { recursive: true }, (error) => {
      if (error) {
        if (error.code === "EEXIST") {
          resolve()
          return
        }
        reject(error)
        return
      }
      resolve()
    })
  })
}
