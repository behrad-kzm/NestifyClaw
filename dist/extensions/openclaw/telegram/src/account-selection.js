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
    get listTelegramAccountIds () {
        return listTelegramAccountIds;
    },
    get resolveDefaultTelegramAccountId () {
        return resolveDefaultTelegramAccountId;
    },
    get resolveDefaultTelegramAccountSelection () {
        return resolveDefaultTelegramAccountSelection;
    }
});
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
const _accountid = require("../../../../common/openclaw/plugin-sdk/account-id");
const DEFAULT_AGENT_ID = "main";
function normalizeAgentId(value) {
    const normalized = (value ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+/g, "").replace(/-+$/g, "");
    return normalized || DEFAULT_AGENT_ID;
}
function normalizeChannelId(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function resolveDefaultAgentId(cfg) {
    const agents = Array.isArray(cfg.agents?.list) ? cfg.agents.list : [];
    const chosen = (agents.find((agent)=>agent?.default) ?? agents[0])?.id;
    return normalizeAgentId(chosen);
}
function listConfiguredAccountIds(cfg) {
    const ids = new Set();
    for (const key of Object.keys(cfg.channels?.telegram?.accounts ?? {})){
        if (key) {
            ids.add((0, _accountid.normalizeAccountId)(key));
        }
    }
    return [
        ...ids
    ];
}
function resolveBindingAccount(params) {
    if (!params.binding || typeof params.binding !== "object") {
        return null;
    }
    const binding = params.binding;
    if (normalizeChannelId(binding.match?.channel) !== params.channelId) {
        return null;
    }
    const accountId = typeof binding.match?.accountId === "string" ? binding.match.accountId : "";
    if (!accountId.trim() || accountId.trim() === "*") {
        return null;
    }
    return {
        agentId: normalizeAgentId(typeof binding.agentId === "string" ? binding.agentId : undefined),
        accountId: (0, _accountid.normalizeAccountId)(accountId)
    };
}
function listBoundAccountIds(cfg, channelId) {
    const ids = new Set();
    for (const binding of cfg.bindings ?? []){
        const resolved = resolveBindingAccount({
            binding,
            channelId
        });
        if (resolved) {
            ids.add(resolved.accountId);
        }
    }
    return [
        ...ids
    ].toSorted((left, right)=>left.localeCompare(right));
}
function resolveDefaultAgentBoundAccountId(cfg, channelId) {
    const defaultAgentId = resolveDefaultAgentId(cfg);
    for (const binding of cfg.bindings ?? []){
        const resolved = resolveBindingAccount({
            binding,
            channelId
        });
        if (resolved?.agentId === defaultAgentId) {
            return resolved.accountId;
        }
    }
    return null;
}
function hasConfiguredDefaultAccountValue(value) {
    if (typeof value === "string") {
        return value.trim().length > 0;
    }
    return value !== undefined && value !== null;
}
function hasImplicitDefaultTelegramAccount(cfg) {
    const telegram = cfg.channels?.telegram;
    if (!telegram) {
        return false;
    }
    return hasConfiguredDefaultAccountValue(telegram.botToken) || hasConfiguredDefaultAccountValue(telegram.tokenFile) || hasConfiguredDefaultAccountValue(process.env.TELEGRAM_BOT_TOKEN);
}
function listTelegramAccountIds(cfg) {
    return (0, _accountcore.listCombinedAccountIds)({
        configuredAccountIds: listConfiguredAccountIds(cfg),
        additionalAccountIds: listBoundAccountIds(cfg, "telegram"),
        implicitAccountId: hasImplicitDefaultTelegramAccount(cfg) ? _accountid.DEFAULT_ACCOUNT_ID : undefined,
        fallbackAccountIdWhenEmpty: _accountid.DEFAULT_ACCOUNT_ID
    });
}
function resolveDefaultTelegramAccountSelection(cfg) {
    const boundDefault = resolveDefaultAgentBoundAccountId(cfg, "telegram");
    if (boundDefault) {
        return {
            accountId: boundDefault,
            accountIds: listTelegramAccountIds(cfg),
            shouldWarnMissingDefault: false
        };
    }
    const accountIds = listTelegramAccountIds(cfg);
    const configuredDefaultAccountId = (0, _accountid.normalizeOptionalAccountId)(cfg.channels?.telegram?.defaultAccount) ?? undefined;
    const hasExplicitDefaultAccount = configuredDefaultAccountId ? accountIds.includes(configuredDefaultAccountId) : false;
    const resolved = (0, _accountcore.resolveListedDefaultAccountId)({
        accountIds,
        configuredDefaultAccountId
    });
    return {
        accountId: resolved,
        accountIds,
        shouldWarnMissingDefault: resolved === accountIds[0] && !hasExplicitDefaultAccount && !accountIds.includes(_accountid.DEFAULT_ACCOUNT_ID) && accountIds.length > 1
    };
}
function resolveDefaultTelegramAccountId(cfg) {
    return resolveDefaultTelegramAccountSelection(cfg).accountId;
}

//# sourceMappingURL=account-selection.js.map