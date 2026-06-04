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
    get getComparableIdentityValues () {
        return getComparableIdentityValues;
    },
    get getMentionIdentities () {
        return getMentionIdentities;
    },
    get getPrimaryIdentityId () {
        return getPrimaryIdentityId;
    },
    get getReplyContext () {
        return getReplyContext;
    },
    get getSelfIdentity () {
        return getSelfIdentity;
    },
    get getSenderIdentity () {
        return getSenderIdentity;
    },
    get identitiesOverlap () {
        return identitiesOverlap;
    },
    get resolveComparableIdentity () {
        return resolveComparableIdentity;
    }
});
const _textruntime = require("./text-runtime.js");
const WHATSAPP_LID_RE = /@(lid|hosted\.lid)$/i;
function normalizeDeviceScopedJid(jid) {
    return jid ? jid.replace(/:\d+/, "") : null;
}
function isLidJid(jid) {
    return Boolean(jid && WHATSAPP_LID_RE.test(jid));
}
function resolveComparableIdentity(identity, authDir) {
    const rawJid = normalizeDeviceScopedJid(identity?.jid);
    const rawLid = normalizeDeviceScopedJid(identity?.lid);
    const lid = rawLid ?? (isLidJid(rawJid) ? rawJid : null);
    const jid = rawJid && !isLidJid(rawJid) ? rawJid : null;
    const e164 = identity?.e164 != null ? (0, _textruntime.normalizeE164)(identity.e164) : (jid ? (0, _textruntime.jidToE164)(jid, authDir ? {
        authDir
    } : undefined) : null) ?? (lid ? (0, _textruntime.jidToE164)(lid, authDir ? {
        authDir
    } : undefined) : null);
    return {
        ...identity,
        jid,
        lid,
        e164
    };
}
function getComparableIdentityValues(identity) {
    const resolved = resolveComparableIdentity(identity);
    return [
        resolved.e164,
        resolved.jid,
        resolved.lid
    ].filter((value)=>Boolean(value));
}
function identitiesOverlap(left, right) {
    const leftValues = new Set(getComparableIdentityValues(left));
    if (leftValues.size === 0) {
        return false;
    }
    return getComparableIdentityValues(right).some((value)=>leftValues.has(value));
}
function getSenderIdentity(msg, authDir) {
    return resolveComparableIdentity(msg.sender ?? {
        jid: msg.senderJid ?? null,
        e164: msg.senderE164 ?? null,
        name: msg.senderName ?? null
    }, authDir);
}
function getSelfIdentity(msg, authDir) {
    return resolveComparableIdentity(msg.self ?? {
        jid: msg.selfJid ?? null,
        lid: msg.selfLid ?? null,
        e164: msg.selfE164 ?? null
    }, authDir);
}
function getReplyContext(msg, authDir) {
    if (msg.replyTo) {
        return {
            ...msg.replyTo,
            sender: resolveComparableIdentity(msg.replyTo.sender, authDir)
        };
    }
    if (!msg.replyToBody) {
        return null;
    }
    return {
        id: msg.replyToId,
        body: msg.replyToBody,
        sender: resolveComparableIdentity({
            jid: msg.replyToSenderJid ?? null,
            e164: msg.replyToSenderE164 ?? null,
            label: msg.replyToSender ?? null
        }, authDir)
    };
}
function getMentionJids(msg) {
    return msg.mentions ?? msg.mentionedJids ?? [];
}
function getMentionIdentities(msg, authDir) {
    return getMentionJids(msg).map((jid)=>resolveComparableIdentity({
            jid
        }, authDir));
}
function getPrimaryIdentityId(identity) {
    return identity?.e164 || identity?.jid?.trim() || identity?.lid || null;
}

//# sourceMappingURL=identity.js.map