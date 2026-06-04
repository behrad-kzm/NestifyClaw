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
    get resolveWhatsAppGroupIntroHint () {
        return resolveWhatsAppGroupIntroHint;
    },
    get resolveWhatsAppMentionStripRegexes () {
        return resolveWhatsAppMentionStripRegexes;
    }
});
const WHATSAPP_GROUP_INTRO_HINT = "WhatsApp IDs: SenderId is the participant JID (group participant id).";
function resolveWhatsAppGroupIntroHint() {
    return WHATSAPP_GROUP_INTRO_HINT;
}
function resolveWhatsAppMentionStripRegexes(ctx) {
    const selfE164 = (ctx.To ?? "").replace(/^whatsapp:/i, "");
    if (!selfE164) {
        return [];
    }
    const escaped = selfE164.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return [
        new RegExp(escaped, "g"),
        new RegExp(`@${escaped}`, "g")
    ];
}

//# sourceMappingURL=group-intro.js.map