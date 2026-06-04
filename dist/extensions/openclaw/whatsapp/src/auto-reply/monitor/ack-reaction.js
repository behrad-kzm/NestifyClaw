"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "maybeSendAckReaction", {
    enumerable: true,
    get: function() {
        return maybeSendAckReaction;
    }
});
const _channelfeedback = require("../../../../../../common/openclaw/plugin-sdk/channel-feedback");
const _runtimeenv = require("../../../../../../common/openclaw/plugin-sdk/runtime-env");
const _identity = require("../../identity.js");
const _reactionlevel = require("../../reaction-level.js");
const _send = require("../../send.js");
const _session = require("../../session.js");
const _ackemoji = require("./ack-emoji.js");
const _groupactivation = require("./group-activation.js");
async function maybeSendAckReaction(params) {
    if (!params.msg.id) {
        return null;
    }
    // Keep ackReaction as the emoji/scope control, while letting reactionLevel
    // suppress all automatic reactions when it is explicitly set to "off".
    const reactionLevel = (0, _reactionlevel.resolveWhatsAppReactionLevel)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    if (reactionLevel.level === "off") {
        return null;
    }
    const ackConfig = params.cfg.channels?.whatsapp?.ackReaction;
    const emoji = (0, _ackemoji.resolveWhatsAppAckEmoji)({
        cfg: params.cfg,
        agentId: params.agentId,
        ackConfig
    });
    const directEnabled = ackConfig?.direct ?? true;
    const groupMode = ackConfig?.group ?? "mentions";
    const conversationIdForCheck = params.msg.conversationId ?? params.msg.from;
    const activation = params.msg.chatType === "group" ? await (0, _groupactivation.resolveGroupActivationFor)({
        cfg: params.cfg,
        accountId: params.accountId,
        agentId: params.agentId,
        sessionKey: params.sessionKey,
        conversationId: conversationIdForCheck
    }) : null;
    const shouldSendReaction = ()=>(0, _channelfeedback.shouldAckReactionForWhatsApp)({
            emoji,
            isDirect: params.msg.chatType === "direct",
            isGroup: params.msg.chatType === "group",
            directEnabled,
            groupMode,
            wasMentioned: params.msg.wasMentioned === true,
            groupActivated: activation === "always"
        });
    if (!shouldSendReaction()) {
        return null;
    }
    params.info({
        chatId: params.msg.chatId,
        messageId: params.msg.id,
        emoji
    }, "sending ack reaction");
    const sender = (0, _identity.getSenderIdentity)(params.msg);
    const reactionOptions = {
        verbose: params.verbose,
        fromMe: false,
        ...sender.jid ? {
            participant: sender.jid
        } : {},
        ...params.accountId ? {
            accountId: params.accountId
        } : {},
        cfg: params.cfg
    };
    return (0, _channelfeedback.createAckReactionHandle)({
        ackReactionValue: emoji,
        send: ()=>(0, _send.sendReactionWhatsApp)(params.msg.chatId, params.msg.id, emoji, reactionOptions),
        remove: ()=>(0, _send.sendReactionWhatsApp)(params.msg.chatId, params.msg.id, "", reactionOptions),
        onSendError: (err)=>{
            params.warn({
                error: (0, _session.formatError)(err),
                chatId: params.msg.chatId,
                messageId: params.msg.id
            }, "failed to send ack reaction");
            (0, _runtimeenv.logVerbose)(`WhatsApp ack reaction failed for chat ${params.msg.chatId}: ${(0, _session.formatError)(err)}`);
        }
    });
}

//# sourceMappingURL=ack-reaction.js.map