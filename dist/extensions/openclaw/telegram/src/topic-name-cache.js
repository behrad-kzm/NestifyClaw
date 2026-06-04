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
    get TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES () {
        return TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES;
    },
    get clearTopicNameCache () {
        return clearTopicNameCache;
    },
    get getTopicEntry () {
        return getTopicEntry;
    },
    get getTopicName () {
        return getTopicName;
    },
    get listTelegramLegacyTopicNameCacheEntries () {
        return listTelegramLegacyTopicNameCacheEntries;
    },
    get resetTopicNameCacheForTest () {
        return resetTopicNameCacheForTest;
    },
    get resolveTopicNameCacheNamespace () {
        return resolveTopicNameCacheNamespace;
    },
    get resolveTopicNameCachePath () {
        return resolveTopicNameCachePath;
    },
    get resolveTopicNameCacheScope () {
        return resolveTopicNameCacheScope;
    },
    get setTelegramTopicNameStoreFactoryForTest () {
        return setTelegramTopicNameStoreFactoryForTest;
    },
    get topicNameCacheSize () {
        return topicNameCacheSize;
    },
    get updateTopicName () {
        return updateTopicName;
    }
});
const _nodecrypto = require("node:crypto");
const _jsonstore = require("../../../../common/openclaw/plugin-sdk/json-store");
const _runtime = require("./runtime.js");
const TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES = 2_048;
const STORE_NAMESPACE_PREFIX = "telegram.topic-name-cache";
const TOPIC_NAME_CACHE_STATE_KEY = Symbol.for("openclaw.telegramTopicNameCacheState");
const DEFAULT_TOPIC_NAME_CACHE_SCOPE = "default";
let topicNameStoreFactoryForTest;
function createTopicNameStore() {
    return new Map();
}
function createTopicNameStoreState(namespace) {
    return {
        lastUpdatedAt: 0,
        store: createTopicNameStore(),
        hydrated: false,
        persistentStore: openTopicNamePersistentStore(namespace)
    };
}
function getTopicNameCacheState() {
    const globalStore = globalThis;
    const existing = globalStore[TOPIC_NAME_CACHE_STATE_KEY];
    if (existing) {
        return existing;
    }
    const state = {
        stores: new Map()
    };
    globalStore[TOPIC_NAME_CACHE_STATE_KEY] = state;
    return state;
}
function cacheKey(chatId, threadId) {
    return `${chatId}:${threadId}`;
}
function namespaceForScope(scope) {
    const hash = (0, _nodecrypto.createHash)("sha256").update(scope).digest("hex").slice(0, 16);
    return `${STORE_NAMESPACE_PREFIX}.${hash}`;
}
function resolveTopicNameCachePath(storePath) {
    return `${storePath}.telegram-topic-names.json`;
}
function resolveTopicNameCacheScope(storePath) {
    return storePath;
}
function resolveTopicNameCacheNamespace(scope) {
    return namespaceForScope(scope);
}
function openTopicNamePersistentStore(namespace) {
    return topicNameStoreFactoryForTest?.(namespace) ?? (0, _runtime.getTelegramRuntime)().state.openKeyedStore({
        namespace,
        maxEntries: TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES
    });
}
function evictOldest(store) {
    if (store.size <= TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES) {
        return undefined;
    }
    let oldestKey;
    let oldestTime = Infinity;
    for (const [key, entry] of store){
        if (entry.updatedAt < oldestTime) {
            oldestTime = entry.updatedAt;
            oldestKey = key;
        }
    }
    if (oldestKey) {
        store.delete(oldestKey);
    }
    return oldestKey;
}
function isTopicEntry(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const entry = value;
    return typeof entry.name === "string" && entry.name.length > 0 && typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt);
}
function getTopicStoreState(scope) {
    const state = getTopicNameCacheState();
    const stateKey = scope ?? DEFAULT_TOPIC_NAME_CACHE_SCOPE;
    const existing = state.stores.get(stateKey);
    if (existing) {
        return existing;
    }
    const next = createTopicNameStoreState(namespaceForScope(stateKey));
    state.stores.set(stateKey, next);
    return next;
}
async function hydrateTopicStoreState(state) {
    if (state.hydrated) {
        return;
    }
    if (state.hydratePromise) {
        await state.hydratePromise;
        return;
    }
    state.hydratePromise = (async ()=>{
        const entries = await state.persistentStore.entries();
        for (const { key, value } of entries){
            if (isTopicEntry(value)) {
                state.store.set(key, value);
            }
        }
        state.lastUpdatedAt = Math.max(0, ...Array.from(state.store.values(), (entry)=>entry.updatedAt));
        state.hydrated = true;
    })().finally(()=>{
        state.hydratePromise = undefined;
    });
    await state.hydratePromise;
}
async function getTopicStore(scope) {
    const state = getTopicStoreState(scope);
    await hydrateTopicStoreState(state);
    return state.store;
}
function nextUpdatedAt(scope) {
    const state = getTopicStoreState(scope);
    const now = Date.now();
    state.lastUpdatedAt = now > state.lastUpdatedAt ? now : state.lastUpdatedAt + 1;
    return state.lastUpdatedAt;
}
async function updateTopicName(chatId, threadId, patch, scope) {
    const state = getTopicStoreState(scope);
    await hydrateTopicStoreState(state);
    const key = cacheKey(chatId, threadId);
    const existing = state.store.get(key);
    const iconColor = patch.iconColor ?? existing?.iconColor;
    const iconCustomEmojiId = patch.iconCustomEmojiId ?? existing?.iconCustomEmojiId;
    const closed = patch.closed ?? existing?.closed;
    const merged = {
        name: patch.name ?? existing?.name ?? "",
        updatedAt: nextUpdatedAt(scope),
        ...iconColor !== undefined ? {
            iconColor
        } : {},
        ...iconCustomEmojiId !== undefined ? {
            iconCustomEmojiId
        } : {},
        ...closed !== undefined ? {
            closed
        } : {}
    };
    if (!merged.name) {
        return;
    }
    state.store.set(key, merged);
    await state.persistentStore.register(key, merged);
    const evictedKey = evictOldest(state.store);
    if (evictedKey) {
        await state.persistentStore.delete(evictedKey);
    }
}
async function getTopicName(chatId, threadId, scope) {
    const state = getTopicStoreState(scope);
    await hydrateTopicStoreState(state);
    const key = cacheKey(chatId, threadId);
    const entry = state.store.get(key);
    if (entry) {
        entry.updatedAt = nextUpdatedAt(scope);
        await state.persistentStore.register(key, entry);
    }
    return entry?.name;
}
async function getTopicEntry(chatId, threadId, scope) {
    return (await getTopicStore(scope)).get(cacheKey(chatId, threadId));
}
async function listTelegramLegacyTopicNameCacheEntries(params) {
    const { value } = await (0, _jsonstore.readJsonFileWithFallback)(params.persistedPath, {});
    return Object.entries(value).filter((entry)=>isTopicEntry(entry[1])).toSorted(([, left], [, right])=>right.updatedAt - left.updatedAt).slice(0, params.maxEntries ?? TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES).map(([key, entry])=>({
            key,
            value: entry
        }));
}
async function clearTopicNameCache() {
    const state = getTopicNameCacheState();
    await Promise.all([
        ...state.stores.values()
    ].map((storeState)=>storeState.persistentStore.clear()));
    state.stores.clear();
}
function topicNameCacheSize(scope) {
    return getTopicStoreState(scope).store.size;
}
function resetTopicNameCacheForTest() {
    getTopicNameCacheState().stores.clear();
}
function setTelegramTopicNameStoreFactoryForTest(factory) {
    topicNameStoreFactoryForTest = factory;
}

//# sourceMappingURL=topic-name-cache.js.map