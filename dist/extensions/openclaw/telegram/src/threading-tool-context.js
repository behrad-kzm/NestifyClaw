"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "buildTelegramThreadingToolContext", {
    enumerable: true,
    get: function() {
        return buildTelegramThreadingToolContext;
    }
});
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _targets = require("./targets.js");
function resolveTelegramToolContextThreadId(context) {
    if (context.MessageThreadId != null) {
        return String(context.MessageThreadId);
    }
    const currentChannelId = (0, _stringcoerceruntime.normalizeOptionalString)(context.To);
    if (!currentChannelId) {
        return undefined;
    }
    const parsedTarget = (0, _targets.parseTelegramTarget)(currentChannelId);
    return parsedTarget.messageThreadId != null ? String(parsedTarget.messageThreadId) : undefined;
}
function buildTelegramThreadingToolContext(params) {
    void params.cfg;
    void params.accountId;
    return {
        currentChannelId: (0, _stringcoerceruntime.normalizeOptionalString)(params.context.To),
        currentThreadTs: resolveTelegramToolContextThreadId(params.context),
        hasRepliedRef: params.hasRepliedRef
    };
}

//# sourceMappingURL=threading-tool-context.js.map