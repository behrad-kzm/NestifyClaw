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
    get WhatsAppInboundMediaLimitExceededError () {
        return WhatsAppInboundMediaLimitExceededError;
    },
    get downloadInboundMedia () {
        return downloadInboundMedia;
    },
    get downloadQuotedInboundMedia () {
        return downloadQuotedInboundMedia;
    }
});
const _mediastore = require("../../../../../common/openclaw/plugin-sdk/media-store");
const _runtimeenv = require("../../../../../common/openclaw/plugin-sdk/runtime-env");
const _extract = require("./extract.js");
const _runtimeapi = require("./runtime-api.js");
let WhatsAppInboundMediaLimitExceededError = class WhatsAppInboundMediaLimitExceededError extends Error {
    constructor(maxBytes){
        super(`Media exceeds ${Math.round(maxBytes / (1024 * 1024))}MB limit`);
        this.name = "WhatsAppInboundMediaLimitExceededError";
    }
};
function unwrapMessage(message) {
    const normalized = (0, _runtimeapi.normalizeMessageContent)(message);
    return normalized;
}
/**
 * Resolve the MIME type for an inbound media message.
 * Falls back to WhatsApp's standard formats when Baileys omits the MIME.
 */ function resolveMediaMimetype(message) {
    const explicit = message.imageMessage?.mimetype ?? message.videoMessage?.mimetype ?? message.documentMessage?.mimetype ?? message.audioMessage?.mimetype ?? message.stickerMessage?.mimetype ?? undefined;
    if (explicit) {
        return explicit;
    }
    // WhatsApp voice messages (PTT) and audio use OGG Opus by default
    if (message.audioMessage) {
        return "audio/ogg; codecs=opus";
    }
    if (message.imageMessage) {
        return "image/jpeg";
    }
    if (message.videoMessage) {
        return "video/mp4";
    }
    if (message.stickerMessage) {
        return "image/webp";
    }
    return undefined;
}
async function downloadInboundMedia(msg, sock, maxBytes = 50 * 1024 * 1024) {
    const message = unwrapMessage(msg.message);
    if (!message) {
        return undefined;
    }
    const mimetype = resolveMediaMimetype(message);
    const fileName = message.documentMessage?.fileName ?? undefined;
    if (!message.imageMessage && !message.videoMessage && !message.documentMessage && !message.audioMessage && !message.stickerMessage) {
        return undefined;
    }
    try {
        const stream = await (0, _runtimeapi.downloadMediaMessage)(msg, "stream", {}, {
            reuploadRequest: sock.updateMediaMessage,
            logger: sock.logger
        });
        const saved = await (0, _mediastore.saveMediaStream)(stream, mimetype, "inbound", maxBytes, fileName).catch((err)=>{
            if (err instanceof Error && /Media exceeds/i.test(err.message)) {
                throw new WhatsAppInboundMediaLimitExceededError(maxBytes);
            }
            throw err;
        });
        return {
            saved,
            mimetype,
            fileName
        };
    } catch (err) {
        if (err instanceof WhatsAppInboundMediaLimitExceededError) {
            throw err;
        }
        (0, _runtimeenv.logVerbose)(`downloadMediaMessage failed: ${String(err)}`);
        return undefined;
    }
}
async function downloadQuotedInboundMedia(msg, sock, maxBytes = 50 * 1024 * 1024) {
    const message = unwrapMessage(msg.message);
    const contextInfo = (0, _extract.extractContextInfo)(message);
    if (!contextInfo?.quotedMessage) {
        return undefined;
    }
    const quotedMessage = contextInfo.quotedMessage;
    return downloadInboundMedia({
        key: {
            id: contextInfo?.stanzaId || undefined,
            remoteJid: contextInfo.remoteJid ?? msg.key?.remoteJid ?? undefined,
            participant: contextInfo?.participant ?? undefined,
            fromMe: false
        },
        message: quotedMessage,
        messageTimestamp: msg.messageTimestamp
    }, sock, maxBytes);
}

//# sourceMappingURL=media.js.map