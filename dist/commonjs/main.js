'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var url$1 = require('url');
var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var util = require('util');
var module$1 = require('module');
require('net');
require('http');
require('https');
require('stream');

const LOG_LEVEL_OFF = "off";
const LOG_LEVEL_DEBUG = "debug";
const LOG_LEVEL_INFO = "info";
const LOG_LEVEL_WARN = "warn";
const LOG_LEVEL_ERROR = "error";

const createLogger = ({
  logLevel = LOG_LEVEL_INFO
} = {}) => {
  if (logLevel === LOG_LEVEL_DEBUG) {
    return {
      debug,
      info,
      warn,
      error
    };
  }

  if (logLevel === LOG_LEVEL_INFO) {
    return {
      debug: debugDisabled,
      info,
      warn,
      error
    };
  }

  if (logLevel === LOG_LEVEL_WARN) {
    return {
      debug: debugDisabled,
      info: infoDisabled,
      warn,
      error
    };
  }

  if (logLevel === LOG_LEVEL_ERROR) {
    return {
      debug: debugDisabled,
      info: infoDisabled,
      warn: warnDisabled,
      error
    };
  }

  if (logLevel === LOG_LEVEL_OFF) {
    return {
      debug: debugDisabled,
      info: infoDisabled,
      warn: warnDisabled,
      error: errorDisabled
    };
  }

  throw new Error(`unexpected logLevel.
--- logLevel ---
${logLevel}
--- allowed log levels ---
${LOG_LEVEL_OFF}
${LOG_LEVEL_ERROR}
${LOG_LEVEL_WARN}
${LOG_LEVEL_INFO}
${LOG_LEVEL_DEBUG}`);
};
const debug = console.debug;

const debugDisabled = () => {};

const info = console.info;

const infoDisabled = () => {};

const warn = console.warn;

const warnDisabled = () => {};

const error = console.error;

const errorDisabled = () => {};

const assertUrlLike = (value, name = "url") => {
  if (typeof value !== "string") {
    throw new TypeError(`${name} must be a url string, got ${value}`);
  }

  if (isWindowsPathnameSpecifier(value)) {
    throw new TypeError(`${name} must be a url but looks like a windows pathname, got ${value}`);
  }

  if (!hasScheme(value)) {
    throw new TypeError(`${name} must be a url and no scheme found, got ${value}`);
  }
};

const isWindowsPathnameSpecifier = specifier => {
  const firstChar = specifier[0];
  if (!/[a-zA-Z]/.test(firstChar)) return false;
  const secondChar = specifier[1];
  if (secondChar !== ":") return false;
  const thirdChar = specifier[2];
  return thirdChar === "/" || thirdChar === "\\";
};

const hasScheme = specifier => /^[a-zA-Z]+:/.test(specifier);

// https://git-scm.com/docs/gitignore
const applySpecifierPatternMatching = ({
  specifier,
  url,
  ...rest
} = {}) => {
  assertUrlLike(specifier, "specifier");
  assertUrlLike(url, "url");

  if (Object.keys(rest).length) {
    throw new Error(`received more parameters than expected.
--- name of unexpected parameters ---
${Object.keys(rest)}
--- name of expected parameters ---
specifier, url`);
  }

  return applyPatternMatching(specifier, url);
};

const applyPatternMatching = (pattern, string) => {
  let patternIndex = 0;
  let index = 0;
  let remainingPattern = pattern;
  let remainingString = string; // eslint-disable-next-line no-constant-condition

  while (true) {
    // pattern consumed and string consumed
    if (remainingPattern === "" && remainingString === "") {
      // pass because string fully matched pattern
      return pass({
        patternIndex,
        index
      });
    } // pattern consumed, string not consumed


    if (remainingPattern === "" && remainingString !== "") {
      // fails because string longer than expected
      return fail({
        patternIndex,
        index
      });
    } // from this point pattern is not consumed
    // string consumed, pattern not consumed


    if (remainingString === "") {
      // pass because trailing "**" is optional
      if (remainingPattern === "**") {
        return pass({
          patternIndex: patternIndex + 2,
          index
        });
      } // fail because string shorted than expected


      return fail({
        patternIndex,
        index
      });
    } // from this point pattern and string are not consumed
    // fast path trailing slash


    if (remainingPattern === "/") {
      // pass because trailing slash matches remaining
      return pass({
        patternIndex: patternIndex + 1,
        index: string.length
      });
    } // fast path trailing '**'


    if (remainingPattern === "**") {
      // pass because trailing ** matches remaining
      return pass({
        patternIndex: patternIndex + 2,
        index: string.length
      });
    } // pattern leading **


    if (remainingPattern.slice(0, 2) === "**") {
      // consumes "**"
      remainingPattern = remainingPattern.slice(2);
      patternIndex += 2;

      if (remainingPattern[0] === "/") {
        // consumes "/"
        remainingPattern = remainingPattern.slice(1);
        patternIndex += 1;
      } // pattern ending with ** always match remaining string


      if (remainingPattern === "") {
        return pass({
          patternIndex,
          index: string.length
        });
      }

      const skipResult = skipUntilMatch({
        pattern: remainingPattern,
        string: remainingString
      });

      if (!skipResult.matched) {
        return fail({
          patternIndex: patternIndex + skipResult.patternIndex,
          index: index + skipResult.index
        });
      }

      return pass({
        patternIndex: pattern.length,
        index: string.length
      });
    }

    if (remainingPattern[0] === "*") {
      // consumes "*"
      remainingPattern = remainingPattern.slice(1);
      patternIndex += 1; // la c'est plus délicat, il faut que remainingString
      // ne soit composé que de truc !== '/'

      if (remainingPattern === "") {
        const slashIndex = remainingString.indexOf("/");

        if (slashIndex > -1) {
          return fail({
            patternIndex,
            index: index + slashIndex
          });
        }

        return pass({
          patternIndex,
          index: string.length
        });
      } // the next char must not the one expected by remainingPattern[0]
      // because * is greedy and expect to skip one char


      if (remainingPattern[0] === remainingString[0]) {
        return fail({
          patternIndex: patternIndex - "*".length,
          index
        });
      }

      const skipResult = skipUntilMatch({
        pattern: remainingPattern,
        string: remainingString,
        skippablePredicate: remainingString => remainingString[0] !== "/"
      });

      if (!skipResult.matched) {
        return fail({
          patternIndex: patternIndex + skipResult.patternIndex,
          index: index + skipResult.index
        });
      }

      return pass({
        patternIndex: pattern.length,
        index: string.length
      });
    }

    if (remainingPattern[0] !== remainingString[0]) {
      return fail({
        patternIndex,
        index
      });
    } // consumes next char


    remainingPattern = remainingPattern.slice(1);
    remainingString = remainingString.slice(1);
    patternIndex += 1;
    index += 1;
    continue;
  }
};

const skipUntilMatch = ({
  pattern,
  string,
  skippablePredicate = () => true
}) => {
  let index = 0;
  let remainingString = string;
  let bestMatch = null; // eslint-disable-next-line no-constant-condition

  while (true) {
    const matchAttempt = applyPatternMatching(pattern, remainingString);

    if (matchAttempt.matched) {
      bestMatch = matchAttempt;
      break;
    }

    const skippable = skippablePredicate(remainingString);
    bestMatch = fail({
      patternIndex: bestMatch ? Math.max(bestMatch.patternIndex, matchAttempt.patternIndex) : matchAttempt.patternIndex,
      index: index + matchAttempt.index
    });

    if (!skippable) {
      break;
    } // search against the next unattempted string


    remainingString = remainingString.slice(matchAttempt.index + 1);
    index += matchAttempt.index + 1;

    if (remainingString === "") {
      bestMatch = { ...bestMatch,
        index: string.length
      };
      break;
    }

    continue;
  }

  return bestMatch;
};

const pass = ({
  patternIndex,
  index
}) => {
  return {
    matched: true,
    index,
    patternIndex
  };
};

const fail = ({
  patternIndex,
  index
}) => {
  return {
    matched: false,
    index,
    patternIndex
  };
};

const isPlainObject = value => {
  if (value === null) {
    return false;
  }

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return false;
    }

    return true;
  }

  return false;
};

const metaMapToSpecifierMetaMap = (metaMap, ...rest) => {
  if (!isPlainObject(metaMap)) {
    throw new TypeError(`metaMap must be a plain object, got ${metaMap}`);
  }

  if (rest.length) {
    throw new Error(`received more arguments than expected.
--- number of arguments received ---
${1 + rest.length}
--- number of arguments expected ---
1`);
  }

  const specifierMetaMap = {};
  Object.keys(metaMap).forEach(metaKey => {
    const specifierValueMap = metaMap[metaKey];

    if (!isPlainObject(specifierValueMap)) {
      throw new TypeError(`metaMap value must be plain object, got ${specifierValueMap} for ${metaKey}`);
    }

    Object.keys(specifierValueMap).forEach(specifier => {
      const metaValue = specifierValueMap[specifier];
      const meta = {
        [metaKey]: metaValue
      };
      specifierMetaMap[specifier] = specifier in specifierMetaMap ? { ...specifierMetaMap[specifier],
        ...meta
      } : meta;
    });
  });
  return specifierMetaMap;
};

const assertSpecifierMetaMap = value => {
  if (!isPlainObject(value)) {
    throw new TypeError(`specifierMetaMap must be a plain object, got ${value}`);
  } // we could ensure it's key/value pair of url like key/object or null values

};

const normalizeSpecifierMetaMap = (specifierMetaMap, url, ...rest) => {
  assertSpecifierMetaMap(specifierMetaMap);
  assertUrlLike(url, "url");

  if (rest.length) {
    throw new Error(`received more arguments than expected.
--- number of arguments received ---
${2 + rest.length}
--- number of arguments expected ---
2`);
  }

  const specifierMetaMapNormalized = {};
  Object.keys(specifierMetaMap).forEach(specifier => {
    const specifierResolved = String(new URL(specifier, url));
    specifierMetaMapNormalized[specifierResolved] = specifierMetaMap[specifier];
  });
  return specifierMetaMapNormalized;
};

const urlCanContainsMetaMatching = ({
  url,
  specifierMetaMap,
  predicate,
  ...rest
}) => {
  assertUrlLike(url, "url"); // the function was meants to be used on url ending with '/'

  if (!url.endsWith("/")) {
    throw new Error(`url should end with /, got ${url}`);
  }

  assertSpecifierMetaMap(specifierMetaMap);

  if (typeof predicate !== "function") {
    throw new TypeError(`predicate must be a function, got ${predicate}`);
  }

  if (Object.keys(rest).length) {
    throw new Error(`received more parameters than expected.
--- name of unexpected parameters ---
${Object.keys(rest)}
--- name of expected parameters ---
url, specifierMetaMap, predicate`);
  } // for full match we must create an object to allow pattern to override previous ones


  let fullMatchMeta = {};
  let someFullMatch = false; // for partial match, any meta satisfying predicate will be valid because
  // we don't know for sure if pattern will still match for a file inside pathname

  const partialMatchMetaArray = [];
  Object.keys(specifierMetaMap).forEach(specifier => {
    const meta = specifierMetaMap[specifier];
    const {
      matched,
      index
    } = applySpecifierPatternMatching({
      specifier,
      url
    });

    if (matched) {
      someFullMatch = true;
      fullMatchMeta = { ...fullMatchMeta,
        ...meta
      };
    } else if (someFullMatch === false && index >= url.length) {
      partialMatchMetaArray.push(meta);
    }
  });

  if (someFullMatch) {
    return Boolean(predicate(fullMatchMeta));
  }

  return partialMatchMetaArray.some(partialMatchMeta => predicate(partialMatchMeta));
};

const urlToMeta = ({
  url,
  specifierMetaMap,
  ...rest
} = {}) => {
  assertUrlLike(url);
  assertSpecifierMetaMap(specifierMetaMap);

  if (Object.keys(rest).length) {
    throw new Error(`received more parameters than expected.
--- name of unexpected parameters ---
${Object.keys(rest)}
--- name of expected parameters ---
url, specifierMetaMap`);
  }

  return Object.keys(specifierMetaMap).reduce((previousMeta, specifier) => {
    const {
      matched
    } = applySpecifierPatternMatching({
      specifier,
      url
    });

    if (matched) {
      return { ...previousMeta,
        ...specifierMetaMap[specifier]
      };
    }

    return previousMeta;
  }, {});
};

const ensureUrlTrailingSlash = url => {
  return url.endsWith("/") ? url : `${url}/`;
};

const isFileSystemPath = value => {
  if (typeof value !== "string") {
    throw new TypeError(`isFileSystemPath first arg must be a string, got ${value}`);
  }

  if (value[0] === "/") return true;
  return startsWithWindowsDriveLetter(value);
};

const startsWithWindowsDriveLetter = string => {
  const firstChar = string[0];
  if (!/[a-zA-Z]/.test(firstChar)) return false;
  const secondChar = string[1];
  if (secondChar !== ":") return false;
  return true;
};

const fileSystemPathToUrl = value => {
  if (!isFileSystemPath(value)) {
    throw new Error(`received an invalid value for fileSystemPath: ${value}`);
  }

  return String(url$1.pathToFileURL(value));
};

const assertAndNormalizeDirectoryUrl = value => {
  let urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath(value)) {
      urlString = fileSystemPathToUrl(value);
    } else {
      try {
        urlString = String(new URL(value));
      } catch (e) {
        throw new TypeError(`directoryUrl must be a valid url, received ${value}`);
      }
    }
  } else {
    throw new TypeError(`directoryUrl must be a string or an url, received ${value}`);
  }

  if (!urlString.startsWith("file://")) {
    throw new Error(`directoryUrl must starts with file://, received ${value}`);
  }

  return ensureUrlTrailingSlash(urlString);
};

const assertAndNormalizeFileUrl = (value, baseUrl) => {
  let urlString;

  if (value instanceof URL) {
    urlString = value.href;
  } else if (typeof value === "string") {
    if (isFileSystemPath(value)) {
      urlString = fileSystemPathToUrl(value);
    } else {
      try {
        urlString = String(new URL(value, baseUrl));
      } catch (e) {
        throw new TypeError(`fileUrl must be a valid url, received ${value}`);
      }
    }
  } else {
    throw new TypeError(`fileUrl must be a string or an url, received ${value}`);
  }

  if (!urlString.startsWith("file://")) {
    throw new Error(`fileUrl must starts with file://, received ${value}`);
  }

  return urlString;
};

const statsToType = stats => {
  if (stats.isFile()) return "file";
  if (stats.isDirectory()) return "directory";
  if (stats.isSymbolicLink()) return "symbolic-link";
  if (stats.isFIFO()) return "fifo";
  if (stats.isSocket()) return "socket";
  if (stats.isCharacterDevice()) return "character-device";
  if (stats.isBlockDevice()) return "block-device";
  return undefined;
};

const urlToFileSystemPath = fileUrl => {
  if (fileUrl[fileUrl.length - 1] === "/") {
    // remove trailing / so that nodejs path becomes predictable otherwise it logs
    // the trailing slash on linux but does not on windows
    fileUrl = fileUrl.slice(0, -1);
  }

  const fileSystemPath = url$1.fileURLToPath(fileUrl);
  return fileSystemPath;
};

// https://github.com/coderaiser/cloudcmd/issues/63#issuecomment-195478143
// https://nodejs.org/api/fs.html#fs_file_modes
// https://github.com/TooTallNate/stat-mode
// cannot get from fs.constants because they are not available on windows
const S_IRUSR = 256;
/* 0000400 read permission, owner */

const S_IWUSR = 128;
/* 0000200 write permission, owner */

const S_IXUSR = 64;
/* 0000100 execute/search permission, owner */

const S_IRGRP = 32;
/* 0000040 read permission, group */

const S_IWGRP = 16;
/* 0000020 write permission, group */

const S_IXGRP = 8;
/* 0000010 execute/search permission, group */

const S_IROTH = 4;
/* 0000004 read permission, others */

const S_IWOTH = 2;
/* 0000002 write permission, others */

const S_IXOTH = 1;
const permissionsToBinaryFlags = ({
  owner,
  group,
  others
}) => {
  let binaryFlags = 0;
  if (owner.read) binaryFlags |= S_IRUSR;
  if (owner.write) binaryFlags |= S_IWUSR;
  if (owner.execute) binaryFlags |= S_IXUSR;
  if (group.read) binaryFlags |= S_IRGRP;
  if (group.write) binaryFlags |= S_IWGRP;
  if (group.execute) binaryFlags |= S_IXGRP;
  if (others.read) binaryFlags |= S_IROTH;
  if (others.write) binaryFlags |= S_IWOTH;
  if (others.execute) binaryFlags |= S_IXOTH;
  return binaryFlags;
};

const writeFileSystemNodePermissions = async (source, permissions) => {
  const sourceUrl = assertAndNormalizeFileUrl(source);
  const sourcePath = urlToFileSystemPath(sourceUrl);
  let binaryFlags;

  if (typeof permissions === "object") {
    permissions = {
      owner: {
        read: getPermissionOrComputeDefault("read", "owner", permissions),
        write: getPermissionOrComputeDefault("write", "owner", permissions),
        execute: getPermissionOrComputeDefault("execute", "owner", permissions)
      },
      group: {
        read: getPermissionOrComputeDefault("read", "group", permissions),
        write: getPermissionOrComputeDefault("write", "group", permissions),
        execute: getPermissionOrComputeDefault("execute", "group", permissions)
      },
      others: {
        read: getPermissionOrComputeDefault("read", "others", permissions),
        write: getPermissionOrComputeDefault("write", "others", permissions),
        execute: getPermissionOrComputeDefault("execute", "others", permissions)
      }
    };
    binaryFlags = permissionsToBinaryFlags(permissions);
  } else {
    binaryFlags = permissions;
  }

  return chmodNaive(sourcePath, binaryFlags);
};

const chmodNaive = (fileSystemPath, binaryFlags) => {
  return new Promise((resolve, reject) => {
    fs.chmod(fileSystemPath, binaryFlags, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const actionLevels = {
  read: 0,
  write: 1,
  execute: 2
};
const subjectLevels = {
  others: 0,
  group: 1,
  owner: 2
};

const getPermissionOrComputeDefault = (action, subject, permissions) => {
  if (subject in permissions) {
    const subjectPermissions = permissions[subject];

    if (action in subjectPermissions) {
      return subjectPermissions[action];
    }

    const actionLevel = actionLevels[action];
    const actionFallback = Object.keys(actionLevels).find(actionFallbackCandidate => actionLevels[actionFallbackCandidate] > actionLevel && actionFallbackCandidate in subjectPermissions);

    if (actionFallback) {
      return subjectPermissions[actionFallback];
    }
  }

  const subjectLevel = subjectLevels[subject]; // do we have a subject with a stronger level (group or owner)
  // where we could read the action permission ?

  const subjectFallback = Object.keys(subjectLevels).find(subjectFallbackCandidate => subjectLevels[subjectFallbackCandidate] > subjectLevel && subjectFallbackCandidate in permissions);

  if (subjectFallback) {
    const subjectPermissions = permissions[subjectFallback];
    return action in subjectPermissions ? subjectPermissions[action] : getPermissionOrComputeDefault(action, subjectFallback, permissions);
  }

  return false;
};

const isWindows = process.platform === "win32";
const readFileSystemNodeStat = async (source, {
  nullIfNotFound = false,
  followLink = true
} = {}) => {
  if (source.endsWith("/")) source = source.slice(0, -1);
  const sourceUrl = assertAndNormalizeFileUrl(source);
  const sourcePath = urlToFileSystemPath(sourceUrl);
  const handleNotFoundOption = nullIfNotFound ? {
    handleNotFoundError: () => null
  } : {};
  return readStat(sourcePath, {
    followLink,
    ...handleNotFoundOption,
    ...(isWindows ? {
      // Windows can EPERM on stat
      handlePermissionDeniedError: async error => {
        // unfortunately it means we mutate the permissions
        // without being able to restore them to the previous value
        // (because reading current permission would also throw)
        try {
          await writeFileSystemNodePermissions(sourceUrl, 0o666);
          const stats = await readStat(sourcePath, {
            followLink,
            ...handleNotFoundOption,
            // could not fix the permission error, give up and throw original error
            handlePermissionDeniedError: () => {
              throw error;
            }
          });
          return stats;
        } catch (e) {
          // failed to write permission or readState, throw original error as well
          throw error;
        }
      }
    } : {})
  });
};

const readStat = (sourcePath, {
  followLink,
  handleNotFoundError = null,
  handlePermissionDeniedError = null
} = {}) => {
  const nodeMethod = followLink ? fs.stat : fs.lstat;
  return new Promise((resolve, reject) => {
    nodeMethod(sourcePath, (error, statsObject) => {
      if (error) {
        if (handlePermissionDeniedError && (error.code === "EPERM" || error.code === "EACCES")) {
          resolve(handlePermissionDeniedError(error));
        } else if (handleNotFoundError && error.code === "ENOENT") {
          resolve(handleNotFoundError(error));
        } else {
          reject(error);
        }
      } else {
        resolve(statsObject);
      }
    });
  });
};

const ETAG_FOR_EMPTY_CONTENT = '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
const bufferToEtag = buffer => {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError(`buffer expected, got ${buffer}`);
  }

  if (buffer.length === 0) {
    return ETAG_FOR_EMPTY_CONTENT;
  }

  const hash = crypto.createHash("sha1");
  hash.update(buffer, "utf8");
  const hashBase64String = hash.digest("base64");
  const hashBase64StringSubset = hashBase64String.slice(0, 27);
  const length = buffer.length;
  return `"${length.toString(16)}-${hashBase64StringSubset}"`;
};

const createCancellationToken = () => {
  const register = callback => {
    if (typeof callback !== "function") {
      throw new Error(`callback must be a function, got ${callback}`);
    }

    return {
      callback,
      unregister: () => {}
    };
  };

  const throwIfRequested = () => undefined;

  return {
    register,
    cancellationRequested: false,
    throwIfRequested
  };
};

const createOperation = ({
  cancellationToken = createCancellationToken(),
  start,
  ...rest
}) => {
  const unknownArgumentNames = Object.keys(rest);

  if (unknownArgumentNames.length) {
    throw new Error(`createOperation called with unknown argument names.
--- unknown argument names ---
${unknownArgumentNames}
--- possible argument names ---
cancellationToken
start`);
  }

  cancellationToken.throwIfRequested();
  const promise = new Promise(resolve => {
    resolve(start());
  });
  const cancelPromise = new Promise((resolve, reject) => {
    const cancelRegistration = cancellationToken.register(cancelError => {
      cancelRegistration.unregister();
      reject(cancelError);
    });
    promise.then(cancelRegistration.unregister, () => {});
  });
  const operationPromise = Promise.race([promise, cancelPromise]);
  return operationPromise;
};

const readDirectory = async (url, {
  emfileMaxWait = 1000
} = {}) => {
  const directoryUrl = assertAndNormalizeDirectoryUrl(url);
  const directoryPath = urlToFileSystemPath(directoryUrl);
  const startMs = Date.now();
  let attemptCount = 0;

  const attempt = () => {
    return readdirNaive(directoryPath, {
      handleTooManyFilesOpenedError: async error => {
        attemptCount++;
        const nowMs = Date.now();
        const timeSpentWaiting = nowMs - startMs;

        if (timeSpentWaiting > emfileMaxWait) {
          throw error;
        }

        return new Promise(resolve => {
          setTimeout(() => {
            resolve(attempt());
          }, attemptCount);
        });
      }
    });
  };

  return attempt();
};

const readdirNaive = (directoryPath, {
  handleTooManyFilesOpenedError = null
} = {}) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, (error, names) => {
      if (error) {
        // https://nodejs.org/dist/latest-v13.x/docs/api/errors.html#errors_common_system_errors
        if (handleTooManyFilesOpenedError && (error.code === "EMFILE" || error.code === "ENFILE")) {
          resolve(handleTooManyFilesOpenedError(error));
        } else {
          reject(error);
        }
      } else {
        resolve(names);
      }
    });
  });
};

const getCommonPathname = (pathname, otherPathname) => {
  const firstDifferentCharacterIndex = findFirstDifferentCharacterIndex(pathname, otherPathname); // pathname and otherpathname are exactly the same

  if (firstDifferentCharacterIndex === -1) {
    return pathname;
  }

  const commonString = pathname.slice(0, firstDifferentCharacterIndex + 1); // the first different char is at firstDifferentCharacterIndex

  if (pathname.charAt(firstDifferentCharacterIndex) === "/") {
    return commonString;
  }

  if (otherPathname.charAt(firstDifferentCharacterIndex) === "/") {
    return commonString;
  }

  const firstDifferentSlashIndex = commonString.lastIndexOf("/");
  return pathname.slice(0, firstDifferentSlashIndex + 1);
};

const findFirstDifferentCharacterIndex = (string, otherString) => {
  const maxCommonLength = Math.min(string.length, otherString.length);
  let i = 0;

  while (i < maxCommonLength) {
    const char = string.charAt(i);
    const otherChar = otherString.charAt(i);

    if (char !== otherChar) {
      return i;
    }

    i++;
  }

  if (string.length === otherString.length) {
    return -1;
  } // they differ at maxCommonLength


  return maxCommonLength;
};

const pathnameToDirectoryPathname = pathname => {
  if (pathname.endsWith("/")) {
    return pathname;
  }

  const slashLastIndex = pathname.lastIndexOf("/");

  if (slashLastIndex === -1) {
    return "";
  }

  return pathname.slice(0, slashLastIndex + 1);
};

const urlToRelativeUrl = (urlArg, baseUrlArg) => {
  const url = new URL(urlArg);
  const baseUrl = new URL(baseUrlArg);

  if (url.protocol !== baseUrl.protocol) {
    return urlArg;
  }

  if (url.username !== baseUrl.username || url.password !== baseUrl.password) {
    return urlArg.slice(url.protocol.length);
  }

  if (url.host !== baseUrl.host) {
    return urlArg.slice(url.protocol.length);
  }

  const {
    pathname,
    hash,
    search
  } = url;

  if (pathname === "/") {
    return baseUrl.pathname.slice(1);
  }

  const {
    pathname: basePathname
  } = baseUrl;
  const commonPathname = getCommonPathname(pathname, basePathname);

  if (!commonPathname) {
    return urlArg;
  }

  const specificPathname = pathname.slice(commonPathname.length);
  const baseSpecificPathname = basePathname.slice(commonPathname.length);
  const baseSpecificDirectoryPathname = pathnameToDirectoryPathname(baseSpecificPathname);
  const relativeDirectoriesNotation = baseSpecificDirectoryPathname.replace(/.*?\//g, "../");
  const relativePathname = `${relativeDirectoriesNotation}${specificPathname}`;
  return `${relativePathname}${search}${hash}`;
};

const comparePathnames = (leftPathame, rightPathname) => {
  const leftPartArray = leftPathame.split("/");
  const rightPartArray = rightPathname.split("/");
  const leftLength = leftPartArray.length;
  const rightLength = rightPartArray.length;
  const maxLength = Math.max(leftLength, rightLength);
  let i = 0;

  while (i < maxLength) {
    const leftPartExists = i in leftPartArray;
    const rightPartExists = i in rightPartArray; // longer comes first

    if (!leftPartExists) return +1;
    if (!rightPartExists) return -1;
    const leftPartIsLast = i === leftPartArray.length - 1;
    const rightPartIsLast = i === rightPartArray.length - 1; // folder comes first

    if (leftPartIsLast && !rightPartIsLast) return +1;
    if (!leftPartIsLast && rightPartIsLast) return -1;
    const leftPart = leftPartArray[i];
    const rightPart = rightPartArray[i];
    i++; // local comparison comes first

    const comparison = leftPart.localeCompare(rightPart);
    if (comparison !== 0) return comparison;
  }

  if (leftLength < rightLength) return +1;
  if (leftLength > rightLength) return -1;
  return 0;
};

const collectFiles = async ({
  cancellationToken = createCancellationToken(),
  directoryUrl,
  specifierMetaMap,
  predicate,
  matchingFileOperation = () => null
}) => {
  const rootDirectoryUrl = assertAndNormalizeDirectoryUrl(directoryUrl);

  if (typeof predicate !== "function") {
    throw new TypeError(`predicate must be a function, got ${predicate}`);
  }

  if (typeof matchingFileOperation !== "function") {
    throw new TypeError(`matchingFileOperation must be a function, got ${matchingFileOperation}`);
  }

  const specifierMetaMapNormalized = normalizeSpecifierMetaMap(specifierMetaMap, rootDirectoryUrl);
  const matchingFileResultArray = [];

  const visitDirectory = async directoryUrl => {
    const directoryItems = await createOperation({
      cancellationToken,
      start: () => readDirectory(directoryUrl)
    });
    await Promise.all(directoryItems.map(async directoryItem => {
      const directoryChildNodeUrl = `${directoryUrl}${directoryItem}`;
      const directoryChildNodeStats = await createOperation({
        cancellationToken,
        start: () => readFileSystemNodeStat(directoryChildNodeUrl, {
          // we ignore symlink because recursively traversed
          // so symlinked file will be discovered.
          // Moreover if they lead outside of directoryPath it can become a problem
          // like infinite recursion of whatever.
          // that we could handle using an object of pathname already seen but it will be useless
          // because directoryPath is recursively traversed
          followLink: false
        })
      });

      if (directoryChildNodeStats.isDirectory()) {
        const subDirectoryUrl = `${directoryChildNodeUrl}/`;

        if (!urlCanContainsMetaMatching({
          url: subDirectoryUrl,
          specifierMetaMap: specifierMetaMapNormalized,
          predicate
        })) {
          return;
        }

        await visitDirectory(subDirectoryUrl);
        return;
      }

      if (directoryChildNodeStats.isFile()) {
        const meta = urlToMeta({
          url: directoryChildNodeUrl,
          specifierMetaMap: specifierMetaMapNormalized
        });
        if (!predicate(meta)) return;
        const relativeUrl = urlToRelativeUrl(directoryChildNodeUrl, rootDirectoryUrl);
        const operationResult = await createOperation({
          cancellationToken,
          start: () => matchingFileOperation({
            cancellationToken,
            relativeUrl,
            meta,
            fileStats: directoryChildNodeStats
          })
        });
        matchingFileResultArray.push({
          relativeUrl,
          meta,
          fileStats: directoryChildNodeStats,
          operationResult
        });
        return;
      }
    }));
  };

  await visitDirectory(rootDirectoryUrl); // When we operate on thoose files later it feels more natural
  // to perform operation in the same order they appear in the filesystem.
  // It also allow to get a predictable return value.
  // For that reason we sort matchingFileResultArray

  matchingFileResultArray.sort((leftFile, rightFile) => {
    return comparePathnames(leftFile.relativeUrl, rightFile.relativeUrl);
  });
  return matchingFileResultArray;
};

const {
  mkdir
} = fs.promises;
const writeDirectory = async (destination, {
  recursive = true,
  allowUseless = false
} = {}) => {
  const destinationUrl = assertAndNormalizeDirectoryUrl(destination);
  const destinationPath = urlToFileSystemPath(destinationUrl);
  const destinationStats = await readFileSystemNodeStat(destinationUrl, {
    nullIfNotFound: true,
    followLink: false
  });

  if (destinationStats) {
    if (destinationStats.isDirectory()) {
      if (allowUseless) {
        return;
      }

      throw new Error(`directory already exists at ${destinationPath}`);
    }

    const destinationType = statsToType(destinationStats);
    throw new Error(`cannot write directory at ${destinationPath} because there is a ${destinationType}`);
  }

  try {
    await mkdir(destinationPath, {
      recursive
    });
  } catch (error) {
    if (allowUseless && error.code === "EEXIST") {
      return;
    }

    throw error;
  }
};

const resolveUrl = (specifier, baseUrl) => {
  if (typeof baseUrl === "undefined") {
    throw new TypeError(`baseUrl missing to resolve ${specifier}`);
  }

  return String(new URL(specifier, baseUrl));
};

const isWindows$1 = process.platform === "win32";
const baseUrlFallback = fileSystemPathToUrl(process.cwd());

const ensureParentDirectories = async destination => {
  const destinationUrl = assertAndNormalizeFileUrl(destination);
  const destinationPath = urlToFileSystemPath(destinationUrl);
  const destinationParentPath = path.dirname(destinationPath);
  return writeDirectory(destinationParentPath, {
    recursive: true,
    allowUseless: true
  });
};

const isWindows$2 = process.platform === "win32";

const readFilePromisified = util.promisify(fs.readFile);
const readFile = async value => {
  const fileUrl = assertAndNormalizeFileUrl(value);
  const filePath = urlToFileSystemPath(fileUrl);
  const buffer = await readFilePromisified(filePath);
  return buffer.toString();
};

const isWindows$3 = process.platform === "win32";

/* eslint-disable import/max-dependencies */
const isLinux = process.platform === "linux"; // linux does not support recursive option

const resolveDirectoryUrl = (specifier, baseUrl) => {
  const url = resolveUrl(specifier, baseUrl);
  return ensureUrlTrailingSlash(url);
};

const {
  writeFile: writeFileNode
} = fs.promises;
const writeFile = async (destination, content = "") => {
  const destinationUrl = assertAndNormalizeFileUrl(destination);
  const destinationPath = urlToFileSystemPath(destinationUrl);

  try {
    await writeFileNode(destinationPath, content);
  } catch (error) {
    if (error.code === "ENOENT") {
      await ensureParentDirectories(destinationUrl);
      await writeFileNode(destinationPath, content);
      return;
    }

    throw error;
  }
};

const jsenvDirectorySizeTrackingConfig = {
  "dist/systemjs": {
    "./**/*": true,
    "./**/*.map": false
  },
  "dist/commonjs": {
    "./**/*": true,
    "./**/*.map": false
  }
};

const generateSnapshotFile = async ({
  logLevel,
  projectDirectoryUrl,
  directorySizeTrackingConfig = jsenvDirectorySizeTrackingConfig,
  snapshotFileRelativeUrl = "./filesize-snapshot.json",
  manifest = true,
  manifestFilename = "manifest.json"
}) => {
  const logger = createLogger({
    logLevel
  });
  projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl);
  const directoryRelativeUrlArray = Object.keys(directorySizeTrackingConfig);

  if (directoryRelativeUrlArray.length === 0) {
    logger.warn(`directorySizeTrackingConfig is empty`);
  }

  const snapshotFileUrl = resolveUrl(snapshotFileRelativeUrl, projectDirectoryUrl);
  const snapshot = {};
  await Promise.all(directoryRelativeUrlArray.map(async directoryRelativeUrl => {
    const directoryUrl = resolveDirectoryUrl(directoryRelativeUrl, projectDirectoryUrl);
    const directoryTrackingConfig = directorySizeTrackingConfig[directoryRelativeUrl];
    const specifierMetaMap = metaMapToSpecifierMetaMap({
      track: directoryTrackingConfig
    });
    const [directoryManifest, directoryFileReport] = await Promise.all([manifest ? readDirectoryManifest({
      logger,
      manifestFilename,
      directoryUrl
    }) : null, generateDirectoryFileReport({
      logger,
      directoryUrl,
      specifierMetaMap,
      manifest,
      manifestFilename
    })]);
    snapshot[directoryRelativeUrl] = {
      manifest: directoryManifest,
      report: directoryFileReport,
      trackingConfig: directoryTrackingConfig
    };
  }));
  logger.info(`write snapshot file at ${urlToFileSystemPath(snapshotFileUrl)}`);
  const snapshotFileContent = JSON.stringify(snapshot, null, "  ");
  logger.debug(snapshotFileContent);
  await writeFile(snapshotFileUrl, snapshotFileContent);
};

const readDirectoryManifest = async ({
  logger,
  manifestFilename,
  directoryUrl
}) => {
  const manifestFileUrl = resolveUrl(manifestFilename, directoryUrl);

  try {
    const manifestFileContent = await readFile(manifestFileUrl);
    return JSON.parse(manifestFileContent);
  } catch (e) {
    if (e && e.code === "ENOENT") {
      logger.debug(`manifest file not found at ${urlToFileSystemPath(manifestFileUrl)}`);
      return null;
    }

    throw e;
  }
};

const generateDirectoryFileReport = async ({
  logger,
  directoryUrl,
  specifierMetaMap,
  manifest,
  manifestFilename
}) => {
  const directoryFileReport = {};

  try {
    await collectFiles({
      directoryUrl,
      specifierMetaMap,
      predicate: meta => meta.track === true,
      matchingFileOperation: async ({
        relativeUrl,
        fileStats
      }) => {
        if (!fileStats.isFile()) {
          return;
        }

        if (manifest && relativeUrl === manifestFilename) {
          return;
        }

        const fileUrl = resolveUrl(relativeUrl, directoryUrl);
        const fileContent = await readFile(fileUrl);
        const hash = bufferToEtag(Buffer.from(fileContent));
        directoryFileReport[relativeUrl] = {
          size: fileStats.size,
          hash
        };
      }
    });
  } catch (e) {
    const directoryPath = urlToFileSystemPath(directoryUrl);

    if (e.code === "ENOENT" && e.path === directoryPath) {
      logger.warn(`${directoryPath} does not exists`);
      return directoryFileReport;
    }

    throw e;
  }

  return directoryFileReport;
};

const convertFileSystemErrorToResponseProperties = error => {
  // https://iojs.org/api/errors.html#errors_eacces_permission_denied
  if (isErrorWithCode(error, "EACCES")) {
    return {
      status: 403,
      statusText: "no permission to read file"
    };
  }

  if (isErrorWithCode(error, "EPERM")) {
    return {
      status: 403,
      statusText: "no permission to read file"
    };
  }

  if (isErrorWithCode(error, "ENOENT")) {
    return {
      status: 404,
      statusText: "file not found"
    };
  } // file access may be temporarily blocked
  // (by an antivirus scanning it because recently modified for instance)


  if (isErrorWithCode(error, "EBUSY")) {
    return {
      status: 503,
      statusText: "file is busy",
      headers: {
        "retry-after": 0.01 // retry in 10ms

      }
    };
  } // emfile means there is too many files currently opened


  if (isErrorWithCode(error, "EMFILE")) {
    return {
      status: 503,
      statusText: "too many file opened",
      headers: {
        "retry-after": 0.1 // retry in 100ms

      }
    };
  }

  if (isErrorWithCode(error, "EISDIR")) {
    return {
      status: 500,
      statusText: "Unexpected directory operation"
    };
  }

  return Promise.reject(error);
};

const isErrorWithCode = (error, code) => {
  return typeof error === "object" && error.code === code;
};

if ("observable" in Symbol === false) {
  Symbol.observable = Symbol.for("observable");
}

// eslint-disable-next-line import/no-unresolved
const nodeRequire = require;
const filenameContainsBackSlashes = __filename.indexOf("\\") > -1;
const url = filenameContainsBackSlashes ? `file:///${__filename.replace(/\\/g, "/")}` : `file://${__filename}`;

const createCancellationToken$1 = () => {
  const register = callback => {
    if (typeof callback !== "function") {
      throw new Error(`callback must be a function, got ${callback}`);
    }

    return {
      callback,
      unregister: () => {}
    };
  };

  const throwIfRequested = () => undefined;

  return {
    register,
    cancellationRequested: false,
    throwIfRequested
  };
};

const createOperation$1 = ({
  cancellationToken = createCancellationToken$1(),
  start,
  ...rest
}) => {
  const unknownArgumentNames = Object.keys(rest);

  if (unknownArgumentNames.length) {
    throw new Error(`createOperation called with unknown argument names.
--- unknown argument names ---
${unknownArgumentNames}
--- possible argument names ---
cancellationToken
start`);
  }

  cancellationToken.throwIfRequested();
  const promise = new Promise(resolve => {
    resolve(start());
  });
  const cancelPromise = new Promise((resolve, reject) => {
    const cancelRegistration = cancellationToken.register(cancelError => {
      cancelRegistration.unregister();
      reject(cancelError);
    });
    promise.then(cancelRegistration.unregister, () => {});
  });
  const operationPromise = Promise.race([promise, cancelPromise]);
  return operationPromise;
};

const jsenvContentTypeMap = {
  "application/javascript": {
    extensions: ["js", "mjs", "ts", "jsx"]
  },
  "application/json": {
    extensions: ["json"]
  },
  "application/octet-stream": {},
  "application/pdf": {
    extensions: ["pdf"]
  },
  "application/xml": {
    extensions: ["xml"]
  },
  "application/x-gzip": {
    extensions: ["gz"]
  },
  "application/wasm": {
    extensions: ["wasm"]
  },
  "application/zip": {
    extensions: ["zip"]
  },
  "audio/basic": {
    extensions: ["au", "snd"]
  },
  "audio/mpeg": {
    extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"]
  },
  "audio/midi": {
    extensions: ["midi", "mid", "kar", "rmi"]
  },
  "audio/mp4": {
    extensions: ["m4a", "mp4a"]
  },
  "audio/ogg": {
    extensions: ["oga", "ogg", "spx"]
  },
  "audio/webm": {
    extensions: ["weba"]
  },
  "audio/x-wav": {
    extensions: ["wav"]
  },
  "font/ttf": {
    extensions: ["ttf"]
  },
  "font/woff": {
    extensions: ["woff"]
  },
  "font/woff2": {
    extensions: ["woff2"]
  },
  "image/png": {
    extensions: ["png"]
  },
  "image/gif": {
    extensions: ["gif"]
  },
  "image/jpeg": {
    extensions: ["jpg"]
  },
  "image/svg+xml": {
    extensions: ["svg", "svgz"]
  },
  "text/plain": {
    extensions: ["txt"]
  },
  "text/html": {
    extensions: ["html"]
  },
  "text/css": {
    extensions: ["css"]
  },
  "text/cache-manifest": {
    extensions: ["appcache"]
  },
  "video/mp4": {
    extensions: ["mp4", "mp4v", "mpg4"]
  },
  "video/mpeg": {
    extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"]
  },
  "video/ogg": {
    extensions: ["ogv"]
  },
  "video/webm": {
    extensions: ["webm"]
  }
};

// https://github.com/jshttp/mime-db/blob/master/src/apache-types.json
const urlToContentType = (url, contentTypeMap = jsenvContentTypeMap, contentTypeDefault = "application/octet-stream") => {
  if (typeof contentTypeMap !== "object") {
    throw new TypeError(`contentTypeMap must be an object, got ${contentTypeMap}`);
  }

  const pathname = new URL(url).pathname;
  const extensionWithDot = path.extname(pathname);

  if (!extensionWithDot || extensionWithDot === ".") {
    return contentTypeDefault;
  }

  const extension = extensionWithDot.slice(1);
  const availableContentTypes = Object.keys(contentTypeMap);
  const contentTypeForExtension = availableContentTypes.find(contentTypeName => {
    const contentType = contentTypeMap[contentTypeName];
    return contentType.extensions && contentType.extensions.indexOf(extension) > -1;
  });
  return contentTypeForExtension || contentTypeDefault;
};

const {
  readFile: readFile$1
} = fs.promises;
const serveFile = async (source, {
  cancellationToken = createCancellationToken$1(),
  method = "GET",
  headers = {},
  canReadDirectory = false,
  cacheStrategy = "etag",
  contentTypeMap = jsenvContentTypeMap
} = {}) => {
  if (method !== "GET" && method !== "HEAD") {
    return {
      status: 501
    };
  }

  const sourceUrl = assertAndNormalizeFileUrl(source);
  const clientCacheDisabled = headers["cache-control"] === "no-cache";

  try {
    const cacheWithMtime = !clientCacheDisabled && cacheStrategy === "mtime";
    const cacheWithETag = !clientCacheDisabled && cacheStrategy === "etag";
    const cachedDisabled = clientCacheDisabled || cacheStrategy === "none";
    const sourceStat = await createOperation$1({
      cancellationToken,
      start: () => readFileSystemNodeStat(sourceUrl)
    });

    if (sourceStat.isDirectory()) {
      if (canReadDirectory === false) {
        return {
          status: 403,
          statusText: "not allowed to read directory",
          headers: { ...(cachedDisabled ? {
              "cache-control": "no-store"
            } : {})
          }
        };
      }

      const directoryContentArray = await createOperation$1({
        cancellationToken,
        start: () => readDirectory(sourceUrl)
      });
      const directoryContentJson = JSON.stringify(directoryContentArray);
      return {
        status: 200,
        headers: { ...(cachedDisabled ? {
            "cache-control": "no-store"
          } : {}),
          "content-type": "application/json",
          "content-length": directoryContentJson.length
        },
        body: directoryContentJson
      };
    } // not a file, give up


    if (!sourceStat.isFile()) {
      return {
        status: 404,
        headers: { ...(cachedDisabled ? {
            "cache-control": "no-store"
          } : {})
        }
      };
    }

    if (cacheWithETag) {
      const fileContentAsBuffer = await createOperation$1({
        cancellationToken,
        start: () => readFile$1(urlToFileSystemPath(sourceUrl))
      });
      const fileContentEtag = bufferToEtag(fileContentAsBuffer);

      if ("if-none-match" in headers && headers["if-none-match"] === fileContentEtag) {
        return {
          status: 304,
          headers: { ...(cachedDisabled ? {
              "cache-control": "no-store"
            } : {})
          }
        };
      }

      return {
        status: 200,
        headers: { ...(cachedDisabled ? {
            "cache-control": "no-store"
          } : {}),
          "content-length": sourceStat.size,
          "content-type": urlToContentType(sourceUrl, contentTypeMap),
          "etag": fileContentEtag
        },
        body: fileContentAsBuffer
      };
    }

    if (cacheWithMtime && "if-modified-since" in headers) {
      let cachedModificationDate;

      try {
        cachedModificationDate = new Date(headers["if-modified-since"]);
      } catch (e) {
        return {
          status: 400,
          statusText: "if-modified-since header is not a valid date"
        };
      }

      const actualModificationDate = dateToSecondsPrecision(sourceStat.mtime);

      if (Number(cachedModificationDate) >= Number(actualModificationDate)) {
        return {
          status: 304
        };
      }
    }

    return {
      status: 200,
      headers: { ...(cachedDisabled ? {
          "cache-control": "no-store"
        } : {}),
        ...(cacheWithMtime ? {
          "last-modified": dateToUTCString(sourceStat.mtime)
        } : {}),
        "content-length": sourceStat.size,
        "content-type": urlToContentType(sourceUrl, contentTypeMap)
      },
      body: fs.createReadStream(urlToFileSystemPath(sourceUrl))
    };
  } catch (e) {
    return convertFileSystemErrorToResponseProperties(e);
  }
}; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toUTCString

const dateToUTCString = date => date.toUTCString();

const dateToSecondsPrecision = date => {
  const dateWithSecondsPrecision = new Date(date);
  dateWithSecondsPrecision.setMilliseconds(0);
  return dateWithSecondsPrecision;
};

const require$1 = module$1.createRequire(url);

const nodeFetch = require$1("node-fetch");

const AbortController = require$1("abort-controller");

const {
  Response
} = nodeFetch;
const fetchUrl = async (url, {
  cancellationToken = createCancellationToken$1(),
  standard = false,
  canReadDirectory,
  contentTypeMap,
  cacheStrategy,
  ...options
} = {}) => {
  try {
    url = String(new URL(url));
  } catch (e) {
    throw new Error(`fetchUrl first argument must be an absolute url, received ${url}`);
  }

  if (url.startsWith("file://")) {
    const {
      status,
      statusText,
      headers,
      body
    } = await serveFile(url, {
      cancellationToken,
      cacheStrategy,
      canReadDirectory,
      contentTypeMap,
      ...options
    });
    const response = new Response(typeof body === "string" ? Buffer.from(body) : body, {
      url,
      status,
      statusText,
      headers
    });
    return standard ? response : standardResponseToSimplifiedResponse(response);
  }

  const response = await createOperation$1({
    cancellationToken,
    start: () => nodeFetch(url, {
      signal: cancellationTokenToAbortSignal(cancellationToken),
      ...options
    })
  });
  return standard ? response : standardResponseToSimplifiedResponse(response);
}; // https://github.com/bitinn/node-fetch#request-cancellation-with-abortsignal

const cancellationTokenToAbortSignal = cancellationToken => {
  const abortController = new AbortController();
  cancellationToken.register(reason => {
    abortController.abort(reason);
  });
  return abortController.signal;
};

const standardResponseToSimplifiedResponse = async response => {
  const text = await response.text();
  return {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    headers: responseToHeaders(response),
    body: text
  };
};

const responseToHeaders = response => {
  const headers = {};
  response.headers.forEach((value, name) => {
    headers[name] = value;
  });
  return headers;
};

const require$2 = module$1.createRequire(url);

const killPort = require$2("kill-port");

const getPullRequestCommentMatching = async ({
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  githubToken,
  regex
}) => {
  let listPullRequestCommentResponse;

  try {
    listPullRequestCommentResponse = await listPullRequestComment({
      githubToken,
      repositoryOwner,
      repositoryName,
      pullRequestNumber
    });
  } catch (e) {
    throw createErrorWhileSearchingGistInPullRequestComments({
      error: e,
      repositoryOwner,
      repositoryName,
      pullRequestNumber
    });
  }

  if (listPullRequestCommentResponse.status !== 200) {
    throw createUnexpectedResponseForListPullRequestComment({
      response: listPullRequestCommentResponse,
      responseBodyAsJson: await listPullRequestCommentResponse.json()
    });
  }

  const commentList = await listPullRequestCommentResponse.json();
  const comment = commentList.find(({
    body
  }) => {
    const match = body.match(regex);
    if (!match) return false;
    return true;
  });
  return comment;
};

const listPullRequestComment = async ({
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  githubToken
}) => {
  const response = await fetchUrl(`https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`, {
    standard: true,
    headers: {
      authorization: `token ${githubToken}`
    },
    method: "GET"
  });
  return response;
};

const createErrorWhileSearchingGistInPullRequestComments = ({
  error,
  pullRequestNumber,
  repositoryName,
  repositoryOwner
}) => new Error(`error while searching in pull request comments.
error: ${error.stack}
pull request number: ${pullRequestNumber}
repository name: ${repositoryName}
repository owner: ${repositoryOwner}`);

const createUnexpectedResponseForListPullRequestComment = ({
  response,
  responseBodyAsJson
}) => new Error(`list pull request comment failed: response status should be 200.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), "  ")}`);

// https://developer.github.com/v3/issues/comments/#edit-a-comment
const createPullRequestComment = async ({
  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  commentBody
}) => {
  let createPullRequestCommentResponse;

  try {
    createPullRequestCommentResponse = await genericCreatePullRequestComment({
      githubToken,
      repositoryOwner,
      repositoryName,
      pullRequestNumber,
      commentBody
    });
  } catch (e) {
    throw createErrorWhileCreatingPullRequestComment({
      error: e,
      pullRequestNumber,
      repositoryName,
      repositoryOwner
    });
  }

  if (createPullRequestCommentResponse.status !== 201) {
    throw createUnexpectedResponseForCreatePullRequestComment({
      response: createPullRequestCommentResponse,
      responseBodyAsJson: await createPullRequestCommentResponse.json()
    });
  }

  const comment = await createPullRequestCommentResponse.json();
  return comment;
};

const genericCreatePullRequestComment = async ({
  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  commentBody
}) => {
  const body = JSON.stringify({
    body: commentBody
  });
  const response = await fetchUrl(`https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`, {
    standard: true,
    headers: {
      "authorization": `token ${githubToken}`,
      "content-length": Buffer.byteLength(body)
    },
    method: "POST",
    body
  });
  return response;
};

const createErrorWhileCreatingPullRequestComment = ({
  error,
  pullRequestNumber,
  repositoryName,
  repositoryOwner
}) => new Error(`error while creating pull request comment.
error: ${error.stack}
pull request number: ${pullRequestNumber}
repository name: ${repositoryName}
repository owner: ${repositoryOwner}`);

const createUnexpectedResponseForCreatePullRequestComment = ({
  response,
  responseBodyAsJson
}) => new Error(`create pull request comment failed: response status should be 201.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), "  ")}`);

// https://developer.github.com/v3/issues/comments/#edit-a-comment
const updatePullRequestComment = async ({
  githubToken,
  repositoryName,
  repositoryOwner,
  commentId,
  commentBody,
  pullRequestNumber
}) => {
  let updatePullRequestCommentResponse;

  try {
    updatePullRequestCommentResponse = await genericUpdatePullRequestComment({
      githubToken,
      repositoryOwner,
      repositoryName,
      commentId,
      commentBody
    });
  } catch (e) {
    throw createErrorWhileUpdatingPullRequestComment({
      error: e,
      commentId,
      pullRequestNumber,
      repositoryName,
      repositoryOwner
    });
  }

  if (updatePullRequestCommentResponse.status !== 200) {
    throw createUnexpectedResponseForUpdatePullRequestComment({
      response: updatePullRequestCommentResponse,
      responseBodyAsJson: await updatePullRequestCommentResponse.json()
    });
  }

  return updatePullRequestCommentResponse;
};

const genericUpdatePullRequestComment = async ({
  githubToken,
  repositoryOwner,
  repositoryName,
  commentId,
  commentBody
}) => {
  const href = `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/comments/${commentId}`;
  const body = JSON.stringify({
    body: commentBody
  });
  const response = await fetchUrl(href, {
    standard: true,
    headers: {
      "authorization": `token ${githubToken}`,
      "content-length": Buffer.byteLength(body)
    },
    method: "PATCH",
    body
  });
  return response;
};

const createErrorWhileUpdatingPullRequestComment = ({
  error,
  commentId,
  repositoryName,
  repositoryOwner,
  pullRequestNumber
}) => new Error(`error while updating pull request comment.
error : ${error.stack}
comment id: ${commentId}
pull request number: ${pullRequestNumber}
repository name: ${repositoryName}
repository owner: ${repositoryOwner}`);

const createUnexpectedResponseForUpdatePullRequestComment = ({
  response,
  responseBodyAsJson
}) => new Error(`update pull request comment failed: response status should be 200.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), "  ")}`);

const enDecimalFormatter = new Intl.NumberFormat("en", {
  style: "decimal"
});

const formatSizeFallback = size => `${enDecimalFormatter.format(size)} bytes`;

const generatePullRequestCommentString = ({
  pullRequestBase,
  pullRequestHead,
  snapshotComparison,
  formatSize = formatSizeFallback,
  // this is to inform someone wondering where this message comes from
  // do not confuse this with advertising
  // if you don't like it, you can pass this option to false
  generatedByLink = true
}) => {
  const directoryMessages = Object.keys(snapshotComparison).map(directoryRelativeUrl => {
    const directoryComparison = snapshotComparison[directoryRelativeUrl];
    const sizeImpactMap = {};
    let sizeImpact = 0;
    let hasImpact = false;
    Object.keys(directoryComparison).forEach(relativeUrl => {
      const {
        base,
        head
      } = directoryComparison[relativeUrl]; // added

      if (!base) {
        const headSize = head.size;

        if (headSize !== 0) {
          sizeImpactMap[relativeUrl] = {
            why: "added",
            baseSize: 0,
            headSize,
            diffSize: headSize
          };
          hasImpact = true;
          sizeImpact += headSize;
        }
      } // removed
      else if (base && !head) {
          const baseSize = base.size;

          if (baseSize !== 0) {
            sizeImpactMap[relativeUrl] = {
              why: "removed",
              baseSize,
              headSize: 0,
              diffSize: -baseSize
            };
            hasImpact = true;
            sizeImpact -= baseSize;
          }
        } // changed
        else if (base && head) {
            const baseSize = base.size;
            const headSize = head.size;
            const diffSize = headSize - baseSize;

            if (base.hash !== head.hash) {
              sizeImpactMap[relativeUrl] = {
                why: "changed",
                baseSize,
                headSize,
                diffSize
              };
              hasImpact = true;
              sizeImpact += diffSize;
            }
          }
    });
    const sizeImpactText = generateSizeImpactText({
      directoryRelativeUrl,
      formatSize,
      sizeImpact
    });
    return `<details>
  <summary>Merging <code>${pullRequestHead}</code> into <code>${pullRequestBase}</code> will ${sizeImpactText}</summary>
${generateSizeImpactDetails({
      pullRequestBase,
      pullRequestHead,
      formatSize,
      sizeImpactMap,
      hasImpact,
      sizeImpact
    })}
</details>`;
  });
  if (directoryMessages.length === 0) return null;
  return `
${directoryMessages.join(`
---
`)}${generatedByLink ? `

<sub>Generated by [github pull request filesize impact](https://github.com/jsenv/jsenv-github-pull-request-filesize-impact)</sub>` : ""}`;
};

const generateSizeImpactDetails = ({
  pullRequestBase,
  pullRequestHead,
  formatSize,
  sizeImpactMap,
  hasImpact,
  sizeImpact
}) => {
  if (hasImpact) {
    return `${generateSizeImpactTable({
      pullRequestBase,
      pullRequestHead,
      formatSize,
      sizeImpactMap
    })}

**Overall size impact:** ${formatSizeImpact(formatSize, sizeImpact)}.<br />
**Cache impact:** ${formatCacheImpact(formatSize, sizeImpactMap)}`;
  }

  return `changes don't affect the overall size or cache.`;
};

const generateSizeImpactTable = ({
  pullRequestBase,
  pullRequestHead,
  formatSize,
  sizeImpactMap
}) => `<br />
${renderTableHeaders({
  pullRequestBase,
  pullRequestHead
})}
${renderTableBody({
  sizeImpactMap,
  formatSize
})}`;

const renderTableHeaders = ({
  pullRequestBase,
  pullRequestHead
}) => {
  const headerNames = ["event", "file", `size&nbsp;on&nbsp;\`${pullRequestBase}\``, `size&nbsp;on&nbsp;\`${pullRequestHead}\``, "size&nbsp;impact"];
  return `
${headerNames.join(" | ")}
${headerNames.map(() => `---`).join(" | ")}`;
};

const renderTableBody = ({
  sizeImpactMap,
  formatSize
}) => {
  return Object.keys(sizeImpactMap).map(relativePath => {
    const sizeImpact = sizeImpactMap[relativePath];
    return [generateEventCellText(sizeImpact.why), relativePath, generateBaseCellText({
      formatSize,
      sizeImpact
    }), generateHeadCellText({
      formatSize,
      sizeImpact
    }), generateImpactCellText({
      formatSize,
      sizeImpact
    })].join(" | ");
  }).join(`
`);
};

const generateEventCellText = why => {
  if (why === "added") {
    return "file&nbsp;created";
  }

  if (why === "removed") {
    return "file&nbsp;deleted";
  }

  return "content&nbsp;changed";
};

const generateBaseCellText = ({
  formatSize,
  sizeImpact: {
    baseSize,
    why
  }
}) => {
  if (why === "added") {
    return "---";
  }

  return formatSize(baseSize);
};

const generateHeadCellText = ({
  formatSize,
  sizeImpact: {
    headSize,
    why
  }
}) => {
  if (why === "removed") {
    return "---";
  }

  return formatSize(headSize);
};

const generateImpactCellText = ({
  formatSize,
  sizeImpact: {
    diffSize
  }
}) => {
  return formatSizeImpact(formatSize, diffSize);
};

const generateSizeImpactText = ({
  directoryRelativeUrl,
  formatSize,
  sizeImpact
}) => {
  if (sizeImpact === 0) {
    return `<b>not impact</b> <code>${directoryRelativeUrl}</code> overall size.`;
  }

  if (sizeImpact < 0) {
    return `<b>decrease</b> <code>${directoryRelativeUrl}</code> overall size by ${formatSize(Math.abs(sizeImpact))}.`;
  }

  return `<b>increase</b> <code>${directoryRelativeUrl}</code> overall size by ${formatSize(sizeImpact)}.`;
};

const formatSizeImpact = (formatSize, diffSize) => {
  if (diffSize > 0) return `+${formatSize(diffSize)}`;
  if (diffSize < 0) return `-${formatSize(Math.abs(diffSize))}`;
  return 0;
};

const formatCacheImpact = (formatSize, sizeImpactMap) => {
  const changedFiles = Object.keys(sizeImpactMap).filter(relativePath => {
    return sizeImpactMap[relativePath].why === "changed";
  });
  const numberOfChangedFiles = changedFiles.length;

  if (numberOfChangedFiles === 0) {
    return "none.";
  }

  const numberOfBytes = changedFiles.reduce((number, relativePath) => {
    return number + sizeImpactMap[relativePath].baseSize;
  }, 0);
  return `${numberOfChangedFiles} files content changed, invalidating a total of ${formatSize(numberOfBytes)}.`;
};

const compareTwoSnapshots = (baseSnapshot, headSnapshot) => {
  const comparison = {};
  Object.keys(headSnapshot).forEach(directoryRelativeUrl => {
    comparison[directoryRelativeUrl] = compareDirectorySnapshot(baseSnapshot[directoryRelativeUrl], headSnapshot[directoryRelativeUrl]);
  });
  return comparison;
};

const compareDirectorySnapshot = (baseSnapshot, headSnapshot) => {
  const snapshotComparison = {};

  if (!baseSnapshot) {
    // may happen when a key in directorySizeTrackingConfig was deleted
    // in that case we don't care about this directory anymore
    return snapshotComparison;
  }

  const baseManifest = baseSnapshot.manifest || {};
  const headManifest = headSnapshot.manifest || {};
  const baseReport = baseSnapshot.report;
  const headReport = headSnapshot.report;
  const baseMappings = manifestToMappings(baseManifest);
  const headMappings = manifestToMappings(headManifest);

  const added = (relativeUrl, headRelativeUrl) => {
    snapshotComparison[relativeUrl] = {
      base: null,
      head: {
        relativeUrl: headRelativeUrl,
        ...headReport[headRelativeUrl]
      }
    };
  };

  const removed = (relativeUrl, baseRelativeUrl) => {
    snapshotComparison[relativeUrl] = {
      base: {
        relativeUrl: baseRelativeUrl,
        ...baseReport[baseRelativeUrl]
      },
      head: null
    };
  };

  const updated = (relativeUrl, baseRelativeUrl, headRelativeUrl) => {
    snapshotComparison[relativeUrl] = {
      base: {
        relativeUrl: baseRelativeUrl,
        ...baseReport[baseRelativeUrl]
      },
      head: {
        relativeUrl: headRelativeUrl,
        ...headReport[headRelativeUrl]
      }
    };
  };

  Object.keys(headReport).forEach(headRelativeUrl => {
    if (headRelativeUrl in headMappings) {
      const headRelativeUrlMapped = headMappings[headRelativeUrl];

      if (headRelativeUrlMapped in baseManifest) {
        // the mapping should be the same and already found while iterating
        // baseReport, otherwise it means the mappings
        // of heads and base are different right ?
        const baseRelativeUrl = baseManifest[headRelativeUrlMapped];
        updated(headRelativeUrlMapped, baseRelativeUrl, headRelativeUrl);
      } else if (headRelativeUrl in baseReport) {
        updated(headRelativeUrlMapped, headRelativeUrl, headRelativeUrl);
      } else {
        added(headRelativeUrlMapped, headRelativeUrl);
      }
    } else if (headRelativeUrl in baseReport) {
      updated(headRelativeUrl, headRelativeUrl, headRelativeUrl);
    } else {
      added(headRelativeUrl, headRelativeUrl);
    }
  });
  const headTrackingConfig = headSnapshot.trackingConfig;
  const directoryUrl = "file:///directory/";
  const headSpecifierMetaMap = normalizeSpecifierMetaMap(metaMapToSpecifierMetaMap({
    track: headTrackingConfig
  }), directoryUrl);
  Object.keys(baseReport).forEach(baseRelativeUrl => {
    const baseUrl = resolveUrl(baseRelativeUrl, directoryUrl);

    if (!urlToMeta({
      url: baseUrl,
      specifierMetaMap: headSpecifierMetaMap
    }).track) {
      // head tracking config is not interested into this file anymore
      return;
    }

    if (baseRelativeUrl in baseMappings) {
      const baseRelativeUrlMapped = baseMappings[baseRelativeUrl];

      if (baseRelativeUrlMapped in headManifest) {
        const headRelativeUrl = headManifest[baseRelativeUrlMapped];
        updated(baseRelativeUrlMapped, baseRelativeUrl, headRelativeUrl);
      } else if (baseRelativeUrl in headReport) {
        updated(baseRelativeUrlMapped, baseRelativeUrl, baseRelativeUrl);
      } else {
        removed(baseRelativeUrlMapped, baseRelativeUrl);
      }
    } else if (baseRelativeUrl in headReport) {
      updated(baseRelativeUrl, baseRelativeUrl, baseRelativeUrl);
    } else {
      removed(baseRelativeUrl, baseRelativeUrl);
    }
  });
  return sortDirectoryStructure(snapshotComparison);
};

const manifestToMappings = manifest => {
  const mappings = {};

  if (manifest) {
    Object.keys(manifest).forEach(originalRelativeUrl => {
      mappings[manifest[originalRelativeUrl]] = originalRelativeUrl;
    });
  }

  return mappings;
};

const sortDirectoryStructure = directoryStructure => {
  const relativeUrlSortedArray = Object.keys(directoryStructure).sort(comparePathnames);
  const directoryStructureSorted = {};
  relativeUrlSortedArray.forEach(relativeUrl => {
    directoryStructureSorted[relativeUrl] = directoryStructure[relativeUrl];
  });
  return directoryStructureSorted;
};

const regexForMergingSizeImpact = /Merging .*? into .*? will .*? overall size/;
const reportSizeImpactIntoGithubPullRequest = async ({
  logLevel,
  projectDirectoryUrl,
  baseSnapshotFileRelativeUrl,
  headSnapshotFileRelativeUrl,
  formatSize,
  generatedByLink
}) => {
  const logger = createLogger({
    logLevel
  });
  projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl);

  if (typeof baseSnapshotFileRelativeUrl !== "string") {
    throw new TypeError(`baseSnapshotFileRelativeUrl must be a string, got ${baseSnapshotFileRelativeUrl}`);
  }

  if (typeof headSnapshotFileRelativeUrl !== "string") {
    throw new TypeError(`headSnapshotFileRelativeUrl must be a string, got ${headSnapshotFileRelativeUrl}`);
  }

  const {
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    pullRequestBase,
    pullRequestHead,
    githubToken
  } = getOptionsFromGithubAction();
  const baseSnapshotFileUrl = resolveUrl(baseSnapshotFileRelativeUrl, projectDirectoryUrl);
  const headSnapshotFileUrl = resolveUrl(headSnapshotFileRelativeUrl, projectDirectoryUrl);
  logger.debug(`
compare file snapshots
--- base snapshot file path ---
${urlToFileSystemPath(baseSnapshotFileUrl)}
--- head snapshot file path ---
${urlToFileSystemPath(headSnapshotFileUrl)}
`);
  const snapshotsPromise = Promise.all([readFile(baseSnapshotFileUrl), readFile(headSnapshotFileUrl)]);
  logger.debug(`
search for existing comment inside pull request.
--- pull request url ---
${getPullRequestHref({
    repositoryOwner,
    repositoryName,
    pullRequestNumber
  })}
`);
  const existingCommentPromise = getPullRequestCommentMatching({
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    githubToken,
    regex: regexForMergingSizeImpact
  });
  const [[baseSnapshotFileContent, headSnapshotFileContent], existingComment] = await Promise.all([snapshotsPromise, existingCommentPromise]);
  logger.debug(`
--- base snapshot file content ---
${baseSnapshotFileContent}
`);
  logger.debug(`
--- head snapshot file content ---
${headSnapshotFileContent}
`);
  const snapshotComparison = compareTwoSnapshots(JSON.parse(baseSnapshotFileContent), JSON.parse(headSnapshotFileContent));
  const pullRequestCommentString = generatePullRequestCommentString({
    pullRequestBase,
    pullRequestHead,
    snapshotComparison,
    formatSize,
    generatedByLink
  });

  if (!pullRequestCommentString) {
    logger.warn(`
aborting because the pull request comment would be empty.
May happen whem a snapshot file is empty for instance
`);
  }

  if (existingComment) {
    logger.debug(`comment found, updating it
--- comment href ---
${existingComment.html_url}`);
    const comment = await updatePullRequestComment({
      githubToken,
      repositoryOwner,
      repositoryName,
      pullRequestNumber,
      commentId: existingComment.id,
      commentBody: pullRequestCommentString
    });
    logger.info(`comment updated at ${existingComment.html_url}`);
    return comment;
  }

  logger.debug(`comment not found, creating a comment`);
  const comment = await createPullRequestComment({
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    githubToken,
    commentBody: pullRequestCommentString
  });
  logger.info(`comment created at ${comment.html_url}`);
  return comment;
};

const getOptionsFromGithubAction = () => {
  const eventName = process.env.GITHUB_EVENT_NAME;

  if (!eventName) {
    throw new Error(`missing process.env.GITHUB_EVENT_NAME, we are not in a github action`);
  }

  if (eventName !== "pull_request") {
    throw new Error(`getOptionsFromGithubAction must be called only in a pull request action`);
  }

  const githubRepository = process.env.GITHUB_REPOSITORY;

  if (!githubRepository) {
    throw new Error(`missing process.env.GITHUB_REPOSITORY`);
  }

  const [repositoryOwner, repositoryName] = githubRepository.split("/");
  const githubRef = process.env.GITHUB_REF;

  if (!githubRef) {
    throw new Error(`missing process.env.GITHUB_REF`);
  }

  const pullRequestNumber = githubRefToPullRequestNumber();

  if (!pullRequestNumber) {
    throw new Error(`cannot get pull request number from process.env.GITHUB_REF
--- process.env.GITHUB_REF ---
${githubRef}`);
  }

  const githubBaseRef = process.env.GITHUB_BASE_REF;

  if (!githubBaseRef) {
    throw new Error(`missing process.env.GITHUB_BASE_REF`);
  }

  const pullRequestBase = githubBaseRef;
  const githubHeadRef = process.env.GITHUB_HEAD_REF;

  if (!githubHeadRef) {
    throw new Error(`missing process.env.GITHUB_HEAD_REF`);
  }

  const pullRequestHead = githubHeadRef;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    throw new Error(`missing process.env.GITHUB_TOKEN`);
  }

  return {
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    pullRequestBase,
    pullRequestHead,
    githubToken
  };
};

const githubRefToPullRequestNumber = () => {
  const ref = process.env.GITHUB_REF;
  const pullPrefix = "refs/pull/";
  const pullRequestNumberStartIndex = ref.indexOf(pullPrefix);
  if (pullRequestNumberStartIndex === -1) return undefined;
  const afterPull = ref.slice(pullRequestNumberStartIndex + pullPrefix.length);
  const slashAfterPullIndex = afterPull.indexOf("/");
  if (slashAfterPullIndex === -1) return undefined;
  const pullRequestNumberString = afterPull.slice(0, slashAfterPullIndex);
  return Number(pullRequestNumberString);
};

const getPullRequestHref = ({
  repositoryOwner,
  repositoryName,
  pullRequestNumber
}) => `https://github.com/${repositoryOwner}/${repositoryName}/pull/${pullRequestNumber}`;

exports.generateSnapshotFile = generateSnapshotFile;
exports.jsenvDirectorySizeTrackingConfig = jsenvDirectorySizeTrackingConfig;
exports.reportSizeImpactIntoGithubPullRequest = reportSizeImpactIntoGithubPullRequest;
//# sourceMappingURL=main.js.map
