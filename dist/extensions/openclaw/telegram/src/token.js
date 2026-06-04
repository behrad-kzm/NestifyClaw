"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramToken", {
    enumerable: true,
    get: function() {
        return resolveTelegramToken;
    }
});
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
const _channelcore = require("../../../../common/openclaw/plugin-sdk/channel-core");
const _providerauth = require("../../../../common/openclaw/plugin-sdk/provider-auth");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _secretinput = require("../../../../common/openclaw/plugin-sdk/secret-input");
function resolveEnvSecretRefValue(params) {
    const providerConfig = params.cfg?.secrets?.providers?.[params.provider];
    if (providerConfig) {
        if (providerConfig.source !== "env") {
            throw new Error(`Secret provider "${params.provider}" has source "${providerConfig.source}" but ref requests "env".`);
        }
        if (providerConfig.allowlist && !providerConfig.allowlist.includes(params.id)) {
            throw new Error(`Environment variable "${params.id}" is not allowlisted in secrets.providers.${params.provider}.allowlist.`);
        }
    } else if (params.provider !== (0, _providerauth.resolveDefaultSecretProviderAlias)({
        secrets: params.cfg?.secrets
    }, "env")) {
        throw new Error(`Secret provider "${params.provider}" is not configured (ref: env:${params.provider}:${params.id}).`);
    }
    return (0, _secretinput.normalizeSecretInputString)((params.env ?? process.env)[params.id]);
}
function resolveRuntimeTokenValue(params) {
    const resolved = (0, _secretinput.resolveSecretInputString)({
        value: params.value,
        path: params.path,
        defaults: params.cfg?.secrets?.defaults,
        mode: "inspect"
    });
    if (resolved.status === "available") {
        return {
            status: "available",
            value: resolved.value
        };
    }
    if (resolved.status === "missing") {
        return {
            status: "missing"
        };
    }
    if (resolved.ref.source === "env") {
        const envValue = resolveEnvSecretRefValue({
            cfg: params.cfg,
            provider: resolved.ref.provider,
            id: resolved.ref.id
        });
        if (envValue) {
            return {
                status: "available",
                value: envValue
            };
        }
        return {
            status: "configured_unavailable"
        };
    }
    // Runtime resolution stays strict for non-env SecretRefs.
    (0, _secretinput.resolveSecretInputString)({
        value: params.value,
        path: params.path,
        defaults: params.cfg?.secrets?.defaults,
        mode: "strict"
    });
    return {
        status: "configured_unavailable"
    };
}
function resolveTelegramToken(cfg, opts = {}) {
    const accountId = (0, _routing.normalizeAccountId)(opts.accountId);
    const telegramCfg = cfg?.channels?.telegram;
    // Account IDs are normalized for routing (e.g. lowercased). Config keys may not
    // be normalized, so resolve per-account config by matching normalized IDs.
    const resolveAccountCfg = (id)=>{
        const accounts = telegramCfg?.accounts;
        return Array.isArray(accounts) ? undefined : (0, _accountcore.resolveNormalizedAccountEntry)(accounts, id, _routing.normalizeAccountId);
    };
    const accountCfg = resolveAccountCfg(accountId !== _routing.DEFAULT_ACCOUNT_ID ? accountId : _routing.DEFAULT_ACCOUNT_ID);
    // When a non-default accountId is explicitly specified but not found in config,
    // decide whether to fall through to channel-level defaults based on whether
    // the config has an explicit accounts section (multi-bot setup).
    //
    // Multi-bot: accounts section exists with entries → block fallthrough to prevent
    // routing via the wrong bot's token.
    //
    // Single-bot: no accounts section (or empty) → allow fallthrough so that
    // binding-created accountIds inherit the channel-level token.
    // See: https://github.com/openclaw/openclaw/issues/53876
    if (accountId !== _routing.DEFAULT_ACCOUNT_ID && !accountCfg) {
        const accounts = telegramCfg?.accounts;
        const hasConfiguredAccounts = Boolean(accounts) && typeof accounts === "object" && !Array.isArray(accounts) && Object.keys(accounts).length > 0;
        if (hasConfiguredAccounts) {
            opts.logMissingFile?.(`channels.telegram.accounts: unknown accountId "${accountId}" — not found in config, refusing channel-level fallback`);
            return {
                token: "",
                source: "none"
            };
        }
    }
    const accountTokenFile = accountCfg?.tokenFile?.trim();
    if (accountTokenFile) {
        const token = (0, _channelcore.tryReadSecretFileSync)(accountTokenFile, `channels.telegram.accounts.${accountId}.tokenFile`, {
            rejectSymlink: true
        });
        if (token) {
            return {
                token,
                source: "tokenFile"
            };
        }
        opts.logMissingFile?.(`channels.telegram.accounts.${accountId}.tokenFile not found or unreadable: ${accountTokenFile}`);
        return {
            token: "",
            source: "none"
        };
    }
    const accountToken = resolveRuntimeTokenValue({
        cfg,
        value: accountCfg?.botToken,
        path: `channels.telegram.accounts.${accountId}.botToken`
    });
    if (accountToken.status === "available") {
        return {
            token: accountToken.value,
            source: "config"
        };
    }
    if (accountToken.status === "configured_unavailable") {
        return {
            token: "",
            source: "none"
        };
    }
    const allowEnv = accountId === _routing.DEFAULT_ACCOUNT_ID;
    const tokenFile = telegramCfg?.tokenFile?.trim();
    if (tokenFile) {
        const token = (0, _channelcore.tryReadSecretFileSync)(tokenFile, "channels.telegram.tokenFile", {
            rejectSymlink: true
        });
        if (token) {
            return {
                token,
                source: "tokenFile"
            };
        }
        opts.logMissingFile?.(`channels.telegram.tokenFile not found or unreadable: ${tokenFile}`);
        return {
            token: "",
            source: "none"
        };
    }
    const configToken = resolveRuntimeTokenValue({
        cfg,
        value: telegramCfg?.botToken,
        path: "channels.telegram.botToken"
    });
    if (configToken.status === "available") {
        return {
            token: configToken.value,
            source: "config"
        };
    }
    if (configToken.status === "configured_unavailable") {
        return {
            token: "",
            source: "none"
        };
    }
    const envToken = allowEnv ? (opts.envToken ?? process.env.TELEGRAM_BOT_TOKEN)?.trim() : "";
    if (envToken) {
        return {
            token: envToken,
            source: "env"
        };
    }
    return {
        token: "",
        source: "none"
    };
}

//# sourceMappingURL=token.js.map