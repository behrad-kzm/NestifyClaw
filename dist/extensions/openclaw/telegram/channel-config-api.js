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
    get TELEGRAM_COMMAND_NAME_PATTERN () {
        return _commandconfig.TELEGRAM_COMMAND_NAME_PATTERN;
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
const _commandconfig = require("./src/command-config.js");

//# sourceMappingURL=channel-config-api.js.map