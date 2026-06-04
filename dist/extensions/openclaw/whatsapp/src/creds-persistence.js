"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get enqueueCredsSave () {
        return enqueueCredsSave;
    },
    get waitForCredsSaveQueue () {
        return waitForCredsSaveQueue;
    },
    get waitForCredsSaveQueueWithTimeout () {
        return waitForCredsSaveQueueWithTimeout;
    },
    get writeCredsJsonAtomically () {
        return writeCredsJsonAtomically;
    },
    get writeWebCredsRawAtomically () {
        return writeWebCredsRawAtomically;
    }
});
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _securityruntime = require("../../../../common/openclaw/plugin-sdk/security-runtime");
const _credsfiles = require("./creds-files.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const CREDS_FILE_MODE = 0o600;
const CREDS_SAVE_FLUSH_TIMEOUT_MS = 15_000;
const credsSaveQueues = new Map();
async function stringifyCreds(creds) {
    const { BufferJSON } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./session.runtime.js")));
    return JSON.stringify(creds, BufferJSON.replacer);
}
async function writeWebCredsRawAtomically(params) {
    await (0, _credsfiles.assertWebCredsPathRegularFileOrMissing)(params.filePath);
    await (0, _securityruntime.replaceFileAtomic)({
        filePath: params.filePath,
        content: params.content,
        dirMode: 0o700,
        mode: CREDS_FILE_MODE,
        tempPrefix: params.tempPrefix,
        syncTempFile: true,
        syncParentDir: true,
        beforeRename: async ({ filePath })=>{
            await (0, _credsfiles.assertWebCredsPathRegularFileOrMissing)(filePath);
        }
    });
}
async function writeCredsJsonAtomically(authDir, creds) {
    await writeWebCredsRawAtomically({
        filePath: (0, _credsfiles.resolveWebCredsPath)(authDir),
        content: await stringifyCreds(creds),
        tempPrefix: ".creds"
    });
}
function enqueueCredsSave(authDir, saveCreds, onError) {
    const previous = credsSaveQueues.get(authDir) ?? Promise.resolve();
    const next = previous.then(()=>saveCreds()).catch((error)=>{
        onError(error);
    }).finally(()=>{
        if (credsSaveQueues.get(authDir) === next) {
            credsSaveQueues.delete(authDir);
        }
    });
    credsSaveQueues.set(authDir, next);
}
function waitForCredsSaveQueue(authDir) {
    if (authDir) {
        return credsSaveQueues.get(authDir) ?? Promise.resolve();
    }
    return Promise.all(credsSaveQueues.values()).then(()=>{});
}
async function waitForCredsSaveQueueWithTimeout(authDir, timeoutMs = CREDS_SAVE_FLUSH_TIMEOUT_MS) {
    const boundedTimeoutMs = (0, _numberruntime.resolveTimerTimeoutMs)(timeoutMs, CREDS_SAVE_FLUSH_TIMEOUT_MS, 0);
    let flushTimeout;
    return await Promise.race([
        waitForCredsSaveQueue(authDir).then(()=>"drained"),
        new Promise((resolve)=>{
            flushTimeout = setTimeout(()=>resolve("timed_out"), boundedTimeoutMs);
        })
    ]).finally(()=>{
        if (flushTimeout) {
            clearTimeout(flushTimeout);
        }
    });
}

//# sourceMappingURL=creds-persistence.js.map