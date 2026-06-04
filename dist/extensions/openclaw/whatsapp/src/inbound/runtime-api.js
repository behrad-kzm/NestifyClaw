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
    get DisconnectReason () {
        return _baileys.DisconnectReason;
    },
    get downloadMediaMessage () {
        return _baileys.downloadMediaMessage;
    },
    get isJidGroup () {
        return _baileys.isJidGroup;
    },
    get normalizeMessageContent () {
        return _baileys.normalizeMessageContent;
    },
    get saveMediaBuffer () {
        return _savemediaruntime.saveMediaBuffer;
    }
});
const _baileys = require("baileys");
const _savemediaruntime = require("./save-media.runtime.js");

//# sourceMappingURL=runtime-api.js.map