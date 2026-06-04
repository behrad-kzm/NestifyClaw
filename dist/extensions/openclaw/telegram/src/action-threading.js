"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramAutoThreadId", {
    enumerable: true,
    get: function() {
        return resolveTelegramAutoThreadId;
    }
});
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _targets = require("./targets.js");
function resolveTelegramAutoThreadId(params) {
    const context = params.toolContext;
    if (!context?.currentThreadTs || !context.currentChannelId) {
        return undefined;
    }
    const parsedTo = (0, _targets.parseTelegramTarget)(params.to);
    if (parsedTo.messageThreadId != null) {
        return undefined;
    }
    const parsedChannel = (0, _targets.parseTelegramTarget)(context.currentChannelId);
    if ((0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(parsedTo.chatId) !== (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(parsedChannel.chatId)) {
        return undefined;
    }
    return context.currentThreadTs;
}

//# sourceMappingURL=action-threading.js.map