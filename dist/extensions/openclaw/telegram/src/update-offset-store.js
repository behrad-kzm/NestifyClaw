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
    get TELEGRAM_UPDATE_OFFSET_MAX_ENTRIES () {
        return TELEGRAM_UPDATE_OFFSET_MAX_ENTRIES;
    },
    get TELEGRAM_UPDATE_OFFSET_NAMESPACE () {
        return TELEGRAM_UPDATE_OFFSET_NAMESPACE;
    },
    get deleteTelegramUpdateOffset () {
        return deleteTelegramUpdateOffset;
    },
    get listTelegramLegacyUpdateOffsetEntries () {
        return listTelegramLegacyUpdateOffsetEntries;
    },
    get normalizeTelegramUpdateOffsetAccountId () {
        return normalizeTelegramUpdateOffsetAccountId;
    },
    get readTelegramUpdateOffset () {
        return readTelegramUpdateOffset;
    },
    get setTelegramUpdateOffsetStoreForTest () {
        return setTelegramUpdateOffsetStoreForTest;
    },
    get shouldReplaceTelegramUpdateOffsetEntry () {
        return shouldReplaceTelegramUpdateOffsetEntry;
    },
    get writeTelegramUpdateOffset () {
        return writeTelegramUpdateOffset;
    }
});
const _jsonstore = require("../../../../common/openclaw/plugin-sdk/json-store");
const _runtime = require("./runtime.js");
const _tokenfingerprint = require("./token-fingerprint.js");
const STORE_VERSION = 3;
const TELEGRAM_UPDATE_OFFSET_NAMESPACE = "telegram.update-offsets";
const TELEGRAM_UPDATE_OFFSET_MAX_ENTRIES = 1_000;
let updateOffsetStoreForTest;
function isValidUpdateId(value) {
    return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function normalizeTelegramUpdateOffsetAccountId(accountId) {
    const trimmed = accountId?.trim();
    if (!trimmed) {
        return "default";
    }
    return trimmed.replace(/[^a-z0-9._-]+/gi, "_");
}
function openUpdateOffsetStore(env) {
    return updateOffsetStoreForTest ?? (0, _runtime.getTelegramRuntime)().state.openKeyedStore({
        namespace: TELEGRAM_UPDATE_OFFSET_NAMESPACE,
        maxEntries: TELEGRAM_UPDATE_OFFSET_MAX_ENTRIES,
        ...env ? {
            env
        } : {}
    });
}
function extractBotIdFromToken(token) {
    const trimmed = token?.trim();
    if (!trimmed) {
        return null;
    }
    const [rawBotId] = trimmed.split(":", 1);
    if (!rawBotId || !/^\d+$/.test(rawBotId)) {
        return null;
    }
    return rawBotId;
}
function fingerprintFromToken(token) {
    const trimmed = token?.trim();
    if (!trimmed) {
        return null;
    }
    return (0, _tokenfingerprint.fingerprintTelegramBotToken)(trimmed);
}
function safeParseState(parsed) {
    try {
        const state = parsed;
        if (state?.version !== STORE_VERSION && state?.version !== 2 && state?.version !== 1) {
            return null;
        }
        if (state.lastUpdateId !== null && !isValidUpdateId(state.lastUpdateId)) {
            return null;
        }
        if (state.version >= 2 && state.botId !== null && typeof state.botId !== "string") {
            return null;
        }
        if (state.version === STORE_VERSION && state.tokenFingerprint !== null && typeof state.tokenFingerprint !== "string") {
            return null;
        }
        return {
            version: state.version,
            lastUpdateId: state.lastUpdateId ?? null,
            botId: state.version >= 2 ? state.botId ?? null : null,
            tokenFingerprint: state.version === STORE_VERSION ? state.tokenFingerprint ?? null : null
        };
    } catch  {
        return null;
    }
}
function rotationForToken(parsed, botToken) {
    const currentBotId = extractBotIdFromToken(botToken);
    if (!currentBotId || parsed.lastUpdateId === null) {
        return null;
    }
    let reason = null;
    if (parsed.botId === null) {
        reason = "legacy-state";
    } else if (parsed.botId !== currentBotId) {
        reason = "bot-id-changed";
    } else if (parsed.tokenFingerprint === null) {
        reason = "legacy-state";
    } else if (parsed.tokenFingerprint !== fingerprintFromToken(botToken)) {
        reason = "token-rotated";
    }
    return reason ? {
        reason,
        previousBotId: parsed.botId,
        currentBotId,
        staleLastUpdateId: parsed.lastUpdateId
    } : null;
}
async function readTelegramUpdateOffset(params) {
    const key = normalizeTelegramUpdateOffsetAccountId(params.accountId);
    let storedValue;
    try {
        storedValue = await openUpdateOffsetStore(params.env).lookup(key);
    } catch  {
        storedValue = undefined;
    }
    const parsed = safeParseState(storedValue);
    if (!parsed) {
        return null;
    }
    const rotation = rotationForToken(parsed, params.botToken);
    if (rotation) {
        await params.onRotationDetected?.(rotation);
        return null;
    }
    return parsed.lastUpdateId;
}
async function writeTelegramUpdateOffset(params) {
    if (!isValidUpdateId(params.updateId)) {
        throw new Error("Telegram update offset must be a non-negative safe integer.");
    }
    const payload = {
        version: STORE_VERSION,
        lastUpdateId: params.updateId,
        botId: extractBotIdFromToken(params.botToken),
        tokenFingerprint: fingerprintFromToken(params.botToken)
    };
    await openUpdateOffsetStore(params.env).register(normalizeTelegramUpdateOffsetAccountId(params.accountId), payload);
}
async function deleteTelegramUpdateOffset(params) {
    await openUpdateOffsetStore(params.env).delete(normalizeTelegramUpdateOffsetAccountId(params.accountId));
}
function setTelegramUpdateOffsetStoreForTest(store) {
    updateOffsetStoreForTest = store;
}
async function listTelegramLegacyUpdateOffsetEntries(params) {
    const { value } = await (0, _jsonstore.readJsonFileWithFallback)(params.persistedPath, null);
    const parsed = safeParseState(value);
    if (!parsed || parsed.lastUpdateId === null) {
        return [];
    }
    return [
        {
            key: normalizeTelegramUpdateOffsetAccountId(params.accountId),
            value: parsed
        }
    ];
}
function shouldReplaceTelegramUpdateOffsetEntry(params) {
    const existing = safeParseState(params.existingValue);
    const incoming = safeParseState(params.incomingValue);
    if (!incoming || incoming.lastUpdateId === null) {
        return false;
    }
    if (!existing || existing.lastUpdateId === null) {
        return true;
    }
    if (!params.botToken) {
        if (existing.botId && incoming.botId && existing.botId !== incoming.botId) {
            return false;
        }
        if (existing.tokenFingerprint && incoming.tokenFingerprint && existing.tokenFingerprint !== incoming.tokenFingerprint) {
            return false;
        }
    }
    const incomingRotation = rotationForToken(incoming, params.botToken);
    if (incomingRotation) {
        return false;
    }
    const existingRotation = rotationForToken(existing, params.botToken);
    if (existingRotation) {
        return true;
    }
    return incoming.lastUpdateId > existing.lastUpdateId;
}

//# sourceMappingURL=update-offset-store.js.map