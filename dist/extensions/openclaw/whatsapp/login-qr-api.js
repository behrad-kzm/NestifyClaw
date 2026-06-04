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
    get startWebLoginWithQr () {
        return _loginqrruntime.startWebLoginWithQr;
    },
    get waitForWebLogin () {
        return _loginqrruntime.waitForWebLogin;
    }
});
const _loginqrruntime = require("./login-qr-runtime.js");

//# sourceMappingURL=login-qr-api.js.map