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
    get getActiveWebListener () {
        return getActiveWebListener;
    },
    get resolveWebAccountId () {
        return resolveWebAccountId;
    }
});
const _accountids = require("./account-ids.js");
const _connectioncontrollerregistry = require("./connection-controller-registry.js");
function resolveWebAccountId(params) {
    return (params.accountId ?? "").trim() || (0, _accountids.resolveDefaultWhatsAppAccountId)(params.cfg);
}
function getActiveWebListener(accountId) {
    return (0, _connectioncontrollerregistry.getRegisteredWhatsAppConnectionController)(accountId)?.getActiveListener() ?? null;
}

//# sourceMappingURL=active-listener.js.map