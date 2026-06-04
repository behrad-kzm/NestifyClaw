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
    get __testing () {
        return testing;
    },
    get checkInboundAccessControl () {
        return checkInboundAccessControl;
    },
    get testing () {
        return testing;
    }
});
const _channelpairing = require("../../../../../common/openclaw/plugin-sdk/channel-pairing");
const _conversationruntime = require("../../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _runtimeenv = require("../../../../../common/openclaw/plugin-sdk/runtime-env");
const _runtimegrouppolicy = require("../../../../../common/openclaw/plugin-sdk/runtime-group-policy");
const _inboundpolicy = require("../inbound-policy.js");
const PAIRING_REPLY_HISTORY_GRACE_MS = 30_000;
function logWhatsAppVerbose(enabled, message) {
    if (!enabled) {
        return;
    }
    _runtimeenv.defaultRuntime.log(message);
}
async function checkInboundAccessControl(params) {
    const policy = (0, _inboundpolicy.resolveWhatsAppInboundPolicy)({
        cfg: params.cfg,
        accountId: params.accountId,
        selfE164: params.selfE164
    });
    const pairingGraceMs = typeof params.pairingGraceMs === "number" && params.pairingGraceMs > 0 ? params.pairingGraceMs : PAIRING_REPLY_HISTORY_GRACE_MS;
    const suppressPairingReply = typeof params.connectedAtMs === "number" && typeof params.messageTimestampMs === "number" && params.messageTimestampMs < params.connectedAtMs - pairingGraceMs;
    // Group policy filtering:
    // - "open": groups bypass allowFrom, only mention-gating applies
    // - "disabled": block all group messages entirely
    // - "allowlist": only allow group messages from senders in groupAllowFrom/allowFrom
    (0, _runtimegrouppolicy.warnMissingProviderGroupPolicyFallbackOnce)({
        providerMissingFallbackApplied: policy.providerMissingFallbackApplied,
        providerKey: "whatsapp",
        accountId: policy.account.accountId,
        log: (message)=>logWhatsAppVerbose(params.verbose, message)
    });
    const access = await (0, _inboundpolicy.resolveWhatsAppIngressAccess)({
        cfg: params.cfg,
        policy,
        isGroup: params.group,
        conversationId: params.remoteJid,
        senderId: params.group ? params.senderE164 : params.from,
        dmSenderId: params.from
    });
    const { senderAccess } = access;
    if (params.group && senderAccess.decision !== "allow") {
        if (senderAccess.reasonCode === "group_policy_disabled") {
            logWhatsAppVerbose(params.verbose, "Blocked group message (groupPolicy: disabled)");
        } else if (senderAccess.reasonCode === "group_policy_empty_allowlist") {
            logWhatsAppVerbose(params.verbose, "Blocked group message (groupPolicy: allowlist, no groupAllowFrom)");
        } else {
            logWhatsAppVerbose(params.verbose, `Blocked group message from ${params.senderE164 ?? "unknown sender"} (groupPolicy: allowlist)`);
        }
        return {
            allowed: false,
            shouldMarkRead: false,
            isSelfChat: policy.isSelfChat,
            resolvedAccountId: policy.account.accountId
        };
    }
    // DM access control (secure defaults): "pairing" (default) / "allowlist" / "open" / "disabled".
    if (!params.group) {
        if (params.isFromMe && !policy.isSamePhone(params.from)) {
            logWhatsAppVerbose(params.verbose, "Skipping outbound DM (fromMe); no pairing reply needed.");
            return {
                allowed: false,
                shouldMarkRead: false,
                isSelfChat: policy.isSelfChat,
                resolvedAccountId: policy.account.accountId
            };
        }
        if (senderAccess.decision === "block" && senderAccess.reasonCode === "dm_policy_disabled") {
            logWhatsAppVerbose(params.verbose, "Blocked dm (dmPolicy: disabled)");
            return {
                allowed: false,
                shouldMarkRead: false,
                isSelfChat: policy.isSelfChat,
                resolvedAccountId: policy.account.accountId
            };
        }
        if (senderAccess.decision === "pairing" && !policy.isSamePhone(params.from)) {
            const candidate = params.from;
            if (suppressPairingReply) {
                logWhatsAppVerbose(params.verbose, `Skipping pairing reply for historical DM from ${candidate}.`);
            } else {
                await (0, _channelpairing.createChannelPairingChallengeIssuer)({
                    channel: "whatsapp",
                    upsertPairingRequest: async ({ id, meta })=>await (0, _conversationruntime.upsertChannelPairingRequest)({
                            channel: "whatsapp",
                            id,
                            accountId: policy.account.accountId,
                            meta
                        })
                })({
                    senderId: candidate,
                    senderIdLine: `Your WhatsApp phone number: ${candidate}`,
                    meta: {
                        name: (params.pushName ?? "").trim() || undefined
                    },
                    onCreated: ()=>{
                        logWhatsAppVerbose(params.verbose, `whatsapp pairing request sender=${candidate} name=${params.pushName ?? "unknown"}`);
                    },
                    sendPairingReply: async (text)=>{
                        await params.sock.sendMessage(params.remoteJid, {
                            text
                        });
                    },
                    onReplyError: (err)=>{
                        logWhatsAppVerbose(params.verbose, `whatsapp pairing reply failed for ${candidate}: ${String(err)}`);
                    }
                });
            }
            return {
                allowed: false,
                shouldMarkRead: false,
                isSelfChat: policy.isSelfChat,
                resolvedAccountId: policy.account.accountId
            };
        }
        if (senderAccess.decision !== "allow") {
            logWhatsAppVerbose(params.verbose, `Blocked unauthorized sender ${params.from} (dmPolicy=${policy.dmPolicy})`);
            return {
                allowed: false,
                shouldMarkRead: false,
                isSelfChat: policy.isSelfChat,
                resolvedAccountId: policy.account.accountId
            };
        }
    }
    return {
        allowed: true,
        shouldMarkRead: true,
        isSelfChat: policy.isSelfChat,
        resolvedAccountId: policy.account.accountId
    };
}
const testing = {
    resolveWhatsAppInboundPolicy: _inboundpolicy.resolveWhatsAppInboundPolicy
};

//# sourceMappingURL=access-control.js.map