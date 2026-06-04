"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveWhatsAppAckEmoji", {
    enumerable: true,
    get: function() {
        return resolveWhatsAppAckEmoji;
    }
});
const _agentruntime = require("../../../../../../common/openclaw/plugin-sdk/agent-runtime");
const DEFAULT_WHATSAPP_ACK_REACTION = "👀";
function resolveWhatsAppAckEmoji(params) {
    if (!params.ackConfig) {
        return "";
    }
    if (params.ackConfig.emoji !== undefined) {
        return params.ackConfig.emoji.trim();
    }
    return resolveAgentIdentityEmoji(params.cfg, params.agentId) ?? DEFAULT_WHATSAPP_ACK_REACTION;
}
function resolveAgentIdentityEmoji(cfg, agentId) {
    const emoji = (0, _agentruntime.resolveAgentIdentity)(cfg, agentId)?.emoji?.trim();
    return emoji || undefined;
}

//# sourceMappingURL=ack-emoji.js.map