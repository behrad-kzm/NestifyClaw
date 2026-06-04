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
    get mergeTelegramAccountConfig () {
        return mergeTelegramAccountConfig;
    },
    get resolveTelegramAccountConfig () {
        return resolveTelegramAccountConfig;
    }
});
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
function normalizeAllowFromEntry(value) {
    return String(value).trim();
}
function hasWildcardAllowFrom(value) {
    return Array.isArray(value) && value.some((entry)=>normalizeAllowFromEntry(entry) === "*");
}
function hasRestrictiveAllowFrom(value) {
    return Array.isArray(value) && value.some((entry)=>{
        const normalized = normalizeAllowFromEntry(entry);
        return normalized.length > 0 && normalized !== "*";
    });
}
function dropWildcardAllowFrom(value) {
    return value.filter((entry)=>normalizeAllowFromEntry(entry) !== "*");
}
function resolveMergedAllowFrom(params) {
    const { baseAllowFrom, accountAllowFrom } = params;
    if (hasRestrictiveAllowFrom(baseAllowFrom) && hasWildcardAllowFrom(accountAllowFrom)) {
        const accountRestrictiveEntries = Array.isArray(accountAllowFrom) ? dropWildcardAllowFrom(accountAllowFrom) : [];
        return accountRestrictiveEntries.length > 0 ? accountRestrictiveEntries : baseAllowFrom;
    }
    return accountAllowFrom ?? baseAllowFrom;
}
function resolveTelegramAccountConfig(cfg, accountId) {
    const normalized = (0, _accountcore.normalizeAccountId)(accountId);
    return (0, _accountcore.resolveNormalizedAccountEntry)(cfg.channels?.telegram?.accounts, normalized, _accountcore.normalizeAccountId);
}
function mergeTelegramAccountConfig(cfg, accountId) {
    const { accounts: _ignored, defaultAccount: _ignoredDefaultAccount, groups: channelGroups, ...base } = cfg.channels?.telegram ?? {};
    const account = resolveTelegramAccountConfig(cfg, accountId) ?? {};
    // Multi-account bots must not inherit channel-level groups unless explicitly set.
    // Single-account bots fall back to root `channels.telegram.groups` when the
    // account does not declare its own groups — including the empty-literal case
    // `accounts.<id>.groups: {}`, which is almost always a config-migration
    // artifact rather than an intentional "block all" declaration (use
    // `groupPolicy: "disabled"` for that).
    const configuredAccountIds = Object.keys(cfg.channels?.telegram?.accounts ?? {});
    const isMultiAccount = configuredAccountIds.length > 1;
    const hasAccountGroups = account.groups && Object.keys(account.groups).length > 0;
    const groups = isMultiAccount ? account.groups : hasAccountGroups ? account.groups : channelGroups;
    const allowFrom = resolveMergedAllowFrom({
        baseAllowFrom: base.allowFrom,
        accountAllowFrom: account.allowFrom
    });
    return {
        ...base,
        ...account,
        allowFrom,
        groups
    };
}

//# sourceMappingURL=account-config.js.map