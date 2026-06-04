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
    get createWhatsAppDurableInboundMessageId () {
        return createWhatsAppDurableInboundMessageId;
    },
    get createWhatsAppDurableInboundReceiveJournal () {
        return createWhatsAppDurableInboundReceiveJournal;
    },
    get deserializeWhatsAppDurableInboundMessage () {
        return deserializeWhatsAppDurableInboundMessage;
    },
    get serializeWhatsAppDurableInboundMessage () {
        return serializeWhatsAppDurableInboundMessage;
    }
});
const _nodecrypto = require("node:crypto");
const _channeloutbound = require("../../../../../common/openclaw/plugin-sdk/channel-outbound");
const _runtime = require("../runtime.js");
const _sessionruntime = require("../session.runtime.js");
const WHATSAPP_DURABLE_INBOUND_PENDING_MAX_ENTRIES = 450;
const WHATSAPP_DURABLE_INBOUND_COMPLETED_MAX_ENTRIES = 450;
const WHATSAPP_DURABLE_INBOUND_PENDING_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const WHATSAPP_DURABLE_INBOUND_COMPLETED_TTL_MS = 7 * 24 * 60 * 60 * 1000;
function hashNamespacePart(value) {
    return (0, _nodecrypto.createHash)("sha256").update(value).digest("hex").slice(0, 24);
}
function createWhatsAppDurableInboundMessageId(params) {
    return (0, _nodecrypto.createHash)("sha256").update(`${params.remoteJid}\n${params.id}`).digest("hex");
}
function serializeWhatsAppDurableInboundMessage(message) {
    return JSON.parse(JSON.stringify(message, _sessionruntime.BufferJSON.replacer));
}
function deserializeWhatsAppDurableInboundMessage(message) {
    return JSON.parse(JSON.stringify(message), _sessionruntime.BufferJSON.reviver);
}
function createWhatsAppDurableInboundReceiveJournal(accountId) {
    const accountPart = hashNamespacePart(accountId);
    const runtime = (0, _runtime.getWhatsAppRuntime)();
    const queue = runtime.state.openChannelIngressQueue({
        accountId: accountPart,
        stateDir: runtime.state.resolveStateDir()
    });
    return (0, _channeloutbound.createDurableInboundReceiveJournalFromQueue)({
        queue,
        retention: {
            pendingTtlMs: WHATSAPP_DURABLE_INBOUND_PENDING_TTL_MS,
            completedTtlMs: WHATSAPP_DURABLE_INBOUND_COMPLETED_TTL_MS,
            failedTtlMs: WHATSAPP_DURABLE_INBOUND_PENDING_TTL_MS,
            pendingMaxEntries: WHATSAPP_DURABLE_INBOUND_PENDING_MAX_ENTRIES,
            completedMaxEntries: WHATSAPP_DURABLE_INBOUND_COMPLETED_MAX_ENTRIES,
            failedMaxEntries: WHATSAPP_DURABLE_INBOUND_PENDING_MAX_ENTRIES
        }
    });
}

//# sourceMappingURL=durable-receive.js.map