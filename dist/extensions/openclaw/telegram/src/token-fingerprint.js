"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "fingerprintTelegramBotToken", {
    enumerable: true,
    get: function() {
        return fingerprintTelegramBotToken;
    }
});
const _nodecrypto = require("node:crypto");
function fingerprintTelegramBotToken(token) {
    return (0, _nodecrypto.createHash)("sha256").update(token).digest("hex").slice(0, 16);
}

//# sourceMappingURL=token-fingerprint.js.map