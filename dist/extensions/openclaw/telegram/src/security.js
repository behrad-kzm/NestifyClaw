"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "telegramSecurityAdapter", {
    enumerable: true,
    get: function() {
        return telegramSecurityAdapter;
    }
});
const _channelconfighelpers = require("../../../../common/openclaw/plugin-sdk/channel-config-helpers");
const _channelpolicy = require("../../../../common/openclaw/plugin-sdk/channel-policy");
const _securityaudit = require("./security-audit.js");
const resolveTelegramDmPolicy = (0, _channelconfighelpers.createScopedDmSecurityResolver)({
    channelKey: "telegram",
    resolvePolicy: (account)=>account.config.dmPolicy,
    resolveAllowFrom: (account)=>account.config.allowFrom,
    policyPathSuffix: "dmPolicy",
    normalizeEntry: (raw)=>raw.replace(/^(telegram|tg):/i, "")
});
const collectTelegramSecurityWarnings = (0, _channelpolicy.createAllowlistProviderRouteAllowlistWarningCollector)({
    providerConfigPresent: (cfg)=>cfg.channels?.telegram !== undefined,
    resolveGroupPolicy: (account)=>account.config.groupPolicy,
    resolveRouteAllowlistConfigured: (account)=>Boolean(account.config.groups) && Object.keys(account.config.groups ?? {}).length > 0,
    restrictSenders: {
        surface: "Telegram groups",
        openScope: "any member in allowed groups",
        groupPolicyPath: "channels.telegram.groupPolicy",
        groupAllowFromPath: "channels.telegram.groupAllowFrom"
    },
    noRouteAllowlist: {
        surface: "Telegram groups",
        routeAllowlistPath: "channels.telegram.groups",
        routeScope: "group",
        groupPolicyPath: "channels.telegram.groupPolicy",
        groupAllowFromPath: "channels.telegram.groupAllowFrom"
    }
});
const telegramSecurityAdapter = {
    resolveDmPolicy: resolveTelegramDmPolicy,
    collectWarnings: collectTelegramSecurityWarnings,
    collectAuditFindings: _securityaudit.collectTelegramSecurityAuditFindings
};

//# sourceMappingURL=security.js.map