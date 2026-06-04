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
    get buildTelegramErrorScopeKey () {
        return buildTelegramErrorScopeKey;
    },
    get isSilentErrorPolicy () {
        return isSilentErrorPolicy;
    },
    get resetTelegramErrorPolicyStoreForTest () {
        return resetTelegramErrorPolicyStoreForTest;
    },
    get resolveTelegramErrorPolicy () {
        return resolveTelegramErrorPolicy;
    },
    get shouldSuppressTelegramError () {
        return shouldSuppressTelegramError;
    }
});
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const errorCooldownStore = new Map();
const DEFAULT_ERROR_COOLDOWN_MS = 14400000;
function pruneExpiredCooldowns(messageStore, now) {
    for (const [message, expiresAt] of messageStore){
        if (!(0, _numberruntime.isFutureDateTimestampMs)(expiresAt, {
            nowMs: now
        })) {
            messageStore.delete(message);
        }
    }
}
function resolveTelegramErrorPolicy(params) {
    const configs = [
        params.accountConfig,
        params.groupConfig,
        params.topicConfig
    ];
    let policy = "always";
    let cooldownMs = DEFAULT_ERROR_COOLDOWN_MS;
    for (const config of configs){
        if (config?.errorPolicy) {
            policy = config.errorPolicy;
        }
        if (typeof config?.errorCooldownMs === "number") {
            cooldownMs = config.errorCooldownMs;
        }
    }
    return {
        policy,
        cooldownMs
    };
}
function buildTelegramErrorScopeKey(params) {
    const threadId = params.threadId == null ? "main" : String(params.threadId);
    return `${params.accountId}:${String(params.chatId)}:${threadId}`;
}
function shouldSuppressTelegramError(params) {
    const { scopeKey, cooldownMs, errorMessage } = params;
    const now = (0, _numberruntime.asDateTimestampMs)(Date.now());
    const messageKey = errorMessage ?? "";
    const scopeStore = errorCooldownStore.get(scopeKey);
    if (now === undefined) {
        errorCooldownStore.delete(scopeKey);
        return false;
    }
    if (scopeStore) {
        pruneExpiredCooldowns(scopeStore, now);
        if (scopeStore.size === 0) {
            errorCooldownStore.delete(scopeKey);
        }
    }
    if (errorCooldownStore.size > 100) {
        for (const [scope, messageStore] of errorCooldownStore){
            pruneExpiredCooldowns(messageStore, now);
            if (messageStore.size === 0) {
                errorCooldownStore.delete(scope);
            }
        }
    }
    const expiresAt = scopeStore?.get(messageKey);
    if ((0, _numberruntime.isFutureDateTimestampMs)(expiresAt, {
        nowMs: now
    })) {
        return true;
    }
    const nextExpiresAt = (0, _numberruntime.resolveExpiresAtMsFromDurationMs)(cooldownMs, {
        nowMs: now
    });
    if (nextExpiresAt === undefined) {
        scopeStore?.delete(messageKey);
        return false;
    }
    const nextScopeStore = scopeStore ?? new Map();
    nextScopeStore.set(messageKey, nextExpiresAt);
    errorCooldownStore.set(scopeKey, nextScopeStore);
    return false;
}
function isSilentErrorPolicy(policy) {
    return policy === "silent";
}
function resetTelegramErrorPolicyStoreForTest() {
    errorCooldownStore.clear();
}

//# sourceMappingURL=error-policy.js.map