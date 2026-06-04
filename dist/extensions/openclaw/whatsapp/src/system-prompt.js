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
    get resolveWhatsAppDirectSystemPrompt () {
        return resolveWhatsAppDirectSystemPrompt;
    },
    get resolveWhatsAppGroupSystemPrompt () {
        return resolveWhatsAppGroupSystemPrompt;
    }
});
function resolveWhatsAppGroupSystemPrompt(params) {
    if (!params.groupId) {
        return undefined;
    }
    const groups = params.accountConfig?.groups;
    const specific = groups?.[params.groupId];
    if (specific != null && specific.systemPrompt != null) {
        return specific.systemPrompt.trim() || undefined;
    }
    const wildcard = groups?.["*"]?.systemPrompt;
    return wildcard != null ? wildcard.trim() || undefined : undefined;
}
function resolveWhatsAppDirectSystemPrompt(params) {
    if (!params.peerId) {
        return undefined;
    }
    const direct = params.accountConfig?.direct;
    const specific = direct?.[params.peerId];
    if (specific != null && specific.systemPrompt != null) {
        return specific.systemPrompt.trim() || undefined;
    }
    const wildcard = direct?.["*"]?.systemPrompt;
    return wildcard != null ? wildcard.trim() || undefined : undefined;
}

//# sourceMappingURL=system-prompt.js.map