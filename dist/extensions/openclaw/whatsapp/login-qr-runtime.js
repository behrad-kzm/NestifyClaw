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
        return startWebLoginWithQr;
    },
    get waitForWebLogin () {
        return waitForWebLogin;
    }
});
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
let loginQrModulePromise = null;
function loadLoginQrModule() {
    loginQrModulePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./src/login-qr.js")));
    return loginQrModulePromise;
}
async function startWebLoginWithQr(...args) {
    const { startWebLoginWithQr: startWebLoginWithQrLocal } = await loadLoginQrModule();
    return await startWebLoginWithQrLocal(...args);
}
async function waitForWebLogin(...args) {
    const { waitForWebLogin: waitForWebLoginLocal } = await loadLoginQrModule();
    return await waitForWebLoginLocal(...args);
}

//# sourceMappingURL=login-qr-runtime.js.map