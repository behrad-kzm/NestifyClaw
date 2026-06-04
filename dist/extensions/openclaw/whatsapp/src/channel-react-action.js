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
    get handleWhatsAppMessageAction () {
        return handleWhatsAppMessageAction;
    },
    get handleWhatsAppReactAction () {
        return handleWhatsAppReactAction;
    }
});
const _channelactions = require("../../../../common/openclaw/plugin-sdk/channel-actions");
const _channelreactactionruntime = require("./channel-react-action.runtime.js");
const WHATSAPP_CHANNEL = "whatsapp";
function readUploadFileMediaSource(args) {
    return (0, _channelreactactionruntime.readStringParam)(args, "media", {
        trim: false
    }) ?? (0, _channelreactactionruntime.readStringParam)(args, "mediaUrl", {
        trim: false
    }) ?? (0, _channelreactactionruntime.readStringParam)(args, "filePath", {
        trim: false
    }) ?? (0, _channelreactactionruntime.readStringParam)(args, "path", {
        trim: false
    }) ?? (0, _channelreactactionruntime.readStringParam)(args, "fileUrl", {
        trim: false
    });
}
function readUploadFileCaptionText(args) {
    return (0, _channelreactactionruntime.readStringParam)(args, "message", {
        allowEmpty: true
    }) ?? (0, _channelreactactionruntime.readStringParam)(args, "content", {
        allowEmpty: true
    }) ?? (0, _channelreactactionruntime.readStringParam)(args, "caption", {
        allowEmpty: true
    }) ?? "";
}
function readBooleanParam(args, key) {
    const value = args[key];
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value !== "string") {
        return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
        return true;
    }
    if (normalized === "false") {
        return false;
    }
    return undefined;
}
function hasUploadFileBufferPayload(args) {
    return (0, _channelreactactionruntime.readStringParam)(args, "buffer", {
        trim: false
    }) !== undefined;
}
function extractBase64Payload(encoded) {
    const match = /^data:[^;]+;base64,(.*)$/i.exec(encoded.trim());
    return match ? match[1] : encoded;
}
function estimateBase64DecodedBytes(encoded) {
    const compact = extractBase64Payload(encoded).replace(/\s/g, "");
    if (!compact) {
        return 0;
    }
    const padding = compact.endsWith("==") ? 2 : compact.endsWith("=") ? 1 : 0;
    return Math.max(0, Math.floor(compact.length * 3 / 4) - padding);
}
function decodeUploadFileMediaPayload(params) {
    if (params.maxBytes !== undefined) {
        const estimatedBytes = estimateBase64DecodedBytes(params.encoded);
        if (estimatedBytes > params.maxBytes) {
            throw new Error(`WhatsApp upload-file buffer exceeds configured media limit (${estimatedBytes} bytes > ${params.maxBytes} bytes).`);
        }
    }
    const contentType = (0, _channelreactactionruntime.readStringParam)(params.args, "contentType") ?? (0, _channelreactactionruntime.readStringParam)(params.args, "mimeType");
    const fileName = (0, _channelreactactionruntime.readStringParam)(params.args, "filename") ?? (0, _channelreactactionruntime.readStringParam)(params.args, "fileName");
    const buffer = Buffer.from(extractBase64Payload(params.encoded), "base64");
    if (params.maxBytes !== undefined && buffer.byteLength > params.maxBytes) {
        throw new Error(`WhatsApp upload-file buffer exceeds configured media limit (${buffer.byteLength} bytes > ${params.maxBytes} bytes).`);
    }
    return {
        buffer,
        ...contentType ? {
            contentType
        } : {},
        ...fileName ? {
            fileName
        } : {}
    };
}
async function handleWhatsAppUploadFileAction(params) {
    const mediaUrl = readUploadFileMediaSource(params.params);
    const encodedPayload = (0, _channelreactactionruntime.readStringParam)(params.params, "buffer", {
        trim: false
    });
    if (!mediaUrl && !hasUploadFileBufferPayload(params.params)) {
        throw new Error("WhatsApp upload-file requires media, mediaUrl, filePath, path, fileUrl, or buffer.");
    }
    const to = (0, _channelreactactionruntime.readStringParam)(params.params, "to", {
        required: true
    });
    const resolved = (0, _channelreactactionruntime.resolveAuthorizedWhatsAppOutboundTarget)({
        cfg: params.cfg,
        chatJid: to,
        accountId: params.accountId ?? undefined,
        actionLabel: "upload-file"
    });
    const account = (0, _channelreactactionruntime.resolveWhatsAppAccount)({
        cfg: params.cfg,
        accountId: resolved.accountId
    });
    const mediaPayload = encodedPayload ? decodeUploadFileMediaPayload({
        args: params.params,
        encoded: encodedPayload,
        maxBytes: (0, _channelreactactionruntime.resolveWhatsAppMediaMaxBytes)(account)
    }) : undefined;
    const result = await (0, _channelreactactionruntime.sendMessageWhatsApp)(resolved.to, readUploadFileCaptionText(params.params), {
        verbose: false,
        cfg: params.cfg,
        ...mediaUrl && !mediaPayload ? {
            mediaUrl
        } : {},
        ...mediaPayload ? {
            mediaPayload
        } : {},
        mediaAccess: params.mediaAccess,
        mediaLocalRoots: params.mediaLocalRoots,
        mediaReadFile: params.mediaReadFile,
        gifPlayback: readBooleanParam(params.params, "gifPlayback") ?? undefined,
        audioAsVoice: readBooleanParam(params.params, "asVoice") ?? readBooleanParam(params.params, "audioAsVoice") ?? undefined,
        forceDocument: readBooleanParam(params.params, "forceDocument") ?? readBooleanParam(params.params, "asDocument") ?? undefined,
        accountId: resolved.accountId
    });
    return (0, _channelactions.jsonResult)({
        ok: true,
        channel: WHATSAPP_CHANNEL,
        action: "upload-file",
        messageId: result.messageId,
        toJid: result.toJid
    });
}
async function handleWhatsAppMessageAction(params) {
    if (params.action === "upload-file") {
        return await handleWhatsAppUploadFileAction(params);
    }
    if (params.action !== "react") {
        throw new Error(`Action ${params.action} is not supported for provider ${WHATSAPP_CHANNEL}.`);
    }
    const isWhatsAppSource = params.toolContext?.currentChannelProvider === WHATSAPP_CHANNEL;
    const explicitTarget = (0, _channelreactactionruntime.readStringParam)(params.params, "chatJid") ?? (0, _channelreactactionruntime.readStringParam)(params.params, "to");
    const normalizedTarget = explicitTarget ? (0, _channelreactactionruntime.normalizeWhatsAppTarget)(explicitTarget) : null;
    const normalizedCurrent = isWhatsAppSource && params.toolContext?.currentChannelId ? (0, _channelreactactionruntime.normalizeWhatsAppTarget)(params.toolContext.currentChannelId) : null;
    const isCrossChat = normalizedTarget != null && (normalizedCurrent == null || normalizedTarget !== normalizedCurrent);
    const scopedContext = !isWhatsAppSource || isCrossChat || !params.toolContext ? undefined : {
        currentChannelId: params.toolContext.currentChannelId ?? undefined,
        currentChannelProvider: params.toolContext.currentChannelProvider ?? undefined,
        currentMessageId: params.toolContext.currentMessageId ?? undefined
    };
    const messageIdRaw = (0, _channelreactactionruntime.resolveReactionMessageId)({
        args: params.params,
        toolContext: scopedContext
    });
    if (messageIdRaw == null) {
        (0, _channelreactactionruntime.readStringParam)(params.params, "messageId", {
            required: true
        });
    }
    const messageId = String(messageIdRaw);
    const explicitMessageId = (0, _channelreactactionruntime.readStringOrNumberParam)(params.params, "messageId");
    const emoji = (0, _channelreactactionruntime.readStringParam)(params.params, "emoji", {
        allowEmpty: true
    });
    const remove = typeof params.params.remove === "boolean" ? params.params.remove : undefined;
    const explicitParticipant = (0, _channelreactactionruntime.readStringParam)(params.params, "participant");
    const inferredParticipant = explicitParticipant || explicitMessageId != null || !isWhatsAppSource || isCrossChat || !(0, _channelreactactionruntime.isWhatsAppGroupJid)(explicitTarget ?? params.toolContext?.currentChannelId ?? "") ? undefined : typeof params.requesterSenderId === "string" && params.requesterSenderId.trim().length > 0 ? params.requesterSenderId.trim() : undefined;
    return await (0, _channelreactactionruntime.handleWhatsAppAction)({
        action: "react",
        chatJid: (0, _channelreactactionruntime.readStringParam)(params.params, "chatJid") ?? (0, _channelreactactionruntime.readStringParam)(params.params, "to", {
            required: true
        }),
        messageId,
        emoji,
        remove,
        participant: explicitParticipant ?? inferredParticipant,
        accountId: params.accountId ?? undefined,
        fromMe: typeof params.params.fromMe === "boolean" ? params.params.fromMe : undefined
    }, params.cfg);
}
const handleWhatsAppReactAction = handleWhatsAppMessageAction;

//# sourceMappingURL=channel-react-action.js.map