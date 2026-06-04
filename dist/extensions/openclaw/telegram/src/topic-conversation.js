"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "parseTelegramTopicConversation", {
    enumerable: true,
    get: function() {
        return parseTelegramTopicConversation;
    }
});
function buildTelegramTopicConversationId(params) {
    const chatId = params.chatId.trim();
    const topicId = params.topicId.trim();
    if (!/^-?\d+$/.test(chatId) || !/^\d+$/.test(topicId)) {
        return null;
    }
    return `${chatId}:topic:${topicId}`;
}
function parseTelegramTopicConversation(params) {
    const conversation = params.conversationId.trim();
    const directMatch = conversation.match(/^(-?\d+):topic:(\d+)$/i);
    if (directMatch?.[1] && directMatch[2]) {
        const canonicalConversationId = buildTelegramTopicConversationId({
            chatId: directMatch[1],
            topicId: directMatch[2]
        });
        if (!canonicalConversationId) {
            return null;
        }
        return {
            chatId: directMatch[1],
            topicId: directMatch[2],
            canonicalConversationId
        };
    }
    if (!/^\d+$/.test(conversation)) {
        return null;
    }
    const parent = params.parentConversationId?.trim();
    if (!parent || !/^-?\d+$/.test(parent)) {
        return null;
    }
    // Telegram DM bindings can carry the chat id in both fields; treat that as
    // a direct conversation shape, not a legacy topic binding.
    if (parent === conversation) {
        return null;
    }
    const canonicalConversationId = buildTelegramTopicConversationId({
        chatId: parent,
        topicId: conversation
    });
    if (!canonicalConversationId) {
        return null;
    }
    return {
        chatId: parent,
        topicId: conversation,
        canonicalConversationId
    };
}

//# sourceMappingURL=topic-conversation.js.map