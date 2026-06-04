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
    get TELEGRAM_THREAD_BINDINGS_MAX_ENTRIES () {
        return TELEGRAM_THREAD_BINDINGS_MAX_ENTRIES;
    },
    get TELEGRAM_THREAD_BINDINGS_NAMESPACE () {
        return TELEGRAM_THREAD_BINDINGS_NAMESPACE;
    },
    get __testing () {
        return testing;
    },
    get createTelegramThreadBindingManager () {
        return createTelegramThreadBindingManager;
    },
    get getTelegramThreadBindingManager () {
        return getTelegramThreadBindingManager;
    },
    get listTelegramLegacyThreadBindingEntries () {
        return listTelegramLegacyThreadBindingEntries;
    },
    get resetTelegramThreadBindingsForTests () {
        return resetTelegramThreadBindingsForTests;
    },
    get setTelegramThreadBindingIdleTimeoutBySessionKey () {
        return setTelegramThreadBindingIdleTimeoutBySessionKey;
    },
    get setTelegramThreadBindingMaxAgeBySessionKey () {
        return setTelegramThreadBindingMaxAgeBySessionKey;
    },
    get setTelegramThreadBindingStoreForTest () {
        return setTelegramThreadBindingStoreForTest;
    },
    get testing () {
        return testing;
    }
});
const _nodecrypto = require("node:crypto");
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _nodeos = /*#__PURE__*/ _interop_require_default(require("node:os"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _acpruntime = require("../../../../common/openclaw/plugin-sdk/acp-runtime");
const _conversationruntime = require("../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _statepaths = require("../../../../common/openclaw/plugin-sdk/state-paths");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _runtime = require("./runtime.js");
const _token = require("./token.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
const DEFAULT_THREAD_BINDING_IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const DEFAULT_THREAD_BINDING_MAX_AGE_MS = 0;
const THREAD_BINDINGS_SWEEP_INTERVAL_MS = 60_000;
const STORE_VERSION = 1;
const TELEGRAM_THREAD_BINDINGS_NAMESPACE = "telegram.thread-bindings";
const TELEGRAM_THREAD_BINDINGS_MAX_ENTRIES = 5_000;
let telegramSendModulePromise;
let threadBindingStoreForTest;
async function loadTelegramSendModule() {
    telegramSendModulePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./send.js")));
    return await telegramSendModulePromise;
}
/**
 * Keep Telegram thread binding state shared across bundled chunks so routing,
 * binding lookups, and binding mutations all observe the same live registry.
 */ const TELEGRAM_THREAD_BINDINGS_STATE_KEY = Symbol.for("openclaw.telegramThreadBindingsState");
let threadBindingsState;
function getThreadBindingsState() {
    if (!threadBindingsState) {
        const globalStore = globalThis;
        threadBindingsState = globalStore[TELEGRAM_THREAD_BINDINGS_STATE_KEY] ?? {
            managersByAccountId: new Map(),
            bindingsByAccountConversation: new Map(),
            persistQueueByAccountId: new Map()
        };
        globalStore[TELEGRAM_THREAD_BINDINGS_STATE_KEY] = threadBindingsState;
    }
    return threadBindingsState;
}
function normalizeDurationMs(raw, fallback) {
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
        return fallback;
    }
    return Math.max(0, Math.floor(raw));
}
function resolveBindingKey(params) {
    return `${params.accountId}:${params.conversationId}`;
}
function resolveStoredBindingKey(params) {
    return (0, _nodecrypto.createHash)("sha256").update(`${params.accountId}\0${params.conversationId}`, "utf8").digest("hex").slice(0, 32);
}
function openThreadBindingStore() {
    return threadBindingStoreForTest ?? (0, _runtime.getTelegramRuntime)().state.openSyncKeyedStore({
        namespace: TELEGRAM_THREAD_BINDINGS_NAMESPACE,
        maxEntries: TELEGRAM_THREAD_BINDINGS_MAX_ENTRIES
    });
}
function toSessionBindingTargetKind(raw) {
    return raw === "subagent" ? "subagent" : "session";
}
function toTelegramTargetKind(raw) {
    return raw === "subagent" ? "subagent" : "acp";
}
function toSessionBindingRecord(record, defaults) {
    return {
        bindingId: resolveBindingKey({
            accountId: record.accountId,
            conversationId: record.conversationId
        }),
        targetSessionKey: record.targetSessionKey,
        targetKind: toSessionBindingTargetKind(record.targetKind),
        conversation: {
            channel: "telegram",
            accountId: record.accountId,
            conversationId: record.conversationId
        },
        status: "active",
        boundAt: record.boundAt,
        expiresAt: (0, _conversationruntime.resolveThreadBindingEffectiveExpiresAt)({
            record,
            defaultIdleTimeoutMs: defaults.idleTimeoutMs,
            defaultMaxAgeMs: defaults.maxAgeMs
        }),
        metadata: {
            agentId: record.agentId,
            label: record.label,
            boundBy: record.boundBy,
            lastActivityAt: record.lastActivityAt,
            idleTimeoutMs: typeof record.idleTimeoutMs === "number" ? Math.max(0, Math.floor(record.idleTimeoutMs)) : defaults.idleTimeoutMs,
            maxAgeMs: typeof record.maxAgeMs === "number" ? Math.max(0, Math.floor(record.maxAgeMs)) : defaults.maxAgeMs,
            ...record.metadata
        }
    };
}
function fromSessionBindingInput(params) {
    const now = Date.now();
    const metadata = params.input.metadata ?? {};
    const existing = getThreadBindingsState().bindingsByAccountConversation.get(resolveBindingKey({
        accountId: params.accountId,
        conversationId: params.input.conversationId
    }));
    const record = {
        accountId: params.accountId,
        conversationId: params.input.conversationId,
        targetKind: toTelegramTargetKind(params.input.targetKind),
        targetSessionKey: params.input.targetSessionKey,
        agentId: typeof metadata.agentId === "string" && metadata.agentId.trim() ? metadata.agentId.trim() : existing?.agentId,
        label: typeof metadata.label === "string" && metadata.label.trim() ? metadata.label.trim() : existing?.label,
        boundBy: typeof metadata.boundBy === "string" && metadata.boundBy.trim() ? metadata.boundBy.trim() : existing?.boundBy,
        boundAt: now,
        lastActivityAt: now,
        metadata: {
            ...existing?.metadata,
            ...metadata
        }
    };
    if (typeof metadata.idleTimeoutMs === "number" && Number.isFinite(metadata.idleTimeoutMs)) {
        record.idleTimeoutMs = Math.max(0, Math.floor(metadata.idleTimeoutMs));
    } else if (typeof existing?.idleTimeoutMs === "number") {
        record.idleTimeoutMs = existing.idleTimeoutMs;
    }
    if (typeof metadata.maxAgeMs === "number" && Number.isFinite(metadata.maxAgeMs)) {
        record.maxAgeMs = Math.max(0, Math.floor(metadata.maxAgeMs));
    } else if (typeof existing?.maxAgeMs === "number") {
        record.maxAgeMs = existing.maxAgeMs;
    }
    return record;
}
function resolveBindingsPath(accountId, env = process.env) {
    const stateDir = (0, _statepaths.resolveStateDir)(env, _nodeos.default.homedir);
    return _nodepath.default.join(stateDir, "telegram", `thread-bindings-${accountId}.json`);
}
function normalizeMetadataForStore(metadata) {
    if (!metadata) {
        return undefined;
    }
    const serialized = JSON.stringify(metadata);
    if (!serialized) {
        return undefined;
    }
    const parsed = JSON.parse(serialized);
    return Object.keys(parsed).length > 0 ? parsed : undefined;
}
function summarizeLifecycleForLog(record, defaults) {
    const idleTimeoutMs = typeof record.idleTimeoutMs === "number" ? record.idleTimeoutMs : defaults.idleTimeoutMs;
    const maxAgeMs = typeof record.maxAgeMs === "number" ? record.maxAgeMs : defaults.maxAgeMs;
    const idleLabel = (0, _conversationruntime.formatThreadBindingDurationLabel)(Math.max(0, Math.floor(idleTimeoutMs)));
    const maxAgeLabel = (0, _conversationruntime.formatThreadBindingDurationLabel)(Math.max(0, Math.floor(maxAgeMs)));
    return `idle=${idleLabel} maxAge=${maxAgeLabel}`;
}
function sanitizeStoredBinding(accountId, entry) {
    const conversationId = (0, _stringcoerceruntime.normalizeOptionalString)(entry?.conversationId);
    const targetSessionKey = (0, _stringcoerceruntime.normalizeOptionalString)(entry?.targetSessionKey) ?? "";
    const targetKind = entry?.targetKind === "subagent" ? "subagent" : "acp";
    if (!conversationId || !targetSessionKey) {
        return null;
    }
    const boundAt = typeof entry?.boundAt === "number" && Number.isFinite(entry.boundAt) ? Math.floor(entry.boundAt) : Date.now();
    const lastActivityAt = typeof entry?.lastActivityAt === "number" && Number.isFinite(entry.lastActivityAt) ? Math.floor(entry.lastActivityAt) : boundAt;
    const record = {
        accountId,
        conversationId,
        targetSessionKey,
        targetKind,
        boundAt,
        lastActivityAt
    };
    if (typeof entry?.idleTimeoutMs === "number" && Number.isFinite(entry.idleTimeoutMs)) {
        record.idleTimeoutMs = Math.max(0, Math.floor(entry.idleTimeoutMs));
    }
    if (typeof entry?.maxAgeMs === "number" && Number.isFinite(entry.maxAgeMs)) {
        record.maxAgeMs = Math.max(0, Math.floor(entry.maxAgeMs));
    }
    if (typeof entry?.agentId === "string" && entry.agentId.trim()) {
        record.agentId = entry.agentId.trim();
    }
    if (typeof entry?.label === "string" && entry.label.trim()) {
        record.label = entry.label.trim();
    }
    if (typeof entry?.boundBy === "string" && entry.boundBy.trim()) {
        record.boundBy = entry.boundBy.trim();
    }
    const metadata = normalizeMetadataForStore(entry?.metadata && typeof entry.metadata === "object" ? {
        ...entry.metadata
    } : undefined);
    if (metadata) {
        record.metadata = metadata;
    }
    return record;
}
function readLegacyBindingsFile(filePath, accountId) {
    try {
        const raw = _nodefs.default.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed?.version !== STORE_VERSION || !Array.isArray(parsed.bindings)) {
            return [];
        }
        const bindings = [];
        for (const entry of parsed.bindings){
            const record = sanitizeStoredBinding(accountId, entry);
            if (record) {
                bindings.push(record);
            }
        }
        return bindings;
    } catch (err) {
        const code = err.code;
        if (code !== "ENOENT") {
            (0, _runtimeenv.logVerbose)(`telegram thread bindings load failed (${accountId}): ${String(err)}`);
        }
        return [];
    }
}
function loadBindingsFromStore(accountId) {
    let store;
    try {
        store = openThreadBindingStore();
    } catch (err) {
        (0, _runtimeenv.logVerbose)(`telegram thread bindings store open failed (${accountId}): ${String(err)}`);
        return [];
    }
    let entries;
    try {
        entries = store.entries();
    } catch (err) {
        (0, _runtimeenv.logVerbose)(`telegram thread bindings store read failed (${accountId}): ${String(err)}`);
        return [];
    }
    const bindings = [];
    for (const entry of entries){
        if (entry.value.accountId !== accountId) {
            continue;
        }
        const sanitized = sanitizeStoredBinding(accountId, entry.value);
        if (sanitized) {
            bindings.push(sanitized);
            continue;
        }
        try {
            store.delete(entry.key);
        } catch (err) {
            (0, _runtimeenv.logVerbose)(`telegram thread bindings invalid row cleanup failed (${accountId}): ${String(err)}`);
        }
    }
    return bindings;
}
async function persistBindingsToStore(params) {
    if (!params.persist) {
        return;
    }
    const store = openThreadBindingStore();
    const bindings = params.bindings ?? [
        ...getThreadBindingsState().bindingsByAccountConversation.values()
    ].filter((entry)=>entry.accountId === params.accountId);
    const nextKeys = new Set();
    for (const binding of bindings){
        const stored = sanitizeStoredBinding(params.accountId, binding);
        if (!stored) {
            continue;
        }
        const key = resolveStoredBindingKey(stored);
        nextKeys.add(key);
        store.register(key, stored);
    }
    for (const entry of store.entries()){
        if (entry.value.accountId === params.accountId && !nextKeys.has(entry.key)) {
            store.delete(entry.key);
        }
    }
}
function listBindingsForAccount(accountId) {
    return [
        ...getThreadBindingsState().bindingsByAccountConversation.values()
    ].filter((entry)=>entry.accountId === accountId);
}
function enqueuePersistBindings(params) {
    if (!params.persist) {
        return Promise.resolve();
    }
    const previous = getThreadBindingsState().persistQueueByAccountId.get(params.accountId) ?? Promise.resolve();
    const next = previous.catch(()=>undefined).then(async ()=>{
        await persistBindingsToStore(params);
    });
    getThreadBindingsState().persistQueueByAccountId.set(params.accountId, next);
    const cleanup = ()=>{
        if (getThreadBindingsState().persistQueueByAccountId.get(params.accountId) === next) {
            getThreadBindingsState().persistQueueByAccountId.delete(params.accountId);
        }
    };
    next.then(cleanup, cleanup);
    return next;
}
function persistBindingsSafely(params) {
    void enqueuePersistBindings(params).catch((err)=>{
        (0, _runtimeenv.logVerbose)(`telegram thread bindings persist failed (${params.accountId}, ${params.reason}): ${String(err)}`);
    });
}
function normalizeTimestampMs(raw) {
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
        return Date.now();
    }
    return Math.max(0, Math.floor(raw));
}
function shouldExpireByIdle(params) {
    const idleTimeoutMs = typeof params.record.idleTimeoutMs === "number" ? Math.max(0, Math.floor(params.record.idleTimeoutMs)) : params.defaultIdleTimeoutMs;
    if (idleTimeoutMs <= 0) {
        return false;
    }
    return params.now >= Math.max(params.record.lastActivityAt, params.record.boundAt) + idleTimeoutMs;
}
function shouldExpireByMaxAge(params) {
    const maxAgeMs = typeof params.record.maxAgeMs === "number" ? Math.max(0, Math.floor(params.record.maxAgeMs)) : params.defaultMaxAgeMs;
    if (maxAgeMs <= 0) {
        return false;
    }
    return params.now >= params.record.boundAt + maxAgeMs;
}
function createTelegramThreadBindingManager(params) {
    const accountId = (0, _routing.normalizeAccountId)(params.accountId);
    const existing = getThreadBindingsState().managersByAccountId.get(accountId);
    if (existing) {
        return existing;
    }
    const persist = params.persist ?? true;
    const idleTimeoutMs = normalizeDurationMs(params.idleTimeoutMs, DEFAULT_THREAD_BINDING_IDLE_TIMEOUT_MS);
    const maxAgeMs = normalizeDurationMs(params.maxAgeMs, DEFAULT_THREAD_BINDING_MAX_AGE_MS);
    const loaded = loadBindingsFromStore(accountId);
    for (const entry of loaded){
        const key = resolveBindingKey({
            accountId,
            conversationId: entry.conversationId
        });
        getThreadBindingsState().bindingsByAccountConversation.set(key, {
            ...entry,
            accountId
        });
    }
    const acpSessionKeys = new Set();
    for (const binding of getThreadBindingsState().bindingsByAccountConversation.values()){
        if (binding.targetKind !== "acp" || !(0, _routing.isAcpSessionKey)(binding.targetSessionKey)) {
            continue;
        }
        acpSessionKeys.add(binding.targetSessionKey);
    }
    const staleSessionKeys = new Set();
    for (const targetSessionKey of acpSessionKeys){
        const sessionEntry = (0, _acpruntime.readAcpSessionEntry)({
            sessionKey: targetSessionKey
        });
        if (!sessionEntry || sessionEntry.storeReadFailed) {
            continue;
        }
        const isStale = !sessionEntry.entry || sessionEntry.entry.status === "failed" || sessionEntry.entry.status === "killed" || sessionEntry.entry.status === "timeout" || sessionEntry.acp?.state === "error";
        if (isStale) {
            staleSessionKeys.add(targetSessionKey);
        }
    }
    let needsPersist = false;
    for (const sessionKey of staleSessionKeys){
        const bindingsToRemove = listBindingsForAccount(accountId).filter((b)=>b.targetSessionKey === sessionKey);
        for (const binding of bindingsToRemove){
            getThreadBindingsState().bindingsByAccountConversation.delete(resolveBindingKey({
                accountId,
                conversationId: binding.conversationId
            }));
        }
        if (bindingsToRemove.length > 0) {
            needsPersist = true;
            (0, _runtimeenv.logVerbose)(`telegram thread binding: cleaned up ${bindingsToRemove.length} stale binding(s) for session ${sessionKey}`);
        }
    }
    if (needsPersist && persist) {
        persistBindingsSafely({
            accountId,
            persist: true,
            bindings: listBindingsForAccount(accountId),
            reason: "cleanup-stale"
        });
    }
    let sweepTimer = null;
    const manager = {
        accountId,
        shouldPersistMutations: ()=>persist,
        getIdleTimeoutMs: ()=>idleTimeoutMs,
        getMaxAgeMs: ()=>maxAgeMs,
        getByConversationId: (conversationIdRaw)=>{
            const conversationId = (0, _stringcoerceruntime.normalizeOptionalString)(conversationIdRaw);
            if (!conversationId) {
                return undefined;
            }
            return getThreadBindingsState().bindingsByAccountConversation.get(resolveBindingKey({
                accountId,
                conversationId
            }));
        },
        listBySessionKey: (targetSessionKeyRaw)=>{
            const targetSessionKey = targetSessionKeyRaw.trim();
            if (!targetSessionKey) {
                return [];
            }
            return listBindingsForAccount(accountId).filter((entry)=>entry.targetSessionKey === targetSessionKey);
        },
        listBindings: ()=>listBindingsForAccount(accountId),
        touchConversation: (conversationIdRaw, at)=>{
            const conversationId = (0, _stringcoerceruntime.normalizeOptionalString)(conversationIdRaw);
            if (!conversationId) {
                return null;
            }
            const key = resolveBindingKey({
                accountId,
                conversationId
            });
            const existingLocal = getThreadBindingsState().bindingsByAccountConversation.get(key);
            if (!existingLocal) {
                return null;
            }
            const nextRecord = {
                ...existingLocal,
                lastActivityAt: normalizeTimestampMs(at ?? Date.now())
            };
            getThreadBindingsState().bindingsByAccountConversation.set(key, nextRecord);
            persistBindingsSafely({
                accountId,
                persist: manager.shouldPersistMutations(),
                bindings: listBindingsForAccount(accountId),
                reason: "touch"
            });
            return nextRecord;
        },
        unbindConversation: (unbindParams)=>{
            const conversationId = (0, _stringcoerceruntime.normalizeOptionalString)(unbindParams.conversationId);
            if (!conversationId) {
                return null;
            }
            const key = resolveBindingKey({
                accountId,
                conversationId
            });
            const removed = getThreadBindingsState().bindingsByAccountConversation.get(key) ?? null;
            if (!removed) {
                return null;
            }
            getThreadBindingsState().bindingsByAccountConversation.delete(key);
            persistBindingsSafely({
                accountId,
                persist: manager.shouldPersistMutations(),
                bindings: listBindingsForAccount(accountId),
                reason: "unbind-conversation"
            });
            return removed;
        },
        unbindBySessionKey: (unbindParams)=>{
            const targetSessionKey = unbindParams.targetSessionKey.trim();
            if (!targetSessionKey) {
                return [];
            }
            const removed = [];
            for (const entry of listBindingsForAccount(accountId)){
                if (entry.targetSessionKey !== targetSessionKey) {
                    continue;
                }
                const key = resolveBindingKey({
                    accountId,
                    conversationId: entry.conversationId
                });
                getThreadBindingsState().bindingsByAccountConversation.delete(key);
                removed.push(entry);
            }
            if (removed.length > 0) {
                persistBindingsSafely({
                    accountId,
                    persist: manager.shouldPersistMutations(),
                    bindings: listBindingsForAccount(accountId),
                    reason: "unbind-session"
                });
            }
            return removed;
        },
        stop: ()=>{
            if (sweepTimer) {
                clearInterval(sweepTimer);
                sweepTimer = null;
            }
            (0, _conversationruntime.unregisterSessionBindingAdapter)({
                channel: "telegram",
                accountId,
                adapter: sessionBindingAdapter
            });
            const existingManager = getThreadBindingsState().managersByAccountId.get(accountId);
            if (existingManager === manager) {
                getThreadBindingsState().managersByAccountId.delete(accountId);
            }
        }
    };
    const sessionBindingAdapter = {
        channel: "telegram",
        accountId,
        capabilities: {
            placements: [
                "current",
                "child"
            ]
        },
        bind: async (input)=>{
            if (input.conversation.channel !== "telegram") {
                return null;
            }
            const targetSessionKey = input.targetSessionKey.trim();
            if (!targetSessionKey) {
                return null;
            }
            const placement = input.placement === "child" ? "child" : "current";
            const metadata = input.metadata ?? {};
            let conversationId;
            if (placement === "child") {
                const rawConversationId = input.conversation.conversationId?.trim() ?? "";
                const rawParent = input.conversation.parentConversationId?.trim() ?? "";
                const chatId = rawParent || rawConversationId;
                if (!chatId) {
                    (0, _runtimeenv.logVerbose)(`telegram: child bind failed: could not resolve group chat ID from conversationId=${rawConversationId}`);
                    return null;
                }
                if (!chatId.startsWith("-")) {
                    (0, _runtimeenv.logVerbose)(`telegram: child bind failed: conversationId "${chatId}" looks like a bare topic ID, not a group chat ID (expected to start with "-"). Provide a full chatId:topic:topicId conversationId or set parentConversationId to the group chat ID.`);
                    return null;
                }
                const threadName = ((0, _stringcoerceruntime.normalizeOptionalString)(metadata.threadName) ?? "") || ((0, _stringcoerceruntime.normalizeOptionalString)(metadata.label) ?? "") || `Agent: ${targetSessionKey.split(":").pop()}`;
                try {
                    const tokenResolution = (0, _token.resolveTelegramToken)(params.cfg, {
                        accountId
                    });
                    if (!tokenResolution.token) {
                        return null;
                    }
                    const { createForumTopicTelegram } = await loadTelegramSendModule();
                    const result = await createForumTopicTelegram(chatId, threadName, {
                        cfg: params.cfg,
                        token: tokenResolution.token,
                        accountId
                    });
                    conversationId = `${result.chatId}:topic:${result.topicId}`;
                } catch (err) {
                    (0, _runtimeenv.logVerbose)(`telegram: child thread-binding failed for ${chatId}: ${(0, _errorruntime.formatErrorMessage)(err)}`);
                    return null;
                }
            } else {
                conversationId = (0, _stringcoerceruntime.normalizeOptionalString)(input.conversation.conversationId);
            }
            if (!conversationId) {
                return null;
            }
            const record = fromSessionBindingInput({
                accountId,
                input: {
                    targetSessionKey,
                    targetKind: input.targetKind,
                    conversationId,
                    metadata: input.metadata
                }
            });
            getThreadBindingsState().bindingsByAccountConversation.set(resolveBindingKey({
                accountId,
                conversationId
            }), record);
            await enqueuePersistBindings({
                accountId,
                persist: manager.shouldPersistMutations(),
                bindings: listBindingsForAccount(accountId)
            });
            (0, _runtimeenv.logVerbose)(`telegram: bound conversation ${conversationId} -> ${targetSessionKey} (${summarizeLifecycleForLog(record, {
                idleTimeoutMs,
                maxAgeMs
            })})`);
            return toSessionBindingRecord(record, {
                idleTimeoutMs,
                maxAgeMs
            });
        },
        listBySession: (targetSessionKeyRaw)=>{
            const targetSessionKey = targetSessionKeyRaw.trim();
            if (!targetSessionKey) {
                return [];
            }
            return manager.listBySessionKey(targetSessionKey).map((entry)=>toSessionBindingRecord(entry, {
                    idleTimeoutMs,
                    maxAgeMs
                }));
        },
        resolveByConversation: (ref)=>{
            if (ref.channel !== "telegram") {
                return null;
            }
            const conversationId = (0, _stringcoerceruntime.normalizeOptionalString)(ref.conversationId);
            if (!conversationId) {
                return null;
            }
            const record = manager.getByConversationId(conversationId);
            return record ? toSessionBindingRecord(record, {
                idleTimeoutMs,
                maxAgeMs
            }) : null;
        },
        touch: (bindingId, at)=>{
            const conversationId = (0, _conversationruntime.resolveThreadBindingConversationIdFromBindingId)({
                accountId,
                bindingId
            });
            if (!conversationId) {
                return;
            }
            manager.touchConversation(conversationId, at);
        },
        unbind: async (input)=>{
            if (input.targetSessionKey?.trim()) {
                const removed = manager.unbindBySessionKey({
                    targetSessionKey: input.targetSessionKey,
                    reason: input.reason,
                    sendFarewell: false
                });
                if (removed.length > 0) {
                    await enqueuePersistBindings({
                        accountId,
                        persist: manager.shouldPersistMutations(),
                        bindings: listBindingsForAccount(accountId)
                    });
                }
                return removed.map((entry)=>toSessionBindingRecord(entry, {
                        idleTimeoutMs,
                        maxAgeMs
                    }));
            }
            const conversationId = (0, _conversationruntime.resolveThreadBindingConversationIdFromBindingId)({
                accountId,
                bindingId: input.bindingId
            });
            if (!conversationId) {
                return [];
            }
            const removed = manager.unbindConversation({
                conversationId,
                reason: input.reason,
                sendFarewell: false
            });
            if (removed) {
                await enqueuePersistBindings({
                    accountId,
                    persist: manager.shouldPersistMutations(),
                    bindings: listBindingsForAccount(accountId)
                });
            }
            return removed ? [
                toSessionBindingRecord(removed, {
                    idleTimeoutMs,
                    maxAgeMs
                })
            ] : [];
        }
    };
    (0, _conversationruntime.registerSessionBindingAdapter)(sessionBindingAdapter);
    const sweeperEnabled = params.enableSweeper !== false;
    if (sweeperEnabled) {
        sweepTimer = setInterval(()=>{
            const now = Date.now();
            for (const record of listBindingsForAccount(accountId)){
                const idleExpired = shouldExpireByIdle({
                    now,
                    record,
                    defaultIdleTimeoutMs: idleTimeoutMs
                });
                const maxAgeExpired = shouldExpireByMaxAge({
                    now,
                    record,
                    defaultMaxAgeMs: maxAgeMs
                });
                if (!idleExpired && !maxAgeExpired) {
                    continue;
                }
                manager.unbindConversation({
                    conversationId: record.conversationId,
                    reason: idleExpired ? "idle-expired" : "max-age-expired",
                    sendFarewell: false
                });
            }
        }, THREAD_BINDINGS_SWEEP_INTERVAL_MS);
        sweepTimer.unref?.();
    }
    getThreadBindingsState().managersByAccountId.set(accountId, manager);
    return manager;
}
function getTelegramThreadBindingManager(accountId) {
    return getThreadBindingsState().managersByAccountId.get((0, _routing.normalizeAccountId)(accountId)) ?? null;
}
function updateTelegramBindingsBySessionKey(params) {
    const targetSessionKey = params.targetSessionKey.trim();
    if (!targetSessionKey) {
        return [];
    }
    const now = Date.now();
    const updated = [];
    for (const entry of params.manager.listBySessionKey(targetSessionKey)){
        const key = resolveBindingKey({
            accountId: params.manager.accountId,
            conversationId: entry.conversationId
        });
        const next = params.update(entry, now);
        getThreadBindingsState().bindingsByAccountConversation.set(key, next);
        updated.push(next);
    }
    if (updated.length > 0) {
        persistBindingsSafely({
            accountId: params.manager.accountId,
            persist: params.manager.shouldPersistMutations(),
            bindings: listBindingsForAccount(params.manager.accountId),
            reason: "session-lifecycle-update"
        });
    }
    return updated;
}
function setTelegramThreadBindingIdleTimeoutBySessionKey(params) {
    const manager = getTelegramThreadBindingManager(params.accountId);
    if (!manager) {
        return [];
    }
    const idleTimeoutMs = normalizeDurationMs(params.idleTimeoutMs, 0);
    return updateTelegramBindingsBySessionKey({
        manager,
        targetSessionKey: params.targetSessionKey,
        update: (entry, now)=>({
                ...entry,
                idleTimeoutMs,
                lastActivityAt: now
            })
    });
}
function setTelegramThreadBindingMaxAgeBySessionKey(params) {
    const manager = getTelegramThreadBindingManager(params.accountId);
    if (!manager) {
        return [];
    }
    const maxAgeMs = normalizeDurationMs(params.maxAgeMs, 0);
    return updateTelegramBindingsBySessionKey({
        manager,
        targetSessionKey: params.targetSessionKey,
        update: (entry, now)=>({
                ...entry,
                maxAgeMs,
                lastActivityAt: now
            })
    });
}
async function resetTelegramThreadBindingsForTests() {
    for (const manager of getThreadBindingsState().managersByAccountId.values()){
        manager.stop();
    }
    const pendingPersists = [
        ...getThreadBindingsState().persistQueueByAccountId.values()
    ];
    if (pendingPersists.length > 0) {
        await Promise.allSettled(pendingPersists);
    }
    getThreadBindingsState().persistQueueByAccountId.clear();
    getThreadBindingsState().managersByAccountId.clear();
    getThreadBindingsState().bindingsByAccountConversation.clear();
}
function setTelegramThreadBindingStoreForTest(store) {
    threadBindingStoreForTest = store;
}
function listTelegramLegacyThreadBindingEntries(params) {
    const bindings = readLegacyBindingsFile(params.persistedPath ?? resolveBindingsPath(params.accountId), params.accountId);
    return bindings.map((value)=>({
            key: resolveStoredBindingKey(value),
            value
        }));
}
const testing = {
    resetTelegramThreadBindingsForTests,
    resolveBindingsPath,
    resolveStoredBindingKey
};

//# sourceMappingURL=thread-bindings.js.map