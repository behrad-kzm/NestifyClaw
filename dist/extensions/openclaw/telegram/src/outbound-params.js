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
    get normalizeTelegramReplyToMessageId () {
        return normalizeTelegramReplyToMessageId;
    },
    get parseTelegramMessageThreadId () {
        return parseTelegramMessageThreadId;
    },
    get parseTelegramReplyToMessageId () {
        return parseTelegramReplyToMessageId;
    },
    get parseTelegramThreadId () {
        return parseTelegramThreadId;
    }
});
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
function parseIntegerId(value) {
    return (0, _numberruntime.parseStrictInteger)(value);
}
function parseTelegramMessageThreadId(value) {
    return (0, _numberruntime.parseStrictNonNegativeInteger)(value);
}
function normalizeTelegramReplyToMessageId(value) {
    if (typeof value !== "string") {
        return parseIntegerId(value);
    }
    const trimmed = value.trim();
    return trimmed ? parseIntegerId(trimmed) : undefined;
}
function parseTelegramReplyToMessageId(replyToId) {
    return normalizeTelegramReplyToMessageId(replyToId);
}
function parseTelegramThreadId(threadId) {
    if (threadId == null) {
        return undefined;
    }
    if (typeof threadId === "number") {
        return parseIntegerId(threadId);
    }
    const trimmed = threadId.trim();
    if (!trimmed) {
        return undefined;
    }
    const topicMatch = /^-?\d+:topic:(\d+)$/.exec(trimmed);
    if (topicMatch) {
        return parseIntegerId(topicMatch[1]);
    }
    // DM topic session keys may scope thread ids as "<chatId>:<threadId>".
    const scopedMatch = /^-?\d+:(-?\d+)$/.exec(trimmed);
    const rawThreadId = scopedMatch ? scopedMatch[1] : trimmed;
    return parseIntegerId(rawThreadId);
}

//# sourceMappingURL=outbound-params.js.map