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
    get elide () {
        return elide;
    },
    get isLikelyWhatsAppCryptoError () {
        return isLikelyWhatsAppCryptoError;
    }
});
const _stringcoerceruntime = require("../../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
function elide(text, limit = 400) {
    if (!text) {
        return text;
    }
    if (text.length <= limit) {
        return text;
    }
    return `${text.slice(0, limit)}… (truncated ${text.length - limit} chars)`;
}
function isLikelyWhatsAppCryptoError(reason) {
    const formatReason = (value)=>{
        if (value == null) {
            return "";
        }
        if (typeof value === "string") {
            return value;
        }
        if (value instanceof Error) {
            return `${value.message}\n${value.stack ?? ""}`;
        }
        if (typeof value === "object") {
            try {
                return JSON.stringify(value);
            } catch  {
                return Object.prototype.toString.call(value);
            }
        }
        if (typeof value === "number") {
            return String(value);
        }
        if (typeof value === "boolean") {
            return String(value);
        }
        if (typeof value === "bigint") {
            return String(value);
        }
        if (typeof value === "symbol") {
            return value.description ?? value.toString();
        }
        if (typeof value === "function") {
            return value.name ? `[function ${value.name}]` : "[function]";
        }
        return Object.prototype.toString.call(value);
    };
    const raw = reason instanceof Error ? `${reason.message}\n${reason.stack ?? ""}` : formatReason(reason);
    const haystack = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(raw);
    const hasAuthError = haystack.includes("unsupported state or unable to authenticate data") || haystack.includes("bad mac");
    if (!hasAuthError) {
        return false;
    }
    return haystack.includes("baileys") || haystack.includes("noise-handler") || haystack.includes("aesdecryptgcm");
}

//# sourceMappingURL=util.js.map