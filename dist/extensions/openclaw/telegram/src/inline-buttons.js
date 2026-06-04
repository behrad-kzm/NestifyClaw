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
    get isTelegramInlineButtonsEnabled () {
        return isTelegramInlineButtonsEnabled;
    },
    get resolveTelegramInlineButtonsConfigScope () {
        return resolveTelegramInlineButtonsConfigScope;
    },
    get resolveTelegramInlineButtonsScope () {
        return resolveTelegramInlineButtonsScope;
    },
    get resolveTelegramInlineButtonsScopeFromCapabilities () {
        return resolveTelegramInlineButtonsScopeFromCapabilities;
    },
    get resolveTelegramTargetChatType () {
        return _targets.resolveTelegramTargetChatType;
    }
});
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accountinspect = require("./account-inspect.js");
const _accounts = require("./accounts.js");
const _targets = require("./targets.js");
const DEFAULT_INLINE_BUTTONS_SCOPE = "allowlist";
function normalizeInlineButtonsScope(value) {
    const trimmed = (0, _stringcoerceruntime.normalizeOptionalLowercaseString)(value);
    if (!trimmed) {
        return undefined;
    }
    if (trimmed === "off" || trimmed === "dm" || trimmed === "group" || trimmed === "all" || trimmed === "allowlist") {
        return trimmed;
    }
    return undefined;
}
function readInlineButtonsCapability(value) {
    if (!value || Array.isArray(value) || typeof value !== "object" || !("inlineButtons" in value)) {
        return undefined;
    }
    return value.inlineButtons;
}
function resolveTelegramInlineButtonsConfigScope(capabilities) {
    return normalizeInlineButtonsScope(readInlineButtonsCapability(capabilities));
}
function resolveTelegramInlineButtonsScopeFromCapabilities(capabilities) {
    if (!capabilities) {
        return DEFAULT_INLINE_BUTTONS_SCOPE;
    }
    if (Array.isArray(capabilities)) {
        const enabled = capabilities.some((entry)=>(0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(String(entry)) === "inlinebuttons");
        return enabled ? "all" : "off";
    }
    if (typeof capabilities === "object") {
        return resolveTelegramInlineButtonsConfigScope(capabilities) ?? DEFAULT_INLINE_BUTTONS_SCOPE;
    }
    return DEFAULT_INLINE_BUTTONS_SCOPE;
}
function resolveTelegramInlineButtonsScope(params) {
    const account = (0, _accountinspect.inspectTelegramAccount)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    return resolveTelegramInlineButtonsScopeFromCapabilities(account.config.capabilities);
}
function isTelegramInlineButtonsEnabled(params) {
    if (params.accountId) {
        return resolveTelegramInlineButtonsScope(params) !== "off";
    }
    const accountIds = (0, _accounts.listTelegramAccountIds)(params.cfg);
    if (accountIds.length === 0) {
        return resolveTelegramInlineButtonsScope(params) !== "off";
    }
    return accountIds.some((accountId)=>resolveTelegramInlineButtonsScope({
            cfg: params.cfg,
            accountId
        }) !== "off");
}

//# sourceMappingURL=inline-buttons.js.map