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
    get createChannelMessageReplyPipeline () {
        return _channeloutbound.createChannelMessageReplyPipeline;
    },
    get deliverReplies () {
        return _delivery.deliverReplies;
    },
    get emitTelegramMessageSentHooks () {
        return _delivery.emitTelegramMessageSentHooks;
    }
});
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _delivery = require("./bot/delivery.js");

//# sourceMappingURL=bot-native-commands.delivery.runtime.js.map