"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramPreviewStreamMode", {
    enumerable: true,
    get: function() {
        return resolveTelegramPreviewStreamMode;
    }
});
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
function resolveTelegramPreviewStreamMode(params = {}) {
    return (0, _channeloutbound.resolveChannelPreviewStreamMode)(params, "partial");
}

//# sourceMappingURL=preview-streaming.js.map