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
    get resolveTelegramSessionConversation () {
        return resolveTelegramSessionConversation;
    },
    get resolveTelegramSessionTarget () {
        return resolveTelegramSessionTarget;
    }
});
const _targets = require("./targets.js");
const _topicconversation = require("./topic-conversation.js");
function resolveTelegramSessionConversation(params) {
    const parsed = (0, _topicconversation.parseTelegramTopicConversation)({
        conversationId: params.rawId
    });
    if (!parsed) {
        return null;
    }
    return {
        id: parsed.chatId,
        threadId: parsed.topicId,
        baseConversationId: parsed.chatId,
        parentConversationCandidates: [
            parsed.chatId
        ]
    };
}
function resolveTelegramSessionTarget(params) {
    const raw = params.kind === "group" ? `telegram:group:${params.id}` : `telegram:${params.id}`;
    return (0, _targets.normalizeTelegramChatId)(raw) ?? (0, _targets.normalizeTelegramLookupTarget)(raw);
}

//# sourceMappingURL=session-conversation.js.map