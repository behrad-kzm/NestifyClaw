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
    get BufferJSON () {
        return _baileys.BufferJSON;
    },
    get DisconnectReason () {
        return _baileys.DisconnectReason;
    },
    get fetchLatestBaileysVersion () {
        return _baileys.fetchLatestBaileysVersion;
    },
    get makeCacheableSignalKeyStore () {
        return _baileys.makeCacheableSignalKeyStore;
    },
    get makeWASocket () {
        return _baileys.makeWASocket;
    },
    get useMultiFileAuthState () {
        return _baileys.useMultiFileAuthState;
    }
});
const _baileys = require("baileys");

//# sourceMappingURL=session.runtime.js.map