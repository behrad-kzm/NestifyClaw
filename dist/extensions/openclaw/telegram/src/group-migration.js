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
    get migrateTelegramGroupConfig () {
        return migrateTelegramGroupConfig;
    },
    get migrateTelegramGroupsInPlace () {
        return migrateTelegramGroupsInPlace;
    }
});
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
function resolveAccountGroups(cfg, accountId) {
    if (!accountId) {
        return {};
    }
    const normalized = (0, _routing.normalizeAccountId)(accountId);
    const accounts = cfg.channels?.telegram?.accounts;
    if (!accounts || typeof accounts !== "object") {
        return {};
    }
    const exact = accounts[normalized];
    if (exact?.groups) {
        return {
            groups: exact.groups
        };
    }
    const matchKey = Object.keys(accounts).find((key)=>(0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(key) === (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(normalized));
    return {
        groups: matchKey ? accounts[matchKey]?.groups : undefined
    };
}
function migrateTelegramGroupsInPlace(groups, oldChatId, newChatId) {
    if (!groups) {
        return {
            migrated: false,
            skippedExisting: false
        };
    }
    if (oldChatId === newChatId) {
        return {
            migrated: false,
            skippedExisting: false
        };
    }
    if (!Object.hasOwn(groups, oldChatId)) {
        return {
            migrated: false,
            skippedExisting: false
        };
    }
    if (Object.hasOwn(groups, newChatId)) {
        return {
            migrated: false,
            skippedExisting: true
        };
    }
    groups[newChatId] = groups[oldChatId];
    delete groups[oldChatId];
    return {
        migrated: true,
        skippedExisting: false
    };
}
function migrateTelegramGroupConfig(params) {
    const scopes = [];
    let migrated = false;
    let skippedExisting = false;
    const migrationTargets = [
        {
            scope: "account",
            groups: resolveAccountGroups(params.cfg, params.accountId).groups
        },
        {
            scope: "global",
            groups: params.cfg.channels?.telegram?.groups
        }
    ];
    for (const target of migrationTargets){
        const result = migrateTelegramGroupsInPlace(target.groups, params.oldChatId, params.newChatId);
        if (result.migrated) {
            migrated = true;
            scopes.push(target.scope);
        }
        if (result.skippedExisting) {
            skippedExisting = true;
        }
    }
    return {
        migrated,
        skippedExisting,
        scopes
    };
}

//# sourceMappingURL=group-migration.js.map