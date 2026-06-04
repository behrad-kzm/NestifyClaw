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
    get combineWhatsAppSendResults () {
        return combineWhatsAppSendResults;
    },
    get listWhatsAppSendResultMessageIds () {
        return listWhatsAppSendResultMessageIds;
    },
    get normalizeWhatsAppSendResult () {
        return normalizeWhatsAppSendResult;
    }
});
const _channeloutbound = require("../../../../../common/openclaw/plugin-sdk/channel-outbound");
const _stringcoerceruntime = require("../../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
function resolveWhatsAppReceiptKind(kind) {
    if (kind === "media" || kind === "text") {
        return kind;
    }
    return "unknown";
}
function toReceiptSourceResult(key) {
    return {
        channel: "whatsapp",
        messageId: key.id,
        ...key.remoteJid ? {
            toJid: key.remoteJid
        } : {},
        meta: {
            fromMe: key.fromMe,
            participant: key.participant
        }
    };
}
function createWhatsAppSendReceipt(kind, keys) {
    return (0, _channeloutbound.createMessageReceiptFromOutboundResults)({
        kind: resolveWhatsAppReceiptKind(kind),
        results: keys.map(toReceiptSourceResult)
    });
}
function normalizeKey(key) {
    const id = typeof key?.id === "string" ? key.id.trim() : "";
    if (!id) {
        return undefined;
    }
    return {
        id,
        remoteJid: key?.remoteJid,
        fromMe: key?.fromMe,
        participant: key?.participant
    };
}
function normalizeWhatsAppSendResult(result, kind) {
    const key = normalizeKey(result?.key);
    const messageId = key?.id ?? "unknown";
    return {
        kind,
        messageId,
        receipt: createWhatsAppSendReceipt(kind, key ? [
            key
        ] : []),
        keys: key ? [
            key
        ] : [],
        providerAccepted: Boolean(key)
    };
}
function combineWhatsAppSendResults(kind, results) {
    const messageIds = (0, _stringcoerceruntime.uniqueStrings)(results.flatMap(listWhatsAppSendResultMessageIds));
    const keys = results.flatMap((result)=>result.keys);
    return {
        kind,
        messageId: messageIds[0] ?? "unknown",
        receipt: createWhatsAppSendReceipt(kind, keys),
        keys,
        providerAccepted: results.some((result)=>result.providerAccepted)
    };
}
function listWhatsAppSendResultMessageIds(result) {
    const receiptIds = result.receipt ? (0, _channeloutbound.listMessageReceiptPlatformIds)(result.receipt) : [];
    if (receiptIds.length > 0) {
        return receiptIds;
    }
    const keyIds = (0, _stringcoerceruntime.normalizeStringEntries)(result.keys.map((key)=>key.id));
    if (keyIds.length > 0) {
        return (0, _stringcoerceruntime.uniqueStrings)(keyIds);
    }
    return [];
}

//# sourceMappingURL=send-result.js.map