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
    get channelSecrets () {
        return _secretcontract.channelSecrets;
    },
    get collectRuntimeConfigAssignments () {
        return _secretcontract.collectRuntimeConfigAssignments;
    },
    get secretTargetRegistryEntries () {
        return _secretcontract.secretTargetRegistryEntries;
    }
});
const _secretcontract = require("./src/secret-contract.js");

//# sourceMappingURL=secret-contract-api.js.map