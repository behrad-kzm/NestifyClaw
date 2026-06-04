"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveWhatsAppRuntimeGroupPolicy", {
    enumerable: true,
    get: function() {
        return resolveWhatsAppRuntimeGroupPolicy;
    }
});
const _runtimegrouppolicy = require("../../../../common/openclaw/plugin-sdk/runtime-group-policy");
function resolveWhatsAppRuntimeGroupPolicy(params) {
    return (0, _runtimegrouppolicy.resolveOpenProviderRuntimeGroupPolicy)({
        providerConfigPresent: params.providerConfigPresent,
        groupPolicy: params.groupPolicy,
        defaultGroupPolicy: params.defaultGroupPolicy
    });
}

//# sourceMappingURL=runtime-group-policy.js.map