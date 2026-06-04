"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveWhatsAppOutboundTarget", {
    enumerable: true,
    get: function() {
        return resolveWhatsAppOutboundTarget;
    }
});
const _channelfeedback = require("../../../../common/openclaw/plugin-sdk/channel-feedback");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _normalizetarget = require("./normalize-target.js");
function whatsappAllowFromPolicyError(target) {
    return new Error(`Target "${target}" is not listed in the configured WhatsApp allowFrom policy.`);
}
function resolveWhatsAppOutboundTarget(params) {
    const trimmed = params.to?.trim() ?? "";
    if (!trimmed) {
        return {
            ok: false,
            error: (0, _channelfeedback.missingTargetError)("WhatsApp", "<E.164|group JID|newsletter JID>")
        };
    }
    const normalizedTo = (0, _normalizetarget.normalizeWhatsAppTarget)(trimmed);
    if (!normalizedTo) {
        return {
            ok: false,
            error: (0, _channelfeedback.missingTargetError)("WhatsApp", "<E.164|group JID|newsletter JID>")
        };
    }
    if ((0, _normalizetarget.isWhatsAppGroupJid)(normalizedTo) || (0, _normalizetarget.isWhatsAppNewsletterJid)(normalizedTo)) {
        return {
            ok: true,
            to: normalizedTo
        };
    }
    const allowListRaw = (0, _stringcoerceruntime.normalizeStringEntries)(params.allowFrom ?? []);
    const hasWildcard = allowListRaw.includes("*");
    const allowList = allowListRaw.filter((entry)=>entry !== "*").map((entry)=>(0, _normalizetarget.normalizeWhatsAppTarget)(entry)).filter((entry)=>Boolean(entry));
    if (hasWildcard || allowList.length === 0) {
        return {
            ok: true,
            to: normalizedTo
        };
    }
    if (allowList.includes(normalizedTo)) {
        return {
            ok: true,
            to: normalizedTo
        };
    }
    return {
        ok: false,
        error: whatsappAllowFromPolicyError(normalizedTo)
    };
}

//# sourceMappingURL=resolve-outbound-target.js.map