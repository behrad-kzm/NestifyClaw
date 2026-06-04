"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "recordOutboundMessageForPromptContext", {
    enumerable: true,
    get: function() {
        return recordOutboundMessageForPromptContext;
    }
});
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _sessionstoreruntime = require("../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _messagecache = require("./message-cache.js");
function inferTelegramChatType(chatId) {
    return String(chatId).startsWith("-") ? "supergroup" : "private";
}
function buildOutboundCacheMessage(params) {
    const chat = params.message.chat ?? {};
    const text = params.message.text ?? params.message.caption ?? params.text;
    return {
        ...params.message,
        message_id: params.messageId,
        date: typeof params.message.date === "number" && Number.isFinite(params.message.date) ? params.message.date : Math.floor(Date.now() / 1000),
        chat: {
            id: chat.id ?? params.chatId,
            type: chat.type ?? inferTelegramChatType(params.chatId),
            ...chat.title ? {
                title: chat.title
            } : {},
            ...chat.username ? {
                username: chat.username
            } : {}
        },
        from: params.message.from ?? {
            id: 0,
            is_bot: true,
            first_name: params.account.name ?? "OpenClaw"
        },
        ...text ? {
            text
        } : {},
        ...params.messageThreadId !== undefined ? {
            message_thread_id: params.messageThreadId
        } : {}
    };
}
async function recordOutboundMessageForPromptContext(params) {
    try {
        const cache = (0, _messagecache.createTelegramMessageCache)({
            scope: (0, _messagecache.resolveTelegramMessageCacheScope)((0, _sessionstoreruntime.resolveStorePath)(params.cfg.session?.store))
        });
        await cache.record({
            accountId: params.account.accountId,
            chatId: params.chatId,
            msg: buildOutboundCacheMessage(params),
            ...params.messageThreadId !== undefined ? {
                threadId: params.messageThreadId
            } : {}
        });
    } catch (error) {
        (0, _runtimeenv.logVerbose)(`telegram: failed to record outbound message context: ${String(error)}`);
    }
}

//# sourceMappingURL=outbound-message-context.js.map