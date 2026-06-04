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
    get resolveWhatsAppRuntimeGroupPolicy () {
        return _runtimegrouppolicy.resolveWhatsAppRuntimeGroupPolicy;
    },
    get whatsappOutbound () {
        return _outboundadapter.whatsappOutbound;
    }
});
const _outboundadapter = require("./src/outbound-adapter.js");
const _runtimegrouppolicy = require("./src/runtime-group-policy.js");

//# sourceMappingURL=test-api.js.map