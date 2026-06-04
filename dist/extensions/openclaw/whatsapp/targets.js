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
    get isWhatsAppGroupJid () {
        return _normalizetarget.isWhatsAppGroupJid;
    },
    get isWhatsAppUserTarget () {
        return _normalizetarget.isWhatsAppUserTarget;
    },
    get normalizeWhatsAppTarget () {
        return _normalizetarget.normalizeWhatsAppTarget;
    }
});
const _normalizetarget = require("./src/normalize-target.js");

//# sourceMappingURL=targets.js.map