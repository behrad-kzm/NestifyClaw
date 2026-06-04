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
    get getProxyUrlFromFetch () {
        return _fetchruntime.getProxyUrlFromFetch;
    },
    get makeProxyFetch () {
        return _fetchruntime.makeProxyFetch;
    }
});
const _fetchruntime = require("../../../../common/openclaw/plugin-sdk/fetch-runtime");

//# sourceMappingURL=proxy.js.map