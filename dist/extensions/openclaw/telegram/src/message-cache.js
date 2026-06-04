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
    get TELEGRAM_MESSAGE_CACHE_PERSISTENT_MAX_MESSAGES () {
        return TELEGRAM_MESSAGE_CACHE_PERSISTENT_MAX_MESSAGES;
    },
    get TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE () {
        return TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE;
    },
    get buildTelegramConversationContext () {
        return buildTelegramConversationContext;
    },
    get buildTelegramReplyChain () {
        return buildTelegramReplyChain;
    },
    get createTelegramMessageCache () {
        return createTelegramMessageCache;
    },
    get listTelegramLegacyMessageCacheEntries () {
        return listTelegramLegacyMessageCacheEntries;
    },
    get resetTelegramMessageCacheBucketsForTest () {
        return resetTelegramMessageCacheBucketsForTest;
    },
    get resolveTelegramMessageCachePath () {
        return resolveTelegramMessageCachePath;
    },
    get resolveTelegramMessageCachePersistentScopeKey () {
        return resolveTelegramMessageCachePersistentScopeKey;
    },
    get resolveTelegramMessageCacheScope () {
        return resolveTelegramMessageCacheScope;
    }
});
const _nodecrypto = require("node:crypto");
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _channelinbound = require("../../../../common/openclaw/plugin-sdk/channel-inbound");
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _bodyhelpers = require("./bot/body-helpers.js");
const _helpers = require("./bot/helpers.js");
const _outboundparams = require("./outbound-params.js");
const _runtime = require("./runtime.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const DEFAULT_MAX_MESSAGES = 5000;
const TELEGRAM_MESSAGE_CACHE_PERSISTENT_MAX_MESSAGES = 3000;
const TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE = "telegram.message-cache";
const PERSISTENT_BUCKET_KEY = `plugin-state:${TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE}`;
const persistedMessageCacheBuckets = new Map();
function resetTelegramMessageCacheBucketsForTest() {
    persistedMessageCacheBuckets.clear();
}
function telegramMessageCacheKey(params) {
    const key = `${params.accountId}:${params.chatId}:${params.messageId}`;
    return params.scopeKey ? `${params.scopeKey}:${key}` : key;
}
function telegramMessageCacheKeyPrefix(params) {
    const prefix = `${params.accountId}:${params.chatId}:`;
    return params.scopeKey ? `${params.scopeKey}:${prefix}` : prefix;
}
function resolveTelegramMessageCachePath(storePath) {
    return `${storePath}.telegram-messages.json`;
}
function resolveTelegramMessageCacheScope(storePath) {
    return resolveTelegramMessageCachePath(storePath);
}
function resolveReplyMessage(msg) {
    const externalReply = msg.external_reply;
    return msg.reply_to_message ?? externalReply;
}
function resolveEmbeddedReplyMessage(msg) {
    return msg.reply_to_message;
}
function resolveMessageBody(msg) {
    const text = (0, _helpers.getTelegramTextParts)(msg).text.trim();
    if (text) {
        return text;
    }
    const location = (0, _helpers.extractTelegramLocation)(msg);
    if (location) {
        return (0, _channelinbound.formatLocationText)(location);
    }
    return (0, _bodyhelpers.resolveTelegramPrimaryMedia)(msg)?.placeholder;
}
function resolveMediaType(placeholder) {
    return placeholder?.match(/^<media:([^>]+)>$/)?.[1];
}
function normalizeMessageNode(msg, params) {
    if (typeof msg.message_id !== "number") {
        return null;
    }
    const media = (0, _bodyhelpers.resolveTelegramPrimaryMedia)(msg);
    const fileId = media?.fileRef.file_id;
    const forwardedFrom = (0, _helpers.normalizeForwardedContext)(msg);
    const replyMessage = resolveReplyMessage(msg);
    const body = resolveMessageBody(msg);
    const threadId = normalizeTelegramCacheThreadId(params.threadId);
    return {
        sourceMessage: msg,
        messageId: String(msg.message_id),
        sender: (0, _helpers.buildSenderName)(msg) ?? "unknown sender",
        ...msg.from?.id != null ? {
            senderId: String(msg.from.id)
        } : {},
        ...msg.from?.username ? {
            senderUsername: msg.from.username
        } : {},
        ...msg.date ? {
            timestamp: msg.date * 1000
        } : {},
        ...body ? {
            body
        } : {},
        ...media ? {
            mediaType: resolveMediaType(media.placeholder) ?? media.placeholder
        } : {},
        ...fileId ? {
            mediaRef: `telegram:file/${fileId}`
        } : {},
        ...replyMessage?.message_id != null ? {
            replyToId: String(replyMessage.message_id)
        } : {},
        ...forwardedFrom?.from ? {
            forwardedFrom: forwardedFrom.from
        } : {},
        ...forwardedFrom?.fromId ? {
            forwardedFromId: forwardedFrom.fromId
        } : {},
        ...forwardedFrom?.fromUsername ? {
            forwardedFromUsername: forwardedFrom.fromUsername
        } : {},
        ...forwardedFrom?.date ? {
            forwardedDate: forwardedFrom.date * 1000
        } : {},
        ...threadId !== undefined ? {
            threadId: String(threadId)
        } : {}
    };
}
function normalizeRequiredMessageNode(msg, params) {
    const node = normalizeMessageNode(msg, params);
    if (!node) {
        throw new Error("Telegram message cache node missing message id");
    }
    return node;
}
function resolveMessageThreadId(msg) {
    const threadId = msg.message_thread_id;
    return normalizeTelegramCacheThreadId(threadId);
}
function normalizeMessageNodes(msg, params) {
    const observations = [];
    const visited = new Set();
    const nodeThreadId = (node)=>parseCachedThreadId(node.threadId);
    const visit = (message, inheritedThreadId, mode)=>{
        const node = normalizeMessageNode(message, {
            threadId: resolveMessageThreadId(message) ?? inheritedThreadId
        });
        if (!node?.messageId || visited.has(node.messageId)) {
            return;
        }
        visited.add(node.messageId);
        const replyMessage = resolveEmbeddedReplyMessage(message);
        if (replyMessage?.message_id != null) {
            visit(replyMessage, nodeThreadId(node) ?? inheritedThreadId, "partial");
        }
        observations.push({
            node,
            mode
        });
    };
    visit(msg, params.threadId, "authoritative");
    return observations;
}
function isString(value) {
    return typeof value === "string" && value.length > 0;
}
function readOptionalString(record, key) {
    const value = record[key];
    return isString(value) ? value : undefined;
}
function parseSafeMessageId(value) {
    return value === undefined ? undefined : (0, _numberruntime.parseStrictPositiveInteger)(value);
}
function parseCachedThreadId(value) {
    return normalizeTelegramCacheThreadId(value);
}
function normalizeTelegramCacheThreadId(value) {
    return (0, _outboundparams.parseTelegramMessageThreadId)(value);
}
function isTelegramSourceMessage(value) {
    return (0, _stringcoerceruntime.isRecord)(value) && typeof value.message_id === "number" && Number.isFinite(value.message_id) && typeof value.date === "number" && Number.isFinite(value.date);
}
function parsePersistedEntry(value) {
    if (!(0, _stringcoerceruntime.isRecord)(value) || !isString(value.key)) {
        return [];
    }
    const separatorIndex = value.key.lastIndexOf(":");
    if (separatorIndex === -1 || !(0, _stringcoerceruntime.isRecord)(value.node) || !isTelegramSourceMessage(value.node.sourceMessage)) {
        return [];
    }
    const keyPrefix = value.key.slice(0, separatorIndex + 1);
    const threadId = parseCachedThreadId(readOptionalString(value.node, "threadId"));
    const sourceMessageId = String(value.node.sourceMessage.message_id);
    const threadParams = threadId !== undefined ? {
        threadId
    } : {};
    return normalizeMessageNodes(value.node.sourceMessage, threadParams).map(({ node, mode })=>({
            key: `${keyPrefix}${node.messageId}`,
            node,
            mode: node.messageId === sourceMessageId ? "authoritative" : mode
        }));
}
function persistedValueToEntry(key, value) {
    return {
        key,
        node: {
            sourceMessage: value.sourceMessage,
            ...value.threadId ? {
                threadId: value.threadId
            } : {}
        }
    };
}
function findJsonArrayEnd(text) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    let started = false;
    for(let index = 0; index < text.length; index++){
        const char = text[index];
        if (!started) {
            if (char.trim() === "") {
                continue;
            }
            if (char !== "[") {
                return -1;
            }
            started = true;
            depth = 1;
            continue;
        }
        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === "\\") {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }
        if (char === '"') {
            inString = true;
        } else if (char === "[") {
            depth++;
        } else if (char === "]") {
            depth--;
            if (depth === 0) {
                return index + 1;
            }
        }
    }
    return -1;
}
function readPersistedEntryValues(raw) {
    const values = [];
    const readLines = (text)=>{
        for (const line of text.split("\n")){
            if (!line.trim()) {
                continue;
            }
            try {
                const value = JSON.parse(line);
                values.push(value);
            } catch  {
            // Legacy cache files were best-effort append logs. Doctor imports every
            // valid row and ignores torn/corrupt entries instead of keeping runtime fallback.
            }
        }
    };
    const trimmedStart = raw.trimStart();
    if (trimmedStart.startsWith("[")) {
        const startOffset = raw.length - trimmedStart.length;
        const arrayEnd = findJsonArrayEnd(raw.slice(startOffset));
        if (arrayEnd === -1) {
            readLines(raw);
            return values;
        }
        const legacyValue = JSON.parse(raw.slice(startOffset, startOffset + arrayEnd));
        if (Array.isArray(legacyValue)) {
            values.push(...legacyValue);
        }
        readLines(raw.slice(startOffset + arrayEnd));
        return values;
    }
    readLines(raw);
    return values;
}
function trimMessages(messages, maxMessages) {
    while(messages.size > maxMessages){
        const oldest = messages.keys().next().value;
        if (oldest === undefined) {
            break;
        }
        messages.delete(oldest);
    }
}
function mergeTelegramSourceMessage(existing, incoming) {
    const existingReply = resolveEmbeddedReplyMessage(existing);
    const incomingReply = resolveEmbeddedReplyMessage(incoming);
    if (existingReply?.message_id != null && incomingReply?.message_id === existingReply.message_id) {
        return Object.assign({}, existing, incoming, {
            reply_to_message: mergeTelegramSourceMessage(existingReply, incomingReply)
        });
    }
    return Object.assign({}, existing, incoming);
}
function mergeAuthoritativeTelegramSourceMessage(existing, incoming) {
    const existingReply = resolveEmbeddedReplyMessage(existing);
    const incomingReply = resolveEmbeddedReplyMessage(incoming);
    if (existingReply?.message_id != null && incomingReply?.message_id === existingReply.message_id) {
        return Object.assign({}, incoming, {
            reply_to_message: mergeTelegramSourceMessage(existingReply, incomingReply)
        });
    }
    return incoming;
}
function mergeCachedMessageNode(existing, incoming, mode) {
    const threadId = parseCachedThreadId(incoming.threadId ?? existing.threadId);
    const sourceMessage = mode === "authoritative" ? mergeAuthoritativeTelegramSourceMessage(existing.sourceMessage, incoming.sourceMessage) : mergeTelegramSourceMessage(existing.sourceMessage, incoming.sourceMessage);
    return normalizeRequiredMessageNode(sourceMessage, threadId !== undefined ? {
        threadId
    } : {});
}
function upsertCachedMessageNode(params) {
    const existing = params.messages.get(params.key);
    const node = existing ? mergeCachedMessageNode(existing, params.node, params.mode) : params.node;
    params.messages.delete(params.key);
    params.messages.set(params.key, node);
    return node;
}
function readPersistedMessages(filePath, maxMessages) {
    const messages = new Map();
    if (!_nodefs.default.existsSync(filePath)) {
        return {
            messages
        };
    }
    try {
        for (const value of readPersistedEntryValues(_nodefs.default.readFileSync(filePath, "utf-8"))){
            for (const entry of parsePersistedEntry(value)){
                upsertCachedMessageNode({
                    messages,
                    key: entry.key,
                    node: entry.node,
                    mode: entry.mode
                });
                trimMessages(messages, maxMessages);
            }
        }
    } catch (error) {
        (0, _runtimeenv.logVerbose)(`telegram: failed to read message cache: ${String(error)}`);
    }
    return {
        messages
    };
}
function toPersistedCacheValue(node) {
    return {
        sourceMessage: node.sourceMessage,
        ...node.threadId ? {
            threadId: node.threadId
        } : {}
    };
}
function resolvePersistentScopeKey(scope) {
    return (0, _nodecrypto.createHash)("sha256").update(scope).digest("hex").slice(0, 24);
}
function resolveTelegramMessageCachePersistentScopeKey(scope) {
    return resolvePersistentScopeKey(scope);
}
function listTelegramLegacyMessageCacheEntries(params) {
    const persisted = readPersistedMessages(params.persistedPath, params.maxMessages ?? TELEGRAM_MESSAGE_CACHE_PERSISTENT_MAX_MESSAGES);
    return Array.from(persisted.messages, ([key, node])=>({
            key,
            value: toPersistedCacheValue(node)
        }));
}
function resolveDefaultPersistentStore() {
    const runtime = (0, _runtime.getOptionalTelegramRuntime)();
    if (!runtime) {
        return undefined;
    }
    try {
        return runtime.state.openKeyedStore({
            namespace: TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE,
            maxEntries: TELEGRAM_MESSAGE_CACHE_PERSISTENT_MAX_MESSAGES
        });
    } catch (error) {
        (0, _runtimeenv.logVerbose)(`telegram: failed to open message cache plugin state: ${String(error)}`);
        return undefined;
    }
}
function resolveMessageCacheBucket(params) {
    const { bucketKey } = params;
    if (!bucketKey) {
        return {
            messages: new Map(),
            hydrated: true
        };
    }
    const existing = persistedMessageCacheBuckets.get(bucketKey);
    if (existing) {
        existing.persistentStore = params.persistentStore ?? existing.persistentStore;
        return existing;
    }
    const bucket = {
        messages: new Map(),
        hydrated: false,
        ...params.persistentStore ? {
            persistentStore: params.persistentStore
        } : {}
    };
    persistedMessageCacheBuckets.set(bucketKey, bucket);
    return bucket;
}
async function hydrateMessageCacheBucket(bucket, maxMessages, scopeKey) {
    if (bucket.hydrated) {
        return;
    }
    if (bucket.hydratePromise) {
        await bucket.hydratePromise;
        return;
    }
    bucket.hydratePromise = (async ()=>{
        let storeEntries = [];
        try {
            storeEntries = await bucket.persistentStore?.entries() ?? [];
        } catch (error) {
            (0, _runtimeenv.logVerbose)(`telegram: failed to hydrate message cache from plugin state: ${String(error)}`);
        }
        const scopedStoreEntries = scopeKey ? storeEntries.filter(({ key })=>key.startsWith(`${scopeKey}:`)) : storeEntries;
        for (const { key, value } of scopedStoreEntries){
            for (const entry of parsePersistedEntry(persistedValueToEntry(key, value))){
                upsertCachedMessageNode({
                    messages: bucket.messages,
                    key: entry.key,
                    node: entry.node,
                    mode: entry.mode
                });
                trimMessages(bucket.messages, maxMessages);
            }
        }
        bucket.hydrated = true;
    })().finally(()=>{
        bucket.hydratePromise = undefined;
    });
    await bucket.hydratePromise;
}
async function persistCachedNode(params) {
    const { persistentStore } = params.bucket;
    if (!persistentStore) {
        return;
    }
    try {
        await persistentStore.register(params.key, toPersistedCacheValue(params.node));
    } catch (error) {
        (0, _runtimeenv.logVerbose)(`telegram: failed to persist message cache: ${String(error)}`);
    }
}
function createTelegramMessageCache(params) {
    const persistentStore = params?.persistentStore ?? resolveDefaultPersistentStore();
    const maxMessages = params?.maxMessages ?? (persistentStore ? TELEGRAM_MESSAGE_CACHE_PERSISTENT_MAX_MESSAGES : DEFAULT_MAX_MESSAGES);
    const scopeKey = persistentStore ? resolvePersistentScopeKey(params?.scope ?? "default") : undefined;
    const bucketKey = params?.bucketKey ?? (persistentStore ? `${PERSISTENT_BUCKET_KEY}:${scopeKey}` : undefined);
    const bucket = resolveMessageCacheBucket({
        bucketKey,
        maxMessages,
        ...persistentStore ? {
            persistentStore
        } : {}
    });
    const { messages } = bucket;
    const get = async ({ accountId, chatId, messageId })=>{
        await hydrateMessageCacheBucket(bucket, maxMessages, scopeKey);
        if (!messageId) {
            return null;
        }
        const key = telegramMessageCacheKey({
            scopeKey,
            accountId,
            chatId,
            messageId
        });
        const entry = messages.get(key);
        if (!entry) {
            return null;
        }
        messages.delete(key);
        messages.set(key, entry);
        return entry;
    };
    const listChatMessages = async (paramsLocal)=>{
        await hydrateMessageCacheBucket(bucket, maxMessages, scopeKey);
        const prefix = telegramMessageCacheKeyPrefix({
            scopeKey,
            ...paramsLocal
        });
        const normalizedThreadId = normalizeTelegramCacheThreadId(paramsLocal.threadId);
        if (paramsLocal.threadId != null && normalizedThreadId === undefined) {
            return [];
        }
        const threadId = normalizedThreadId !== undefined ? String(normalizedThreadId) : undefined;
        return Array.from(messages, ([key, node])=>({
                key,
                node
            })).filter(({ key, node })=>{
            if (!key.startsWith(prefix)) {
                return false;
            }
            return threadId === undefined || node.threadId === threadId;
        }).map(({ node })=>node).toSorted(compareCachedMessageNodes);
    };
    return {
        record: async ({ accountId, chatId, msg, threadId })=>{
            await hydrateMessageCacheBucket(bucket, maxMessages, scopeKey);
            const observations = normalizeMessageNodes(msg, {
                threadId
            });
            const currentObservation = observations.at(-1);
            if (!currentObservation) {
                return null;
            }
            let recordedEntry = null;
            for (const { node, mode } of observations){
                const { messageId } = node;
                if (!messageId) {
                    continue;
                }
                const key = telegramMessageCacheKey({
                    scopeKey,
                    accountId,
                    chatId,
                    messageId
                });
                const cachedNode = upsertCachedMessageNode({
                    messages,
                    key,
                    node,
                    mode
                });
                if (messageId === currentObservation.node.messageId) {
                    recordedEntry = cachedNode;
                }
                trimMessages(messages, maxMessages);
                await persistCachedNode({
                    bucket,
                    key,
                    node: cachedNode
                });
            }
            return recordedEntry ?? currentObservation.node;
        },
        get,
        recentBefore: async ({ accountId, chatId, messageId, threadId, limit })=>{
            if (!messageId || limit <= 0) {
                return [];
            }
            const targetId = parseSafeMessageId(messageId);
            if (targetId === undefined) {
                return [];
            }
            return (await listChatMessages({
                accountId,
                chatId,
                threadId
            })).filter((entry)=>{
                const entryId = parseSafeMessageId(entry.messageId);
                return entryId !== undefined && entryId < targetId;
            }).slice(-limit);
        },
        around: async ({ accountId, chatId, messageId, threadId, before, after })=>{
            if (!messageId) {
                return [];
            }
            const entries = await listChatMessages({
                accountId,
                chatId,
                threadId
            });
            const targetIndex = entries.findIndex((entry)=>entry.messageId === messageId);
            if (targetIndex === -1) {
                return [];
            }
            return entries.slice(Math.max(0, targetIndex - Math.max(0, before)), targetIndex + Math.max(0, after) + 1);
        }
    };
}
function compareCachedMessageNodes(left, right) {
    const leftId = parseSafeMessageId(left.messageId);
    const rightId = parseSafeMessageId(right.messageId);
    if (leftId !== undefined && rightId !== undefined) {
        return leftId - rightId;
    }
    return (left.messageId ?? "").localeCompare(right.messageId ?? "");
}
const SESSION_BOUNDARY_COMMAND_RE = /^\/(?:new|reset)(?:@[A-Za-z0-9_]+)?(?:\s|$)/i;
const SOFT_RESET_COMMAND_RE = /^\/reset(?:@[A-Za-z0-9_]+)?\s+soft(?:\s|$)/i;
function isSessionBoundaryCommandNode(node) {
    const body = node.body?.trim();
    return Boolean(body && SESSION_BOUNDARY_COMMAND_RE.test(body) && !SOFT_RESET_COMMAND_RE.test(body));
}
function isAfterSessionBoundary(node, boundary) {
    if (!boundary) {
        return true;
    }
    const nodeId = parseSafeMessageId(node.messageId);
    const boundaryId = parseSafeMessageId(boundary.messageId);
    if (nodeId !== undefined && boundaryId !== undefined) {
        return nodeId > boundaryId;
    }
    if (typeof node.timestamp === "number" && Number.isFinite(node.timestamp) && typeof boundary.timestamp === "number" && Number.isFinite(boundary.timestamp)) {
        return node.timestamp > boundary.timestamp;
    }
    return true;
}
function normalizeSessionBoundaryTimestamp(timestampMs) {
    if (typeof timestampMs !== "number" || !Number.isFinite(timestampMs)) {
        return undefined;
    }
    return Math.floor(timestampMs / 1000) * 1000;
}
function isAtOrAfterSessionBoundaryTimestamp(node, boundaryTimestampMs) {
    if (boundaryTimestampMs === undefined) {
        return true;
    }
    return typeof node.timestamp !== "number" || !Number.isFinite(node.timestamp) ? true : node.timestamp >= boundaryTimestampMs;
}
async function resolveSessionBoundaryNode(params) {
    if (!params.messageId) {
        return undefined;
    }
    const { messageId } = params;
    const candidates = (await params.cache.recentBefore({
        accountId: params.accountId,
        chatId: params.chatId,
        messageId,
        ...params.threadId !== undefined ? {
            threadId: params.threadId
        } : {},
        limit: Number.MAX_SAFE_INTEGER
    })).filter(isSessionBoundaryCommandNode);
    const current = await params.cache.get({
        accountId: params.accountId,
        chatId: params.chatId,
        messageId
    });
    if (current && isSessionBoundaryCommandNode(current)) {
        candidates.push(current);
    }
    return candidates.toSorted(compareCachedMessageNodes).at(-1);
}
async function buildTelegramReplyChain(params) {
    const replyMessage = resolveReplyMessage(params.msg);
    if (!replyMessage?.message_id) {
        return [];
    }
    const maxDepth = params.maxDepth ?? 4;
    const visited = new Set();
    const chain = [];
    let current = await params.cache.get({
        accountId: params.accountId,
        chatId: params.chatId,
        messageId: String(replyMessage.message_id)
    }) ?? normalizeMessageNode(replyMessage, {});
    while(current?.messageId && chain.length < maxDepth && !visited.has(current.messageId)){
        visited.add(current.messageId);
        chain.push(current);
        current = await params.cache.get({
            accountId: params.accountId,
            chatId: params.chatId,
            messageId: current.replyToId
        });
    }
    return chain;
}
async function buildTelegramConversationContext(params) {
    const selected = new Map();
    const replyTargetIds = new Set();
    const sessionBoundary = await resolveSessionBoundaryNode(params);
    const sessionBoundaryTimestamp = normalizeSessionBoundaryTimestamp(params.minTimestampMs);
    const addNode = (node, flags)=>{
        if (!node.messageId || node.messageId === params.messageId) {
            return;
        }
        if (!isAfterSessionBoundary(node, sessionBoundary)) {
            return;
        }
        if (!isAtOrAfterSessionBoundaryTimestamp(node, sessionBoundaryTimestamp)) {
            return;
        }
        const existing = selected.get(node.messageId);
        const isReplyTarget = existing?.isReplyTarget === true || flags?.replyTarget === true;
        selected.set(node.messageId, {
            node: existing?.node ?? node,
            isReplyTarget: isReplyTarget ? true : undefined
        });
    };
    const addReplyTargetWindow = async (messageId)=>{
        replyTargetIds.add(messageId);
        for (const node of (await params.cache.around({
            accountId: params.accountId,
            chatId: params.chatId,
            messageId,
            ...params.threadId !== undefined ? {
                threadId: params.threadId
            } : {},
            before: params.replyTargetWindowSize,
            after: params.replyTargetWindowSize
        }))){
            addNode(node, {
                replyTarget: node.messageId === messageId
            });
        }
    };
    const currentWindow = await params.cache.recentBefore({
        accountId: params.accountId,
        chatId: params.chatId,
        messageId: params.messageId,
        ...params.threadId !== undefined ? {
            threadId: params.threadId
        } : {},
        limit: params.recentLimit
    });
    for (const node of currentWindow){
        addNode(node);
        if (node.replyToId) {
            await addReplyTargetWindow(node.replyToId);
        }
    }
    for (const [index, node] of params.replyChainNodes.entries()){
        addNode(node, {
            replyTarget: index === 0
        });
        if (index === 0 && node.messageId) {
            await addReplyTargetWindow(node.messageId);
        }
        if (node.replyToId) {
            replyTargetIds.add(node.replyToId);
        }
    }
    for (const messageId of replyTargetIds){
        const node = await params.cache.get({
            accountId: params.accountId,
            chatId: params.chatId,
            messageId
        });
        if (node) {
            addNode(node, {
                replyTarget: true
            });
        }
    }
    return Array.from(selected.values()).toSorted((left, right)=>compareCachedMessageNodes(left.node, right.node));
}

//# sourceMappingURL=message-cache.js.map