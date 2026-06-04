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
    get looksLikeTelegramTargetId () {
        return looksLikeTelegramTargetId;
    },
    get normalizeTelegramMessagingTarget () {
        return normalizeTelegramMessagingTarget;
    }
});
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _targets = require("./targets.js");
const TELEGRAM_PREFIX_RE = /^(telegram|tg):/i;
function normalizeTelegramTargetBody(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
        return undefined;
    }
    const prefixStripped = trimmed.replace(TELEGRAM_PREFIX_RE, "").trim();
    if (!prefixStripped) {
        return undefined;
    }
    const parsed = (0, _targets.parseTelegramTarget)(trimmed);
    const normalizedChatId = (0, _targets.normalizeTelegramLookupTarget)(parsed.chatId);
    if (!normalizedChatId) {
        return undefined;
    }
    const keepLegacyGroupPrefix = /^group:/i.test(prefixStripped);
    const hasTopicSuffix = /:topic:\d+$/i.test(prefixStripped);
    const chatSegment = keepLegacyGroupPrefix ? `group:${normalizedChatId}` : normalizedChatId;
    if (parsed.messageThreadId == null) {
        return chatSegment;
    }
    const threadSuffix = hasTopicSuffix ? `:topic:${parsed.messageThreadId}` : `:${parsed.messageThreadId}`;
    return `${chatSegment}${threadSuffix}`;
}
function normalizeTelegramMessagingTarget(raw) {
    const normalizedBody = normalizeTelegramTargetBody(raw);
    if (!normalizedBody) {
        return undefined;
    }
    return (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(`telegram:${normalizedBody}`);
}
function looksLikeTelegramTargetId(raw) {
    return normalizeTelegramTargetBody(raw) !== undefined;
}

//# sourceMappingURL=normalize.js.map