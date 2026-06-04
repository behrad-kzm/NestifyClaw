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
    get buildQuotedMessageOptions () {
        return buildQuotedMessageOptions;
    },
    get cacheInboundMessageMeta () {
        return cacheInboundMessageMeta;
    },
    get lookupInboundMessageMeta () {
        return lookupInboundMessageMeta;
    },
    get lookupInboundMessageMetaForTarget () {
        return lookupInboundMessageMetaForTarget;
    }
});
const _textruntime = require("./text-runtime.js");
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map();
function makeCacheKey(accountId, remoteJid, messageId) {
    return `${accountId}:${remoteJid}:${messageId}`;
}
function cacheInboundMessageMeta(accountId, remoteJid, messageId, meta) {
    if (!accountId || !messageId || !remoteJid) {
        return;
    }
    if (cache.size >= MAX_ENTRIES) {
        const oldest = cache.keys().next().value;
        if (oldest) {
            cache.delete(oldest);
        }
    }
    cache.set(makeCacheKey(accountId, remoteJid, messageId), {
        ...meta,
        ts: Date.now()
    });
}
function lookupInboundMessageMeta(accountId, remoteJid, messageId) {
    const cacheKey = makeCacheKey(accountId, remoteJid, messageId);
    const entry = cache.get(cacheKey);
    if (!entry) {
        return undefined;
    }
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
        cache.delete(cacheKey);
        return undefined;
    }
    return {
        participant: entry.participant,
        participantE164: entry.participantE164,
        body: entry.body,
        fromMe: entry.fromMe
    };
}
function normalizeComparableJid(jid) {
    const normalized = jid?.trim().replace(/:\d+/, "").toLowerCase();
    return normalized || undefined;
}
function isGroupJid(jid) {
    return Boolean(jid && jid.endsWith("@g.us"));
}
function areComparableE164sEqual(left, right) {
    const normalizedLeft = left?.trim();
    const normalizedRight = right?.trim();
    if (!normalizedLeft || !normalizedRight) {
        return false;
    }
    return normalizedLeft === normalizedRight;
}
function areComparableJidsEqual(left, right) {
    const normalizedLeft = normalizeComparableJid(left);
    const normalizedRight = normalizeComparableJid(right);
    if (!normalizedLeft || !normalizedRight) {
        return false;
    }
    if (normalizedLeft === normalizedRight) {
        return true;
    }
    const leftE164 = (0, _textruntime.jidToE164)(normalizedLeft);
    const rightE164 = (0, _textruntime.jidToE164)(normalizedRight);
    return Boolean(leftE164 && rightE164 && leftE164 === rightE164);
}
function matchesQuotedConversationTarget(targetJid, candidate) {
    if (areComparableJidsEqual(targetJid, candidate.remoteJid)) {
        return true;
    }
    if (isGroupJid(targetJid) || isGroupJid(candidate.remoteJid)) {
        return false;
    }
    return areComparableJidsEqual(targetJid, candidate.participant) || areComparableE164sEqual((0, _textruntime.jidToE164)(targetJid) ?? undefined, candidate.participantE164);
}
function lookupInboundMessageMetaForTarget(accountId, targetJid, messageId) {
    if (!accountId || !messageId || !targetJid) {
        return undefined;
    }
    const exact = lookupInboundMessageMeta(accountId, targetJid, messageId);
    if (exact) {
        return {
            remoteJid: targetJid,
            participant: exact.participant,
            participantE164: exact.participantE164,
            body: exact.body,
            fromMe: exact.fromMe
        };
    }
    const prefix = `${accountId}:`;
    const suffix = `:${messageId}`;
    let matched;
    for (const [cacheKey, entry] of cache.entries()){
        if (!cacheKey.startsWith(prefix) || !cacheKey.endsWith(suffix)) {
            continue;
        }
        if (Date.now() - entry.ts > CACHE_TTL_MS) {
            cache.delete(cacheKey);
            continue;
        }
        const remoteJid = cacheKey.slice(prefix.length, cacheKey.length - suffix.length);
        const candidate = {
            remoteJid,
            participant: entry.participant,
            participantE164: entry.participantE164,
            body: entry.body,
            fromMe: entry.fromMe
        };
        if (!matchesQuotedConversationTarget(targetJid, candidate)) {
            continue;
        }
        if (matched) {
            return undefined;
        }
        matched = candidate;
    }
    return matched;
}
function buildQuotedMessageOptions(params) {
    const id = params.messageId?.trim();
    const remoteJid = params.remoteJid?.trim();
    if (!id || !remoteJid) {
        return undefined;
    }
    return {
        quoted: {
            key: {
                remoteJid,
                id,
                fromMe: params.fromMe ?? false,
                participant: params.participant
            },
            message: {
                conversation: params.messageText ?? ""
            }
        }
    };
}

//# sourceMappingURL=quoted-message.js.map