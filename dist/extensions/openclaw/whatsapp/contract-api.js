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
    get canonicalizeLegacySessionKey () {
        return canonicalizeLegacySessionKey;
    },
    get collectUnsupportedSecretRefConfigCandidates () {
        return _securitycontract.collectUnsupportedSecretRefConfigCandidates;
    },
    get isLegacyGroupSessionKey () {
        return isLegacyGroupSessionKey;
    },
    get isWhatsAppGroupJid () {
        return isWhatsAppGroupJid;
    },
    get listWhatsAppDirectoryGroupsFromConfig () {
        return _directoryconfig.listWhatsAppDirectoryGroupsFromConfig;
    },
    get listWhatsAppDirectoryPeersFromConfig () {
        return _directoryconfig.listWhatsAppDirectoryPeersFromConfig;
    },
    get normalizeWhatsAppTarget () {
        return normalizeWhatsAppTarget;
    },
    get resolveLegacyGroupSessionKey () {
        return resolveLegacyGroupSessionKey;
    },
    get resolveWhatsAppRuntimeGroupPolicy () {
        return resolveWhatsAppRuntimeGroupPolicy;
    },
    get unsupportedSecretRefSurfacePatterns () {
        return _securitycontract.unsupportedSecretRefSurfacePatterns;
    },
    get whatsappAccessControlTesting () {
        return whatsappAccessControlTesting;
    },
    get whatsappCommandPolicy () {
        return whatsappCommandPolicy;
    }
});
const _commandpolicy = require("./src/command-policy.js");
const _groupsessioncontract = require("./src/group-session-contract.js");
const _accesscontrol = require("./src/inbound/access-control.js");
const _normalizetarget = require("./src/normalize-target.js");
const _directoryconfig = require("./src/directory-config.js");
const _runtimegrouppolicy = require("./src/runtime-group-policy.js");
const _sessioncontract = require("./src/session-contract.js");
const _securitycontract = require("./src/security-contract.js");
const canonicalizeLegacySessionKey = _sessioncontract.canonicalizeLegacySessionKey;
const isLegacyGroupSessionKey = _sessioncontract.isLegacyGroupSessionKey;
const isWhatsAppGroupJid = _normalizetarget.isWhatsAppGroupJid;
const normalizeWhatsAppTarget = _normalizetarget.normalizeWhatsAppTarget;
const resolveLegacyGroupSessionKey = _groupsessioncontract.resolveLegacyGroupSessionKey;
const resolveWhatsAppRuntimeGroupPolicy = _runtimegrouppolicy.resolveWhatsAppRuntimeGroupPolicy;
const whatsappAccessControlTesting = _accesscontrol.testing;
const whatsappCommandPolicy = _commandpolicy.whatsappCommandPolicy;

//# sourceMappingURL=contract-api.js.map