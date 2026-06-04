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
    get normalizeWhatsAppChannelPayloadText () {
        return normalizeWhatsAppChannelPayloadText;
    },
    get whatsappChannelOutbound () {
        return whatsappChannelOutbound;
    },
    get whatsappMessageAdapter () {
        return whatsappMessageAdapter;
    }
});
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _replychunking = require("../../../../common/openclaw/plugin-sdk/reply-chunking");
const _outboundbase = require("./outbound-base.js");
const _outboundmediacontract = require("./outbound-media-contract.js");
const _resolveoutboundtarget = require("./resolve-outbound-target.js");
const _runtime = require("./runtime.js");
const _send = require("./send.js");
function normalizeWhatsAppChannelPayloadText(text) {
    return (0, _outboundmediacontract.normalizeWhatsAppPayloadTextPreservingIndentation)(text);
}
function normalizeWhatsAppChannelSendText(text) {
    const normalized = normalizeWhatsAppChannelPayloadText(text);
    return normalized.trim() ? normalized : "";
}
const whatsappChannelOutbound = {
    ...(0, _outboundbase.createWhatsAppOutboundBase)({
        chunker: _replychunking.chunkText,
        sendMessageWhatsApp: async (to, text, options)=>await (0, _send.sendMessageWhatsApp)(to, text, {
                ...options,
                preserveLeadingWhitespace: true
            }),
        sendPollWhatsApp: _send.sendPollWhatsApp,
        shouldLogVerbose: ()=>(0, _runtime.getWhatsAppRuntime)().logging.shouldLogVerbose(),
        resolveTarget: ({ to, allowFrom, mode })=>(0, _resolveoutboundtarget.resolveWhatsAppOutboundTarget)({
                to,
                allowFrom,
                mode
            }),
        normalizeText: normalizeWhatsAppChannelSendText
    }),
    sendTextOnlyErrorPayloads: true,
    normalizePayload: ({ payload })=>({
            ...payload,
            text: normalizeWhatsAppChannelPayloadText(payload.text)
        })
};
function toWhatsAppMessageSendResult(result, replyToId) {
    const source = result;
    const receipt = result.receipt ?? (0, _channeloutbound.createMessageReceiptFromOutboundResults)({
        results: result.messageId ? [
            {
                channel: "whatsapp",
                messageId: result.messageId,
                toJid: source.toJid
            }
        ] : [],
        kind: "text",
        ...replyToId ? {
            replyToId
        } : {}
    });
    return {
        messageId: result.messageId || receipt.primaryPlatformMessageId,
        receipt
    };
}
const whatsappMessageAdapter = (0, _channeloutbound.defineChannelMessageAdapter)({
    id: "whatsapp",
    durableFinal: {
        capabilities: {
            text: true,
            replyTo: true,
            messageSendingHooks: true
        }
    },
    send: {
        text: async (ctx)=>toWhatsAppMessageSendResult(await whatsappChannelOutbound.sendText({
                ...ctx
            }), ctx.replyToId)
    }
});

//# sourceMappingURL=channel-outbound.js.map