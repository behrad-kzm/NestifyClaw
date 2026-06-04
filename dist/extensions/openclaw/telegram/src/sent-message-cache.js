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
    get TELEGRAM_SENT_MESSAGE_CACHE_MAX_ENTRIES () {
        return TELEGRAM_SENT_MESSAGE_CACHE_MAX_ENTRIES;
    },
    get TELEGRAM_SENT_MESSAGE_CACHE_NAMESPACE () {
        return TELEGRAM_SENT_MESSAGE_CACHE_NAMESPACE;
    },
    get clearSentMessageCache () {
        return clearSentMessageCache;
    },
    get listTelegramLegacySentMessageCacheEntries () {
        return listTelegramLegacySentMessageCacheEntries;
    },
    get recordSentMessage () {
        return recordSentMessage;
    },
    get resetSentMessageCacheForTest () {
        return resetSentMessageCacheForTest;
    },
    get setTelegramSentMessageStoreForTest () {
        return setTelegramSentMessageStoreForTest;
    },
    get wasSentByBot () {
        return wasSentByBot;
    }
});
const _nodecrypto = require("node:crypto");
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _sessionstoreruntime = require("../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _runtime = require("./runtime.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const TTL_MS = 24 * 60 * 60 * 1000;
const TELEGRAM_SENT_MESSAGE_CACHE_NAMESPACE = "telegram.sent-messages";
const TELEGRAM_SENT_MESSAGE_CACHE_MAX_ENTRIES = 10_000;
const TELEGRAM_SENT_MESSAGES_STATE_KEY = Symbol.for("openclaw.telegramSentMessagesState");
const TELEGRAM_SENT_MESSAGES_STORE_FOR_TEST_KEY = Symbol.for("openclaw.telegramSentMessagesStoreForTest");
let sentMessageStoreForTest;
function getSentMessageStoreForTest() {
    const globalStore = globalThis;
    return sentMessageStoreForTest ?? globalStore[TELEGRAM_SENT_MESSAGES_STORE_FOR_TEST_KEY];
}
function getSentMessageState() {
    const globalStore = globalThis;
    const existing = globalStore[TELEGRAM_SENT_MESSAGES_STATE_KEY];
    if (existing) {
        return existing;
    }
    const state = {
        bucketsByScope: new Map()
    };
    globalStore[TELEGRAM_SENT_MESSAGES_STATE_KEY] = state;
    return state;
}
function createSentMessageStore() {
    return new Map();
}
function resolveSentMessageStorePath(cfg) {
    return `${(0, _sessionstoreruntime.resolveStorePath)(cfg?.session?.store)}.telegram-sent-messages.json`;
}
function resolveSentMessageScopeKey(cfg) {
    const storePath = (0, _sessionstoreruntime.resolveStorePath)(cfg?.session?.store);
    return (0, _nodecrypto.createHash)("sha256").update(storePath, "utf8").digest("hex").slice(0, 24);
}
function sentMessageEntryKey(scopeKey, chatId, messageId) {
    return (0, _nodecrypto.createHash)("sha256").update(`${scopeKey}\0${chatId}\0${messageId}`, "utf8").digest("hex").slice(0, 32);
}
function openSentMessageStore() {
    return getSentMessageStoreForTest() ?? (0, _runtime.getTelegramRuntime)().state.openSyncKeyedStore({
        namespace: TELEGRAM_SENT_MESSAGE_CACHE_NAMESPACE,
        maxEntries: TELEGRAM_SENT_MESSAGE_CACHE_MAX_ENTRIES
    });
}
function cleanupExpired(store, scopeKey, entry, now) {
    for (const [id, timestamp] of entry){
        if (now - timestamp >= TTL_MS) {
            entry.delete(id);
        }
    }
    if (entry.size === 0) {
        store.delete(scopeKey);
    }
}
function readLegacySentMessages(filePath) {
    try {
        const raw = _nodefs.default.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        const now = Date.now();
        const store = createSentMessageStore();
        for (const [chatId, entry] of Object.entries(parsed)){
            const messages = new Map();
            for (const [messageId, timestamp] of Object.entries(entry)){
                if (typeof timestamp === "number" && Number.isFinite(timestamp) && now - timestamp <= TTL_MS) {
                    messages.set(messageId, timestamp);
                }
            }
            if (messages.size > 0) {
                store.set(chatId, messages);
            }
        }
        return store;
    } catch (error) {
        (0, _runtimeenv.logVerbose)(`telegram: failed to read sent-message cache: ${String(error)}`);
        return createSentMessageStore();
    }
}
function readPersistedSentMessages(scopeKey) {
    const now = Date.now();
    const store = createSentMessageStore();
    try {
        for (const entry of openSentMessageStore().entries()){
            if (entry.value.scopeKey !== scopeKey || now - entry.value.timestamp > TTL_MS) {
                continue;
            }
            let messages = store.get(entry.value.chatId);
            if (!messages) {
                messages = new Map();
                store.set(entry.value.chatId, messages);
            }
            messages.set(entry.value.messageId, entry.value.timestamp);
        }
    } catch (error) {
        (0, _runtimeenv.logVerbose)(`telegram: failed to read sent-message cache: ${String(error)}`);
    }
    return store;
}
function getSentMessageBucket(cfg) {
    const state = getSentMessageState();
    const scopeKey = resolveSentMessageScopeKey(cfg);
    const existing = state.bucketsByScope.get(scopeKey);
    if (existing) {
        return existing;
    }
    const bucket = {
        scopeKey,
        store: readPersistedSentMessages(scopeKey)
    };
    state.bucketsByScope.set(scopeKey, bucket);
    return bucket;
}
function getSentMessages(cfg) {
    return getSentMessageBucket(cfg).store;
}
function persistSentMessages(bucket) {
    const { store, scopeKey } = bucket;
    const now = Date.now();
    for (const [chatId, entry] of store){
        cleanupExpired(store, chatId, entry, now);
        for (const [messageId, timestamp] of entry){
            const ttlMs = TTL_MS - Math.max(0, now - timestamp);
            if (ttlMs <= 0) {
                continue;
            }
            openSentMessageStore().register(sentMessageEntryKey(scopeKey, chatId, messageId), {
                scopeKey,
                chatId,
                messageId,
                timestamp
            }, {
                ttlMs
            });
        }
    }
}
function recordSentMessage(chatId, messageId, cfg) {
    const scopeKey = String(chatId);
    const idKey = String(messageId);
    const now = Date.now();
    const bucket = getSentMessageBucket(cfg);
    const { store } = bucket;
    let entry = store.get(scopeKey);
    if (!entry) {
        entry = new Map();
        store.set(scopeKey, entry);
    }
    entry.set(idKey, now);
    if (entry.size > 100) {
        cleanupExpired(store, scopeKey, entry, now);
    }
    try {
        persistSentMessages(bucket);
    } catch (error) {
        (0, _runtimeenv.logVerbose)(`telegram: failed to persist sent-message cache: ${String(error)}`);
    }
}
function wasSentByBot(chatId, messageId, cfg) {
    const scopeKey = String(chatId);
    const idKey = String(messageId);
    const store = getSentMessages(cfg);
    const entry = store.get(scopeKey);
    if (!entry) {
        return false;
    }
    cleanupExpired(store, scopeKey, entry, Date.now());
    return entry.has(idKey);
}
function clearSentMessageCache() {
    const state = getSentMessageState();
    for (const bucket of state.bucketsByScope.values()){
        bucket.store.clear();
    }
    state.bucketsByScope.clear();
    openSentMessageStore().clear();
}
function resetSentMessageCacheForTest() {
    getSentMessageState().bucketsByScope.clear();
}
function setTelegramSentMessageStoreForTest(store) {
    sentMessageStoreForTest = store;
    const globalStore = globalThis;
    if (store) {
        globalStore[TELEGRAM_SENT_MESSAGES_STORE_FOR_TEST_KEY] = store;
    } else {
        delete globalStore[TELEGRAM_SENT_MESSAGES_STORE_FOR_TEST_KEY];
    }
}
function listTelegramLegacySentMessageCacheEntries(params) {
    const scopeKey = resolveSentMessageScopeKey(params.cfg);
    const filePath = params.persistedPath ?? resolveSentMessageStorePath(params.cfg);
    const legacy = _nodefs.default.existsSync(filePath) ? readLegacySentMessages(filePath) : createSentMessageStore();
    return [
        ...legacy.entries()
    ].flatMap(([chatId, messages])=>[
            ...messages.entries()
        ].map(([messageId, timestamp])=>({
                key: sentMessageEntryKey(scopeKey, chatId, messageId),
                value: {
                    scopeKey,
                    chatId,
                    messageId,
                    timestamp
                },
                ttlMs: Math.max(1, TTL_MS - Math.max(0, Date.now() - timestamp))
            })));
}

//# sourceMappingURL=sent-message-cache.js.map