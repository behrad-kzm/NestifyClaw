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
    get createTelegramBot () {
        return createTelegramBot;
    },
    get getTelegramSequentialKey () {
        return _botcore.getTelegramSequentialKey;
    },
    get setTelegramBotRuntimeForTest () {
        return _botcore.setTelegramBotRuntimeForTest;
    }
});
const _botcore = require("./bot-core.js");
const _botdeps = require("./bot-deps.js");
function createTelegramBot(opts) {
    return (0, _botcore.createTelegramBotCore)({
        ...opts,
        telegramDeps: opts.telegramDeps ?? _botdeps.defaultTelegramBotDeps
    });
}

//# sourceMappingURL=bot.js.map