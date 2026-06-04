"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createWebSendApi", {
    enumerable: true,
    get: function() {
        return createWebSendApi;
    }
});
const _channelactivityruntime = require("../../../../../common/openclaw/plugin-sdk/channel-activity-runtime");
const _documentfilename = require("../document-filename.js");
const _imagepreview = require("../image-preview.js");
const _normalize = require("../normalize.js");
const _quotedmessage = require("../quoted-message.js");
const _textruntime = require("../text-runtime.js");
const _outboundmentions = require("./outbound-mentions.js");
const _sendresult = require("./send-result.js");
function recordWhatsAppOutbound(accountId) {
    (0, _channelactivityruntime.recordChannelActivity)({
        channel: "whatsapp",
        accountId,
        direction: "outbound"
    });
}
function supportsForcedDocumentMediaType(mediaType) {
    return mediaType.startsWith("image/") || mediaType.startsWith("video/");
}
function createWebSendApi(params) {
    const resolveOutboundJid = (recipient)=>params.authDir ? (0, _textruntime.toWhatsappJidWithLid)(recipient, {
            authDir: params.authDir
        }) : (0, _textruntime.toWhatsappJid)(recipient);
    const resolveMentions = async (jid, text)=>params.resolveOutboundMentions ? await params.resolveOutboundMentions({
            jid,
            text
        }) : {
            text,
            mentionedJids: []
        };
    return {
        sendMessage: async (to, text, mediaBuffer, mediaTypeInput, sendOptions)=>{
            let mediaType = mediaTypeInput;
            const jid = resolveOutboundJid(to);
            let payload;
            if (mediaBuffer) {
                mediaType ??= "application/octet-stream";
            }
            const shouldSendAudioText = Boolean(mediaBuffer && mediaType?.startsWith("audio/") && text.trim());
            const resolvedPayloadText = shouldSendAudioText ? {
                text,
                mentionedJids: []
            } : await resolveMentions(jid, text);
            if (mediaBuffer && mediaType) {
                if (sendOptions?.asDocument === true && supportsForcedDocumentMediaType(mediaType)) {
                    const fileName = (0, _documentfilename.resolveWhatsAppDocumentFileName)({
                        fileName: sendOptions?.fileName,
                        mimetype: mediaType
                    });
                    payload = {
                        document: mediaBuffer,
                        fileName,
                        caption: resolvedPayloadText.text || undefined,
                        mimetype: mediaType
                    };
                } else if (mediaType.startsWith("image/")) {
                    payload = await (0, _imagepreview.addWhatsAppImagePreviewFields)({
                        image: mediaBuffer,
                        caption: resolvedPayloadText.text || undefined,
                        mimetype: mediaType
                    });
                } else if (mediaType.startsWith("audio/")) {
                    payload = {
                        audio: mediaBuffer,
                        ptt: true,
                        mimetype: mediaType
                    };
                } else if (mediaType.startsWith("video/")) {
                    const gifPlayback = sendOptions?.gifPlayback;
                    payload = {
                        video: mediaBuffer,
                        caption: resolvedPayloadText.text || undefined,
                        mimetype: mediaType,
                        ...gifPlayback ? {
                            gifPlayback: true
                        } : {}
                    };
                } else {
                    const fileName = (0, _documentfilename.resolveWhatsAppDocumentFileName)({
                        fileName: sendOptions?.fileName,
                        mimetype: mediaType
                    });
                    payload = {
                        document: mediaBuffer,
                        fileName,
                        caption: resolvedPayloadText.text || undefined,
                        mimetype: mediaType
                    };
                }
            } else {
                payload = {
                    text: resolvedPayloadText.text
                };
            }
            payload = (0, _outboundmentions.addWhatsAppOutboundMentionsToContent)(payload, resolvedPayloadText.mentionedJids);
            const quotedOpts = (0, _quotedmessage.buildQuotedMessageOptions)({
                messageId: sendOptions?.quotedMessageKey?.id,
                remoteJid: sendOptions?.quotedMessageKey?.remoteJid,
                fromMe: sendOptions?.quotedMessageKey?.fromMe,
                participant: sendOptions?.quotedMessageKey?.participant,
                messageText: sendOptions?.quotedMessageKey?.messageText
            });
            const result = quotedOpts ? await params.sock.sendMessage(jid, payload, quotedOpts) : await params.sock.sendMessage(jid, payload);
            const results = [
                (0, _sendresult.normalizeWhatsAppSendResult)(result, mediaBuffer ? "media" : "text")
            ];
            if (shouldSendAudioText) {
                const resolvedAudioText = await resolveMentions(jid, text);
                const textPayload = (0, _outboundmentions.addWhatsAppOutboundMentionsToContent)({
                    text: resolvedAudioText.text
                }, resolvedAudioText.mentionedJids);
                const textResult = quotedOpts ? await params.sock.sendMessage(jid, textPayload, quotedOpts) : await params.sock.sendMessage(jid, textPayload);
                results.push((0, _sendresult.normalizeWhatsAppSendResult)(textResult, "text"));
            }
            const accountId = sendOptions?.accountId ?? params.defaultAccountId;
            recordWhatsAppOutbound(accountId);
            return (0, _sendresult.combineWhatsAppSendResults)(mediaBuffer ? "media" : "text", results);
        },
        sendPoll: async (to, poll)=>{
            const jid = resolveOutboundJid(to);
            const result = await params.sock.sendMessage(jid, {
                poll: {
                    name: poll.question,
                    values: poll.options,
                    selectableCount: poll.maxSelections ?? 1
                }
            });
            recordWhatsAppOutbound(params.defaultAccountId);
            return (0, _sendresult.normalizeWhatsAppSendResult)(result, "poll");
        },
        sendReaction: async (chatJid, messageId, emoji, fromMe, participant)=>{
            // Resolve DM targets through the same LID-aware path as normal sends so
            // reactions land on the delivered WhatsApp message key.
            const jid = resolveOutboundJid(chatJid);
            const result = await params.sock.sendMessage(jid, {
                react: {
                    text: emoji,
                    key: {
                        remoteJid: jid,
                        id: messageId,
                        fromMe,
                        participant: participant ? (0, _textruntime.toWhatsappJid)(participant) : undefined
                    }
                }
            });
            return (0, _sendresult.normalizeWhatsAppSendResult)(result, "reaction");
        },
        sendComposingTo: async (to)=>{
            const jid = resolveOutboundJid(to);
            if ((0, _normalize.isWhatsAppNewsletterJid)(jid)) {
                return;
            }
            await params.sock.sendPresenceUpdate("composing", jid);
        }
    };
}

//# sourceMappingURL=send-api.js.map