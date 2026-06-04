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
    get normalizeWhatsAppOutboundPayload () {
        return normalizeWhatsAppOutboundPayload;
    },
    get normalizeWhatsAppPayloadText () {
        return normalizeWhatsAppPayloadText;
    },
    get normalizeWhatsAppPayloadTextPreservingIndentation () {
        return normalizeWhatsAppPayloadTextPreservingIndentation;
    },
    get prepareWhatsAppOutboundMedia () {
        return prepareWhatsAppOutboundMedia;
    },
    get resolveWhatsAppOutboundMediaUrls () {
        return resolveWhatsAppOutboundMediaUrls;
    },
    get sendWhatsAppOutboundWithRetry () {
        return sendWhatsAppOutboundWithRetry;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _mediaruntime = require("../../../../common/openclaw/plugin-sdk/media-runtime");
const _securityruntime = require("../../../../common/openclaw/plugin-sdk/security-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _temppath = require("../../../../common/openclaw/plugin-sdk/temp-path");
const _documentfilename = require("./document-filename.js");
const _sessionerrors = require("./session-errors.js");
const _textruntime = require("./text-runtime.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const WHATSAPP_VOICE_FILE_NAME = "voice.ogg";
const WHATSAPP_VOICE_SAMPLE_RATE_HZ = 48_000;
const WHATSAPP_VOICE_BITRATE = "64k";
const WHATSAPP_VOICE_MIMETYPE = "audio/ogg; codecs=opus";
function stripWhatsAppPluralToolXml(text) {
    return (0, _textruntime.stripToolCallXmlTags)(text, {
        stripFunctionCallsXmlPayloads: true
    });
}
function finalizeWhatsAppVisibleText(text) {
    return (0, _channeloutbound.sanitizeForPlainText)(stripWhatsAppPluralToolXml(text));
}
function normalizeWhatsAppPayloadText(text) {
    return finalizeWhatsAppVisibleText((0, _textruntime.sanitizeAssistantVisibleText)(text ?? "")).trimStart();
}
function stripLeadingBlankLines(text) {
    return text.replace(/^(?:[ \t]*\r?\n)+/, "");
}
function normalizeWhatsAppPayloadTextPreservingIndentation(text) {
    const sanitized = (0, _textruntime.sanitizeAssistantVisibleTextWithProfile)(stripLeadingBlankLines(text ?? ""), "history");
    const normalized = stripLeadingBlankLines(finalizeWhatsAppVisibleText(sanitized));
    return normalized.trim() ? normalized : "";
}
function resolveWhatsAppOutboundMediaUrls(payload) {
    const primaryMediaUrl = payload.mediaUrl?.trim();
    const mediaUrls = (payload.mediaUrls ? [
        ...payload.mediaUrls
    ] : []).map((entry)=>entry.trim()).filter((entry)=>Boolean(entry));
    const orderedMediaUrls = [
        primaryMediaUrl,
        ...mediaUrls
    ].filter((entry)=>Boolean(entry));
    return (0, _stringcoerceruntime.uniqueStrings)(orderedMediaUrls);
}
function normalizeWhatsAppOutboundPayload(payload, options) {
    const mediaUrls = resolveWhatsAppOutboundMediaUrls(payload);
    const normalizeText = options?.normalizeText ?? normalizeWhatsAppPayloadText;
    return {
        ...payload,
        text: normalizeText(payload.text),
        mediaUrl: mediaUrls[0],
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
    };
}
function inferWhatsAppMediaKind(media) {
    if (media.kind === "image" || media.kind === "audio" || media.kind === "video" || media.kind === "document") {
        return media.kind;
    }
    const contentType = normalizeContentType(media.contentType);
    if (contentType.startsWith("image/")) {
        return "image";
    }
    if (contentType.startsWith("audio/")) {
        return "audio";
    }
    if (contentType.startsWith("video/")) {
        return "video";
    }
    return "document";
}
function normalizeWhatsAppLoadedMedia(media, mediaUrl) {
    const kind = inferWhatsAppMediaKind(media);
    const mimetype = kind === "audio" && isWhatsAppNativeVoiceAudio({
        contentType: media.contentType,
        mediaUrl
    }) ? WHATSAPP_VOICE_MIMETYPE : media.contentType ?? "application/octet-stream";
    const fileName = kind === "document" ? (0, _documentfilename.resolveWhatsAppDocumentFileName)({
        fileName: media.fileName ?? deriveWhatsAppDocumentFileName(mediaUrl),
        mimetype
    }) : media.fileName;
    return {
        buffer: media.buffer,
        kind,
        mimetype,
        ...fileName ? {
            fileName
        } : {}
    };
}
async function prepareWhatsAppOutboundMedia(media, mediaUrl) {
    const normalized = normalizeWhatsAppLoadedMedia(media, mediaUrl);
    if (normalized.kind !== "audio") {
        return normalized;
    }
    if (isWhatsAppNativeVoiceAudio({
        contentType: media.contentType,
        fileName: media.fileName,
        mediaUrl
    })) {
        return normalized;
    }
    const buffer = await transcodeToWhatsAppVoiceOpus({
        buffer: media.buffer,
        fileName: media.fileName ?? deriveWhatsAppDocumentFileName(mediaUrl) ?? "audio"
    });
    return {
        buffer,
        kind: "audio",
        mimetype: WHATSAPP_VOICE_MIMETYPE
    };
}
function normalizeContentType(value) {
    return value?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}
function isWhatsAppNativeVoiceAudio(params) {
    const contentType = normalizeContentType(params.contentType);
    if (contentType === "audio/ogg" || contentType === "audio/opus") {
        return true;
    }
    const fileName = params.fileName ?? deriveWhatsAppDocumentFileName(params.mediaUrl) ?? "";
    const ext = _nodepath.default.extname(fileName).toLowerCase();
    return ext === ".ogg" || ext === ".opus";
}
async function transcodeToWhatsAppVoiceOpus(params) {
    return await (0, _temppath.withTempWorkspace)({
        rootDir: (0, _temppath.resolvePreferredOpenClawTmpDir)(),
        prefix: "whatsapp-voice-"
    }, async (workspace)=>{
        const ext = _nodepath.default.extname(params.fileName).toLowerCase();
        const inputExt = ext && ext.length <= 12 ? ext : ".audio";
        const inputPath = await workspace.write(`input${inputExt}`, params.buffer);
        await (0, _securityruntime.writeExternalFileWithinRoot)({
            rootDir: workspace.dir,
            path: WHATSAPP_VOICE_FILE_NAME,
            write: async (outputPath)=>{
                await (0, _mediaruntime.runFfmpeg)([
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-i",
                    inputPath,
                    "-vn",
                    "-sn",
                    "-dn",
                    "-t",
                    String(_mediaruntime.MEDIA_FFMPEG_MAX_AUDIO_DURATION_SECS),
                    "-ar",
                    String(WHATSAPP_VOICE_SAMPLE_RATE_HZ),
                    "-ac",
                    "1",
                    "-c:a",
                    "libopus",
                    "-b:a",
                    WHATSAPP_VOICE_BITRATE,
                    "-f",
                    "ogg",
                    outputPath
                ]);
            }
        });
        return await workspace.read(WHATSAPP_VOICE_FILE_NAME);
    });
}
function deriveWhatsAppDocumentFileName(mediaUrl) {
    if (!mediaUrl) {
        return undefined;
    }
    try {
        const parsed = new URL(mediaUrl);
        const fileName = _nodepath.default.posix.basename(parsed.pathname);
        return fileName ? decodeURIComponent(fileName) : undefined;
    } catch  {
        const withoutQueryOrFragment = mediaUrl.split(/[?#]/, 1)[0] ?? "";
        const fileName = withoutQueryOrFragment.split(/[\\/]/).pop();
        return fileName || undefined;
    }
}
function isRetryableWhatsAppOutboundError(error) {
    return /closed|reset|timed\s*out|disconnect/i.test((0, _sessionerrors.formatError)(error));
}
async function sendWhatsAppOutboundWithRetry(params) {
    const maxAttempts = params.maxAttempts ?? 3;
    let lastError;
    for(let attempt = 1; attempt <= maxAttempts; attempt += 1){
        try {
            return await params.send();
        } catch (error) {
            lastError = error;
            const errorText = (0, _sessionerrors.formatError)(error);
            const isLastAttempt = attempt === maxAttempts;
            if (!isRetryableWhatsAppOutboundError(error) || isLastAttempt) {
                throw error;
            }
            const backoffMs = 500 * attempt;
            await params.onRetry?.({
                attempt,
                maxAttempts,
                backoffMs,
                error,
                errorText
            });
            await (0, _textruntime.sleep)(backoffMs);
        }
    }
    throw lastError;
}

//# sourceMappingURL=outbound-media-contract.js.map