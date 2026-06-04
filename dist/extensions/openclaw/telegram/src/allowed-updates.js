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
    get DEFAULT_TELEGRAM_UPDATE_TYPES () {
        return DEFAULT_TELEGRAM_UPDATE_TYPES;
    },
    get resolveTelegramAllowedUpdates () {
        return resolveTelegramAllowedUpdates;
    }
});
const _grammy = require("grammy");
const DEFAULT_TELEGRAM_UPDATE_TYPES = _grammy.API_CONSTANTS.DEFAULT_UPDATE_TYPES;
function resolveTelegramAllowedUpdates() {
    const updates = [
        ...DEFAULT_TELEGRAM_UPDATE_TYPES
    ];
    if (!updates.includes("message_reaction")) {
        updates.push("message_reaction");
    }
    if (!updates.includes("channel_post")) {
        updates.push("channel_post");
    }
    return updates;
}

//# sourceMappingURL=allowed-updates.js.map