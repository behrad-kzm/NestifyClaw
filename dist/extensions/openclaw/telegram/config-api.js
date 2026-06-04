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
    get TelegramConfigSchema () {
        return _bundledchannelconfigschema.TelegramConfigSchema;
    },
    get buildChannelConfigSchema () {
        return _bundledchannelconfigschema.buildChannelConfigSchema;
    },
    get normalizeTelegramCommandDescription () {
        return _commandconfig.normalizeTelegramCommandDescription;
    },
    get normalizeTelegramCommandName () {
        return _commandconfig.normalizeTelegramCommandName;
    },
    get resolveTelegramCustomCommands () {
        return _commandconfig.resolveTelegramCustomCommands;
    }
});
const _bundledchannelconfigschema = require("../../../common/openclaw/plugin-sdk/bundled-channel-config-schema");
const _commandconfig = require("./src/command-config.js");

//# sourceMappingURL=config-api.js.map