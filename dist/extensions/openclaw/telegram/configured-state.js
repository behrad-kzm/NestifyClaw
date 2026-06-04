"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "hasTelegramConfiguredState", {
    enumerable: true,
    get: function() {
        return hasTelegramConfiguredState;
    }
});
function hasTelegramConfiguredState(params) {
    return typeof params.env?.TELEGRAM_BOT_TOKEN === "string" && params.env.TELEGRAM_BOT_TOKEN.trim().length > 0;
}

//# sourceMappingURL=configured-state.js.map