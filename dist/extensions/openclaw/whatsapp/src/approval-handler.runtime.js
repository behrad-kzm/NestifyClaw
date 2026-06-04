"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "whatsappApprovalNativeRuntime", {
    enumerable: true,
    get: function() {
        return whatsappApprovalNativeRuntime;
    }
});
const _approvalhandlerruntime = require("../../../../common/openclaw/plugin-sdk/approval-handler-runtime");
const _approvalnativeruntime = require("../../../../common/openclaw/plugin-sdk/approval-native-runtime");
const _approvalreactionruntime = require("../../../../common/openclaw/plugin-sdk/approval-reaction-runtime");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _approvalreactions = require("./approval-reactions.js");
const _normalize = require("./normalize.js");
const _runtime = require("./runtime.js");
const _send = require("./send.js");
const log = (0, _runtimeenv.createSubsystemLogger)("whatsapp/approvals");
function buildPendingPayload(params) {
    return (0, _approvalreactionruntime.buildApprovalReactionPendingContent)(params);
}
const whatsappApprovalNativeRuntime = (0, _approvalhandlerruntime.createChannelApprovalNativeRuntimeAdapter)({
    eventKinds: [
        "exec",
        "plugin"
    ],
    availability: {
        isConfigured: ({ context })=>Boolean(context),
        shouldHandle: ({ context })=>Boolean(context)
    },
    presentation: {
        buildPendingPayload: ({ request, nowMs, view })=>buildPendingPayload({
                request,
                view,
                nowMs
            }),
        buildResolvedResult: ({ request, resolved, view })=>({
                kind: "update",
                payload: {
                    text: (0, _approvalhandlerruntime.buildChannelApprovalResolvedText)({
                        request,
                        resolved,
                        view
                    })
                }
            }),
        buildExpiredResult: ({ request, view })=>({
                kind: "update",
                payload: {
                    text: (0, _approvalhandlerruntime.buildChannelApprovalExpiredText)({
                        request,
                        view
                    })
                }
            })
    },
    transport: {
        prepareTarget: ({ plannedTarget, accountId })=>{
            const to = (0, _normalize.normalizeWhatsAppMessagingTarget)(plannedTarget.target.to);
            if (!to) {
                return null;
            }
            const prepared = {
                to,
                accountId: (0, _approvalhandlerruntime.resolvePreparedApprovalAccountId)({
                    plannedAccountId: plannedTarget.target.accountId,
                    contextAccountId: accountId
                })
            };
            return {
                dedupeKey: `${prepared.accountId ?? ""}:${(0, _approvalnativeruntime.buildChannelApprovalNativeTargetKey)({
                    to: prepared.to
                })}`,
                target: prepared
            };
        },
        deliverPending: async ({ cfg, preparedTarget, pendingPayload })=>{
            const verbose = (0, _runtime.getWhatsAppRuntime)().logging.shouldLogVerbose();
            await (0, _send.sendTypingWhatsApp)(preparedTarget.to, {
                cfg,
                ...preparedTarget.accountId ? {
                    accountId: preparedTarget.accountId
                } : {}
            }).catch(()=>{});
            const result = await (0, _send.sendMessageWhatsApp)(preparedTarget.to, pendingPayload.reactionPayload.text ?? "", {
                cfg,
                verbose,
                preserveLeadingWhitespace: true,
                ...preparedTarget.accountId ? {
                    accountId: preparedTarget.accountId
                } : {}
            });
            if (!result.messageId) {
                return null;
            }
            return {
                accountId: preparedTarget.accountId,
                to: preparedTarget.to,
                remoteJid: result.toJid,
                messageId: result.messageId
            };
        },
        updateEntry: async ({ cfg, entry, payload })=>{
            const verbose = (0, _runtime.getWhatsAppRuntime)().logging.shouldLogVerbose();
            await (0, _send.sendMessageWhatsApp)(entry.to, payload.text, {
                cfg,
                verbose,
                preserveLeadingWhitespace: true,
                ...entry.accountId ? {
                    accountId: entry.accountId
                } : {},
                quotedMessageKey: {
                    id: entry.messageId,
                    remoteJid: entry.remoteJid,
                    fromMe: true
                }
            });
        }
    },
    interactions: {
        bindPending: ({ entry, request, view, pendingPayload })=>(0, _approvalreactions.registerWhatsAppApprovalReactionTarget)({
                accountId: entry.accountId ?? "",
                remoteJid: entry.remoteJid,
                messageId: entry.messageId,
                approvalId: request.id,
                allowedDecisions: pendingPayload.reactionPayload.allowedDecisions,
                ttlMs: Math.max(1, view.expiresAtMs - Date.now())
            }) ? true : null,
        unbindPending: ({ entry })=>{
            (0, _approvalreactions.unregisterWhatsAppApprovalReactionTarget)({
                accountId: entry.accountId ?? "",
                remoteJid: entry.remoteJid,
                messageId: entry.messageId
            });
        },
        cancelDelivered: ({ entry })=>{
            (0, _approvalreactions.unregisterWhatsAppApprovalReactionTarget)({
                accountId: entry.accountId ?? "",
                remoteJid: entry.remoteJid,
                messageId: entry.messageId
            });
        }
    },
    observe: {
        onDeliveryError: ({ error, request })=>{
            log.error(`whatsapp approvals: failed to send request ${request.id}: ${String(error)}`);
        }
    }
});

//# sourceMappingURL=approval-handler.runtime.js.map