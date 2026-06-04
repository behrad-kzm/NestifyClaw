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
    get resolveVisibleWhatsAppGroupHistory () {
        return resolveVisibleWhatsAppGroupHistory;
    },
    get resolveVisibleWhatsAppReplyContext () {
        return resolveVisibleWhatsAppReplyContext;
    }
});
const _channelinbound = require("../../../../../../common/openclaw/plugin-sdk/channel-inbound");
const _securityruntime = require("../../../../../../common/openclaw/plugin-sdk/security-runtime");
const _identity = require("../../identity.js");
const _textruntime = require("../../text-runtime.js");
function isWhatsAppSupplementalSenderAllowed(params) {
    if (params.allowFrom.includes("*")) {
        return true;
    }
    const senderValues = new Set((0, _identity.getComparableIdentityValues)(params.sender));
    if (senderValues.size === 0) {
        return false;
    }
    for (const entry of params.allowFrom){
        const rawEntry = entry.trim();
        if (!rawEntry) {
            continue;
        }
        const normalizedEntry = (0, _textruntime.normalizeE164)(rawEntry);
        if (normalizedEntry && senderValues.has(normalizedEntry) || senderValues.has(rawEntry)) {
            return true;
        }
    }
    return false;
}
function resolveVisibleWhatsAppGroupHistory(params) {
    if (params.groupPolicy !== "allowlist") {
        return params.history;
    }
    return (0, _securityruntime.filterSupplementalContextItems)({
        items: params.history,
        mode: params.mode,
        kind: "history",
        isSenderAllowed: (entry)=>isWhatsAppSupplementalSenderAllowed({
                allowFrom: params.groupAllowFrom,
                sender: entry.senderJid ? {
                    jid: entry.senderJid
                } : null
            })
    }).items;
}
function resolveVisibleWhatsAppReplyContext(params) {
    const replyTo = (0, _identity.getReplyContext)(params.msg, params.authDir);
    if (!replyTo) {
        return null;
    }
    const senderAllowed = params.msg.chatType !== "group" || params.groupPolicy !== "allowlist" ? true : isWhatsAppSupplementalSenderAllowed({
        allowFrom: params.groupAllowFrom,
        sender: replyTo.sender
    });
    const visible = (0, _channelinbound.filterChannelInboundQuoteContext)(params.mode, {
        id: replyTo.id,
        body: replyTo.body,
        sender: replyTo.sender?.label ?? undefined,
        senderAllowed
    });
    return visible ? replyTo : null;
}

//# sourceMappingURL=inbound-context.js.map