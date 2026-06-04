"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "detectWhatsAppLegacyStateMigrations", {
    enumerable: true,
    get: function() {
        return detectWhatsAppLegacyStateMigrations;
    }
});
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _accountid = require("../../../../common/openclaw/plugin-sdk/account-id");
const _securityruntime = require("../../../../common/openclaw/plugin-sdk/security-runtime");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function fileExists(pathValue) {
    try {
        return !(0, _securityruntime.statRegularFileSync)(pathValue).missing;
    } catch  {
        return false;
    }
}
function isLegacyWhatsAppAuthFile(name) {
    if (name === "creds.json" || name === "creds.json.bak") {
        return true;
    }
    if (!name.endsWith(".json")) {
        return false;
    }
    return /^(app-state-sync|session|sender-key|pre-key)-/.test(name);
}
function detectWhatsAppLegacyStateMigrations(params) {
    const targetDir = _nodepath.default.join(params.oauthDir, "whatsapp", _accountid.DEFAULT_ACCOUNT_ID);
    const entries = (()=>{
        try {
            return _nodefs.default.readdirSync(params.oauthDir, {
                withFileTypes: true
            });
        } catch  {
            return [];
        }
    })();
    return entries.flatMap((entry)=>{
        if (!entry.isFile() || entry.name === "oauth.json" || !isLegacyWhatsAppAuthFile(entry.name)) {
            return [];
        }
        const sourcePath = _nodepath.default.join(params.oauthDir, entry.name);
        const targetPath = _nodepath.default.join(targetDir, entry.name);
        if (fileExists(targetPath)) {
            return [];
        }
        return [
            {
                kind: "move",
                label: `WhatsApp auth ${entry.name}`,
                sourcePath,
                targetPath
            }
        ];
    });
}

//# sourceMappingURL=state-migrations.js.map