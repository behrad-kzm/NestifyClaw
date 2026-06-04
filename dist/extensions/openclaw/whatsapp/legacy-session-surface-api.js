"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "whatsappLegacySessionSurface", {
    enumerable: true,
    get: function() {
        return whatsappLegacySessionSurface;
    }
});
const _sessioncontract = require("./src/session-contract.js");
const whatsappLegacySessionSurface = {
    isLegacyGroupSessionKey: _sessioncontract.isLegacyGroupSessionKey,
    canonicalizeLegacySessionKey: _sessioncontract.canonicalizeLegacySessionKey
};

//# sourceMappingURL=legacy-session-surface-api.js.map