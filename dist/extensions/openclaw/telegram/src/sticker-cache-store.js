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
    get TELEGRAM_STICKER_CACHE_MAX_ENTRIES () {
        return TELEGRAM_STICKER_CACHE_MAX_ENTRIES;
    },
    get TELEGRAM_STICKER_CACHE_NAMESPACE () {
        return TELEGRAM_STICKER_CACHE_NAMESPACE;
    },
    get cacheSticker () {
        return cacheSticker;
    },
    get clearTelegramStickerCacheForTest () {
        return clearTelegramStickerCacheForTest;
    },
    get getAllCachedStickers () {
        return getAllCachedStickers;
    },
    get getCacheStats () {
        return getCacheStats;
    },
    get getCachedSticker () {
        return getCachedSticker;
    },
    get listTelegramLegacyStickerCacheEntries () {
        return listTelegramLegacyStickerCacheEntries;
    },
    get searchStickers () {
        return searchStickers;
    },
    get setTelegramStickerCacheStoreForTest () {
        return setTelegramStickerCacheStoreForTest;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _jsonstore = require("../../../../common/openclaw/plugin-sdk/json-store");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _statepaths = require("../../../../common/openclaw/plugin-sdk/state-paths");
const _runtime = require("./runtime.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const CACHE_VERSION = 1;
const TELEGRAM_STICKER_CACHE_NAMESPACE = "telegram.sticker-cache";
const TELEGRAM_STICKER_CACHE_MAX_ENTRIES = 10_000;
let stickerCacheStoreForTest;
function getCacheFile() {
    return _nodepath.default.join((0, _statepaths.resolveStateDir)(), "telegram", "sticker-cache.json");
}
function openStickerCacheStore() {
    return stickerCacheStoreForTest ?? (0, _runtime.getTelegramRuntime)().state.openSyncKeyedStore({
        namespace: TELEGRAM_STICKER_CACHE_NAMESPACE,
        maxEntries: TELEGRAM_STICKER_CACHE_MAX_ENTRIES
    });
}
function loadCache() {
    return loadCacheFile(getCacheFile());
}
function normalizeStickerSearchText(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function normalizeCachedStickerForStore(sticker) {
    return {
        fileId: sticker.fileId,
        fileUniqueId: sticker.fileUniqueId,
        description: sticker.description,
        cachedAt: sticker.cachedAt,
        ...sticker.emoji !== undefined ? {
            emoji: sticker.emoji
        } : {},
        ...sticker.setName !== undefined ? {
            setName: sticker.setName
        } : {},
        ...sticker.receivedFrom !== undefined ? {
            receivedFrom: sticker.receivedFrom
        } : {}
    };
}
function readStickerCacheStore(operation, read, fallback) {
    try {
        return read(openStickerCacheStore());
    } catch (err) {
        (0, _runtimeenv.logVerbose)(`telegram sticker cache ${operation} failed: ${String(err)}`);
        return fallback;
    }
}
function getCachedSticker(fileUniqueId) {
    return readStickerCacheStore("lookup", (store)=>store.lookup(fileUniqueId) ?? null, null);
}
function cacheSticker(sticker) {
    readStickerCacheStore("register", (store)=>{
        store.register(sticker.fileUniqueId, normalizeCachedStickerForStore(sticker));
    }, undefined);
}
function searchStickers(query, limit = 10) {
    const queryLower = normalizeStickerSearchText(query);
    const results = [];
    for (const { value: sticker } of readStickerCacheStore("entries", (store)=>store.entries(), [])){
        let score = 0;
        const descLower = normalizeStickerSearchText(sticker.description);
        // Exact substring match in description
        if (descLower.includes(queryLower)) {
            score += 10;
        }
        // Word-level matching
        const queryWords = queryLower.split(/\s+/).filter(Boolean);
        const descWords = descLower.split(/\s+/);
        for (const qWord of queryWords){
            if (descWords.some((dWord)=>dWord.includes(qWord))) {
                score += 5;
            }
        }
        // Emoji match
        if (sticker.emoji && query.includes(sticker.emoji)) {
            score += 8;
        }
        // Set name match
        if (normalizeStickerSearchText(sticker.setName).includes(queryLower)) {
            score += 3;
        }
        if (score > 0) {
            results.push({
                sticker,
                score
            });
        }
    }
    return results.toSorted((a, b)=>b.score - a.score).slice(0, limit).map((r)=>r.sticker);
}
function getAllCachedStickers() {
    return readStickerCacheStore("entries", (store)=>store.entries().map((entry)=>entry.value), []);
}
function getCacheStats() {
    const stickers = getAllCachedStickers();
    if (stickers.length === 0) {
        return {
            count: 0
        };
    }
    const sorted = [
        ...stickers
    ].toSorted((a, b)=>new Date(a.cachedAt).getTime() - new Date(b.cachedAt).getTime());
    return {
        count: stickers.length,
        oldestAt: sorted[0]?.cachedAt,
        newestAt: sorted[sorted.length - 1]?.cachedAt
    };
}
function setTelegramStickerCacheStoreForTest(store) {
    stickerCacheStoreForTest = store;
}
function clearTelegramStickerCacheForTest() {
    openStickerCacheStore().clear();
}
function listTelegramLegacyStickerCacheEntries(params = {}) {
    const cache = params.persistedPath ? loadCacheFile(params.persistedPath) : loadCache();
    return Object.entries(cache.stickers).map(([key, value])=>({
            key,
            value: normalizeCachedStickerForStore(value)
        }));
}
function loadCacheFile(filePath) {
    const data = (0, _jsonstore.loadJsonFile)(filePath);
    if (!data || typeof data !== "object") {
        return {
            version: CACHE_VERSION,
            stickers: {}
        };
    }
    const cache = data;
    if (cache.version !== CACHE_VERSION) {
        return {
            version: CACHE_VERSION,
            stickers: {}
        };
    }
    return cache;
}

//# sourceMappingURL=sticker-cache-store.js.map