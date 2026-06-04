"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "dispatchTelegramPluginInteractiveHandler", {
    enumerable: true,
    get: function() {
        return dispatchTelegramPluginInteractiveHandler;
    }
});
const _pluginruntime = require("../../../../common/openclaw/plugin-sdk/plugin-runtime");
async function dispatchTelegramPluginInteractiveHandler(params) {
    return await (0, _pluginruntime.dispatchPluginInteractiveHandler)({
        channel: "telegram",
        data: params.data,
        dedupeId: params.callbackId,
        onMatched: params.onMatched,
        invoke: ({ registration, namespace, payload })=>{
            const { callbackMessage, ...handlerContext } = params.ctx;
            return registration.handler({
                ...handlerContext,
                channel: "telegram",
                callback: {
                    data: params.data,
                    namespace,
                    payload,
                    messageId: callbackMessage.messageId,
                    chatId: callbackMessage.chatId,
                    messageText: callbackMessage.messageText
                },
                respond: params.respond,
                ...(0, _pluginruntime.createInteractiveConversationBindingHelpers)({
                    registration,
                    senderId: handlerContext.senderId,
                    conversation: {
                        channel: "telegram",
                        accountId: handlerContext.accountId,
                        conversationId: handlerContext.conversationId,
                        parentConversationId: handlerContext.parentConversationId,
                        threadId: handlerContext.threadId
                    }
                })
            });
        }
    });
}

//# sourceMappingURL=interactive-dispatch.js.map