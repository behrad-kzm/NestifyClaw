// WhatsApp does not expose secret-contract surfaces.
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
    get collectRuntimeConfigAssignments () {
        return collectRuntimeConfigAssignments;
    },
    get secretTargetRegistryEntries () {
        return secretTargetRegistryEntries;
    }
});
const secretTargetRegistryEntries = [];
function collectRuntimeConfigAssignments() {}

//# sourceMappingURL=secret-contract-api.js.map