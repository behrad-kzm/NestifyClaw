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
    get sendMessageWhatsApp () {
        return sendMessageWhatsApp;
    },
    get sendPollWhatsApp () {
        return sendPollWhatsApp;
    },
    get sendReactionWhatsApp () {
        return sendReactionWhatsApp;
    },
    get sendTypingWhatsApp () {
        return sendTypingWhatsApp;
    }
});
const _cliruntime = require("../../../../common/openclaw/plugin-sdk/cli-runtime");
const _core = require("../../../../common/openclaw/plugin-sdk/core");
const _loggingcore = require("../../../../common/openclaw/plugin-sdk/logging-core");
const _markdowntableruntime = require("../../../../common/openclaw/plugin-sdk/markdown-table-runtime");
const _pluginconfigruntime = require("../../../../common/openclaw/plugin-sdk/plugin-config-runtime");
const _pollruntime = require("../../../../common/openclaw/plugin-sdk/poll-runtime");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _accounts = require("./accounts.js");
const _approvalreactions = require("./approval-reactions.js");
const _connectioncontrollerregistry = require("./connection-controller-registry.js");
const _documentfilename = require("./document-filename.js");
const _normalize = require("./normalize.js");
const _outboundmediacontract = require("./outbound-media-contract.js");
const _outboundmediaruntime = require("./outbound-media.runtime.js");
const _textruntime = require("./text-runtime.js");
const outboundLog = (0, _runtimeenv.createSubsystemLogger)("gateway/channels/whatsapp").child("outbound");
function supportsForcedDocumentDelivery(kind) {
    return kind === "image" || kind === "video";
}
function buildWhatsAppMediaSendState(params) {
    const { media, caption } = params;
    const forceDocumentDelivery = Boolean(params.forceDocument && supportsForcedDocumentDelivery(media.kind));
    let text = caption ?? "";
    let documentFileName = media.kind === "document" ? media.fileName : undefined;
    let visibleTextAfterVoice;
    if (media.kind === "audio" && caption) {
        visibleTextAfterVoice = caption;
        text = "";
    }
    if (forceDocumentDelivery) {
        documentFileName ??= (0, _documentfilename.resolveWhatsAppDocumentFileName)({
            fileName: media.fileName,
            mimetype: media.mimetype
        });
    }
    return {
        mediaBuffer: media.buffer,
        mediaType: media.mimetype,
        text,
        forceDocumentDelivery,
        ...documentFileName ? {
            documentFileName
        } : {},
        ...visibleTextAfterVoice ? {
            visibleTextAfterVoice
        } : {}
    };
}
function resolveOutboundWhatsAppAccountId(params) {
    const explicitAccountId = params.accountId?.trim();
    if (explicitAccountId) {
        return explicitAccountId;
    }
    return (0, _accounts.resolveDefaultWhatsAppAccountId)(params.cfg);
}
function requireOutboundActiveWebListener(params) {
    const accountId = resolveOutboundWhatsAppAccountId(params);
    const resolvedAccountId = accountId ?? (0, _accounts.resolveDefaultWhatsAppAccountId)(params.cfg);
    const listener = (0, _connectioncontrollerregistry.getRegisteredWhatsAppConnectionController)(resolvedAccountId)?.getActiveListener() ?? null;
    if (!listener) {
        throw new Error(`No active WhatsApp Web listener (account: ${resolvedAccountId}). Start the gateway, then link WhatsApp with: ${(0, _cliruntime.formatCliCommand)(`openclaw channels login --channel whatsapp --account ${resolvedAccountId}`)}.`);
    }
    return {
        accountId: resolvedAccountId,
        listener
    };
}
function resolveActualSentRemoteJid(result, fallbackJid) {
    if (!result || typeof result !== "object") {
        return fallbackJid;
    }
    const rawKeys = result.keys;
    const keys = Array.isArray(rawKeys) ? rawKeys : [];
    for (const key of keys){
        if (typeof key?.remoteJid === "string" && key.remoteJid.trim()) {
            return key.remoteJid.trim();
        }
    }
    return fallbackJid;
}
async function sendMessageWhatsApp(to, body, options) {
    let text = options.preserveLeadingWhitespace ? body : (0, _outboundmediacontract.normalizeWhatsAppPayloadText)(body);
    const jid = (0, _textruntime.toWhatsappJid)(to);
    const mediaUrls = (0, _outboundmediacontract.resolveWhatsAppOutboundMediaUrls)(options);
    const mediaPayload = options.mediaPayload;
    const primaryMediaUrl = mediaUrls[0] ?? mediaPayload?.fileName;
    const hasMedia = Boolean(mediaPayload || primaryMediaUrl);
    if (!text && !hasMedia) {
        return {
            messageId: "",
            toJid: jid
        };
    }
    const correlationId = (0, _core.generateSecureUuid)();
    const startedAt = Date.now();
    const cfg = (0, _pluginconfigruntime.requireRuntimeConfig)(options.cfg, "WhatsApp send");
    const { listener: active, accountId: resolvedAccountId } = requireOutboundActiveWebListener({
        cfg,
        accountId: options.accountId
    });
    const account = (0, _accounts.resolveWhatsAppAccount)({
        cfg,
        accountId: resolvedAccountId ?? options.accountId
    });
    const tableMode = (0, _markdowntableruntime.resolveMarkdownTableMode)({
        cfg,
        channel: "whatsapp",
        accountId: resolvedAccountId ?? options.accountId
    });
    text = (0, _markdowntableruntime.convertMarkdownTables)(text ?? "", tableMode);
    text = (0, _textruntime.markdownToWhatsApp)(text);
    const redactedTo = (0, _loggingcore.redactIdentifier)(to);
    const logger = (0, _runtimeenv.getChildLogger)({
        module: "web-outbound",
        correlationId,
        to: redactedTo
    });
    try {
        const redactedJid = (0, _loggingcore.redactIdentifier)(jid);
        let mediaBuffer;
        let mediaType;
        let documentFileName;
        let visibleTextAfterVoice;
        let forceDocumentDelivery = false;
        let media;
        if (mediaPayload) {
            media = await (0, _outboundmediacontract.prepareWhatsAppOutboundMedia)(mediaPayload, primaryMediaUrl);
        } else if (primaryMediaUrl) {
            media = await (0, _outboundmediacontract.prepareWhatsAppOutboundMedia)(await (0, _outboundmediaruntime.loadOutboundMediaFromUrl)(primaryMediaUrl, {
                maxBytes: (0, _accounts.resolveWhatsAppMediaMaxBytes)(account),
                optimizeImages: options.forceDocument ? false : undefined,
                mediaAccess: options.mediaAccess,
                mediaLocalRoots: options.mediaLocalRoots,
                mediaReadFile: options.mediaReadFile
            }), primaryMediaUrl);
        }
        if (media) {
            const mediaSendState = buildWhatsAppMediaSendState({
                media,
                caption: text || undefined,
                forceDocument: options.forceDocument
            });
            mediaBuffer = mediaSendState.mediaBuffer;
            mediaType = mediaSendState.mediaType;
            documentFileName = mediaSendState.documentFileName;
            visibleTextAfterVoice = mediaSendState.visibleTextAfterVoice;
            forceDocumentDelivery = mediaSendState.forceDocumentDelivery;
            text = mediaSendState.text;
        }
        outboundLog.info(`Sending message -> ${redactedJid}${hasMedia ? " (media)" : ""}`);
        logger.info({
            jid: redactedJid,
            hasMedia
        }, "sending message");
        if (!(0, _normalize.isWhatsAppNewsletterJid)(jid)) {
            await active.sendComposingTo(to);
        }
        const hasExplicitAccountId = Boolean(options.accountId?.trim());
        const accountId = hasExplicitAccountId ? resolvedAccountId : undefined;
        const sendOptions = options.gifPlayback || forceDocumentDelivery || accountId || documentFileName || options.quotedMessageKey ? {
            ...options.gifPlayback ? {
                gifPlayback: true
            } : {},
            ...forceDocumentDelivery ? {
                asDocument: true
            } : {},
            ...documentFileName ? {
                fileName: documentFileName
            } : {},
            ...options.quotedMessageKey ? {
                quotedMessageKey: options.quotedMessageKey
            } : {},
            accountId
        } : undefined;
        const result = sendOptions ? await active.sendMessage(to, text, mediaBuffer, mediaType, sendOptions) : await active.sendMessage(to, text, mediaBuffer, mediaType);
        if (visibleTextAfterVoice) {
            if (sendOptions) {
                await active.sendMessage(to, visibleTextAfterVoice, undefined, undefined, sendOptions);
            } else {
                await active.sendMessage(to, visibleTextAfterVoice, undefined, undefined);
            }
        }
        const messageId = result?.messageId ?? "unknown";
        const sentRemoteJid = resolveActualSentRemoteJid(result, jid);
        if (messageId && messageId !== "unknown" && text) {
            (0, _approvalreactions.registerWhatsAppApprovalReactionTargetForOutboundMessage)({
                accountId: resolvedAccountId,
                remoteJid: sentRemoteJid,
                messageId,
                text
            });
        }
        const durationMs = Date.now() - startedAt;
        outboundLog.info(`Sent message ${messageId} -> ${redactedJid}${hasMedia ? " (media)" : ""} (${durationMs}ms)`);
        logger.info({
            jid: redactedJid,
            messageId
        }, "sent message");
        return {
            messageId,
            toJid: sentRemoteJid
        };
    } catch (err) {
        logger.error({
            err: String(err),
            to: redactedTo,
            hasMedia
        }, "failed to send via web session");
        throw err;
    }
}
async function sendTypingWhatsApp(to, options) {
    const cfg = (0, _pluginconfigruntime.requireRuntimeConfig)(options.cfg, "WhatsApp typing send");
    const { listener: active } = requireOutboundActiveWebListener({
        cfg,
        accountId: options.accountId
    });
    if (!(0, _normalize.isWhatsAppNewsletterJid)((0, _textruntime.toWhatsappJid)(to))) {
        await active.sendComposingTo(to);
    }
}
async function sendReactionWhatsApp(chatJid, messageId, emoji, options) {
    const correlationId = (0, _core.generateSecureUuid)();
    const cfg = (0, _pluginconfigruntime.requireRuntimeConfig)(options.cfg, "WhatsApp reaction");
    const { listener: active } = requireOutboundActiveWebListener({
        cfg,
        accountId: options.accountId
    });
    const redactedChatJid = (0, _loggingcore.redactIdentifier)(chatJid);
    const logger = (0, _runtimeenv.getChildLogger)({
        module: "web-outbound",
        correlationId,
        chatJid: redactedChatJid,
        messageId
    });
    try {
        const jid = (0, _textruntime.toWhatsappJid)(chatJid);
        const redactedJid = (0, _loggingcore.redactIdentifier)(jid);
        outboundLog.info(`Sending reaction "${emoji}" -> message ${messageId}`);
        logger.info({
            chatJid: redactedJid,
            messageId,
            emoji
        }, "sending reaction");
        await active.sendReaction(chatJid, messageId, emoji, options.fromMe ?? false, options.participant);
        outboundLog.info(`Sent reaction "${emoji}" -> message ${messageId}`);
        logger.info({
            chatJid: redactedJid,
            messageId,
            emoji
        }, "sent reaction");
    } catch (err) {
        logger.error({
            err: String(err),
            chatJid: redactedChatJid,
            messageId,
            emoji
        }, "failed to send reaction via web session");
        throw err;
    }
}
async function sendPollWhatsApp(to, poll, options) {
    const correlationId = (0, _core.generateSecureUuid)();
    const startedAt = Date.now();
    const cfg = (0, _pluginconfigruntime.requireRuntimeConfig)(options.cfg, "WhatsApp poll");
    const { listener: active } = requireOutboundActiveWebListener({
        cfg,
        accountId: options.accountId
    });
    const redactedTo = (0, _loggingcore.redactIdentifier)(to);
    const logger = (0, _runtimeenv.getChildLogger)({
        module: "web-outbound",
        correlationId,
        to: redactedTo
    });
    try {
        const jid = (0, _textruntime.toWhatsappJid)(to);
        const redactedJid = (0, _loggingcore.redactIdentifier)(jid);
        const normalized = (0, _pollruntime.normalizePollInput)(poll, {
            maxOptions: 12
        });
        outboundLog.info(`Sending poll -> ${redactedJid}`);
        logger.info({
            jid: redactedJid,
            optionCount: normalized.options.length,
            maxSelections: normalized.maxSelections
        }, "sending poll");
        const result = await active.sendPoll(to, normalized);
        const messageId = result?.messageId ?? "unknown";
        const durationMs = Date.now() - startedAt;
        outboundLog.info(`Sent poll ${messageId} -> ${redactedJid} (${durationMs}ms)`);
        logger.info({
            jid: redactedJid,
            messageId
        }, "sent poll");
        return {
            messageId,
            toJid: jid
        };
    } catch (err) {
        logger.error({
            err: String(err),
            to: redactedTo
        }, "failed to send poll via web session");
        throw err;
    }
}

//# sourceMappingURL=send.js.map