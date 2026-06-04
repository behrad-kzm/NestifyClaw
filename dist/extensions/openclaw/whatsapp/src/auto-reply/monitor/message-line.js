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
    get buildInboundLine () {
        return buildInboundLine;
    },
    get formatReplyContext () {
        return formatReplyContext;
    }
});
const _identity = require("../../identity.js");
const _messagelineruntime = require("./message-line.runtime.js");
function formatReplyContext(msg) {
    const replyTo = (0, _identity.getReplyContext)(msg);
    if (!replyTo?.body) {
        return null;
    }
    const sender = replyTo.sender?.label ?? replyTo.sender?.e164 ?? "unknown sender";
    const idPart = replyTo.id ? ` id:${replyTo.id}` : "";
    return `[Replying to ${sender}${idPart}]\n${replyTo.body}\n[/Replying]`;
}
function buildInboundLine(params) {
    const { cfg, msg, agentId, previousTimestamp, envelope } = params;
    // WhatsApp inbound prefix: channels.whatsapp.messagePrefix > legacy messages.messagePrefix > identity/defaults
    const messagePrefix = (0, _messagelineruntime.resolveMessagePrefix)(cfg, agentId, {
        configured: cfg.channels?.whatsapp?.messagePrefix,
        hasAllowFrom: (cfg.channels?.whatsapp?.allowFrom?.length ?? 0) > 0
    });
    const prefixStr = messagePrefix ? `${messagePrefix} ` : "";
    const replyContext = formatReplyContext(msg);
    const baseLine = `${prefixStr}${msg.body}${replyContext ? `\n\n${replyContext}` : ""}`;
    const sender = (0, _identity.getSenderIdentity)(msg);
    // Wrap with standardized envelope for the agent.
    return (0, _messagelineruntime.formatInboundEnvelope)({
        channel: "WhatsApp",
        from: msg.chatType === "group" ? msg.from : msg.from?.replace(/^whatsapp:/, ""),
        timestamp: msg.timestamp,
        body: baseLine,
        chatType: msg.chatType,
        sender: {
            name: sender.name ?? undefined,
            e164: sender.e164 ?? undefined,
            id: (0, _identity.getPrimaryIdentityId)(sender) ?? undefined
        },
        previousTimestamp,
        envelope,
        fromMe: msg.fromMe
    });
}

//# sourceMappingURL=message-line.js.map