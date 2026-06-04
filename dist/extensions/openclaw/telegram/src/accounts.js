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
    get createTelegramActionGate () {
        return createTelegramActionGate;
    },
    get listEnabledTelegramAccounts () {
        return listEnabledTelegramAccounts;
    },
    get listTelegramAccountIds () {
        return listTelegramAccountIds;
    },
    get mergeTelegramAccountConfig () {
        return _accountconfig.mergeTelegramAccountConfig;
    },
    get resetMissingDefaultWarnFlag () {
        return resetMissingDefaultWarnFlag;
    },
    get resolveDefaultTelegramAccountId () {
        return resolveDefaultTelegramAccountId;
    },
    get resolveTelegramAccount () {
        return resolveTelegramAccount;
    },
    get resolveTelegramAccountConfig () {
        return _accountconfig.resolveTelegramAccountConfig;
    },
    get resolveTelegramMediaRuntimeOptions () {
        return resolveTelegramMediaRuntimeOptions;
    },
    get resolveTelegramPollActionGateState () {
        return resolveTelegramPollActionGateState;
    }
});
const _nodeutil = /*#__PURE__*/ _interop_require_default(require("node:util"));
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accountconfig = require("./account-config.js");
const _accountselection = require("./account-selection.js");
const _token = require("./token.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
let log = null;
function getLog() {
    if (!log) {
        log = (0, _runtimeenv.createSubsystemLogger)("telegram/accounts");
    }
    return log;
}
function formatDebugArg(value) {
    if (typeof value === "string") {
        return value;
    }
    if (value instanceof Error) {
        return value.stack ?? value.message;
    }
    return _nodeutil.default.inspect(value, {
        colors: false,
        depth: null,
        compact: true,
        breakLength: Infinity
    });
}
const debugAccounts = (...args)=>{
    if ((0, _runtimeenv.isTruthyEnvValue)(process.env.OPENCLAW_DEBUG_TELEGRAM_ACCOUNTS)) {
        const parts = args.map((arg)=>formatDebugArg(arg));
        getLog().warn(parts.join(" ").trim());
    }
};
function listTelegramAccountIds(cfg) {
    const ids = (0, _accountselection.listTelegramAccountIds)(cfg);
    debugAccounts("listTelegramAccountIds", ids);
    return ids;
}
let emittedMissingDefaultWarn = false;
function resetMissingDefaultWarnFlag() {
    emittedMissingDefaultWarn = false;
}
function resolveDefaultTelegramAccountId(cfg) {
    const selection = (0, _accountselection.resolveDefaultTelegramAccountSelection)(cfg);
    if (selection.shouldWarnMissingDefault && !emittedMissingDefaultWarn) {
        emittedMissingDefaultWarn = true;
        getLog().warn(`channels.telegram: accounts.default is missing; falling back to "${selection.accountId}". ` + `${(0, _routing.formatSetExplicitDefaultInstruction)("telegram")} to avoid routing surprises in multi-account setups.`);
    }
    return selection.accountId;
}
function createTelegramActionGate(params) {
    const accountId = (0, _accountcore.normalizeAccountId)(params.accountId ?? resolveDefaultTelegramAccountId(params.cfg));
    return (0, _accountcore.createAccountActionGate)({
        baseActions: params.cfg.channels?.telegram?.actions,
        accountActions: (0, _accountconfig.resolveTelegramAccountConfig)(params.cfg, accountId)?.actions
    });
}
function resolveTelegramMediaRuntimeOptions(params) {
    const normalizedAccountId = (0, _accountcore.normalizeOptionalAccountId)(params.accountId);
    const accountCfg = normalizedAccountId ? (0, _accountconfig.mergeTelegramAccountConfig)(params.cfg, normalizedAccountId) : params.cfg.channels?.telegram;
    return {
        token: params.token,
        transport: params.transport,
        apiRoot: accountCfg?.apiRoot,
        trustedLocalFileRoots: accountCfg?.trustedLocalFileRoots,
        dangerouslyAllowPrivateNetwork: accountCfg?.network?.dangerouslyAllowPrivateNetwork
    };
}
function resolveTelegramPollActionGateState(isActionEnabled) {
    const sendMessageEnabled = isActionEnabled("sendMessage");
    const pollEnabled = isActionEnabled("poll");
    return {
        sendMessageEnabled,
        pollEnabled,
        enabled: sendMessageEnabled && pollEnabled
    };
}
function resolveTelegramAccount(params) {
    const baseEnabled = params.cfg.channels?.telegram?.enabled !== false;
    const resolve = (accountId)=>{
        const merged = (0, _accountconfig.mergeTelegramAccountConfig)(params.cfg, accountId);
        const accountEnabled = merged.enabled !== false;
        const enabled = baseEnabled && accountEnabled;
        const tokenResolution = (0, _token.resolveTelegramToken)(params.cfg, {
            accountId
        });
        debugAccounts("resolve", {
            accountId,
            enabled,
            tokenSource: tokenResolution.source
        });
        return {
            accountId,
            enabled,
            name: (0, _stringcoerceruntime.normalizeOptionalString)(merged.name),
            token: tokenResolution.token,
            tokenSource: tokenResolution.source,
            config: merged
        };
    };
    // If accountId is omitted, prefer a configured account token over failing on
    // the implicit "default" account. This keeps env-based setups working while
    // making config-only tokens work for things like heartbeats.
    return (0, _accountcore.resolveAccountWithDefaultFallback)({
        accountId: params.accountId,
        normalizeAccountId: _accountcore.normalizeAccountId,
        resolvePrimary: resolve,
        hasCredential: (account)=>account.tokenSource !== "none",
        resolveDefaultAccountId: ()=>resolveDefaultTelegramAccountId(params.cfg)
    });
}
function listEnabledTelegramAccounts(cfg) {
    const baseEnabled = cfg.channels?.telegram?.enabled !== false;
    if (!baseEnabled) {
        return [];
    }
    return listTelegramAccountIds(cfg).filter((accountId)=>(0, _accountconfig.mergeTelegramAccountConfig)(cfg, accountId).enabled !== false).map((accountId)=>resolveTelegramAccount({
            cfg,
            accountId
        }));
}

//# sourceMappingURL=accounts.js.map