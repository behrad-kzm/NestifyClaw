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
    get buildSenderLabel () {
        return buildSenderLabel;
    },
    get buildSenderName () {
        return buildSenderName;
    },
    get extractTelegramLocation () {
        return extractTelegramLocation;
    },
    get getTelegramTextParts () {
        return getTelegramTextParts;
    },
    get hasBotMention () {
        return hasBotMention;
    },
    get isBinaryContent () {
        return isBinaryContent;
    },
    get normalizeForwardedContext () {
        return normalizeForwardedContext;
    },
    get renderTelegramTextEntities () {
        return renderTelegramTextEntities;
    },
    get resolveTelegramMediaPlaceholder () {
        return resolveTelegramMediaPlaceholder;
    },
    get resolveTelegramPrimaryMedia () {
        return resolveTelegramPrimaryMedia;
    },
    get resolveTelegramTextContent () {
        return resolveTelegramTextContent;
    }
});
const _stringcoerceruntime = require("../../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
function buildSenderName(msg) {
    const name = [
        msg.from?.first_name,
        msg.from?.last_name
    ].filter(Boolean).join(" ").trim() || msg.from?.username;
    return name || undefined;
}
function resolveTelegramPrimaryMedia(msg) {
    if (!msg) {
        return undefined;
    }
    const photo = msg.photo?.[msg.photo.length - 1];
    if (photo) {
        return {
            placeholder: "<media:image>",
            fileRef: photo
        };
    }
    if (msg.video) {
        return {
            placeholder: "<media:video>",
            fileRef: msg.video
        };
    }
    if (msg.video_note) {
        return {
            placeholder: "<media:video>",
            fileRef: msg.video_note
        };
    }
    if (msg.audio) {
        return {
            placeholder: "<media:audio>",
            fileRef: msg.audio
        };
    }
    if (msg.voice) {
        return {
            placeholder: "<media:audio>",
            fileRef: msg.voice
        };
    }
    if (msg.document) {
        return {
            placeholder: "<media:document>",
            fileRef: msg.document
        };
    }
    if (msg.sticker) {
        return {
            placeholder: "<media:sticker>",
            fileRef: msg.sticker
        };
    }
    return undefined;
}
function resolveTelegramMediaPlaceholder(msg) {
    return resolveTelegramPrimaryMedia(msg)?.placeholder;
}
function buildSenderLabel(msg, senderId) {
    const name = buildSenderName(msg);
    const username = msg.from?.username ? `@${msg.from.username}` : undefined;
    let label = name;
    if (name && username) {
        label = `${name} (${username})`;
    } else if (!name && username) {
        label = username;
    }
    const normalizedSenderId = senderId != null ? (0, _stringcoerceruntime.normalizeOptionalString)(String(senderId)) : undefined;
    const fallbackId = normalizedSenderId ?? (msg.from?.id != null ? String(msg.from.id) : undefined);
    const idPart = fallbackId ? `id:${fallbackId}` : undefined;
    if (label && idPart) {
        return `${label} ${idPart}`;
    }
    if (label) {
        return label;
    }
    return idPart ?? "id:unknown";
}
function isBinaryContent(text) {
    for(let i = 0; i < text.length; i++){
        const code = text.charCodeAt(i);
        if (code <= 0x1f && code !== 0x09 && code !== 0x0a && code !== 0x0d) {
            return true;
        }
    }
    return false;
}
function resolveTelegramTextContent(text, caption) {
    const raw = typeof text === "string" ? text : typeof caption === "string" ? caption : "";
    return isBinaryContent(raw) ? "" : raw;
}
function getTelegramTextParts(msg) {
    const text = resolveTelegramTextContent(msg.text, msg.caption);
    const entities = text ? msg.entities ?? msg.caption_entities ?? [] : [];
    return {
        text,
        entities
    };
}
function isTelegramMentionWordChar(char) {
    return char != null && /[a-z0-9_]/i.test(char);
}
function hasStandaloneTelegramMention(text, mention) {
    let startIndex = 0;
    while(startIndex < text.length){
        const idx = text.indexOf(mention, startIndex);
        if (idx === -1) {
            return false;
        }
        const prev = idx > 0 ? text[idx - 1] : undefined;
        const next = text[idx + mention.length];
        if (!isTelegramMentionWordChar(prev) && !isTelegramMentionWordChar(next)) {
            return true;
        }
        startIndex = idx + 1;
    }
    return false;
}
function isBotCommandAddressedToMention(command, mention) {
    const normalized = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(command);
    if (!normalized.startsWith("/") || !normalized.endsWith(mention)) {
        return false;
    }
    const atIndex = normalized.lastIndexOf(mention);
    return atIndex > 1;
}
function hasBotMention(msg, botUsername) {
    const { text, entities } = getTelegramTextParts(msg);
    const mention = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(`@${botUsername}`);
    if (hasStandaloneTelegramMention((0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(text), mention)) {
        return true;
    }
    for (const ent of entities){
        const slice = text.slice(ent.offset, ent.offset + ent.length);
        if (ent.type === "mention" && (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(slice) === mention) {
            return true;
        }
        if (ent.type === "bot_command" && isBotCommandAddressedToMention(slice, mention)) {
            return true;
        }
    }
    return false;
}
const TELEGRAM_ENTITY_MARKDOWN_PRIORITY = {
    bold: 10,
    italic: 20,
    underline: 30,
    strikethrough: 40,
    spoiler: 50,
    text_link: 60,
    code: 70,
    pre: 80
};
function longestBacktickRun(text) {
    let longest = 0;
    let current = 0;
    for (const char of text){
        if (char === "`") {
            current += 1;
            longest = Math.max(longest, current);
        } else {
            current = 0;
        }
    }
    return longest;
}
function markdownInlineCodeDelimiters(content) {
    const delimiter = "`".repeat(longestBacktickRun(content) + 1);
    if (content.startsWith(" ") || content.endsWith(" ")) {
        return [
            `${delimiter} `,
            ` ${delimiter}`
        ];
    }
    return [
        delimiter,
        delimiter
    ];
}
function markdownPreAffixes(entity, content) {
    const language = entity.language?.replace(/[\s`]+/g, "").trim();
    const fence = "`".repeat(Math.max(3, longestBacktickRun(content) + 1));
    const opener = language ? `${fence}${language}\n` : `${fence}\n`;
    const closer = content.endsWith("\n") ? fence : `\n${fence}`;
    return [
        opener,
        closer
    ];
}
function markdownAffixesForTelegramEntity(entity, content) {
    switch(entity.type){
        case "bold":
            return [
                "**",
                "**"
            ];
        case "italic":
            return [
                "_",
                "_"
            ];
        case "underline":
            return [
                "__",
                "__"
            ];
        case "strikethrough":
            return [
                "~~",
                "~~"
            ];
        case "spoiler":
            return [
                "||",
                "||"
            ];
        case "code":
            return markdownInlineCodeDelimiters(content);
        case "pre":
            return markdownPreAffixes(entity, content);
        case "text_link":
            return entity.url ? [
                "[",
                `](${entity.url})`
            ] : null;
        default:
            return null;
    }
}
function renderTelegramTextEntities(text, entities) {
    if (!text || !entities?.length) {
        return text;
    }
    const boundaries = new Map();
    const addBoundary = (offset, boundary)=>{
        boundaries.set(offset, [
            ...boundaries.get(offset) ?? [],
            boundary
        ]);
    };
    entities.forEach((entity, index)=>{
        if (!Number.isInteger(entity.offset) || !Number.isInteger(entity.length) || entity.offset < 0 || entity.length <= 0 || entity.offset + entity.length > text.length) {
            return;
        }
        const content = text.slice(entity.offset, entity.offset + entity.length);
        const affixes = markdownAffixesForTelegramEntity(entity, content);
        if (!affixes) {
            return;
        }
        const boundary = {
            open: affixes[0],
            close: affixes[1],
            start: entity.offset,
            end: entity.offset + entity.length,
            length: entity.length,
            priority: TELEGRAM_ENTITY_MARKDOWN_PRIORITY[entity.type] ?? 100,
            index
        };
        addBoundary(boundary.start, boundary);
        addBoundary(boundary.end, boundary);
    });
    if (boundaries.size === 0) {
        return text;
    }
    let result = "";
    for(let offset = 0; offset <= text.length; offset += 1){
        const boundary = boundaries.get(offset);
        if (boundary) {
            boundary.filter((entity)=>entity.end === offset).toSorted((a, b)=>a.length - b.length || b.priority - a.priority || b.index - a.index).forEach((entity)=>{
                result += entity.close;
            });
            boundary.filter((entity)=>entity.start === offset).toSorted((a, b)=>b.length - a.length || a.priority - b.priority || a.index - b.index).forEach((entity)=>{
                result += entity.open;
            });
        }
        if (offset < text.length) {
            result += text[offset];
        }
    }
    return result;
}
function normalizeForwardedUserLabel(user) {
    const name = [
        user.first_name,
        user.last_name
    ].filter(Boolean).join(" ").trim();
    const username = (0, _stringcoerceruntime.normalizeOptionalString)(user.username);
    const id = String(user.id);
    const display = (name && username ? `${name} (@${username})` : name || (username ? `@${username}` : undefined)) || `user:${id}`;
    return {
        display,
        name: name || undefined,
        username,
        id
    };
}
function normalizeForwardedChatLabel(chat, fallbackKind) {
    const title = (0, _stringcoerceruntime.normalizeOptionalString)(chat.title);
    const username = (0, _stringcoerceruntime.normalizeOptionalString)(chat.username);
    const id = String(chat.id);
    const display = title || (username ? `@${username}` : undefined) || `${fallbackKind}:${id}`;
    return {
        display,
        title,
        username,
        id
    };
}
function buildForwardedContextFromUser(params) {
    const { display, name, username, id } = normalizeForwardedUserLabel(params.user);
    if (!display) {
        return null;
    }
    return {
        from: display,
        date: params.date,
        fromType: params.type,
        fromId: id,
        fromUsername: username,
        fromTitle: name
    };
}
function buildForwardedContextFromHiddenName(params) {
    const trimmed = params.name?.trim();
    if (!trimmed) {
        return null;
    }
    return {
        from: trimmed,
        date: params.date,
        fromType: params.type,
        fromTitle: trimmed
    };
}
function buildForwardedContextFromChat(params) {
    const fallbackKind = params.type === "channel" ? "channel" : "chat";
    const { display, title, username, id } = normalizeForwardedChatLabel(params.chat, fallbackKind);
    if (!display) {
        return null;
    }
    const signature = (0, _stringcoerceruntime.normalizeOptionalString)(params.signature);
    const from = signature ? `${display} (${signature})` : display;
    const chatType = (0, _stringcoerceruntime.normalizeOptionalString)(params.chat.type);
    return {
        from,
        date: params.date,
        fromType: params.type,
        fromId: id,
        fromUsername: username,
        fromTitle: title,
        fromSignature: signature,
        fromChatType: chatType,
        fromMessageId: params.messageId
    };
}
function resolveForwardOrigin(origin) {
    switch(origin.type){
        case "user":
            return buildForwardedContextFromUser({
                user: origin.sender_user,
                date: origin.date,
                type: "user"
            });
        case "hidden_user":
            return buildForwardedContextFromHiddenName({
                name: origin.sender_user_name,
                date: origin.date,
                type: "hidden_user"
            });
        case "chat":
            return buildForwardedContextFromChat({
                chat: origin.sender_chat,
                date: origin.date,
                type: "chat",
                signature: origin.author_signature
            });
        case "channel":
            return buildForwardedContextFromChat({
                chat: origin.chat,
                date: origin.date,
                type: "channel",
                signature: origin.author_signature,
                messageId: origin.message_id
            });
        default:
            origin;
            return null;
    }
}
function normalizeForwardedContext(msg) {
    if (!msg.forward_origin) {
        return null;
    }
    return resolveForwardOrigin(msg.forward_origin);
}
function extractTelegramLocation(msg) {
    const { venue, location } = msg;
    if (venue) {
        return {
            latitude: venue.location.latitude,
            longitude: venue.location.longitude,
            accuracy: venue.location.horizontal_accuracy,
            name: venue.title,
            address: venue.address,
            source: "place",
            isLive: false
        };
    }
    if (location) {
        const isLive = typeof location.live_period === "number" && location.live_period > 0;
        return {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.horizontal_accuracy,
            source: isLive ? "live" : "pin",
            isLive
        };
    }
    return null;
}

//# sourceMappingURL=body-helpers.js.map