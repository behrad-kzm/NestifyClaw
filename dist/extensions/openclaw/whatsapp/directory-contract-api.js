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
    get listWhatsAppDirectoryGroupsFromConfig () {
        return _directoryconfig.listWhatsAppDirectoryGroupsFromConfig;
    },
    get listWhatsAppDirectoryPeersFromConfig () {
        return _directoryconfig.listWhatsAppDirectoryPeersFromConfig;
    }
});
const _directoryconfig = require("./src/directory-config.js");

//# sourceMappingURL=directory-contract-api.js.map