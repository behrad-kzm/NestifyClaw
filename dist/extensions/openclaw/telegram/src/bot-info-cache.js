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
    get TELEGRAM_BOT_INFO_CACHE_MAX_AGE_MS () {
        return TELEGRAM_BOT_INFO_CACHE_MAX_AGE_MS;
    },
    get TELEGRAM_BOT_INFO_CACHE_MAX_ENTRIES () {
        return TELEGRAM_BOT_INFO_CACHE_MAX_ENTRIES;
    },
    get TELEGRAM_BOT_INFO_CACHE_NAMESPACE () {
        return TELEGRAM_BOT_INFO_CACHE_NAMESPACE;
    },
    get deleteCachedTelegramBotInfo () {
        return deleteCachedTelegramBotInfo;
    },
    get listTelegramLegacyBotInfoCacheEntries () {
        return listTelegramLegacyBotInfoCacheEntries;
    },
    get readCachedTelegramBotInfo () {
        return readCachedTelegramBotInfo;
    },
    get resolveTelegramBotInfoCachePath () {
        return resolveTelegramBotInfoCachePath;
    },
    get setTelegramBotInfoCacheStoreForTest () {
        return setTelegramBotInfoCacheStoreForTest;
    },
    get writeCachedTelegramBotInfo () {
        return writeCachedTelegramBotInfo;
    }
});
const _nodeos = /*#__PURE__*/ _interop_require_default(require("node:os"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _jsonstore = require("../../../../common/openclaw/plugin-sdk/json-store");
const _statepaths = require("../../../../common/openclaw/plugin-sdk/state-paths");
const _botinfo = require("./bot-info.js");
const _runtime = require("./runtime.js");
const _tokenfingerprint = require("./token-fingerprint.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const LEGACY_STORE_VERSION = 1;
const TELEGRAM_BOT_INFO_CACHE_NAMESPACE = "telegram.bot-info-cache";
const TELEGRAM_BOT_INFO_CACHE_MAX_ENTRIES = 128;
const TELEGRAM_BOT_INFO_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
let botInfoCacheStoreForTest;
function normalizeAccountId(accountId) {
    const trimmed = accountId?.trim();
    if (!trimmed) {
        return "default";
    }
    return trimmed.replace(/[^a-z0-9._-]+/gi, "_");
}
function fingerprintFromToken(botToken) {
    const trimmed = botToken?.trim();
    if (!trimmed) {
        return null;
    }
    return (0, _tokenfingerprint.fingerprintTelegramBotToken)(trimmed);
}
function resolveTelegramBotInfoCachePath(accountId, env = process.env) {
    const stateDir = (0, _statepaths.resolveStateDir)(env, _nodeos.default.homedir);
    return _nodepath.default.join(stateDir, "telegram", `bot-info-${normalizeAccountId(accountId)}.json`);
}
function openBotInfoCacheStore() {
    return botInfoCacheStoreForTest ?? (0, _runtime.getTelegramRuntime)().state.openKeyedStore({
        namespace: TELEGRAM_BOT_INFO_CACHE_NAMESPACE,
        maxEntries: TELEGRAM_BOT_INFO_CACHE_MAX_ENTRIES,
        defaultTtlMs: TELEGRAM_BOT_INFO_CACHE_MAX_AGE_MS
    });
}
function parseCachedTelegramBotInfo(value) {
    if (!value || typeof value !== "object") {
        return null;
    }
    const state = value;
    if (typeof state.tokenFingerprint !== "string" || typeof state.fetchedAt !== "string" || Number.isNaN(Date.parse(state.fetchedAt))) {
        return null;
    }
    const botInfo = (0, _botinfo.normalizeTelegramBotInfo)(state.botInfo);
    if (!botInfo) {
        return null;
    }
    return {
        tokenFingerprint: state.tokenFingerprint,
        fetchedAt: state.fetchedAt,
        botInfo
    };
}
function parseLegacyCachedTelegramBotInfo(value) {
    if (!value || typeof value !== "object") {
        return null;
    }
    const state = value;
    if (state.version !== LEGACY_STORE_VERSION) {
        return null;
    }
    return parseCachedTelegramBotInfo(value);
}
async function readCachedTelegramBotInfo(params) {
    const tokenFingerprint = fingerprintFromToken(params.botToken);
    if (!tokenFingerprint) {
        return null;
    }
    const parsed = parseCachedTelegramBotInfo(await openBotInfoCacheStore().lookup(normalizeAccountId(params.accountId)));
    if (!parsed || parsed.tokenFingerprint !== tokenFingerprint) {
        return null;
    }
    const fetchedAtMs = Date.parse(parsed.fetchedAt);
    const nowMs = params.now?.getTime() ?? Date.now();
    if (nowMs - fetchedAtMs > TELEGRAM_BOT_INFO_CACHE_MAX_AGE_MS) {
        return null;
    }
    return {
        botInfo: parsed.botInfo,
        fetchedAt: parsed.fetchedAt
    };
}
async function writeCachedTelegramBotInfo(params) {
    const tokenFingerprint = fingerprintFromToken(params.botToken);
    if (!tokenFingerprint) {
        return;
    }
    const botInfo = (0, _botinfo.normalizeTelegramBotInfo)(params.botInfo);
    if (!botInfo) {
        return;
    }
    await openBotInfoCacheStore().register(normalizeAccountId(params.accountId), {
        tokenFingerprint,
        fetchedAt: new Date().toISOString(),
        botInfo
    });
}
async function deleteCachedTelegramBotInfo(params) {
    await openBotInfoCacheStore().delete(normalizeAccountId(params.accountId));
}
function setTelegramBotInfoCacheStoreForTest(store) {
    botInfoCacheStoreForTest = store;
}
async function listTelegramLegacyBotInfoCacheEntries(params) {
    const { value } = await (0, _jsonstore.readJsonFileWithFallback)(params.persistedPath, null);
    const parsed = parseLegacyCachedTelegramBotInfo(value);
    if (!parsed) {
        return [];
    }
    return [
        {
            key: normalizeAccountId(params.accountId),
            value: parsed
        }
    ];
}

//# sourceMappingURL=bot-info-cache.js.map