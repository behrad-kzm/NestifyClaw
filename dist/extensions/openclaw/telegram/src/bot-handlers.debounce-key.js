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
    get buildTelegramInboundDebounceConversationKey () {
        return buildTelegramInboundDebounceConversationKey;
    },
    get buildTelegramInboundDebounceKey () {
        return buildTelegramInboundDebounceKey;
    }
});
function buildTelegramInboundDebounceKey(params) {
    const resolvedAccountId = params.accountId?.trim() || "default";
    return `telegram:${resolvedAccountId}:${params.conversationKey}:${params.senderId}:${params.debounceLane}`;
}
function buildTelegramInboundDebounceConversationKey(params) {
    return params.threadId != null ? `${params.chatId}:topic:${params.threadId}` : String(params.chatId);
}

//# sourceMappingURL=bot-handlers.debounce-key.js.map