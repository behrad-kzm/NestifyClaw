"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveLegacyGroupSessionKey", {
    enumerable: true,
    get: function() {
        return resolveLegacyGroupSessionKey;
    }
});
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
function resolveLegacyGroupSessionKey(ctx) {
    const from = typeof ctx.From === "string" ? ctx.From.trim() : "";
    const normalized = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(from);
    if (!from || from.includes(":") || !normalized.endsWith("@g.us")) {
        return null;
    }
    return {
        key: `whatsapp:group:${normalized}`,
        channel: "whatsapp",
        id: normalized,
        chatType: "group"
    };
}

//# sourceMappingURL=group-session-contract.js.map