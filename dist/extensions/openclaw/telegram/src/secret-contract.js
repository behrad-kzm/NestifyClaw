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
    get channelSecrets () {
        return channelSecrets;
    },
    get collectRuntimeConfigAssignments () {
        return collectRuntimeConfigAssignments;
    },
    get secretTargetRegistryEntries () {
        return secretTargetRegistryEntries;
    }
});
const _channelsecretbasicruntime = require("../../../../common/openclaw/plugin-sdk/channel-secret-basic-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const secretTargetRegistryEntries = [
    {
        id: "channels.telegram.accounts.*.botToken",
        targetType: "channels.telegram.accounts.*.botToken",
        configFile: "openclaw.json",
        pathPattern: "channels.telegram.accounts.*.botToken",
        secretShape: "secret_input",
        expectedResolvedValue: "string",
        includeInPlan: true,
        includeInConfigure: true,
        includeInAudit: true
    },
    {
        id: "channels.telegram.accounts.*.webhookSecret",
        targetType: "channels.telegram.accounts.*.webhookSecret",
        configFile: "openclaw.json",
        pathPattern: "channels.telegram.accounts.*.webhookSecret",
        secretShape: "secret_input",
        expectedResolvedValue: "string",
        includeInPlan: true,
        includeInConfigure: true,
        includeInAudit: true
    },
    {
        id: "channels.telegram.botToken",
        targetType: "channels.telegram.botToken",
        configFile: "openclaw.json",
        pathPattern: "channels.telegram.botToken",
        secretShape: "secret_input",
        expectedResolvedValue: "string",
        includeInPlan: true,
        includeInConfigure: true,
        includeInAudit: true
    },
    {
        id: "channels.telegram.webhookSecret",
        targetType: "channels.telegram.webhookSecret",
        configFile: "openclaw.json",
        pathPattern: "channels.telegram.webhookSecret",
        secretShape: "secret_input",
        expectedResolvedValue: "string",
        includeInPlan: true,
        includeInConfigure: true,
        includeInAudit: true
    }
];
function collectRuntimeConfigAssignments(params) {
    const resolved = (0, _channelsecretbasicruntime.getChannelSurface)(params.config, "telegram");
    if (!resolved) {
        return;
    }
    const { channel: telegram, surface } = resolved;
    const baseTokenFile = (0, _stringcoerceruntime.normalizeOptionalString)(telegram.tokenFile) ?? "";
    const accountTokenFile = (account)=>(0, _stringcoerceruntime.normalizeOptionalString)(account.tokenFile) ?? "";
    (0, _channelsecretbasicruntime.collectConditionalChannelFieldAssignments)({
        channelKey: "telegram",
        field: "botToken",
        channel: telegram,
        surface,
        defaults: params.defaults,
        context: params.context,
        topLevelActiveWithoutAccounts: baseTokenFile.length === 0,
        topLevelInheritedAccountActive: ({ account, enabled })=>{
            if (!enabled || baseTokenFile.length > 0) {
                return false;
            }
            const accountBotTokenConfigured = (0, _channelsecretbasicruntime.hasConfiguredSecretInputValue)(account.botToken, params.defaults);
            return !accountBotTokenConfigured && accountTokenFile(account).length === 0;
        },
        accountActive: ({ account, enabled })=>enabled && accountTokenFile(account).length === 0,
        topInactiveReason: "no enabled Telegram surface inherits this top-level botToken (tokenFile is configured).",
        accountInactiveReason: "Telegram account is disabled or tokenFile is configured."
    });
    const baseWebhookUrl = (0, _stringcoerceruntime.normalizeOptionalString)(telegram.webhookUrl) ?? "";
    const accountWebhookUrl = (account)=>(0, _channelsecretbasicruntime.hasOwnProperty)(account, "webhookUrl") ? (0, _stringcoerceruntime.normalizeOptionalString)(account.webhookUrl) ?? "" : baseWebhookUrl;
    (0, _channelsecretbasicruntime.collectConditionalChannelFieldAssignments)({
        channelKey: "telegram",
        field: "webhookSecret",
        channel: telegram,
        surface,
        defaults: params.defaults,
        context: params.context,
        topLevelActiveWithoutAccounts: baseWebhookUrl.length > 0,
        topLevelInheritedAccountActive: ({ account, enabled })=>enabled && !(0, _channelsecretbasicruntime.hasOwnProperty)(account, "webhookSecret") && accountWebhookUrl(account).length > 0,
        accountActive: ({ account, enabled })=>enabled && accountWebhookUrl(account).length > 0,
        topInactiveReason: "no enabled Telegram webhook surface inherits this top-level webhookSecret (webhook mode is not active).",
        accountInactiveReason: "Telegram account is disabled or webhook mode is not active for this account."
    });
}
const channelSecrets = {
    secretTargetRegistryEntries,
    collectRuntimeConfigAssignments
};

//# sourceMappingURL=secret-contract.js.map