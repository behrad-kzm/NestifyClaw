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
    get listWhatsAppDirectoryGroupsFromConfig () {
        return listWhatsAppDirectoryGroupsFromConfig;
    },
    get listWhatsAppDirectoryPeersFromConfig () {
        return listWhatsAppDirectoryPeersFromConfig;
    }
});
const _directoryconfigruntime = require("../../../../common/openclaw/plugin-sdk/directory-config-runtime");
const _accountconfig = require("./account-config.js");
const _normalize = require("./normalize.js");
function resolveWhatsAppDirectoryAccount(cfg, accountId) {
    return (0, _accountconfig.resolveMergedWhatsAppAccountConfig)({
        cfg,
        accountId
    });
}
async function listWhatsAppDirectoryPeersFromConfig(params) {
    return (0, _directoryconfigruntime.listResolvedDirectoryUserEntriesFromAllowFrom)({
        ...params,
        resolveAccount: resolveWhatsAppDirectoryAccount,
        resolveAllowFrom: (account)=>account.allowFrom,
        normalizeId: (entry)=>{
            const normalized = (0, _normalize.normalizeWhatsAppTarget)(entry);
            if (!normalized || (0, _normalize.isWhatsAppGroupJid)(normalized)) {
                return null;
            }
            return normalized;
        }
    });
}
async function listWhatsAppDirectoryGroupsFromConfig(params) {
    return (0, _directoryconfigruntime.listResolvedDirectoryGroupEntriesFromMapKeys)({
        ...params,
        resolveAccount: resolveWhatsAppDirectoryAccount,
        resolveGroups: (account)=>account.groups
    });
}

//# sourceMappingURL=directory-config.js.map