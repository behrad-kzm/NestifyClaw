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
    get handleWhatsAppAction () {
        return handleWhatsAppAction;
    },
    get whatsAppActionRuntime () {
        return whatsAppActionRuntime;
    }
});
const _channelactions = require("../../../../common/openclaw/plugin-sdk/channel-actions");
const _actionruntimetargetauth = require("./action-runtime-target-auth.js");
const _reactionlevel = require("./reaction-level.js");
const _send = require("./send.js");
const whatsAppActionRuntime = {
    resolveAuthorizedWhatsAppOutboundTarget: _actionruntimetargetauth.resolveAuthorizedWhatsAppOutboundTarget,
    sendReactionWhatsApp: _send.sendReactionWhatsApp
};
async function handleWhatsAppAction(params, cfg) {
    const action = (0, _channelactions.readStringParam)(params, "action", {
        required: true
    });
    const whatsAppConfig = cfg.channels?.whatsapp;
    const isActionEnabled = (0, _channelactions.createActionGate)(whatsAppConfig?.actions);
    if (action === "react") {
        const accountId = (0, _channelactions.readStringParam)(params, "accountId");
        if (!whatsAppConfig) {
            throw new Error("WhatsApp reactions are disabled.");
        }
        if (!isActionEnabled("reactions")) {
            throw new Error("WhatsApp reactions are disabled.");
        }
        const reactionLevelInfo = (0, _reactionlevel.resolveWhatsAppReactionLevel)({
            cfg,
            accountId: accountId ?? undefined
        });
        if (!reactionLevelInfo.agentReactionsEnabled) {
            throw new Error(`WhatsApp agent reactions disabled (reactionLevel="${reactionLevelInfo.level}"). ` + `Set channels.whatsapp.reactionLevel to "minimal" or "extensive" to enable.`);
        }
        const chatJid = (0, _channelactions.readStringParam)(params, "chatJid", {
            required: true
        });
        const messageId = (0, _channelactions.readStringParam)(params, "messageId", {
            required: true
        });
        const { emoji, remove, isEmpty } = (0, _channelactions.readReactionParams)(params, {
            removeErrorMessage: "Emoji is required to remove a WhatsApp reaction."
        });
        const participant = (0, _channelactions.readStringParam)(params, "participant");
        const fromMeRaw = params.fromMe;
        const fromMe = typeof fromMeRaw === "boolean" ? fromMeRaw : undefined;
        // Resolve account + allowFrom via shared account logic so auth and routing stay aligned.
        const resolved = whatsAppActionRuntime.resolveAuthorizedWhatsAppOutboundTarget({
            cfg,
            chatJid,
            accountId,
            actionLabel: "reaction"
        });
        const resolvedEmoji = remove ? "" : emoji;
        await whatsAppActionRuntime.sendReactionWhatsApp(resolved.to, messageId, resolvedEmoji, {
            verbose: false,
            fromMe,
            participant: participant ?? undefined,
            accountId: resolved.accountId,
            cfg
        });
        if (!remove && !isEmpty) {
            return (0, _channelactions.jsonResult)({
                ok: true,
                added: emoji
            });
        }
        return (0, _channelactions.jsonResult)({
            ok: true,
            removed: true
        });
    }
    throw new Error(`Unsupported WhatsApp action: ${action}`);
}

//# sourceMappingURL=action-runtime.js.map