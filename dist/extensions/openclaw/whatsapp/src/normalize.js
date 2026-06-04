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
    get isWhatsAppNewsletterJid () {
        return _normalizetarget.isWhatsAppNewsletterJid;
    },
    get looksLikeWhatsAppTargetId () {
        return _normalizetarget.looksLikeWhatsAppTargetId;
    },
    get normalizeWhatsAppAllowFromEntry () {
        return _normalizetarget.normalizeWhatsAppAllowFromEntry;
    },
    get normalizeWhatsAppMessagingTarget () {
        return _normalizetarget.normalizeWhatsAppMessagingTarget;
    },
    get normalizeWhatsAppTarget () {
        return _normalizetarget.normalizeWhatsAppTarget;
    }
});
const _normalizetarget = require("./normalize-target.js");

//# sourceMappingURL=normalize.js.map