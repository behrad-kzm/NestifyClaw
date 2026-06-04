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
    get collectUnsupportedSecretRefConfigCandidates () {
        return collectUnsupportedSecretRefConfigCandidates;
    },
    get unsupportedSecretRefSurfacePatterns () {
        return unsupportedSecretRefSurfacePatterns;
    }
});
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const unsupportedSecretRefSurfacePatterns = [
    "channels.whatsapp.creds.json",
    "channels.whatsapp.accounts.*.creds.json"
];
function collectUnsupportedSecretRefConfigCandidates(raw) {
    if (!(0, _stringcoerceruntime.isRecord)(raw)) {
        return [];
    }
    if (!(0, _stringcoerceruntime.isRecord)(raw.channels) || !(0, _stringcoerceruntime.isRecord)(raw.channels.whatsapp)) {
        return [];
    }
    const candidates = [];
    const whatsapp = raw.channels.whatsapp;
    const creds = (0, _stringcoerceruntime.isRecord)(whatsapp.creds) ? whatsapp.creds : null;
    if (creds) {
        candidates.push({
            path: "channels.whatsapp.creds.json",
            value: creds.json
        });
    }
    const accounts = (0, _stringcoerceruntime.isRecord)(whatsapp.accounts) ? whatsapp.accounts : null;
    if (!accounts) {
        return candidates;
    }
    for (const [accountId, account] of Object.entries(accounts)){
        if (!(0, _stringcoerceruntime.isRecord)(account) || !(0, _stringcoerceruntime.isRecord)(account.creds)) {
            continue;
        }
        candidates.push({
            path: `channels.whatsapp.accounts.${accountId}.creds.json`,
            value: account.creds.json
        });
    }
    return candidates;
}

//# sourceMappingURL=security-contract.js.map