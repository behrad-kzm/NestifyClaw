"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveWhatsAppOutboundSessionRoute", {
    enumerable: true,
    get: function() {
        return resolveWhatsAppOutboundSessionRoute;
    }
});
const _core = require("../../../../common/openclaw/plugin-sdk/core");
const _normalize = require("./normalize.js");
function resolveWhatsAppOutboundSessionRoute(params) {
    const normalized = (0, _normalize.normalizeWhatsAppTarget)(params.target);
    if (!normalized) {
        return null;
    }
    const isGroup = (0, _normalize.isWhatsAppGroupJid)(normalized);
    const isNewsletter = (0, _normalize.isWhatsAppNewsletterJid)(normalized);
    const chatType = isGroup ? "group" : isNewsletter ? "channel" : "direct";
    return (0, _core.buildChannelOutboundSessionRoute)({
        cfg: params.cfg,
        agentId: params.agentId,
        channel: "whatsapp",
        accountId: params.accountId,
        peer: {
            kind: chatType,
            id: normalized
        },
        chatType,
        from: normalized,
        to: normalized
    });
}

//# sourceMappingURL=session-route.js.map