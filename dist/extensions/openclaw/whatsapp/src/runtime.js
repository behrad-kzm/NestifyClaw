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
    get getOptionalWhatsAppRuntime () {
        return getOptionalWhatsAppRuntime;
    },
    get getWhatsAppRuntime () {
        return getWhatsAppRuntime;
    },
    get setWhatsAppRuntime () {
        return setWhatsAppRuntime;
    }
});
const _runtimestore = require("../../../../common/openclaw/plugin-sdk/runtime-store");
const { setRuntime: setWhatsAppRuntime, getRuntime: getWhatsAppRuntime, tryGetRuntime: getOptionalWhatsAppRuntime } = (0, _runtimestore.createPluginRuntimeStore)({
    pluginId: "whatsapp",
    errorMessage: "WhatsApp runtime not initialized"
});

//# sourceMappingURL=runtime.js.map