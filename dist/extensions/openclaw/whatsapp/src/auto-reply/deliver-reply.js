"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "deliverWebReply", {
    enumerable: true,
    get: function() {
        return deliverWebReply;
    }
});
const _channeloutbound = require("../../../../../common/openclaw/plugin-sdk/channel-outbound");
const _replychunking = require("../../../../../common/openclaw/plugin-sdk/reply-chunking");
const _replypayload = require("../../../../../common/openclaw/plugin-sdk/reply-payload");
const _runtimeenv = require("../../../../../common/openclaw/plugin-sdk/runtime-env");
const _sendresult = require("../inbound/send-result.js");
const _media = require("../media.js");
const _outboundmediacontract = require("../outbound-media-contract.js");
const _quotedmessage = require("../quoted-message.js");
const _reconnect = require("../reconnect.js");
const _session = require("../session.js");
const _textruntime = require("../text-runtime.js");
const _loggers = require("./loggers.js");
const _util = require("./util.js");
function resolveWhatsAppReceiptKind(results) {
    if (results.length > 0 && results.every((result)=>result.kind === "text")) {
        return "text";
    }
    if (results.length > 0 && results.every((result)=>result.kind === "media")) {
        return "media";
    }
    return "unknown";
}
function createWhatsAppReplyDeliveryReceipt(results) {
    const receiptResultsById = new Map();
    for (const result of results){
        if (result.receipt?.parts.length) {
            for (const part of result.receipt.parts){
                receiptResultsById.set(part.platformMessageId, {
                    ...part.raw ?? {
                        channel: "whatsapp",
                        messageId: part.platformMessageId
                    },
                    meta: {
                        ...part.raw?.meta,
                        kind: result.kind,
                        providerAccepted: result.providerAccepted
                    }
                });
            }
            continue;
        }
        for (const messageId of (0, _sendresult.listWhatsAppSendResultMessageIds)(result)){
            receiptResultsById.set(messageId, {
                channel: "whatsapp",
                messageId,
                meta: {
                    kind: result.kind,
                    providerAccepted: result.providerAccepted
                }
            });
        }
    }
    return (0, _channeloutbound.createMessageReceiptFromOutboundResults)({
        results: [
            ...receiptResultsById.values()
        ],
        kind: resolveWhatsAppReceiptKind(results)
    });
}
function markWhatsAppVisibleDeliveryError(error) {
    if (typeof error === "object" && error !== null && !Array.isArray(error)) {
        try {
            Object.assign(error, {
                sentBeforeError: true,
                visibleReplySent: true
            });
            return error;
        } catch  {
        // Fall back to a wrapper when a platform error object is non-extensible.
        }
    }
    const visibleError = new Error("visible WhatsApp reply delivery failed", {
        cause: error
    });
    Object.assign(visibleError, {
        sentBeforeError: true,
        visibleReplySent: true
    });
    return visibleError;
}
async function deliverWebReply(params) {
    const { replyResult, msg, maxMediaBytes, textLimit, replyLogger, connectionId, skipLog } = params;
    const replyStarted = Date.now();
    const sendResults = [];
    const rememberSendResult = (result)=>{
        if (result) {
            sendResults.push(result);
        }
    };
    const finishDelivery = ()=>{
        const receipt = createWhatsAppReplyDeliveryReceipt(sendResults);
        return {
            results: sendResults,
            receipt,
            providerAccepted: sendResults.some((result)=>result.providerAccepted)
        };
    };
    if ((0, _replypayload.isReasoningReplyPayload)(replyResult)) {
        _loggers.whatsappOutboundLog.debug(`Suppressed reasoning payload to ${msg.from}`);
        return finishDelivery();
    }
    const tableMode = params.tableMode ?? "code";
    const chunkMode = params.chunkMode ?? "length";
    const normalizedReply = params.normalizedReplyResult ?? (0, _outboundmediacontract.normalizeWhatsAppOutboundPayload)(replyResult, {
        normalizeText: _outboundmediacontract.normalizeWhatsAppPayloadTextPreservingIndentation
    });
    const convertedText = (0, _textruntime.markdownToWhatsApp)((0, _textruntime.convertMarkdownTables)(normalizedReply.text ?? "", tableMode));
    const textChunks = (0, _replychunking.chunkMarkdownTextWithMode)(convertedText, textLimit, chunkMode);
    const mediaList = normalizedReply.mediaUrls ?? [];
    const getQuote = ()=>{
        if (!replyResult.replyToId) {
            return undefined;
        }
        // Use replyToId (not msg.id) so batched payloads quote the correct
        // per-message target.  Look up cached metadata for the specific
        // message being quoted — msg.body may be a combined batch body.
        const cached = (0, _quotedmessage.lookupInboundMessageMeta)(msg.accountId, msg.chatId, replyResult.replyToId);
        return (0, _quotedmessage.buildQuotedMessageOptions)({
            messageId: replyResult.replyToId,
            remoteJid: msg.chatId,
            fromMe: cached?.fromMe ?? false,
            participant: cached?.participant ?? (msg.chatType === "group" ? msg.senderJid : undefined),
            messageText: cached?.body ?? ""
        });
    };
    const sendWithRetry = async (fn, label, maxAttempts = 3)=>{
        try {
            return await (0, _outboundmediacontract.sendWhatsAppOutboundWithRetry)({
                send: fn,
                maxAttempts,
                onRetry: ({ attempt, maxAttempts: retryMaxAttempts, backoffMs, errorText })=>{
                    (0, _runtimeenv.logVerbose)(`Retrying ${label} to ${msg.from} after failure (${attempt}/${retryMaxAttempts - 1}) in ${backoffMs}ms: ${errorText}`);
                }
            });
        } catch (error) {
            if (sendResults.some((result)=>result.providerAccepted)) {
                throw markWhatsAppVisibleDeliveryError(error);
            }
            throw error;
        }
    };
    // Text-only replies
    if (mediaList.length === 0 && textChunks.length) {
        const totalChunks = textChunks.length;
        for (const [index, chunk] of textChunks.entries()){
            const chunkStarted = Date.now();
            const quote = getQuote();
            rememberSendResult(await sendWithRetry(()=>msg.reply(chunk, quote), "text"));
            if (!skipLog) {
                const durationMs = Date.now() - chunkStarted;
                _loggers.whatsappOutboundLog.debug(`Sent chunk ${index + 1}/${totalChunks} to ${msg.from} (${durationMs.toFixed(0)}ms)`);
            }
        }
        const delivery = finishDelivery();
        const logPayload = {
            correlationId: msg.id ?? (0, _reconnect.newConnectionId)(),
            connectionId: connectionId ?? null,
            to: msg.from,
            from: msg.to,
            text: (0, _util.elide)(replyResult.text, 240),
            mediaUrl: null,
            mediaSizeBytes: null,
            mediaKind: null,
            durationMs: Date.now() - replyStarted
        };
        if (delivery.providerAccepted) {
            replyLogger.info(logPayload, "auto-reply sent (text)");
        } else {
            replyLogger.warn(logPayload, "auto-reply text was not accepted by WhatsApp provider");
        }
        return delivery;
    }
    const remainingText = [
        ...textChunks
    ];
    // Media (with optional caption on first item)
    const leadingCaption = remainingText.shift() || "";
    await (0, _replypayload.sendMediaWithLeadingCaption)({
        mediaUrls: mediaList,
        caption: leadingCaption,
        send: async ({ mediaUrl, caption })=>{
            const media = await (0, _outboundmediacontract.prepareWhatsAppOutboundMedia)(await (0, _media.loadWebMedia)(mediaUrl, {
                maxBytes: maxMediaBytes,
                localRoots: params.mediaLocalRoots
            }), mediaUrl);
            if ((0, _runtimeenv.shouldLogVerbose)()) {
                (0, _runtimeenv.logVerbose)(`Web auto-reply media size: ${(media.buffer.length / (1024 * 1024)).toFixed(2)}MB`);
                (0, _runtimeenv.logVerbose)(`Web auto-reply media source: ${mediaUrl} (kind ${media.kind})`);
            }
            if (media.kind === "image") {
                const quote = getQuote();
                rememberSendResult(await sendWithRetry(()=>msg.sendMedia({
                        image: media.buffer,
                        caption,
                        mimetype: media.mimetype
                    }, quote), "media:image"));
            } else if (media.kind === "audio") {
                const quote = getQuote();
                rememberSendResult(await sendWithRetry(()=>msg.sendMedia({
                        audio: media.buffer,
                        ptt: true,
                        mimetype: media.mimetype
                    }, quote), "media:audio"));
                if (caption) {
                    rememberSendResult(await sendWithRetry(()=>msg.reply(caption, quote), "media:audio-text"));
                }
            } else if (media.kind === "video") {
                const quote = getQuote();
                rememberSendResult(await sendWithRetry(()=>msg.sendMedia({
                        video: media.buffer,
                        caption,
                        mimetype: media.mimetype
                    }, quote), "media:video"));
            } else {
                const quote = getQuote();
                rememberSendResult(await sendWithRetry(()=>msg.sendMedia({
                        document: media.buffer,
                        fileName: media.fileName,
                        caption,
                        mimetype: media.mimetype
                    }, quote), "media:document"));
            }
            _loggers.whatsappOutboundLog.info(`Sent media reply to ${msg.from} (${(media.buffer.length / (1024 * 1024)).toFixed(2)}MB)`);
            replyLogger.info({
                correlationId: msg.id ?? (0, _reconnect.newConnectionId)(),
                connectionId: connectionId ?? null,
                to: msg.from,
                from: msg.to,
                text: caption ?? null,
                mediaUrl,
                mediaSizeBytes: media.buffer.length,
                mediaKind: media.kind,
                durationMs: Date.now() - replyStarted
            }, "auto-reply sent (media)");
        },
        onError: async ({ error, mediaUrl, caption, isFirst })=>{
            _loggers.whatsappOutboundLog.error(`Failed sending web media to ${msg.from}: ${(0, _session.formatError)(error)}`);
            replyLogger.warn({
                err: error,
                mediaUrl
            }, "failed to send web media reply");
            if (!isFirst) {
                return;
            }
            const warning = "⚠️ Media failed.";
            const fallbackTextParts = [
                remainingText.shift() ?? caption ?? "",
                warning
            ].filter(Boolean);
            const fallbackText = fallbackTextParts.join("\n");
            if (!fallbackText) {
                return;
            }
            _loggers.whatsappOutboundLog.warn(`Media skipped; sent text-only to ${msg.from}`);
            rememberSendResult(await sendWithRetry(()=>msg.reply(fallbackText, getQuote()), "media:fallback-text"));
        }
    });
    // Remaining text chunks after media
    for (const chunk of remainingText){
        rememberSendResult(await sendWithRetry(()=>msg.reply(chunk, getQuote()), "media:text"));
    }
    return finishDelivery();
}

//# sourceMappingURL=deliver-reply.js.map