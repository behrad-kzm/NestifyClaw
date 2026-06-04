"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "telegramSetupWizard", {
    enumerable: true,
    get: function() {
        return telegramSetupWizard;
    }
});
const _setup = require("../../../../common/openclaw/plugin-sdk/setup");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accountinspect = require("./account-inspect.js");
const _accounts = require("./accounts.js");
const _setupcore = require("./setup-core.js");
const _setupsurfacehelpers = require("./setup-surface.helpers.js");
const t = (0, _setup.createSetupTranslator)();
const channel = "telegram";
const telegramSetupWizard = {
    channel,
    status: (0, _setup.createStandardChannelSetupStatus)({
        channelLabel: "Telegram",
        configuredLabel: t("wizard.channels.statusConfigured"),
        unconfiguredLabel: t("wizard.channels.statusNeedsToken"),
        configuredHint: t("wizard.channels.statusRecommendedConfigured"),
        unconfiguredHint: t("wizard.channels.statusRecommendedNewcomerFriendly"),
        configuredScore: 1,
        unconfiguredScore: 10,
        resolveConfigured: ({ cfg, accountId })=>(accountId ? [
                accountId
            ] : (0, _accounts.listTelegramAccountIds)(cfg)).some((resolvedAccountId)=>{
                const account = (0, _accountinspect.inspectTelegramAccount)({
                    cfg,
                    accountId: resolvedAccountId
                });
                return account.configured;
            })
    }),
    prepare: async ({ cfg, accountId, credentialValues })=>({
            cfg: (0, _setupsurfacehelpers.ensureTelegramDefaultGroupMentionGate)(cfg, accountId),
            credentialValues
        }),
    credentials: [
        {
            inputKey: "token",
            providerHint: channel,
            credentialLabel: t("wizard.telegram.botToken"),
            preferredEnvVar: "TELEGRAM_BOT_TOKEN",
            helpTitle: t("wizard.telegram.botToken"),
            helpLines: (0, _setupcore.getTelegramTokenHelpLines)(),
            envPrompt: t("wizard.telegram.tokenEnvPrompt"),
            keepPrompt: t("wizard.telegram.tokenKeepPrompt"),
            inputPrompt: t("wizard.telegram.tokenInputPrompt"),
            allowEnv: ({ accountId })=>accountId === _setup.DEFAULT_ACCOUNT_ID,
            inspect: ({ cfg, accountId })=>{
                const resolved = (0, _accounts.resolveTelegramAccount)({
                    cfg,
                    accountId
                });
                const hasConfiguredBotToken = (0, _setup.hasConfiguredSecretInput)(resolved.config.botToken);
                const hasConfiguredValue = hasConfiguredBotToken || Boolean(resolved.config.tokenFile?.trim());
                return {
                    accountConfigured: Boolean(resolved.token) || hasConfiguredValue,
                    hasConfiguredValue,
                    resolvedValue: (0, _stringcoerceruntime.normalizeOptionalString)(resolved.token),
                    envValue: accountId === _setup.DEFAULT_ACCOUNT_ID ? (0, _stringcoerceruntime.normalizeOptionalString)(process.env.TELEGRAM_BOT_TOKEN) : undefined
                };
            }
        }
    ],
    allowFrom: (0, _setup.createAllowFromSection)({
        helpTitle: t("wizard.telegram.userIdTitle"),
        helpLines: (0, _setupcore.getTelegramUserIdHelpLines)(),
        message: t("wizard.telegram.allowFromPrompt"),
        placeholder: "123456789",
        invalidWithoutCredentialNote: t("wizard.telegram.allowFromInvalid"),
        parseInputs: _setup.splitSetupEntries,
        parseId: _setupcore.parseTelegramAllowFromId,
        resolveEntries: async ({ entries })=>entries.map((entry)=>{
                const id = (0, _setupcore.parseTelegramAllowFromId)(entry);
                return {
                    input: entry,
                    resolved: Boolean(id),
                    id
                };
            }),
        apply: async ({ cfg, accountId, allowFrom })=>(0, _setup.patchChannelConfigForAccount)({
                cfg,
                channel,
                accountId,
                patch: {
                    dmPolicy: "allowlist",
                    allowFrom
                }
            })
    }),
    finalize: async ({ cfg, accountId, prompter })=>{
        if (!(0, _setupsurfacehelpers.shouldShowTelegramDmAccessWarning)(cfg, accountId)) {
            return;
        }
        await prompter.note((0, _setupsurfacehelpers.buildTelegramDmAccessWarningLines)(accountId).join("\n"), "Telegram DM access warning");
    },
    dmPolicy: _setupsurfacehelpers.telegramSetupDmPolicy,
    disable: (cfg)=>(0, _setup.setSetupChannelEnabled)(cfg, channel, false)
};

//# sourceMappingURL=setup-surface.js.map