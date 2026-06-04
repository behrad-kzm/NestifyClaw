"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "inspectTelegramAccount", {
    enumerable: true,
    get: function() {
        return inspectTelegramAccount;
    }
});
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
const _channelcore = require("../../../../common/openclaw/plugin-sdk/channel-core");
const _providerauth = require("../../../../common/openclaw/plugin-sdk/provider-auth");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _secretinput = require("../../../../common/openclaw/plugin-sdk/secret-input");
const _secretinputruntime = require("../../../../common/openclaw/plugin-sdk/secret-input-runtime");
const _securityruntime = require("../../../../common/openclaw/plugin-sdk/security-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accounts = require("./accounts.js");
function inspectTokenFile(pathValue) {
    const tokenFile = (0, _stringcoerceruntime.normalizeOptionalString)(pathValue) ?? "";
    if (!tokenFile) {
        return null;
    }
    let token;
    try {
        token = (0, _channelcore.tryReadSecretFileSync)(tokenFile, "Telegram bot token", {
            rejectSymlink: true
        });
    } catch (error) {
        if (!(error instanceof _securityruntime.FsSafeError)) {
            throw error;
        }
        return {
            token: "",
            tokenSource: "tokenFile",
            tokenStatus: "configured_unavailable"
        };
    }
    return {
        token: token ?? "",
        tokenSource: "tokenFile",
        tokenStatus: token ? "available" : "configured_unavailable"
    };
}
function canResolveEnvSecretRefInReadOnlyPath(params) {
    const providerConfig = params.cfg.secrets?.providers?.[params.provider];
    if (!providerConfig) {
        return params.provider === (0, _providerauth.resolveDefaultSecretProviderAlias)(params.cfg, "env");
    }
    if (providerConfig.source !== "env") {
        return false;
    }
    const allowlist = providerConfig.allowlist;
    return !allowlist || allowlist.includes(params.id);
}
function inspectTokenValue(params) {
    // Try to resolve env-based SecretRefs from process.env for read-only inspection
    const ref = (0, _secretinputruntime.coerceSecretRef)(params.value, params.cfg.secrets?.defaults);
    if (ref?.source === "env") {
        if (!canResolveEnvSecretRefInReadOnlyPath({
            cfg: params.cfg,
            provider: ref.provider,
            id: ref.id
        })) {
            return {
                token: "",
                tokenSource: "env",
                tokenStatus: "configured_unavailable"
            };
        }
        const envValue = (0, _stringcoerceruntime.normalizeOptionalString)(process.env[ref.id]);
        if (envValue) {
            return {
                token: envValue,
                tokenSource: "env",
                tokenStatus: "available"
            };
        }
        return {
            token: "",
            tokenSource: "env",
            tokenStatus: "configured_unavailable"
        };
    }
    const token = (0, _secretinput.normalizeSecretInputString)(params.value);
    if (token) {
        return {
            token,
            tokenSource: "config",
            tokenStatus: "available"
        };
    }
    if ((0, _secretinput.hasConfiguredSecretInput)(params.value, params.cfg.secrets?.defaults)) {
        return {
            token: "",
            tokenSource: "config",
            tokenStatus: "configured_unavailable"
        };
    }
    return null;
}
function hasConfiguredTelegramAccounts(cfg) {
    const accounts = cfg.channels?.telegram?.accounts;
    return Boolean(accounts) && typeof accounts === "object" && !Array.isArray(accounts) && Object.keys(accounts).length > 0;
}
function inspectTelegramAccountPrimary(params) {
    const accountId = (0, _routing.normalizeAccountId)(params.accountId);
    const merged = (0, _accounts.mergeTelegramAccountConfig)(params.cfg, accountId);
    const enabled = params.cfg.channels?.telegram?.enabled !== false && merged.enabled !== false;
    const accountConfig = (0, _accounts.resolveTelegramAccountConfig)(params.cfg, accountId);
    const allowChannelCredentialFallback = accountId === _routing.DEFAULT_ACCOUNT_ID || Boolean(accountConfig) || !hasConfiguredTelegramAccounts(params.cfg);
    const accountTokenFile = inspectTokenFile(accountConfig?.tokenFile);
    if (accountTokenFile) {
        return {
            accountId,
            enabled,
            name: (0, _stringcoerceruntime.normalizeOptionalString)(merged.name),
            token: accountTokenFile.token,
            tokenSource: accountTokenFile.tokenSource,
            tokenStatus: accountTokenFile.tokenStatus,
            configured: accountTokenFile.tokenStatus !== "missing",
            config: merged
        };
    }
    const accountToken = inspectTokenValue({
        cfg: params.cfg,
        value: accountConfig?.botToken
    });
    if (accountToken) {
        return {
            accountId,
            enabled,
            name: (0, _stringcoerceruntime.normalizeOptionalString)(merged.name),
            token: accountToken.token,
            tokenSource: accountToken.tokenSource,
            tokenStatus: accountToken.tokenStatus,
            configured: accountToken.tokenStatus !== "missing",
            config: merged
        };
    }
    if (allowChannelCredentialFallback) {
        const channelTokenFile = inspectTokenFile(params.cfg.channels?.telegram?.tokenFile);
        if (channelTokenFile) {
            return {
                accountId,
                enabled,
                name: (0, _stringcoerceruntime.normalizeOptionalString)(merged.name),
                token: channelTokenFile.token,
                tokenSource: channelTokenFile.tokenSource,
                tokenStatus: channelTokenFile.tokenStatus,
                configured: channelTokenFile.tokenStatus !== "missing",
                config: merged
            };
        }
        const channelToken = inspectTokenValue({
            cfg: params.cfg,
            value: params.cfg.channels?.telegram?.botToken
        });
        if (channelToken) {
            return {
                accountId,
                enabled,
                name: (0, _stringcoerceruntime.normalizeOptionalString)(merged.name),
                token: channelToken.token,
                tokenSource: channelToken.tokenSource,
                tokenStatus: channelToken.tokenStatus,
                configured: channelToken.tokenStatus !== "missing",
                config: merged
            };
        }
    }
    const allowEnv = accountId === _routing.DEFAULT_ACCOUNT_ID;
    const envToken = allowEnv ? (0, _stringcoerceruntime.normalizeOptionalString)(params.envToken) ?? (0, _stringcoerceruntime.normalizeOptionalString)(process.env.TELEGRAM_BOT_TOKEN) ?? "" : "";
    if (envToken) {
        return {
            accountId,
            enabled,
            name: (0, _stringcoerceruntime.normalizeOptionalString)(merged.name),
            token: envToken,
            tokenSource: "env",
            tokenStatus: "available",
            configured: true,
            config: merged
        };
    }
    return {
        accountId,
        enabled,
        name: (0, _stringcoerceruntime.normalizeOptionalString)(merged.name),
        token: "",
        tokenSource: "none",
        tokenStatus: "missing",
        configured: false,
        config: merged
    };
}
function inspectTelegramAccount(params) {
    return (0, _accountcore.resolveAccountWithDefaultFallback)({
        accountId: params.accountId,
        normalizeAccountId: _routing.normalizeAccountId,
        resolvePrimary: (accountId)=>inspectTelegramAccountPrimary({
                cfg: params.cfg,
                accountId,
                envToken: params.envToken
            }),
        hasCredential: (account)=>account.tokenSource !== "none",
        resolveDefaultAccountId: ()=>(0, _accounts.resolveDefaultTelegramAccountId)(params.cfg)
    });
}

//# sourceMappingURL=account-inspect.js.map