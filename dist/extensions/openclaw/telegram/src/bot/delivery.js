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
    get deliverReplies () {
        return _deliveryreplies.deliverReplies;
    },
    get emitInternalMessageSentHook () {
        return _deliveryreplies.emitInternalMessageSentHook;
    },
    get emitTelegramMessageSentHooks () {
        return _deliveryreplies.emitTelegramMessageSentHooks;
    },
    get resolveMedia () {
        return _deliveryresolvemedia.resolveMedia;
    }
});
const _deliveryreplies = require("./delivery.replies.js");
const _deliveryresolvemedia = require("./delivery.resolve-media.js");

//# sourceMappingURL=delivery.js.map