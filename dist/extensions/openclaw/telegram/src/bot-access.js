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
    get firstDefined () {
        return _allowfrom.firstDefined;
    },
    get isSenderAllowed () {
        return isSenderAllowed;
    },
    get normalizeAllowFrom () {
        return normalizeAllowFrom;
    },
    get normalizeDmAllowFromWithStore () {
        return normalizeDmAllowFromWithStore;
    },
    get resolveTelegramEffectiveDmPolicy () {
        return resolveTelegramEffectiveDmPolicy;
    }
});
const _allowfrom = require("../../../../common/openclaw/plugin-sdk/allow-from");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const warnedInvalidEntries = new Set();
const log = (0, _runtimeenv.createSubsystemLogger)("telegram/bot-access");
function warnInvalidAllowFromEntries(entries) {
    if (process.env.VITEST || process.env.NODE_ENV === "test") {
        return;
    }
    for (const entry of entries){
        if (warnedInvalidEntries.has(entry)) {
            continue;
        }
        warnedInvalidEntries.add(entry);
        log.warn([
            "Invalid allowFrom entry:",
            JSON.stringify(entry),
            "- allowFrom/groupAllowFrom authorization expects numeric Telegram sender user IDs only.",
            'To allow a Telegram group or supergroup, add its negative chat ID under "channels.telegram.groups" instead.',
            'If you had "@username" entries, re-run setup (it resolves @username to IDs) or replace them manually.'
        ].join(" "));
    }
}
const normalizeAllowFrom = (list)=>{
    const entries = (list ?? []).map((value)=>(0, _stringcoerceruntime.normalizeOptionalString)(String(value)) ?? "").filter(Boolean);
    const hasWildcard = entries.includes("*");
    const normalized = entries.filter((value)=>value !== "*").map((value)=>value.replace(/^(telegram|tg):/i, ""));
    const invalidEntries = normalized.filter((value)=>!/^\d+$/.test(value));
    if (invalidEntries.length > 0) {
        warnInvalidAllowFromEntries((0, _stringcoerceruntime.uniqueStrings)(invalidEntries));
    }
    const ids = normalized.filter((value)=>/^\d+$/.test(value));
    return {
        entries: ids,
        hasWildcard,
        hasEntries: entries.length > 0,
        invalidEntries
    };
};
const normalizeDmAllowFromWithStore = (params)=>normalizeAllowFrom((0, _allowfrom.mergeDmAllowFromSources)(params));
function resolveTelegramEffectiveDmPolicy(params) {
    if (!params.isGroup && params.groupConfig && "dmPolicy" in params.groupConfig) {
        return params.groupConfig.dmPolicy ?? params.dmPolicy ?? "pairing";
    }
    return params.dmPolicy ?? "pairing";
}
const isSenderAllowed = (params)=>{
    const { allow, senderId } = params;
    return (0, _allowfrom.isSenderIdAllowed)(allow, senderId, true);
};

//# sourceMappingURL=bot-access.js.map