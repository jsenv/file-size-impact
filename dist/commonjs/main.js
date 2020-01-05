'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var url$1 = require('url');
var path = require('path');
var util = require('util');
var crypto = require('crypto');

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

  throw new Error(createUnexpectedLogLevelMessage({
    logLevel
  }));
};

const createUnexpectedLogLevelMessage = ({
  logLevel
}) => `unexpected logLevel.
--- logLevel ---
${logLevel}
--- allowed log levels ---
${LOG_LEVEL_OFF}
${LOG_LEVEL_ERROR}
${LOG_LEVEL_WARN}
${LOG_LEVEL_INFO}
${LOG_LEVEL_DEBUG}
`;

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
  return thirdChar === "/";
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

const ensureUrlTrailingSlash = url => {
  return url.endsWith("/") ? url : `${url}/`;
};
const urlToFilePath = fileUrl => {
  return url$1.fileURLToPath(fileUrl);
};
const hasScheme$1 = string => {
  return /^[a-zA-Z]{2,}:/.test(string);
};
const urlToRelativeUrl = (url, baseUrl) => {
  if (typeof baseUrl !== "string") {
    throw new TypeError(`baseUrl must be a string, got ${baseUrl}`);
  }

  if (url.startsWith(baseUrl)) {
    return url.slice(baseUrl.length);
  }

  return url;
};

const normalizeDirectoryUrl = value => {
  if (value instanceof URL) {
    value = value.href;
  }

  if (typeof value === "string") {
    const url = hasScheme$1(value) ? value : urlToFilePath(value);

    if (!url.startsWith("file://")) {
      throw new Error(`directoryUrl must starts with file://, received ${value}`);
    }

    return ensureUrlTrailingSlash(url);
  }

  throw new TypeError(`directoryUrl must be a string or an url, received ${value}`);
};

const compareFilePath = (leftPath, rightPath) => {
  const leftPartArray = leftPath.split("/");
  const rightPartArray = rightPath.split("/");
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
  const rootDirectoryUrl = normalizeDirectoryUrl(directoryUrl);

  if (typeof predicate !== "function") {
    throw new TypeError(`predicate must be a function, got ${predicate}`);
  }

  if (typeof matchingFileOperation !== "function") {
    throw new TypeError(`matchingFileOperation must be a function, got ${matchingFileOperation}`);
  }

  const specifierMetaMapNormalized = normalizeSpecifierMetaMap(specifierMetaMap, rootDirectoryUrl);
  const matchingFileResultArray = [];

  const visitDirectory = async directoryUrl => {
    const directoryPath = urlToFilePath(directoryUrl);
    const directoryItems = await createOperation({
      cancellationToken,
      start: () => readDirectory(directoryPath)
    });
    await Promise.all(directoryItems.map(async directoryItem => {
      const directoryItemUrl = `${directoryUrl}${directoryItem}`;
      const directoryItemPath = urlToFilePath(directoryItemUrl);
      const lstat = await createOperation({
        cancellationToken,
        start: () => readLStat(directoryItemPath)
      });

      if (lstat.isDirectory()) {
        const subDirectoryUrl = `${directoryItemUrl}/`;

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

      if (lstat.isFile()) {
        const meta = urlToMeta({
          url: directoryItemUrl,
          specifierMetaMap: specifierMetaMapNormalized
        });
        if (!predicate(meta)) return;
        const relativeUrl = urlToRelativeUrl(directoryItemUrl, rootDirectoryUrl);
        const operationResult = await createOperation({
          cancellationToken,
          start: () => matchingFileOperation({
            cancellationToken,
            relativeUrl,
            meta,
            lstat
          })
        });
        matchingFileResultArray.push({
          relativeUrl,
          meta,
          lstat,
          operationResult
        });
        return;
      } // we ignore symlink because recursively traversed
      // so symlinked file will be discovered.
      // Moreover if they lead outside of directoryPath it can become a problem
      // like infinite recursion of whatever.
      // that we could handle using an object of pathname already seen but it will be useless
      // because directoryPath is recursively traversed

    }));
  };

  await visitDirectory(rootDirectoryUrl); // When we operate on thoose files later it feels more natural
  // to perform operation in the same order they appear in the filesystem.
  // It also allow to get a predictable return value.
  // For that reason we sort matchingFileResultArray

  matchingFileResultArray.sort((leftFile, rightFile) => {
    return compareFilePath(leftFile.relativeUrl, rightFile.relativeUrl);
  });
  return matchingFileResultArray;
};

const readDirectory = filePath => new Promise((resolve, reject) => {
  fs.readdir(filePath, (error, names) => {
    if (error) {
      reject(error);
    } else {
      resolve(names);
    }
  });
});

const readLStat = filePath => new Promise((resolve, reject) => {
  fs.lstat(filePath, (error, stat) => {
    if (error) {
      reject(error);
    } else {
      resolve(stat);
    }
  });
});

const ensureUrlTrailingSlash$1 = url => {
  return url.endsWith("/") ? url : `${url}/`;
};
const urlToFilePath$1 = fileUrl => {
  return url$1.fileURLToPath(fileUrl);
};
const resolveDirectoryUrl = (specifier, baseUrl) => {
  const directoryUrl = String(new URL(specifier, baseUrl));

  if (directoryUrl.endsWith("/")) {
    return directoryUrl;
  }

  return `${directoryUrl}/`;
};

const hasScheme$2 = string => {
  return /^[a-zA-Z]{2,}:/.test(string);
};
const resolveUrl = (specifier, baseUrl) => {
  if (typeof baseUrl === "undefined") {
    throw new TypeError(`baseUrl missing`);
  }

  return String(new URL(specifier, baseUrl));
};

const readFilePromisified = util.promisify(fs.readFile);
const readFileContent = async filePath => {
  const buffer = await readFilePromisified(filePath);
  return buffer.toString();
};
const writeFilePromisified = util.promisify(fs.writeFile);
const writeFileContent = async (filePath, content) => {
  await createFileDirectories(filePath);
  return writeFilePromisified(filePath, content);
};
const createFileDirectories = filePath => {
  return new Promise((resolve, reject) => {
    fs.mkdir(path.dirname(filePath), {
      recursive: true
    }, error => {
      if (error) {
        if (error.code === "EEXIST") {
          resolve();
          return;
        }

        reject(error);
        return;
      }

      resolve();
    });
  });
};

const normalizeDirectoryUrl$1 = (value, name = "projectDirectoryUrl") => {
  if (value instanceof URL) {
    value = value.href;
  }

  if (typeof value === "string") {
    const url = hasScheme$2(value) ? value : urlToFilePath$1(value);

    if (!url.startsWith("file://")) {
      throw new Error(`${name} must starts with file://, received ${value}`);
    }

    return ensureUrlTrailingSlash$1(url);
  }

  throw new TypeError(`${name} must be a string or an url, received ${value}`);
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

const EMPTY_ID = '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
const bufferToEtag = buffer => {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError(`buffer expected, got ${buffer}`);
  }

  if (buffer.length === 0) {
    return EMPTY_ID;
  }

  const hash = crypto.createHash("sha1");
  hash.update(buffer, "utf8");
  const hashBase64String = hash.digest("base64");
  const hashBase64StringSubset = hashBase64String.slice(0, 27);
  const length = buffer.length;
  return `"${length.toString(16)}-${hashBase64StringSubset}"`;
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
  projectDirectoryUrl = normalizeDirectoryUrl$1(projectDirectoryUrl);
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
  const snapshotFilePath = urlToFilePath$1(snapshotFileUrl);
  logger.info(`write snapshot file at ${snapshotFilePath}`);
  const snapshotFileContent = JSON.stringify(snapshot, null, "  ");
  logger.debug(snapshotFileContent);
  await writeFileContent(snapshotFilePath, snapshotFileContent);
};

const readDirectoryManifest = async ({
  logger,
  manifestFilename,
  directoryUrl
}) => {
  const manifestFileUrl = resolveUrl(manifestFilename, directoryUrl);
  const manifestFilePath = urlToFilePath$1(manifestFileUrl);

  try {
    const manifestFileContent = await readFileContent(manifestFilePath);
    return JSON.parse(manifestFileContent);
  } catch (e) {
    if (e && e.code === "ENOENT") {
      logger.debug(`manifest file not found at ${manifestFilePath}`);
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
  const directoryPath = urlToFilePath$1(directoryUrl);
  const directoryFileReport = {};

  try {
    await collectFiles({
      directoryUrl,
      specifierMetaMap,
      predicate: meta => meta.track === true,
      matchingFileOperation: async ({
        relativeUrl,
        lstat
      }) => {
        if (!lstat.isFile()) {
          return;
        }

        if (manifest && relativeUrl === manifestFilename) {
          return;
        }

        const fileUrl = resolveUrl(relativeUrl, directoryUrl);
        const filePath = urlToFilePath$1(fileUrl);
        const fileContent = await readFileContent(filePath);
        const hash = bufferToEtag(Buffer.from(fileContent));
        directoryFileReport[relativeUrl] = {
          size: lstat.size,
          hash
        };
      }
    });
  } catch (e) {
    if (e.code === "ENOENT" && e.path === directoryPath) {
      logger.warn(`${directoryPath} does not exists`);
      return directoryFileReport;
    }

    throw e;
  }

  return directoryFileReport;
};

// eslint-disable-next-line import/no-unresolved
const nodeRequire = require;
const filenameContainsBackSlashes = __filename.indexOf("\\") > -1;
const url = filenameContainsBackSlashes ? `file:///${__filename.replace(/\\/g, "/")}` : `file://${__filename}`;

const fetch = nodeRequire("node-fetch");

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
  const response = await fetch(`https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`, {
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
const fetch$1 = nodeRequire("node-fetch");

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
  const response = await fetch$1(`https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`, {
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
const fetch$2 = nodeRequire("node-fetch");

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
  const response = await fetch$2(href, {
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

              if (diffSize !== 0) {
                sizeImpact += diffSize;
              }
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

**Overall size impact:** ${formatSizeImpact(formatSize, sizeImpact)}.
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
event | file | size on \`${pullRequestBase}\` | size on \`${pullRequestHead}\`| size impact
----- | ---- | ------------------------------ | ----------------------------- | ------------
${Object.keys(sizeImpactMap).map(relativePath => {
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
`)}`;

const generateEventCellText = why => {
  if (why === "added") {
    return "file created";
  }

  if (why === "removed") {
    return "file deleted";
  }

  return "content changed";
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
  const relativeUrlSortedArray = Object.keys(directoryStructure).sort(compareFilePath);
  const directoryStructureSorted = {};
  relativeUrlSortedArray.forEach(relativeUrl => {
    directoryStructureSorted[relativeUrl] = directoryStructure[relativeUrl];
  });
  return directoryStructureSorted;
};

const regexForMergingSizeImpact = /Merging .*? into .*? would .*? size/;
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
  projectDirectoryUrl = normalizeDirectoryUrl$1(projectDirectoryUrl);

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
  const baseSnapshotFilePath = urlToFilePath$1(baseSnapshotFileUrl);
  const headSnapshotFilePath = urlToFilePath$1(headSnapshotFileUrl);
  logger.debug(`
compare file snapshots
--- base snapshot file path ---
${baseSnapshotFilePath}
--- head snapshot file path ---
${headSnapshotFilePath}
`);
  const snapshotsPromise = Promise.all([readFileContent(baseSnapshotFilePath), readFileContent(headSnapshotFilePath)]);
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
