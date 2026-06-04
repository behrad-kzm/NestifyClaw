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
    get DEFAULT_WHATSAPP_MEDIA_MAX_MB () {
        return DEFAULT_WHATSAPP_MEDIA_MAX_MB;
    },
    get hasAnyWhatsAppAuth () {
        return hasAnyWhatsAppAuth;
    },
    get listEnabledWhatsAppAccounts () {
        return listEnabledWhatsAppAccounts;
    },
    get listWhatsAppAccountIds () {
        return _accountids.listWhatsAppAccountIds;
    },
    get listWhatsAppAuthDirs () {
        return listWhatsAppAuthDirs;
    },
    get resolveDefaultWhatsAppAccountId () {
        return _accountids.resolveDefaultWhatsAppAccountId;
    },
    get resolveWhatsAppAccount () {
        return resolveWhatsAppAccount;
    },
    get resolveWhatsAppAuthDir () {
        return resolveWhatsAppAuthDir;
    },
    get resolveWhatsAppMediaMaxBytes () {
        return resolveWhatsAppMediaMaxBytes;
    }
});
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
const _statepaths = require("../../../../common/openclaw/plugin-sdk/state-paths");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accountconfig = require("./account-config.js");
const _accountids = require("./account-ids.js");
const _credsfiles = require("./creds-files.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const DEFAULT_WHATSAPP_MEDIA_MAX_MB = 50;
function listWhatsAppAuthDirs(cfg) {
    const oauthDir = (0, _statepaths.resolveOAuthDir)();
    const whatsappDir = _nodepath.default.join(oauthDir, "whatsapp");
    const authDirs = new Set([
        oauthDir,
        _nodepath.default.join(whatsappDir, _accountcore.DEFAULT_ACCOUNT_ID)
    ]);
    const accountIds = (0, _accountids.listConfiguredAccountIds)(cfg);
    for (const accountId of accountIds){
        authDirs.add(resolveWhatsAppAuthDir({
            cfg,
            accountId
        }).authDir);
    }
    try {
        const entries = _nodefs.default.readdirSync(whatsappDir, {
            withFileTypes: true
        });
        for (const entry of entries){
            if (!entry.isDirectory()) {
                continue;
            }
            authDirs.add(_nodepath.default.join(whatsappDir, entry.name));
        }
    } catch  {
    // ignore missing dirs
    }
    return Array.from(authDirs);
}
function hasAnyWhatsAppAuth(cfg) {
    return listWhatsAppAuthDirs(cfg).some((authDir)=>(0, _credsfiles.hasWebCredsSync)(authDir));
}
function resolveDefaultAuthDir(accountId) {
    return _nodepath.default.join((0, _statepaths.resolveOAuthDir)(), "whatsapp", (0, _accountcore.normalizeAccountId)(accountId));
}
function resolveLegacyAuthDir() {
    // Legacy Baileys creds lived in the same directory as OAuth tokens.
    return (0, _statepaths.resolveOAuthDir)();
}
function legacyAuthExists(authDir) {
    return (0, _credsfiles.hasWebCredsRegularFileSync)(authDir);
}
function resolveWhatsAppAuthDir(params) {
    const accountId = params.accountId.trim() || _accountcore.DEFAULT_ACCOUNT_ID;
    const account = (0, _accountconfig.resolveMergedWhatsAppAccountConfig)({
        cfg: params.cfg,
        accountId
    });
    const configured = account?.authDir?.trim();
    if (configured) {
        return {
            authDir: (0, _accountcore.resolveUserPath)(configured),
            isLegacy: false
        };
    }
    const defaultDir = resolveDefaultAuthDir(accountId);
    if (accountId === _accountcore.DEFAULT_ACCOUNT_ID) {
        const legacyDir = resolveLegacyAuthDir();
        if (legacyAuthExists(legacyDir) && !legacyAuthExists(defaultDir)) {
            return {
                authDir: legacyDir,
                isLegacy: true
            };
        }
    }
    return {
        authDir: defaultDir,
        isLegacy: false
    };
}
function resolveWhatsAppAccount(params) {
    const merged = (0, _accountconfig.resolveMergedWhatsAppAccountConfig)({
        cfg: params.cfg,
        accountId: params.accountId?.trim() || (0, _accountids.resolveDefaultWhatsAppAccountId)(params.cfg)
    });
    const accountId = merged.accountId;
    const enabled = merged.enabled !== false;
    const { authDir, isLegacy } = resolveWhatsAppAuthDir({
        cfg: params.cfg,
        accountId
    });
    return {
        accountId,
        name: (0, _stringcoerceruntime.normalizeOptionalString)(merged.name),
        enabled,
        sendReadReceipts: merged.sendReadReceipts ?? true,
        messagePrefix: merged.messagePrefix ?? params.cfg.messages?.messagePrefix,
        defaultTo: merged.defaultTo,
        authDir,
        isLegacyAuthDir: isLegacy,
        selfChatMode: merged.selfChatMode,
        dmPolicy: merged.dmPolicy,
        allowFrom: merged.allowFrom,
        groupAllowFrom: merged.groupAllowFrom,
        groupPolicy: merged.groupPolicy,
        mentionPatterns: merged.mentionPatterns,
        historyLimit: merged.historyLimit,
        textChunkLimit: merged.textChunkLimit,
        chunkMode: merged.chunkMode,
        mediaMaxMb: merged.mediaMaxMb,
        blockStreaming: merged.blockStreaming,
        ackReaction: merged.ackReaction,
        reactionLevel: merged.reactionLevel,
        groups: merged.groups,
        direct: merged.direct,
        debounceMs: merged.debounceMs,
        replyToMode: merged.replyToMode
    };
}
function resolveWhatsAppMediaMaxBytes(account) {
    const mediaMaxMb = typeof account.mediaMaxMb === "number" && account.mediaMaxMb > 0 ? account.mediaMaxMb : DEFAULT_WHATSAPP_MEDIA_MAX_MB;
    return Math.floor(mediaMaxMb * 1024 * 1024);
}
function listEnabledWhatsAppAccounts(cfg) {
    return (0, _accountids.listWhatsAppAccountIds)(cfg).map((accountId)=>resolveWhatsAppAccount({
            cfg,
            accountId
        })).filter((account)=>account.enabled);
}

//# sourceMappingURL=accounts.js.map