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
    get listTelegramDirectoryGroupsFromConfig () {
        return _directoryconfig.listTelegramDirectoryGroupsFromConfig;
    },
    get listTelegramDirectoryPeersFromConfig () {
        return _directoryconfig.listTelegramDirectoryPeersFromConfig;
    }
});
const _directoryconfig = require("./src/directory-config.js");

//# sourceMappingURL=directory-contract-api.js.map