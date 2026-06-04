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
    get resolveWhatsAppConfigPath () {
        return resolveWhatsAppConfigPath;
    },
    get resolveWhatsAppGroupsConfigPath () {
        return resolveWhatsAppGroupsConfigPath;
    }
});
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
const WHATSAPP_GROUP_SCOPE_FIELDS = [
    "groupPolicy",
    "groupAllowFrom",
    "groups"
];
function resolveWhatsAppAccountKey(accounts, accountId) {
    if (!accounts) {
        return undefined;
    }
    if (Object.hasOwn(accounts, accountId)) {
        return accountId;
    }
    const normalizedAccountId = accountId.trim().toLowerCase();
    return Object.keys(accounts).find((key)=>key.trim().toLowerCase() === normalizedAccountId);
}
function normalizePathAccountId(accountId) {
    return typeof accountId === "string" ? accountId.trim() || _accountcore.DEFAULT_ACCOUNT_ID : _accountcore.DEFAULT_ACCOUNT_ID;
}
function hasConfiguredField(config, field) {
    return Boolean(config && typeof config === "object" && Object.hasOwn(config, field) && config[field] !== undefined);
}
function resolveSpecificFieldBasePath(params) {
    const accountId = normalizePathAccountId(params.accountId);
    const whatsapp = params.cfg.channels?.whatsapp;
    const accounts = whatsapp?.accounts;
    const accountKey = resolveWhatsAppAccountKey(accounts, accountId);
    const defaultAccountKey = resolveWhatsAppAccountKey(accounts, _accountcore.DEFAULT_ACCOUNT_ID);
    const accountConfig = accountKey ? accounts?.[accountKey] : undefined;
    const defaultAccountConfig = defaultAccountKey ? accounts?.[defaultAccountKey] : undefined;
    if (hasConfiguredField(accountConfig, params.field)) {
        return `channels.whatsapp.accounts.${accountKey}`;
    }
    if (accountId !== _accountcore.DEFAULT_ACCOUNT_ID && hasConfiguredField(defaultAccountConfig, params.field)) {
        return `channels.whatsapp.accounts.${defaultAccountKey}`;
    }
    if (hasConfiguredField(whatsapp, params.field)) {
        return "channels.whatsapp";
    }
    return undefined;
}
function resolveWhatsAppGroupScopeBasePath(params) {
    const accountId = normalizePathAccountId(params.accountId);
    const whatsapp = params.cfg.channels?.whatsapp;
    const accounts = whatsapp?.accounts;
    const accountKey = resolveWhatsAppAccountKey(accounts, accountId);
    const defaultAccountKey = resolveWhatsAppAccountKey(accounts, _accountcore.DEFAULT_ACCOUNT_ID);
    const accountConfig = accountKey ? accounts?.[accountKey] : undefined;
    const defaultAccountConfig = defaultAccountKey ? accounts?.[defaultAccountKey] : undefined;
    const matchesAnyGroupScopeField = (config)=>WHATSAPP_GROUP_SCOPE_FIELDS.some((field)=>hasConfiguredField(config, field));
    if (matchesAnyGroupScopeField(accountConfig)) {
        return `channels.whatsapp.accounts.${accountKey}`;
    }
    if (accountId !== _accountcore.DEFAULT_ACCOUNT_ID && matchesAnyGroupScopeField(defaultAccountConfig)) {
        return `channels.whatsapp.accounts.${defaultAccountKey}`;
    }
    return "channels.whatsapp";
}
function resolveWhatsAppConfigPath(params) {
    return `${resolveWhatsAppGroupScopeBasePath(params)}.${params.field}`;
}
function resolveWhatsAppGroupsConfigPath(params) {
    return `${resolveSpecificFieldBasePath({
        ...params,
        field: "groups"
    }) ?? resolveWhatsAppGroupScopeBasePath(params)}.groups`;
}

//# sourceMappingURL=group-config-path.js.map