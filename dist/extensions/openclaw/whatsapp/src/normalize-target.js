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
    get isWhatsAppGroupJid () {
        return isWhatsAppGroupJid;
    },
    get isWhatsAppNewsletterJid () {
        return isWhatsAppNewsletterJid;
    },
    get isWhatsAppUserTarget () {
        return isWhatsAppUserTarget;
    },
    get looksLikeWhatsAppTargetId () {
        return looksLikeWhatsAppTargetId;
    },
    get normalizeWhatsAppAllowFromEntries () {
        return normalizeWhatsAppAllowFromEntries;
    },
    get normalizeWhatsAppAllowFromEntry () {
        return normalizeWhatsAppAllowFromEntry;
    },
    get normalizeWhatsAppMessagingTarget () {
        return normalizeWhatsAppMessagingTarget;
    },
    get normalizeWhatsAppTarget () {
        return normalizeWhatsAppTarget;
    }
});
const _accountresolution = require("../../../../common/openclaw/plugin-sdk/account-resolution");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const WHATSAPP_USER_JID_RE = /^(\d+)(?::\d+)?@s\.whatsapp\.net$/i;
const WHATSAPP_LEGACY_USER_JID_RE = /^(\d+)@c\.us$/i;
const WHATSAPP_LID_RE = /^(\d+)@lid$/i;
const NON_WHATSAPP_PROVIDER_PREFIX_RE = /^[a-z][a-z0-9-]*:/i;
const WHATSAPP_NEWSLETTER_JID_RE = /^([0-9]+)@newsletter$/i;
function stripWhatsAppTargetPrefixes(value) {
    let candidate = value.trim();
    for(;;){
        const before = candidate;
        candidate = candidate.replace(/^whatsapp:/i, "").trim();
        if (candidate === before) {
            return candidate;
        }
    }
}
function normalizeWhatsAppGroupJid(value) {
    const candidate = stripWhatsAppTargetPrefixes(value).replace(/^group:/i, "").trim();
    const lower = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(candidate);
    if (!lower.endsWith("@g.us")) {
        return null;
    }
    const localPart = candidate.slice(0, candidate.length - "@g.us".length);
    if (!localPart || localPart.includes("@")) {
        return null;
    }
    return /^[0-9]+(-[0-9]+)*$/.test(localPart) ? `${localPart}@g.us` : null;
}
function isWhatsAppGroupJid(value) {
    return normalizeWhatsAppGroupJid(value) !== null;
}
function isWhatsAppNewsletterJid(value) {
    const candidate = stripWhatsAppTargetPrefixes(value);
    return WHATSAPP_NEWSLETTER_JID_RE.test(candidate);
}
function isWhatsAppUserTarget(value) {
    const candidate = stripWhatsAppTargetPrefixes(value);
    return WHATSAPP_USER_JID_RE.test(candidate) || WHATSAPP_LEGACY_USER_JID_RE.test(candidate) || WHATSAPP_LID_RE.test(candidate);
}
function extractUserJidPhone(jid) {
    const userMatch = jid.match(WHATSAPP_USER_JID_RE);
    if (userMatch) {
        return userMatch[1];
    }
    const legacyUserMatch = jid.match(WHATSAPP_LEGACY_USER_JID_RE);
    if (legacyUserMatch) {
        return legacyUserMatch[1];
    }
    const lidMatch = jid.match(WHATSAPP_LID_RE);
    if (lidMatch) {
        return lidMatch[1];
    }
    return null;
}
function normalizeWhatsAppTarget(value) {
    const candidate = stripWhatsAppTargetPrefixes(value);
    if (!candidate) {
        return null;
    }
    const groupJid = normalizeWhatsAppGroupJid(candidate);
    if (groupJid) {
        return groupJid;
    }
    if (isWhatsAppNewsletterJid(candidate)) {
        const match = candidate.match(WHATSAPP_NEWSLETTER_JID_RE);
        return match ? `${match[1]}@newsletter` : null;
    }
    if (isWhatsAppUserTarget(candidate)) {
        const phone = extractUserJidPhone(candidate);
        if (!phone) {
            return null;
        }
        const normalized = (0, _accountresolution.normalizeE164)(phone);
        return normalized.length > 1 ? normalized : null;
    }
    if (candidate.includes("@")) {
        return null;
    }
    if (NON_WHATSAPP_PROVIDER_PREFIX_RE.test(candidate)) {
        return null;
    }
    const normalized = (0, _accountresolution.normalizeE164)(candidate);
    return normalized.length > 1 ? normalized : null;
}
function normalizeWhatsAppMessagingTarget(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
        return undefined;
    }
    return normalizeWhatsAppTarget(trimmed) ?? undefined;
}
function normalizeWhatsAppAllowFromEntries(allowFrom) {
    const seen = new Set();
    const normalized = allowFrom.map((entry)=>String(entry).trim()).filter((entry)=>Boolean(entry)).map(normalizeWhatsAppAllowFromEntry).filter((entry)=>Boolean(entry));
    return normalized.filter((entry)=>{
        if (seen.has(entry)) {
            return false;
        }
        seen.add(entry);
        return true;
    });
}
function normalizeWhatsAppAllowFromEntry(entry) {
    if (entry === "*") {
        return entry;
    }
    const normalized = normalizeWhatsAppTarget(entry);
    if (!normalized) {
        return null;
    }
    return normalized.startsWith("+") ? normalized.slice(1) : normalized;
}
function looksLikeWhatsAppTargetId(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
        return false;
    }
    return /^whatsapp:/i.test(trimmed) || isWhatsAppGroupJid(trimmed) || isWhatsAppNewsletterJid(trimmed) || isWhatsAppUserTarget(trimmed) || normalizeWhatsAppTarget(trimmed) !== null;
}

//# sourceMappingURL=normalize-target.js.map