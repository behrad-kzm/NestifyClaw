"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TelegramChannelConfigSchema", {
    enumerable: true,
    get: function() {
        return TelegramChannelConfigSchema;
    }
});
const _configapi = require("../config-api.js");
const _configuihints = require("./config-ui-hints.js");
const TelegramChannelConfigSchema = (0, _configapi.buildChannelConfigSchema)(_configapi.TelegramConfigSchema, {
    uiHints: _configuihints.telegramChannelConfigUiHints
});

//# sourceMappingURL=config-schema.js.map