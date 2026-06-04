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
    get describeReplyContext () {
        return describeReplyContext;
    },
    get extractContactContext () {
        return extractContactContext;
    },
    get extractContextInfo () {
        return extractContextInfo;
    },
    get extractLocationData () {
        return extractLocationData;
    },
    get extractMediaPlaceholder () {
        return extractMediaPlaceholder;
    },
    get extractMentionedJids () {
        return extractMentionedJids;
    },
    get extractText () {
        return extractText;
    },
    get hasInboundUserContent () {
        return hasInboundUserContent;
    }
});
const _baileys = require("baileys");
const _channelinbound = require("../../../../../common/openclaw/plugin-sdk/channel-inbound");
const _runtimeenv = require("../../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _identity = require("../identity.js");
const _textruntime = require("../text-runtime.js");
const _vcard = require("../vcard.js");
const MESSAGE_WRAPPER_KEYS = [
    "botInvokeMessage",
    "ephemeralMessage",
    "viewOnceMessage",
    "viewOnceMessageV2",
    "viewOnceMessageV2Extension",
    "documentWithCaptionMessage",
    "groupMentionedMessage"
];
const MESSAGE_CONTENT_KEYS = [
    "conversation",
    "extendedTextMessage",
    "imageMessage",
    "videoMessage",
    "audioMessage",
    "documentMessage",
    "stickerMessage",
    "locationMessage",
    "liveLocationMessage",
    "contactMessage",
    "contactsArrayMessage",
    "buttonsResponseMessage",
    "listResponseMessage",
    "templateButtonReplyMessage",
    "interactiveResponseMessage",
    "buttonsMessage",
    "listMessage"
];
function fallbackNormalizeMessageContent(message) {
    let current = message;
    while(current && typeof current === "object"){
        let unwrapped = false;
        for (const key of MESSAGE_WRAPPER_KEYS){
            const candidate = current[key];
            if (candidate && typeof candidate === "object" && "message" in candidate && candidate.message) {
                current = candidate.message;
                unwrapped = true;
                break;
            }
        }
        if (!unwrapped) {
            break;
        }
    }
    return current;
}
function normalizeMessage(message) {
    if (typeof _baileys.normalizeMessageContent === "function") {
        return (0, _baileys.normalizeMessageContent)(message);
    }
    return fallbackNormalizeMessageContent(message);
}
function fallbackGetContentType(message) {
    const normalized = fallbackNormalizeMessageContent(message);
    if (!normalized || typeof normalized !== "object") {
        return undefined;
    }
    for (const key of MESSAGE_CONTENT_KEYS){
        if (normalized[key] != null) {
            return key;
        }
    }
    return undefined;
}
function getMessageContentType(message) {
    if (typeof _baileys.getContentType === "function") {
        return (0, _baileys.getContentType)(message);
    }
    return fallbackGetContentType(message);
}
function extractMessage(message) {
    if (typeof _baileys.extractMessageContent === "function") {
        return (0, _baileys.extractMessageContent)(message);
    }
    const normalized = fallbackNormalizeMessageContent(message);
    const contentType = fallbackGetContentType(normalized);
    if (!normalized || !contentType || contentType === "conversation") {
        return normalized;
    }
    const candidate = normalized[contentType];
    return candidate && typeof candidate === "object" ? candidate : normalized;
}
function getFutureProofInnerMessage(message) {
    const contentType = getMessageContentType(message);
    const candidate = contentType ? message[contentType] : undefined;
    if (candidate && typeof candidate === "object" && "message" in candidate && candidate.message && typeof candidate.message === "object") {
        const inner = normalizeMessage(candidate.message);
        if (inner) {
            const innerType = getMessageContentType(inner);
            if (innerType && innerType !== contentType) {
                return inner;
            }
        }
    }
    return undefined;
}
function buildMessageChain(message) {
    const chain = [];
    let current = normalizeMessage(message);
    while(current && chain.length < 4){
        chain.push(current);
        current = getFutureProofInnerMessage(current);
    }
    return chain;
}
function unwrapMessage(message) {
    const chain = buildMessageChain(message);
    return chain.at(-1);
}
function extractContextInfoFromMessage(message) {
    const contentType = getMessageContentType(message);
    const candidate = contentType ? message[contentType] : undefined;
    const contextInfo = candidate && typeof candidate === "object" && "contextInfo" in candidate ? candidate.contextInfo : undefined;
    if (contextInfo) {
        return contextInfo;
    }
    const fallback = message.extendedTextMessage?.contextInfo ?? message.imageMessage?.contextInfo ?? message.videoMessage?.contextInfo ?? message.documentMessage?.contextInfo ?? message.audioMessage?.contextInfo ?? message.stickerMessage?.contextInfo ?? message.buttonsResponseMessage?.contextInfo ?? message.listResponseMessage?.contextInfo ?? message.templateButtonReplyMessage?.contextInfo ?? message.interactiveResponseMessage?.contextInfo ?? message.buttonsMessage?.contextInfo ?? message.listMessage?.contextInfo;
    if (fallback) {
        return fallback;
    }
    for (const value of Object.values(message)){
        if (!value || typeof value !== "object") {
            continue;
        }
        if ("contextInfo" in value) {
            const candidateContext = value.contextInfo;
            if (candidateContext) {
                return candidateContext;
            }
        }
        // FutureProofMessage wrapper: dig into .message to find contextInfo
        if ("message" in value) {
            const inner = value.message;
            if (inner) {
                const innerCtx = extractContextInfo(inner);
                if (innerCtx) {
                    return innerCtx;
                }
            }
        }
    }
    return undefined;
}
function extractContextInfo(message) {
    for (const candidate of buildMessageChain(message)){
        const contextInfo = extractContextInfoFromMessage(candidate);
        if (contextInfo) {
            return contextInfo;
        }
    }
    return undefined;
}
function extractMentionedJids(rawMessage) {
    const message = unwrapMessage(rawMessage);
    if (!message) {
        return undefined;
    }
    const candidates = [
        message.extendedTextMessage?.contextInfo?.mentionedJid,
        message.imageMessage?.contextInfo?.mentionedJid,
        message.videoMessage?.contextInfo?.mentionedJid,
        message.documentMessage?.contextInfo?.mentionedJid,
        message.audioMessage?.contextInfo?.mentionedJid,
        message.stickerMessage?.contextInfo?.mentionedJid,
        message.buttonsResponseMessage?.contextInfo?.mentionedJid,
        message.listResponseMessage?.contextInfo?.mentionedJid
    ];
    const flattened = candidates.flatMap((arr)=>arr ?? []).filter(Boolean);
    if (flattened.length === 0) {
        return undefined;
    }
    return (0, _stringcoerceruntime.uniqueStrings)(flattened);
}
function extractText(rawMessage) {
    const message = unwrapMessage(rawMessage);
    if (!message) {
        return undefined;
    }
    const extracted = extractMessage(message);
    const candidates = [
        message,
        extracted && extracted !== message ? extracted : undefined
    ];
    for (const candidate of candidates){
        if (!candidate) {
            continue;
        }
        if (typeof candidate.conversation === "string" && candidate.conversation.trim()) {
            return candidate.conversation.trim();
        }
        const extended = candidate.extendedTextMessage?.text;
        if (extended?.trim()) {
            return extended.trim();
        }
        const caption = candidate.imageMessage?.caption ?? candidate.videoMessage?.caption ?? candidate.documentMessage?.caption;
        if (caption?.trim()) {
            return caption.trim();
        }
    }
    const contactPlaceholder = extractContactPlaceholder(message) ?? (extracted && extracted !== message ? extractContactPlaceholder(extracted) : undefined);
    if (contactPlaceholder) {
        return contactPlaceholder;
    }
    return undefined;
}
function extractMediaPlaceholder(rawMessage) {
    const message = unwrapMessage(rawMessage);
    if (!message) {
        return undefined;
    }
    if (message.imageMessage) {
        return "<media:image>";
    }
    if (message.videoMessage) {
        return "<media:video>";
    }
    if (message.audioMessage) {
        return "<media:audio>";
    }
    if (message.documentMessage) {
        return "<media:document>";
    }
    if (message.stickerMessage) {
        return "<media:sticker>";
    }
    return undefined;
}
function extractContactPlaceholder(rawMessage) {
    const contactContext = extractContactContext(rawMessage);
    if (!contactContext) {
        return undefined;
    }
    if (contactContext.kind === "contact") {
        return "<contact>";
    }
    const suffix = contactContext.total === 1 ? "contact" : "contacts";
    return `<contacts: ${contactContext.total} ${suffix}>`;
}
function extractContactContext(rawMessage) {
    const message = unwrapMessage(rawMessage);
    if (!message) {
        return undefined;
    }
    const contact = message.contactMessage ?? undefined;
    if (contact) {
        const { name, phones } = describeContact({
            displayName: contact.displayName,
            vcard: contact.vcard
        });
        return {
            kind: "contact",
            total: 1,
            contacts: [
                {
                    name,
                    phones
                }
            ]
        };
    }
    const contactsArray = message.contactsArrayMessage?.contacts ?? undefined;
    if (!contactsArray || contactsArray.length === 0) {
        return undefined;
    }
    return {
        kind: "contacts",
        total: contactsArray.length,
        contacts: contactsArray.map((entry)=>describeContact({
                displayName: entry.displayName,
                vcard: entry.vcard
            }))
    };
}
function describeContact(input) {
    const displayName = (input.displayName ?? "").trim();
    const parsed = (0, _vcard.parseVcard)(input.vcard ?? undefined);
    const name = displayName || parsed.name;
    return {
        name,
        phones: parsed.phones
    };
}
function extractLocationData(rawMessage) {
    const message = unwrapMessage(rawMessage);
    if (!message) {
        return null;
    }
    const live = message.liveLocationMessage ?? undefined;
    if (live) {
        const latitudeRaw = live.degreesLatitude;
        const longitudeRaw = live.degreesLongitude;
        if (latitudeRaw != null && longitudeRaw != null) {
            const latitude = latitudeRaw;
            const longitude = longitudeRaw;
            if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
                return {
                    latitude,
                    longitude,
                    accuracy: live.accuracyInMeters ?? undefined,
                    caption: live.caption ?? undefined,
                    source: "live",
                    isLive: true
                };
            }
        }
    }
    const location = message.locationMessage ?? undefined;
    if (location) {
        const latitudeRaw = location.degreesLatitude;
        const longitudeRaw = location.degreesLongitude;
        if (latitudeRaw != null && longitudeRaw != null) {
            const latitude = latitudeRaw;
            const longitude = longitudeRaw;
            if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
                const isLive = Boolean(location.isLive);
                return {
                    latitude,
                    longitude,
                    accuracy: location.accuracyInMeters ?? undefined,
                    name: location.name ?? undefined,
                    address: location.address ?? undefined,
                    caption: location.comment ?? undefined,
                    source: isLive ? "live" : location.name || location.address ? "place" : "pin",
                    isLive
                };
            }
        }
    }
    return null;
}
function describeReplyContext(rawMessage) {
    const message = unwrapMessage(rawMessage);
    if (!message) {
        return null;
    }
    const contextInfo = extractContextInfo(message);
    const quoted = normalizeMessage(contextInfo?.quotedMessage);
    if (!quoted) {
        return null;
    }
    const location = extractLocationData(quoted);
    const locationText = location ? (0, _channelinbound.formatLocationText)(location) : undefined;
    const text = extractText(quoted);
    let body = [
        text,
        locationText
    ].filter(Boolean).join("\n").trim();
    if (!body) {
        body = extractMediaPlaceholder(quoted);
    }
    if (!body) {
        const quotedType = quoted ? getMessageContentType(quoted) : undefined;
        (0, _runtimeenv.logVerbose)(`Quoted message missing extractable body${quotedType ? ` (type ${quotedType})` : ""}`);
        return null;
    }
    const senderJid = contextInfo?.participant ?? undefined;
    const sender = (0, _identity.resolveComparableIdentity)({
        jid: senderJid,
        label: senderJid ? (0, _textruntime.jidToE164)(senderJid) ?? senderJid : "unknown sender"
    });
    return {
        id: contextInfo?.stanzaId || undefined,
        body,
        sender
    };
}
function hasInteractiveResponseContent(message) {
    if (!message) {
        return false;
    }
    // Button/list/template/interactive selections that the existing four
    // extractors do not cover. Treat any presence of these keys as user
    // content — Baileys never delivers these as receipts or protocol
    // envelopes, only as explicit user choices.
    return Boolean(message.buttonsResponseMessage || message.listResponseMessage || message.templateButtonReplyMessage || message.interactiveResponseMessage);
}
function hasInboundUserContent(rawMessage) {
    if (!rawMessage) {
        return false;
    }
    if (extractText(rawMessage)) {
        return true;
    }
    if (extractMediaPlaceholder(rawMessage)) {
        return true;
    }
    if (extractLocationData(rawMessage)) {
        return true;
    }
    // Walk wrappers (ephemeral, viewOnce, etc.) — interactive responses
    // can arrive nested.
    for (const candidate of buildMessageChain(rawMessage)){
        if (hasInteractiveResponseContent(candidate)) {
            return true;
        }
    }
    return false;
}

//# sourceMappingURL=extract.js.map