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
    get createTelegramPluginBase () {
        return createTelegramPluginBase;
    },
    get findTelegramTokenOwnerAccountId () {
        return findTelegramTokenOwnerAccountId;
    },
    get formatDuplicateTelegramTokenReason () {
        return formatDuplicateTelegramTokenReason;
    },
    get telegramConfigAdapter () {
        return telegramConfigAdapter;
    }
});
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
const _accountid = require("../../../../common/openclaw/plugin-sdk/account-id");
const _allowfrom = require("../../../../common/openclaw/plugin-sdk/allow-from");
const _channelconfighelpers = require("../../../../common/openclaw/plugin-sdk/channel-config-helpers");
const _channelcore = require("../../../../common/openclaw/plugin-sdk/channel-core");
const _channelplugincommon = require("../../../../common/openclaw/plugin-sdk/channel-plugin-common");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _accountinspect = require("./account-inspect.js");
const _accounts = require("./accounts.js");
const _commandui = require("./command-ui.js");
const _configschema = require("./config-schema.js");
const _doctor = require("./doctor.js");
const _secretcontract = require("./secret-contract.js");
const _security = require("./security.js");
const _setupcontract = require("./setup-contract.js");
const TELEGRAM_CHANNEL = "telegram";
function findTelegramTokenOwnerAccountId(params) {
    const normalizedAccountId = (0, _accountid.normalizeAccountId)(params.accountId);
    const tokenOwners = new Map();
    for (const id of (0, _accounts.listTelegramAccountIds)(params.cfg)){
        const account = (0, _accountinspect.inspectTelegramAccount)({
            cfg: params.cfg,
            accountId: id
        });
        const token = (account.token ?? "").trim();
        if (!token) {
            continue;
        }
        const ownerAccountId = tokenOwners.get(token);
        if (!ownerAccountId) {
            tokenOwners.set(token, account.accountId);
            continue;
        }
        if (account.accountId === normalizedAccountId) {
            return ownerAccountId;
        }
    }
    return null;
}
function formatDuplicateTelegramTokenReason(params) {
    return `Duplicate Telegram bot token: account "${params.accountId}" shares a token with ` + `account "${params.ownerAccountId}". Keep one owner account per bot token.`;
}
/**
 * Returns true when the runtime token resolver (`resolveTelegramToken`) would
 * block channel-level fallthrough for the given accountId.  This mirrors the
 * guard in `token.ts` so that status-check functions (`isConfigured`,
 * `unconfiguredReason`, `describeAccount`) stay consistent with the gateway
 * runtime behaviour.
 *
 * The guard fires when:
 *   1. The accountId is not the default account, AND
 *   2. The config has an explicit `accounts` section with entries, AND
 *   3. The accountId is not found in that `accounts` section.
 *
 * See: https://github.com/openclaw/openclaw/issues/53876
 */ function isBlockedByMultiBotGuard(cfg, accountId) {
    if ((0, _accountid.normalizeAccountId)(accountId) === _routing.DEFAULT_ACCOUNT_ID) {
        return false;
    }
    const accounts = cfg.channels?.telegram?.accounts;
    const hasConfiguredAccounts = Boolean(accounts) && typeof accounts === "object" && !Array.isArray(accounts) && Object.keys(accounts).length > 0;
    if (!hasConfiguredAccounts) {
        return false;
    }
    // Use resolveNormalizedAccountEntry (same as resolveTelegramToken in token.ts)
    // instead of resolveAccountEntry to handle keys that require full normalization
    // (e.g. "Carey Notifications" → "carey-notifications").
    return !(0, _accountcore.resolveNormalizedAccountEntry)(accounts, accountId, _accountid.normalizeAccountId);
}
function resolveTelegramConfigAccessorAccount(params) {
    const accountId = (0, _accountid.normalizeAccountId)(params.accountId ?? (0, _accounts.resolveDefaultTelegramAccountId)(params.cfg));
    return {
        config: (0, _accounts.mergeTelegramAccountConfig)(params.cfg, accountId)
    };
}
const telegramConfigAdapter = (0, _channelconfighelpers.createScopedChannelConfigAdapter)({
    sectionKey: TELEGRAM_CHANNEL,
    listAccountIds: _accounts.listTelegramAccountIds,
    resolveAccount: (0, _channelconfighelpers.adaptScopedAccountAccessor)(_accounts.resolveTelegramAccount),
    resolveAccessorAccount: resolveTelegramConfigAccessorAccount,
    inspectAccount: (0, _channelconfighelpers.adaptScopedAccountAccessor)(_accountinspect.inspectTelegramAccount),
    defaultAccountId: _accounts.resolveDefaultTelegramAccountId,
    clearBaseFields: [
        "botToken",
        "tokenFile",
        "name"
    ],
    resolveAllowFrom: (account)=>account.config.allowFrom,
    formatAllowFrom: (allowFrom)=>(0, _allowfrom.formatAllowFromLowercase)({
            allowFrom,
            stripPrefixRe: /^(telegram|tg):/i
        }),
    resolveDefaultTo: (account)=>account.config.defaultTo
});
function createTelegramPluginBase(params) {
    const base = (0, _channelcore.createChannelPluginBase)({
        id: TELEGRAM_CHANNEL,
        meta: {
            ...(0, _channelplugincommon.getChatChannelMeta)(TELEGRAM_CHANNEL),
            quickstartAllowFrom: true
        },
        setupWizard: params.setupWizard,
        capabilities: {
            chatTypes: [
                "direct",
                "group",
                "channel",
                "thread"
            ],
            reactions: true,
            threads: true,
            media: true,
            tts: {
                voice: {
                    synthesisTarget: "voice-note"
                }
            },
            polls: true,
            nativeCommands: true,
            blockStreaming: true
        },
        commands: {
            nativeCommandsAutoEnabled: true,
            nativeSkillsAutoEnabled: true,
            buildCommandsListChannelData: _commandui.buildTelegramCommandsListChannelData,
            buildModelsMenuChannelData: _commandui.buildTelegramModelsMenuChannelData,
            buildModelsProviderChannelData: _commandui.buildTelegramModelsProviderChannelData,
            buildModelsAddProviderChannelData: _commandui.buildTelegramModelsAddProviderChannelData,
            buildModelsListChannelData: _commandui.buildTelegramModelsListChannelData,
            buildModelBrowseChannelData: _commandui.buildTelegramModelBrowseChannelData
        },
        doctor: _doctor.telegramDoctor,
        security: _security.telegramSecurityAdapter,
        reload: {
            configPrefixes: [
                "channels.telegram"
            ]
        },
        configSchema: _configschema.TelegramChannelConfigSchema,
        config: {
            ...telegramConfigAdapter,
            hasConfiguredState: ({ env })=>typeof env?.TELEGRAM_BOT_TOKEN === "string" && env.TELEGRAM_BOT_TOKEN.trim().length > 0,
            isConfigured: (account, cfg)=>{
                // Use inspectTelegramAccount for a complete token resolution that includes
                // channel-level fallback paths not available in resolveTelegramAccount.
                // This ensures binding-created accountIds that inherit the channel-level
                // token are correctly detected as configured.
                // See: https://github.com/openclaw/openclaw/issues/53876
                if (isBlockedByMultiBotGuard(cfg, account.accountId)) {
                    return false;
                }
                const inspected = (0, _accountinspect.inspectTelegramAccount)({
                    cfg,
                    accountId: account.accountId
                });
                // Gate on actually available token, not just "configured" — the latter
                // includes "configured_unavailable" (unreadable tokenFile, unresolved
                // SecretRef) which would pass here but fail at runtime.
                if (!inspected.token?.trim()) {
                    return false;
                }
                return !findTelegramTokenOwnerAccountId({
                    cfg,
                    accountId: account.accountId
                });
            },
            unconfiguredReason: (account, cfg)=>{
                if (isBlockedByMultiBotGuard(cfg, account.accountId)) {
                    return `not configured: unknown accountId "${account.accountId}" in multi-bot setup`;
                }
                const inspected = (0, _accountinspect.inspectTelegramAccount)({
                    cfg,
                    accountId: account.accountId
                });
                if (!inspected.token?.trim()) {
                    if (inspected.tokenStatus === "configured_unavailable") {
                        return `not configured: token ${inspected.tokenSource} is configured but unavailable`;
                    }
                    return "not configured";
                }
                const ownerAccountId = findTelegramTokenOwnerAccountId({
                    cfg,
                    accountId: account.accountId
                });
                if (!ownerAccountId) {
                    return "not configured";
                }
                return formatDuplicateTelegramTokenReason({
                    accountId: account.accountId,
                    ownerAccountId
                });
            },
            describeAccount: (account, cfg)=>{
                if (isBlockedByMultiBotGuard(cfg, account.accountId)) {
                    return {
                        accountId: account.accountId,
                        name: account.name,
                        enabled: account.enabled,
                        configured: false,
                        tokenSource: "none"
                    };
                }
                const inspected = (0, _accountinspect.inspectTelegramAccount)({
                    cfg,
                    accountId: account.accountId
                });
                return {
                    accountId: account.accountId,
                    name: account.name,
                    enabled: account.enabled,
                    configured: Boolean(inspected.token?.trim()) && !findTelegramTokenOwnerAccountId({
                        cfg,
                        accountId: account.accountId
                    }),
                    tokenSource: inspected.tokenSource
                };
            }
        },
        setup: {
            ...params.setup,
            namedAccountPromotionKeys: _setupcontract.namedAccountPromotionKeys,
            singleAccountKeysToMove: _setupcontract.singleAccountKeysToMove
        }
    });
    return {
        ...base,
        secrets: {
            secretTargetRegistryEntries: _secretcontract.secretTargetRegistryEntries,
            collectRuntimeConfigAssignments: _secretcontract.collectRuntimeConfigAssignments
        }
    };
}

//# sourceMappingURL=shared.js.map