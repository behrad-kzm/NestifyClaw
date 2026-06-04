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
    get buildTelegramDmAccessWarningLines () {
        return buildTelegramDmAccessWarningLines;
    },
    get ensureTelegramDefaultGroupMentionGate () {
        return ensureTelegramDefaultGroupMentionGate;
    },
    get shouldShowTelegramDmAccessWarning () {
        return shouldShowTelegramDmAccessWarning;
    },
    get telegramSetupDmPolicy () {
        return telegramSetupDmPolicy;
    }
});
const _setup = require("../../../../common/openclaw/plugin-sdk/setup");
const _setuptools = require("../../../../common/openclaw/plugin-sdk/setup-tools");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accounts = require("./accounts.js");
const _setupcore = require("./setup-core.js");
const channel = "telegram";
function ensureTelegramDefaultGroupMentionGate(cfg, accountId) {
    const resolved = (0, _accounts.resolveTelegramAccount)({
        cfg,
        accountId
    });
    const wildcardGroup = resolved.config.groups?.["*"];
    if (wildcardGroup?.requireMention !== undefined) {
        return cfg;
    }
    return (0, _setup.patchChannelConfigForAccount)({
        cfg,
        channel,
        accountId,
        patch: {
            groups: {
                ...resolved.config.groups,
                "*": {
                    ...wildcardGroup,
                    requireMention: true
                }
            }
        }
    });
}
function shouldShowTelegramDmAccessWarning(cfg, accountId) {
    const merged = (0, _accounts.mergeTelegramAccountConfig)(cfg, accountId);
    const policy = merged.dmPolicy ?? "pairing";
    const hasAllowFrom = Array.isArray(merged.allowFrom) && merged.allowFrom.some((entry)=>(0, _stringcoerceruntime.normalizeOptionalString)(String(entry)));
    return policy === "pairing" && !hasAllowFrom;
}
function buildTelegramDmAccessWarningLines(accountId) {
    const configBase = accountId === _setup.DEFAULT_ACCOUNT_ID ? "channels.telegram" : `channels.telegram.accounts.${accountId}`;
    return [
        "Your bot is using DM policy: pairing.",
        "Any Telegram user who discovers the bot can send pairing requests.",
        "For private use, configure an allowlist with your Telegram user id:",
        "  " + (0, _setuptools.formatCliCommand)(`openclaw config set ${configBase}.dmPolicy "allowlist"`),
        "  " + (0, _setuptools.formatCliCommand)(`openclaw config set ${configBase}.allowFrom '["YOUR_USER_ID"]'`),
        `Docs: ${(0, _setuptools.formatDocsLink)("/channels/pairing", "channels/pairing")}`
    ];
}
const telegramSetupDmPolicy = {
    label: "Telegram",
    channel,
    policyKey: "channels.telegram.dmPolicy",
    allowFromKey: "channels.telegram.allowFrom",
    resolveConfigKeys: (cfg, accountId)=>(accountId ?? (0, _accounts.resolveDefaultTelegramAccountId)(cfg)) !== _setup.DEFAULT_ACCOUNT_ID ? {
            policyKey: `channels.telegram.accounts.${accountId ?? (0, _accounts.resolveDefaultTelegramAccountId)(cfg)}.dmPolicy`,
            allowFromKey: `channels.telegram.accounts.${accountId ?? (0, _accounts.resolveDefaultTelegramAccountId)(cfg)}.allowFrom`
        } : {
            policyKey: "channels.telegram.dmPolicy",
            allowFromKey: "channels.telegram.allowFrom"
        },
    getCurrent: (cfg, accountId)=>(0, _accounts.mergeTelegramAccountConfig)(cfg, accountId ?? (0, _accounts.resolveDefaultTelegramAccountId)(cfg)).dmPolicy ?? "pairing",
    setPolicy: (cfg, policy, accountId)=>{
        const resolvedAccountId = accountId ?? (0, _accounts.resolveDefaultTelegramAccountId)(cfg);
        const merged = (0, _accounts.mergeTelegramAccountConfig)(cfg, resolvedAccountId);
        const patch = {
            dmPolicy: policy,
            ...policy === "open" ? {
                allowFrom: (0, _setup.addWildcardAllowFrom)(merged.allowFrom)
            } : {}
        };
        return accountId == null && resolvedAccountId !== _setup.DEFAULT_ACCOUNT_ID ? (0, _setup.applySetupAccountConfigPatch)({
            cfg,
            channelKey: channel,
            accountId: resolvedAccountId,
            patch
        }) : (0, _setup.patchChannelConfigForAccount)({
            cfg,
            channel,
            accountId: resolvedAccountId,
            patch
        });
    },
    promptAllowFrom: _setupcore.promptTelegramAllowFromForAccount
};

//# sourceMappingURL=setup-surface.helpers.js.map