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
    get TELEGRAM_TOKEN_HELP_LINES () {
        return TELEGRAM_TOKEN_HELP_LINES;
    },
    get TELEGRAM_USER_ID_HELP_LINES () {
        return TELEGRAM_USER_ID_HELP_LINES;
    },
    get getTelegramTokenHelpLines () {
        return getTelegramTokenHelpLines;
    },
    get getTelegramUserIdHelpLines () {
        return getTelegramUserIdHelpLines;
    },
    get parseTelegramAllowFromId () {
        return parseTelegramAllowFromId;
    },
    get promptTelegramAllowFromForAccount () {
        return promptTelegramAllowFromForAccount;
    },
    get telegramSetupAdapter () {
        return telegramSetupAdapter;
    }
});
const _setupruntime = require("../../../../common/openclaw/plugin-sdk/setup-runtime");
const _setuptools = require("../../../../common/openclaw/plugin-sdk/setup-tools");
const _accounts = require("./accounts.js");
const _allowfrom = require("./allow-from.js");
const t = (0, _setupruntime.createSetupTranslator)();
const channel = "telegram";
function getTelegramTokenHelpLines() {
    return [
        t("wizard.telegram.tokenHelpOpenBotFather"),
        t("wizard.telegram.tokenHelpNewBot"),
        t("wizard.telegram.tokenHelpCopyToken"),
        t("wizard.telegram.tokenEnvTip"),
        t("wizard.channels.docs", {
            link: (0, _setuptools.formatDocsLink)("/telegram")
        }),
        t("wizard.telegram.website", {
            url: "https://openclaw.ai"
        })
    ];
}
function getTelegramUserIdHelpLines() {
    return [
        t("wizard.telegram.userIdHelpLogs", {
            command: (0, _setuptools.formatCliCommand)("openclaw logs --follow")
        }),
        t("wizard.telegram.userIdHelpGetUpdates"),
        t("wizard.telegram.userIdHelpThirdParty"),
        t("wizard.channels.docs", {
            link: (0, _setuptools.formatDocsLink)("/telegram")
        }),
        t("wizard.telegram.website", {
            url: "https://openclaw.ai"
        })
    ];
}
const TELEGRAM_TOKEN_HELP_LINES = getTelegramTokenHelpLines();
const TELEGRAM_USER_ID_HELP_LINES = getTelegramUserIdHelpLines();
function normalizeTelegramAllowFromInput(raw) {
    return raw.trim().replace(/^(telegram|tg):/i, "").trim();
}
function parseTelegramAllowFromId(raw) {
    const stripped = normalizeTelegramAllowFromInput(raw);
    return (0, _allowfrom.isNumericTelegramSenderUserId)(stripped) ? stripped : null;
}
async function promptTelegramAllowFromForAccount(params) {
    const accountId = params.accountId ?? (0, _accounts.resolveDefaultTelegramAccountId)(params.cfg);
    const resolved = (0, _accounts.resolveTelegramAccount)({
        cfg: params.cfg,
        accountId
    });
    await params.prompter.note(getTelegramUserIdHelpLines().join("\n"), t("wizard.telegram.userIdTitle"));
    const unique = await (0, _setupruntime.promptResolvedAllowFrom)({
        prompter: params.prompter,
        existing: resolved.config.allowFrom ?? [],
        message: t("wizard.telegram.allowFromPrompt"),
        placeholder: "123456789",
        label: t("wizard.telegram.allowlistTitle"),
        parseInputs: _setupruntime.splitSetupEntries,
        parseId: parseTelegramAllowFromId,
        invalidWithoutTokenNote: t("wizard.telegram.allowFromInvalid"),
        resolveEntries: async ({ entries })=>entries.map((entry)=>{
                const id = parseTelegramAllowFromId(entry);
                return {
                    input: entry,
                    resolved: Boolean(id),
                    id
                };
            })
    });
    return (0, _setupruntime.patchChannelConfigForAccount)({
        cfg: params.cfg,
        channel,
        accountId,
        patch: {
            dmPolicy: "allowlist",
            allowFrom: unique
        }
    });
}
const telegramSetupAdapter = (0, _setupruntime.createEnvPatchedAccountSetupAdapter)({
    channelKey: channel,
    defaultAccountOnlyEnvError: "TELEGRAM_BOT_TOKEN can only be used for the default account.",
    missingCredentialError: "Telegram requires token or --token-file (or --use-env).",
    hasCredentials: (input)=>Boolean(input.token || input.tokenFile),
    buildPatch: (input)=>input.tokenFile ? {
            tokenFile: input.tokenFile
        } : input.token ? {
            botToken: input.token
        } : {}
});

//# sourceMappingURL=setup-core.js.map