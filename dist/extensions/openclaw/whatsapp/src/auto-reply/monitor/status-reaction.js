"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createWhatsAppStatusReactionController", {
    enumerable: true,
    get: function() {
        return createWhatsAppStatusReactionController;
    }
});
const _channelfeedback = require("../../../../../../common/openclaw/plugin-sdk/channel-feedback");
const _runtimeenv = require("../../../../../../common/openclaw/plugin-sdk/runtime-env");
const _identity = require("../../identity.js");
const _reactionlevel = require("../../reaction-level.js");
const _send = require("../../send.js");
const _ackemoji = require("./ack-emoji.js");
const _groupactivation = require("./group-activation.js");
async function createWhatsAppStatusReactionController(params) {
    if (!params.msg.id) {
        return null;
    }
    const statusReactionsConfig = params.cfg.messages?.statusReactions;
    if (statusReactionsConfig?.enabled !== true) {
        return null;
    }
    const reactionLevel = (0, _reactionlevel.resolveWhatsAppReactionLevel)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    if (reactionLevel.level === "off") {
        return null;
    }
    const ackConfig = params.cfg.channels?.whatsapp?.ackReaction;
    const ackEmoji = (0, _ackemoji.resolveWhatsAppAckEmoji)({
        cfg: params.cfg,
        agentId: params.agentId,
        ackConfig
    });
    if (!ackEmoji) {
        return null;
    }
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
    const shouldUseStatusReaction = (0, _channelfeedback.shouldAckReactionForWhatsApp)({
        emoji: ackEmoji,
        isDirect: params.msg.chatType === "direct",
        isGroup: params.msg.chatType === "group",
        directEnabled,
        groupMode,
        wasMentioned: params.msg.wasMentioned === true,
        groupActivated: activation === "always"
    });
    if (!shouldUseStatusReaction) {
        return null;
    }
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
    const chatId = params.msg.chatId;
    const msgId = params.msg.id;
    return (0, _channelfeedback.createStatusReactionController)({
        enabled: true,
        adapter: {
            setReaction: async (emoji)=>{
                await (0, _send.sendReactionWhatsApp)(chatId, msgId, emoji, reactionOptions);
            },
            clearReaction: async ()=>{
                await (0, _send.sendReactionWhatsApp)(chatId, msgId, "", reactionOptions);
            }
        },
        initialEmoji: ackEmoji,
        emojis: statusReactionsConfig.emojis,
        timing: statusReactionsConfig.timing,
        onError: (err)=>{
            (0, _runtimeenv.logVerbose)(`WhatsApp status-reaction error for chat ${chatId}/${msgId}: ${String(err)}`);
        }
    });
}

//# sourceMappingURL=status-reaction.js.map