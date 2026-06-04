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
    get listTelegramDirectoryGroupsFromConfig () {
        return listTelegramDirectoryGroupsFromConfig;
    },
    get listTelegramDirectoryPeersFromConfig () {
        return listTelegramDirectoryPeersFromConfig;
    }
});
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
const _channelconfighelpers = require("../../../../common/openclaw/plugin-sdk/channel-config-helpers");
const _directoryconfigruntime = require("../../../../common/openclaw/plugin-sdk/directory-config-runtime");
const _accountconfig = require("./account-config.js");
const _accountselection = require("./account-selection.js");
function resolveTelegramDirectoryAccount(cfg, accountId) {
    const resolvedAccountId = accountId?.trim() ? (0, _accountcore.normalizeAccountId)(accountId) : (0, _accountselection.resolveDefaultTelegramAccountSelection)(cfg).accountId;
    return {
        config: (0, _accountconfig.mergeTelegramAccountConfig)(cfg, resolvedAccountId)
    };
}
const listTelegramDirectoryPeersFromConfig = (0, _directoryconfigruntime.createResolvedDirectoryEntriesLister)({
    kind: "user",
    resolveAccount: (cfg, accountId)=>resolveTelegramDirectoryAccount(cfg, accountId),
    resolveSources: (account)=>[
            (0, _channelconfighelpers.mapAllowFromEntries)(account.config.allowFrom),
            Object.keys(account.config.dms ?? {})
        ],
    normalizeId: (entry)=>{
        const trimmed = entry.replace(/^(telegram|tg):/i, "").trim();
        if (!trimmed) {
            return null;
        }
        if (/^-?\d+$/.test(trimmed)) {
            return trimmed;
        }
        return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
    }
});
const listTelegramDirectoryGroupsFromConfig = (0, _directoryconfigruntime.createResolvedDirectoryEntriesLister)({
    kind: "group",
    resolveAccount: (cfg, accountId)=>resolveTelegramDirectoryAccount(cfg, accountId),
    resolveSources: (account)=>[
            Object.keys(account.config.groups ?? {})
        ],
    normalizeId: (entry)=>entry.trim() || null
});

//# sourceMappingURL=directory-config.js.map