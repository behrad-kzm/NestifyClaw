"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createTelegramPollExtraToolSchemas", {
    enumerable: true,
    get: function() {
        return createTelegramPollExtraToolSchemas;
    }
});
const _channelactions = require("../../../../common/openclaw/plugin-sdk/channel-actions");
const _typebox = require("typebox");
function createTelegramPollExtraToolSchemas() {
    return {
        pollDurationSeconds: (0, _channelactions.optionalPositiveIntegerSchema)(),
        pollAnonymous: _typebox.Type.Optional(_typebox.Type.Boolean()),
        pollPublic: _typebox.Type.Optional(_typebox.Type.Boolean())
    };
}

//# sourceMappingURL=message-tool-schema.js.map