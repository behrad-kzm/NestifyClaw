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
    get clearTelegramRuntime () {
        return clearTelegramRuntime;
    },
    get getOptionalTelegramRuntime () {
        return getOptionalTelegramRuntime;
    },
    get getTelegramRuntime () {
        return getTelegramRuntime;
    },
    get setTelegramRuntime () {
        return setTelegramRuntime;
    }
});
const _runtimestore = require("../../../../common/openclaw/plugin-sdk/runtime-store");
const { setRuntime: setTelegramRuntime, clearRuntime: clearTelegramRuntime, getRuntime: getTelegramRuntime, tryGetRuntime: getOptionalTelegramRuntime } = (0, _runtimestore.createPluginRuntimeStore)({
    pluginId: "telegram",
    errorMessage: "Telegram runtime not initialized"
});

//# sourceMappingURL=runtime.js.map