"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WhatsAppChannelConfigSchema", {
    enumerable: true,
    get: function() {
        return WhatsAppChannelConfigSchema;
    }
});
const _configapi = require("../config-api.js");
const _configuihints = require("./config-ui-hints.js");
const WhatsAppChannelConfigSchema = (0, _configapi.buildChannelConfigSchema)(_configapi.WhatsAppConfigSchema, {
    uiHints: _configuihints.whatsAppChannelConfigUiHints
});

//# sourceMappingURL=config-schema.js.map