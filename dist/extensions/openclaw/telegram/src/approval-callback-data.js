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
    get fitsTelegramCallbackData () {
        return fitsTelegramCallbackData;
    },
    get rewriteTelegramApprovalDecisionAlias () {
        return rewriteTelegramApprovalDecisionAlias;
    },
    get sanitizeTelegramCallbackData () {
        return sanitizeTelegramCallbackData;
    }
});
const TELEGRAM_CALLBACK_DATA_MAX_BYTES = 64;
const TELEGRAM_APPROVE_ALLOW_ALWAYS_PATTERN = /^\/approve(?:@[^\s]+)?\s+[A-Za-z0-9][A-Za-z0-9._:-]*\s+allow-always$/i;
function fitsTelegramCallbackData(value) {
    return Buffer.byteLength(value, "utf8") <= TELEGRAM_CALLBACK_DATA_MAX_BYTES;
}
function rewriteTelegramApprovalDecisionAlias(value) {
    if (!value.endsWith(" allow-always")) {
        return value;
    }
    if (!TELEGRAM_APPROVE_ALLOW_ALWAYS_PATTERN.test(value)) {
        return value;
    }
    return value.slice(0, -"allow-always".length) + "always";
}
function sanitizeTelegramCallbackData(value) {
    const rewritten = rewriteTelegramApprovalDecisionAlias(value);
    return fitsTelegramCallbackData(rewritten) ? rewritten : undefined;
}

//# sourceMappingURL=approval-callback-data.js.map