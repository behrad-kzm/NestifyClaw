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
    get expandTelegramAllowFromWithAccessGroups () {
        return expandTelegramAllowFromWithAccessGroups;
    },
    get resolveTelegramDmAllow () {
        return resolveTelegramDmAllow;
    }
});
const _securityruntime = require("../../../../common/openclaw/plugin-sdk/security-runtime");
const _botaccess = require("./bot-access.js");
async function expandTelegramAllowFromWithAccessGroups(params) {
    const allowFrom = (params.allowFrom ?? []).map(String);
    const senderId = params.senderId?.trim() ?? "";
    const expanded = params.cfg && senderId ? await (0, _securityruntime.expandAllowFromWithAccessGroups)({
        cfg: params.cfg,
        allowFrom,
        channel: "telegram",
        accountId: params.accountId ?? "default",
        senderId,
        isSenderAllowed: (candidateSenderId, allowEntries)=>(0, _botaccess.isSenderAllowed)({
                allow: (0, _botaccess.normalizeAllowFrom)(allowEntries),
                senderId: candidateSenderId
            })
    }) : allowFrom;
    const originalEntries = new Set(allowFrom);
    const matched = expanded.some((entry)=>!originalEntries.has(entry));
    return matched ? expanded.filter((entry)=>(0, _securityruntime.parseAccessGroupAllowFromEntry)(entry) == null) : expanded;
}
async function resolveTelegramDmAllow(params) {
    const allowFrom = params.groupAllowOverride ?? params.allowFrom;
    const expandedAllowFrom = await expandTelegramAllowFromWithAccessGroups({
        cfg: params.cfg,
        allowFrom,
        accountId: params.accountId,
        senderId: params.senderId
    });
    return {
        allowFrom,
        expandedAllowFrom,
        effectiveAllow: (0, _botaccess.normalizeDmAllowFromWithStore)({
            allowFrom: expandedAllowFrom,
            storeAllowFrom: params.storeAllowFrom,
            dmPolicy: params.dmPolicy
        })
    };
}

//# sourceMappingURL=access-groups.js.map