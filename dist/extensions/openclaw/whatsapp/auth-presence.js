"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "hasAnyWhatsAppAuth", {
    enumerable: true,
    get: function() {
        return hasAnyWhatsAppAuth;
    }
});
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _accountid = require("../../../common/openclaw/plugin-sdk/account-id");
const _accountresolution = require("../../../common/openclaw/plugin-sdk/account-resolution");
const _statepaths = require("../../../common/openclaw/plugin-sdk/state-paths");
const _credsfiles = require("./src/creds-files.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function addAccountAuthDirs(authDirs, accountId, authDir, accountsRoot, env) {
    authDirs.add(_nodepath.default.join(accountsRoot, (0, _accountid.normalizeAccountId)(accountId)));
    const configuredAuthDir = authDir?.trim();
    if (configuredAuthDir) {
        authDirs.add((0, _accountresolution.resolveUserPath)(configuredAuthDir, env));
    }
}
function listWhatsAppAuthDirs(cfg, env = process.env) {
    const oauthDir = (0, _statepaths.resolveOAuthDir)(env);
    const accountsRoot = _nodepath.default.join(oauthDir, "whatsapp");
    const channel = cfg.channels?.whatsapp;
    const authDirs = new Set([
        oauthDir,
        _nodepath.default.join(accountsRoot, _accountid.DEFAULT_ACCOUNT_ID)
    ]);
    addAccountAuthDirs(authDirs, _accountid.DEFAULT_ACCOUNT_ID, undefined, accountsRoot, env);
    if (channel?.defaultAccount?.trim()) {
        addAccountAuthDirs(authDirs, channel.defaultAccount, channel.accounts?.[channel.defaultAccount]?.authDir, accountsRoot, env);
    }
    const accounts = channel?.accounts;
    if (accounts) {
        for (const [accountId, account] of Object.entries(accounts)){
            addAccountAuthDirs(authDirs, accountId, account?.authDir, accountsRoot, env);
        }
    }
    try {
        const entries = _nodefs.default.readdirSync(accountsRoot, {
            withFileTypes: true
        });
        for (const entry of entries){
            if (entry.isDirectory()) {
                authDirs.add(_nodepath.default.join(accountsRoot, entry.name));
            }
        }
    } catch  {
    // Missing directories mean no auth state.
    }
    return [
        ...authDirs
    ];
}
function hasAnyWhatsAppAuth(params, env = process.env) {
    const cfg = params && typeof params === "object" && "cfg" in params ? params.cfg : params;
    const resolvedEnv = params && typeof params === "object" && "cfg" in params ? params.env ?? env : env;
    return listWhatsAppAuthDirs(cfg, resolvedEnv).some((authDir)=>(0, _credsfiles.hasWebCredsSync)(authDir));
}

//# sourceMappingURL=auth-presence.js.map