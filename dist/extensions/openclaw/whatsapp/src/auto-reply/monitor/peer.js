"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolvePeerId", {
    enumerable: true,
    get: function() {
        return resolvePeerId;
    }
});
const _identity = require("../../identity.js");
const _textruntime = require("../../text-runtime.js");
function resolvePeerId(msg) {
    if (msg.chatType === "group") {
        return msg.conversationId ?? msg.from;
    }
    const sender = (0, _identity.getSenderIdentity)(msg);
    if (sender.e164) {
        return (0, _textruntime.normalizeE164)(sender.e164) ?? sender.e164;
    }
    if (msg.from.includes("@")) {
        return (0, _textruntime.jidToE164)(msg.from) ?? msg.from;
    }
    return (0, _textruntime.normalizeE164)(msg.from) ?? msg.from;
}

//# sourceMappingURL=peer.js.map