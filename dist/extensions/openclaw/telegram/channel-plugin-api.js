// Keep bundled channel entry imports narrow so bootstrap/discovery paths do
// not drag the broad Telegram API barrel into lightweight plugin loads.
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
    get telegramPlugin () {
        return _channel.telegramPlugin;
    },
    get telegramSetupPlugin () {
        return _channelsetup.telegramSetupPlugin;
    }
});
const _channel = require("./src/channel.js");
const _channelsetup = require("./src/channel.setup.js");

//# sourceMappingURL=channel-plugin-api.js.map