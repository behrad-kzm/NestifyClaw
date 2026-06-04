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
    get TELEGRAM_MESSAGE_DISPATCH_DEDUPE_MAX_ENTRIES () {
        return TELEGRAM_MESSAGE_DISPATCH_DEDUPE_MAX_ENTRIES;
    },
    get TELEGRAM_MESSAGE_DISPATCH_DEDUPE_NAMESPACE () {
        return TELEGRAM_MESSAGE_DISPATCH_DEDUPE_NAMESPACE;
    },
    get buildTelegramMessageDispatchReplayKey () {
        return buildTelegramMessageDispatchReplayKey;
    },
    get claimTelegramMessageDispatchReplay () {
        return claimTelegramMessageDispatchReplay;
    },
    get commitTelegramMessageDispatchReplay () {
        return commitTelegramMessageDispatchReplay;
    },
    get createTelegramMessageDispatchReplayGuard () {
        return createTelegramMessageDispatchReplayGuard;
    },
    get listTelegramLegacyMessageDispatchDedupeEntries () {
        return listTelegramLegacyMessageDispatchDedupeEntries;
    },
    get releaseTelegramMessageDispatchReplay () {
        return releaseTelegramMessageDispatchReplay;
    },
    get resolveTelegramMessageDispatchLegacyPath () {
        return resolveTelegramMessageDispatchLegacyPath;
    },
    get setTelegramMessageDispatchDedupeStoreForTest () {
        return setTelegramMessageDispatchDedupeStoreForTest;
    }
});
const _nodecrypto = require("node:crypto");
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _runtime = require("./runtime.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const TELEGRAM_MESSAGE_DISPATCH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TELEGRAM_MESSAGE_DISPATCH_DEDUPE_NAMESPACE = "telegram.message-dispatch-dedupe";
const TELEGRAM_MESSAGE_DISPATCH_DEDUPE_MAX_ENTRIES = 4_096;
const TELEGRAM_MESSAGE_DISPATCH_DEDUPE_LOGICAL_MAX_ENTRIES = 50_000;
const TELEGRAM_MESSAGE_DISPATCH_DEDUPE_BUCKET_COUNT = 256;
const TELEGRAM_MESSAGE_DISPATCH_DEDUPE_BUCKET_MAX_KEYS = 256;
const TELEGRAM_MESSAGE_DISPATCH_DEDUPE_LOCK_TTL_MS = 30_000;
const TELEGRAM_MESSAGE_DISPATCH_DEDUPE_LOCK_RETRY_MS = 10;
const TELEGRAM_MESSAGE_DISPATCH_DEDUPE_LOCK_ATTEMPTS = 50;
let dispatchDedupeStoreForTest;
function openDispatchDedupeStore() {
    if (dispatchDedupeStoreForTest) {
        return dispatchDedupeStoreForTest;
    }
    return (0, _runtime.getOptionalTelegramRuntime)()?.state.openKeyedStore({
        namespace: TELEGRAM_MESSAGE_DISPATCH_DEDUPE_NAMESPACE,
        maxEntries: TELEGRAM_MESSAGE_DISPATCH_DEDUPE_MAX_ENTRIES
    });
}
function resolveDispatchScopeKey(storePath) {
    return (0, _nodecrypto.createHash)("sha256").update(storePath, "utf8").digest("hex").slice(0, 24);
}
function dedupeEntryKey(scopeKey, namespace, key) {
    return (0, _nodecrypto.createHash)("sha256").update(`${scopeKey}\0${namespace}\0${key}`, "utf8").digest("hex").slice(0, 32);
}
function dedupeBucketId(key) {
    const bucketIndex = Number.parseInt((0, _nodecrypto.createHash)("sha256").update(key, "utf8").digest("hex").slice(0, 8), 16) % TELEGRAM_MESSAGE_DISPATCH_DEDUPE_BUCKET_COUNT;
    return bucketIndex.toString(16).padStart(2, "0");
}
function dedupeBucketEntryKey(scopeKey, namespace, bucketId) {
    return (0, _nodecrypto.createHash)("sha256").update(`${scopeKey}\0${namespace}\0${bucketId}`, "utf8").digest("hex").slice(0, 32);
}
function dedupeLegacyBucketEntryKey(params) {
    const sourceKey = (0, _nodecrypto.createHash)("sha256").update(params.sourcePath, "utf8").digest("hex").slice(0, 12);
    return dedupeBucketEntryKey(params.scopeKey, params.namespace, `${params.bucketId}:${sourceKey}`);
}
function dedupeBucketLockKey(bucketKey) {
    return `${bucketKey}:lock`;
}
async function sleep(ms) {
    await new Promise((resolve)=>{
        setTimeout(resolve, ms);
    });
}
function pruneDedupeBucketEntries(entries, now) {
    for (const [key, timestamp] of Object.entries(entries)){
        if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
            delete entries[key];
            continue;
        }
        if (now - timestamp >= TELEGRAM_MESSAGE_DISPATCH_TTL_MS) {
            delete entries[key];
        }
    }
    const keys = Object.keys(entries);
    if (keys.length <= TELEGRAM_MESSAGE_DISPATCH_DEDUPE_BUCKET_MAX_KEYS) {
        return;
    }
    for (const key of keys.toSorted((left, right)=>entries[left] - entries[right]).slice(0, keys.length - TELEGRAM_MESSAGE_DISPATCH_DEDUPE_BUCKET_MAX_KEYS)){
        delete entries[key];
    }
}
function createDedupeBucketRecord(params) {
    return {
        scopeKey: params.scopeKey,
        namespace: params.namespace,
        bucketId: params.bucketId,
        entries: {
            ...params.entries
        }
    };
}
function normalizeDedupeBucketRecord(value, params) {
    const entries = value?.scopeKey === params.scopeKey && value.namespace === params.namespace && value.bucketId === params.bucketId && value.entries && typeof value.entries === "object" ? {
        ...value.entries
    } : {};
    pruneDedupeBucketEntries(entries, params.now);
    return createDedupeBucketRecord({
        scopeKey: params.scopeKey,
        namespace: params.namespace,
        bucketId: params.bucketId,
        entries
    });
}
async function lookupDedupeBucketContains(params) {
    const bucket = normalizeDedupeBucketRecord(await params.store.lookup(params.bucketKey), params);
    if (bucket.entries[params.key] !== undefined) {
        return true;
    }
    for (const entry of (await params.store.entries())){
        if (entry.key === params.bucketKey || entry.value.scopeKey !== params.scopeKey || entry.value.namespace !== params.namespace || entry.value.bucketId !== params.bucketId) {
            continue;
        }
        const legacyBucket = normalizeDedupeBucketRecord(entry.value, params);
        if (legacyBucket.entries[params.key] !== undefined) {
            return true;
        }
    }
    return false;
}
function sanitizeFileSegment(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return "default";
    }
    return trimmed.replace(/[^a-zA-Z0-9_-]/g, "_");
}
function resolveTelegramMessageDispatchLegacyPath(params) {
    return _nodepath.default.join(_nodepath.default.dirname(params.storePath), `${_nodepath.default.basename(params.storePath)}.telegram-message-dispatch-${sanitizeFileSegment(params.namespace)}.json`);
}
function buildTelegramMessageDispatchReplayKey(msg) {
    const chatId = msg.chat?.id;
    const messageId = msg.message_id;
    if (chatId == null || typeof messageId !== "number" || messageId <= 0) {
        return null;
    }
    return JSON.stringify([
        "message",
        String(chatId),
        messageId
    ]);
}
function createTelegramMessageDispatchReplayGuard(params) {
    const scopeKey = resolveDispatchScopeKey(params.storePath);
    const onStateError = params.onDiskError;
    let store;
    const inflight = new Map();
    const committedInMemory = new Map();
    const bucketWriteQueue = new Map();
    function getStore() {
        if (store) {
            return store;
        }
        try {
            store = openDispatchDedupeStore();
            return store;
        } catch (error) {
            onStateError?.(error);
            return undefined;
        }
    }
    function pruneCommittedInMemory(now = Date.now()) {
        for (const [entryKey, entry] of committedInMemory){
            if (entry.expiresAt <= now || committedInMemory.size > TELEGRAM_MESSAGE_DISPATCH_DEDUPE_LOGICAL_MAX_ENTRIES) {
                committedInMemory.delete(entryKey);
            }
        }
    }
    function rememberCommittedInMemory(entryKey, namespace, now) {
        committedInMemory.set(entryKey, {
            namespace,
            expiresAt: now + TELEGRAM_MESSAGE_DISPATCH_TTL_MS
        });
        pruneCommittedInMemory(now);
    }
    function hasCommittedInMemory(entryKey, now = Date.now()) {
        const entry = committedInMemory.get(entryKey);
        if (!entry) {
            return false;
        }
        if (entry.expiresAt <= now) {
            committedInMemory.delete(entryKey);
            return false;
        }
        return true;
    }
    function rememberPendingClaim(entryKey) {
        let resolve;
        let reject;
        const promise = new Promise((resolvePromise, rejectPromise)=>{
            resolve = resolvePromise;
            reject = rejectPromise;
        });
        void promise.catch(()=>{});
        const pending = {
            promise,
            resolve,
            reject
        };
        inflight.set(entryKey, pending);
        return pending;
    }
    function enqueueBucketWrite(bucketKey, write) {
        const previous = bucketWriteQueue.get(bucketKey) ?? Promise.resolve();
        const next = previous.catch(()=>undefined).then(write);
        const queued = next.then(()=>undefined, ()=>undefined);
        bucketWriteQueue.set(bucketKey, queued);
        void queued.finally(()=>{
            if (bucketWriteQueue.get(bucketKey) === queued) {
                bucketWriteQueue.delete(bucketKey);
            }
        });
        return next;
    }
    async function withBucketLock(paramsLocal) {
        const lockKey = dedupeBucketLockKey(paramsLocal.bucketKey);
        const lockValue = createDedupeBucketRecord({
            scopeKey,
            namespace: `${paramsLocal.namespace}:lock`,
            bucketId: paramsLocal.bucketId
        });
        let locked = false;
        for(let attempt = 0; attempt < TELEGRAM_MESSAGE_DISPATCH_DEDUPE_LOCK_ATTEMPTS; attempt += 1){
            if (await paramsLocal.store.registerIfAbsent(lockKey, lockValue, {
                ttlMs: TELEGRAM_MESSAGE_DISPATCH_DEDUPE_LOCK_TTL_MS
            })) {
                locked = true;
                break;
            }
            await sleep(TELEGRAM_MESSAGE_DISPATCH_DEDUPE_LOCK_RETRY_MS);
        }
        if (!locked) {
            throw new Error(`timed out acquiring Telegram dispatch dedupe bucket lock: ${paramsLocal.bucketId}`);
        }
        try {
            return await paramsLocal.write();
        } finally{
            await paramsLocal.store.delete(lockKey);
        }
    }
    return {
        async claim (key, options) {
            const namespace = options?.namespace?.trim() || "global";
            const entryKey = dedupeEntryKey(scopeKey, namespace, key);
            const bucketId = dedupeBucketId(key);
            const bucketKey = dedupeBucketEntryKey(scopeKey, namespace, bucketId);
            if (hasCommittedInMemory(entryKey)) {
                return {
                    kind: "duplicate"
                };
            }
            const existing = inflight.get(entryKey);
            if (existing) {
                return {
                    kind: "inflight",
                    pending: existing.promise
                };
            }
            const pending = rememberPendingClaim(entryKey);
            const storeEntry = getStore();
            if (!storeEntry) {
                return {
                    kind: "claimed"
                };
            }
            try {
                if (await lookupDedupeBucketContains({
                    store: storeEntry,
                    scopeKey,
                    namespace,
                    bucketId,
                    bucketKey,
                    key,
                    now: Date.now()
                })) {
                    pending.resolve(false);
                    inflight.delete(entryKey);
                    return {
                        kind: "duplicate"
                    };
                }
                return {
                    kind: "claimed"
                };
            } catch (error) {
                onStateError?.(error);
                return {
                    kind: "claimed"
                };
            }
        },
        async commit (key, options) {
            const namespace = options?.namespace?.trim() || "global";
            const now = options?.now ?? Date.now();
            const entryKey = dedupeEntryKey(scopeKey, namespace, key);
            const bucketId = dedupeBucketId(key);
            const bucketKey = dedupeBucketEntryKey(scopeKey, namespace, bucketId);
            const storeResult = getStore();
            if (!storeResult) {
                rememberCommittedInMemory(entryKey, namespace, now);
                inflight.get(entryKey)?.resolve(true);
                inflight.delete(entryKey);
                return false;
            }
            try {
                await enqueueBucketWrite(bucketKey, async ()=>{
                    await withBucketLock({
                        store: storeResult,
                        namespace,
                        bucketId,
                        bucketKey,
                        write: async ()=>{
                            const bucket = normalizeDedupeBucketRecord(await storeResult.lookup(bucketKey), {
                                scopeKey,
                                namespace,
                                bucketId,
                                now
                            });
                            bucket.entries[key] = now;
                            pruneDedupeBucketEntries(bucket.entries, now);
                            await storeResult.register(bucketKey, bucket, {
                                ttlMs: TELEGRAM_MESSAGE_DISPATCH_TTL_MS
                            });
                        }
                    });
                });
                rememberCommittedInMemory(entryKey, namespace, now);
                inflight.get(entryKey)?.resolve(true);
                return true;
            } catch (error) {
                rememberCommittedInMemory(entryKey, namespace, now);
                inflight.get(entryKey)?.resolve(true);
                onStateError?.(error);
                return false;
            } finally{
                inflight.delete(entryKey);
            }
        },
        release (key, options) {
            const namespace = options?.namespace?.trim() || "global";
            const entryKey = dedupeEntryKey(scopeKey, namespace, key);
            const pending = inflight.get(entryKey);
            if (pending) {
                pending.reject(options?.error ?? new Error(`claim released before commit: ${namespace}`));
                inflight.delete(entryKey);
            }
        },
        async hasRecent (key, options) {
            const namespace = options?.namespace?.trim() || "global";
            const entryKey = dedupeEntryKey(scopeKey, namespace, key);
            const bucketId = dedupeBucketId(key);
            const bucketKey = dedupeBucketEntryKey(scopeKey, namespace, bucketId);
            if (hasCommittedInMemory(entryKey)) {
                return true;
            }
            const storeValue = getStore();
            if (!storeValue) {
                return false;
            }
            try {
                return await lookupDedupeBucketContains({
                    store: storeValue,
                    scopeKey,
                    namespace,
                    bucketId,
                    bucketKey,
                    key,
                    now: Date.now()
                });
            } catch (error) {
                onStateError?.(error);
                return false;
            }
        },
        async warmup (namespace = "global") {
            pruneCommittedInMemory();
            const memoryCount = [
                ...committedInMemory.values()
            ].filter((entry)=>entry.namespace === namespace).length;
            const storeLocal = getStore();
            if (!storeLocal) {
                return memoryCount;
            }
            try {
                const now = Date.now();
                const persistedCount = (await storeLocal.entries()).filter((entry)=>entry.value.scopeKey === scopeKey && entry.value.namespace === namespace).reduce((count, entry)=>{
                    const bucket = normalizeDedupeBucketRecord(entry.value, {
                        scopeKey,
                        namespace,
                        bucketId: entry.value.bucketId,
                        now
                    });
                    return count + Object.keys(bucket.entries).length;
                }, 0);
                return persistedCount + memoryCount;
            } catch (error) {
                onStateError?.(error);
                return memoryCount;
            }
        },
        clearMemory () {
            inflight.clear();
            committedInMemory.clear();
        },
        memorySize () {
            pruneCommittedInMemory();
            return inflight.size + committedInMemory.size;
        }
    };
}
async function claimTelegramMessageDispatchReplay(params) {
    const key = buildTelegramMessageDispatchReplayKey(params.msg);
    if (!key) {
        return {
            kind: "invalid"
        };
    }
    let releaseRetries = 0;
    while(true){
        const claim = await params.guard.claim(key, {
            namespace: params.accountId
        });
        if (claim.kind === "claimed") {
            return {
                kind: "claimed",
                key
            };
        }
        if (claim.kind === "duplicate") {
            return {
                kind: "duplicate"
            };
        }
        try {
            await claim.pending;
            return {
                kind: "duplicate"
            };
        } catch  {
            releaseRetries += 1;
            if (releaseRetries > 1) {
                return {
                    kind: "duplicate"
                };
            }
        }
    }
}
function normalizeReplayKeys(keys) {
    return (0, _stringcoerceruntime.uniqueStrings)((0, _stringcoerceruntime.normalizeStringEntries)(keys ?? []));
}
async function commitTelegramMessageDispatchReplay(params) {
    const keys = normalizeReplayKeys(params.keys);
    await Promise.all(keys.map((key)=>params.guard.commit(key, {
            namespace: params.accountId
        })));
}
function releaseTelegramMessageDispatchReplay(params) {
    const keys = normalizeReplayKeys(params.keys);
    for (const key of keys){
        params.guard.release(key, {
            namespace: params.accountId,
            error: params.error
        });
    }
}
function setTelegramMessageDispatchDedupeStoreForTest(store) {
    dispatchDedupeStoreForTest = store;
}
function listTelegramLegacyMessageDispatchDedupeEntries(params) {
    const filePath = params.persistedPath ?? resolveTelegramMessageDispatchLegacyPath(params);
    if (!_nodefs.default.existsSync(filePath)) {
        return [];
    }
    const now = Date.now();
    let parsed;
    try {
        parsed = JSON.parse(_nodefs.default.readFileSync(filePath, "utf8"));
    } catch  {
        return [];
    }
    if (!parsed || typeof parsed !== "object") {
        return [];
    }
    const scopeKey = resolveDispatchScopeKey(params.storePath);
    const buckets = new Map();
    for (const [key, value] of Object.entries(parsed)){
        if (typeof value !== "number" || !Number.isFinite(value)) {
            continue;
        }
        const ttlMs = TELEGRAM_MESSAGE_DISPATCH_TTL_MS - Math.max(0, now - value);
        if (ttlMs <= 0) {
            continue;
        }
        const bucketId = dedupeBucketId(key);
        const bucketKey = dedupeLegacyBucketEntryKey({
            scopeKey,
            namespace: params.namespace,
            bucketId,
            sourcePath: filePath
        });
        const bucket = buckets.get(bucketKey) ?? {
            value: createDedupeBucketRecord({
                scopeKey,
                namespace: params.namespace,
                bucketId
            }),
            ttlMs: 0
        };
        bucket.value.entries[key] = value;
        bucket.ttlMs = Math.max(bucket.ttlMs, ttlMs);
        buckets.set(bucketKey, bucket);
    }
    return [
        ...buckets.entries()
    ].map(([key, bucket])=>({
            key,
            value: bucket.value,
            ttlMs: bucket.ttlMs
        }));
}

//# sourceMappingURL=message-dispatch-dedupe.js.map