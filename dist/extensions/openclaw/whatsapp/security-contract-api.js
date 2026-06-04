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
        return _securitycontract.collectUnsupportedSecretRefConfigCandidates;
    },
    get unsupportedSecretRefSurfacePatterns () {
        return _securitycontract.unsupportedSecretRefSurfacePatterns;
    }
});
const _securitycontract = require("./src/security-contract.js");

//# sourceMappingURL=security-contract-api.js.map