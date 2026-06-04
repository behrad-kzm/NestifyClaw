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
    get canonicalizeLegacySessionKey () {
        return canonicalizeLegacySessionKey;
    },
    get deriveLegacySessionChatType () {
        return deriveLegacySessionChatType;
    },
    get isLegacyGroupSessionKey () {
        return isLegacyGroupSessionKey;
    }
});
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
function extractLegacyWhatsAppGroupId(key) {
    const trimmed = key.trim();
    if (!trimmed) {
        return null;
    }
    const lower = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(trimmed);
    if (trimmed.startsWith("group:")) {
        const id = trimmed.slice("group:".length).trim();
        return (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(id).includes("@g.us") ? id : null;
    }
    if (!lower.includes("@g.us")) {
        return null;
    }
    if (!trimmed.includes(":")) {
        return trimmed;
    }
    if (lower.startsWith("whatsapp:") && !trimmed.includes(":group:")) {
        const remainder = trimmed.slice("whatsapp:".length).trim();
        const cleaned = remainder.replace(/^group:/i, "").trim();
        return cleaned || null;
    }
    return null;
}
function isLegacyGroupSessionKey(key) {
    return extractLegacyWhatsAppGroupId(key) !== null;
}
function deriveLegacySessionChatType(key) {
    return isLegacyGroupSessionKey(key) ? "group" : undefined;
}
function canonicalizeLegacySessionKey(params) {
    const legacyGroupId = extractLegacyWhatsAppGroupId(params.key);
    return legacyGroupId ? `agent:${(0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(params.agentId)}:whatsapp:group:${(0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(legacyGroupId)}` : null;
}

//# sourceMappingURL=session-contract.js.map