"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "telegramApprovalNativeRuntime", {
    enumerable: true,
    get: function() {
        return telegramApprovalNativeRuntime;
    }
});
const _approvalhandlerruntime = require("../../../../common/openclaw/plugin-sdk/approval-handler-runtime");
const _approvalnativeruntime = require("../../../../common/openclaw/plugin-sdk/approval-native-runtime");
const _approvalreplyruntime = require("../../../../common/openclaw/plugin-sdk/approval-reply-runtime");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _buttontypes = require("./button-types.js");
const _execapprovals = require("./exec-approvals.js");
const _send = require("./send.js");
const log = (0, _runtimeenv.createSubsystemLogger)("telegram/approvals");
function resolveHandlerContext(params) {
    const context = params.context;
    const accountId = (0, _stringcoerceruntime.normalizeOptionalString)(params.accountId) ?? "";
    if (!context?.token || !accountId) {
        return null;
    }
    return {
        accountId,
        context
    };
}
function buildPendingPayload(params) {
    const payload = params.approvalKind === "plugin" ? (0, _approvalreplyruntime.buildPluginApprovalPendingReplyPayload)({
        request: params.request,
        nowMs: params.nowMs
    }) : (0, _approvalreplyruntime.buildExecApprovalPendingReplyPayload)({
        approvalId: params.request.id,
        approvalSlug: params.request.id.slice(0, 8),
        approvalCommandId: params.request.id,
        warningText: params.view.approvalKind === "exec" ? params.view.warningText ?? undefined : undefined,
        command: params.view.approvalKind === "exec" ? params.view.commandText : "",
        cwd: params.view.approvalKind === "exec" ? params.view.cwd ?? undefined : undefined,
        host: params.view.approvalKind === "exec" && params.view.host === "node" ? "node" : "gateway",
        nodeId: params.view.approvalKind === "exec" ? params.view.nodeId ?? undefined : undefined,
        allowedDecisions: params.view.actions.map((action)=>action.decision),
        expiresAtMs: params.request.expiresAtMs,
        nowMs: params.nowMs
    });
    return {
        text: payload.text ?? "",
        buttons: (0, _buttontypes.resolveTelegramInlineButtons)({
            presentation: (0, _approvalreplyruntime.buildApprovalPresentationFromActionDescriptors)(params.view.actions)
        })
    };
}
const telegramApprovalNativeRuntime = (0, _approvalhandlerruntime.createChannelApprovalNativeRuntimeAdapter)({
    eventKinds: [
        "exec",
        "plugin"
    ],
    availability: {
        isConfigured: (params)=>{
            const resolved = resolveHandlerContext(params);
            return resolved ? (0, _execapprovals.isTelegramExecApprovalHandlerConfigured)({
                cfg: params.cfg,
                accountId: resolved.accountId
            }) : false;
        },
        shouldHandle: (params)=>{
            const resolved = resolveHandlerContext(params);
            return resolved ? (0, _execapprovals.shouldHandleTelegramExecApprovalRequest)({
                cfg: params.cfg,
                accountId: resolved.accountId,
                request: params.request
            }) : false;
        }
    },
    presentation: {
        buildPendingPayload: ({ request, approvalKind, nowMs, view })=>buildPendingPayload({
                request,
                approvalKind,
                nowMs,
                view
            }),
        buildResolvedResult: ()=>({
                kind: "clear-actions"
            }),
        buildExpiredResult: ()=>({
                kind: "clear-actions"
            })
    },
    transport: {
        prepareTarget: ({ plannedTarget })=>({
                dedupeKey: (0, _approvalnativeruntime.buildChannelApprovalNativeTargetKey)(plannedTarget.target),
                target: {
                    chatId: plannedTarget.target.to,
                    messageThreadId: typeof plannedTarget.target.threadId === "number" ? plannedTarget.target.threadId : undefined
                }
            }),
        deliverPending: async ({ cfg, accountId, context, preparedTarget, pendingPayload })=>{
            const resolved = resolveHandlerContext({
                cfg,
                accountId,
                context
            });
            if (!resolved) {
                return null;
            }
            const sendTyping = resolved.context.deps?.sendTyping ?? _send.sendTypingTelegram;
            const sendMessage = resolved.context.deps?.sendMessage ?? _send.sendMessageTelegram;
            await sendTyping(preparedTarget.chatId, {
                cfg,
                token: resolved.context.token,
                accountId: resolved.accountId,
                ...preparedTarget.messageThreadId != null ? {
                    messageThreadId: preparedTarget.messageThreadId
                } : {}
            }).catch(()=>{});
            const result = await sendMessage(preparedTarget.chatId, pendingPayload.text, {
                cfg,
                token: resolved.context.token,
                accountId: resolved.accountId,
                buttons: pendingPayload.buttons,
                ...preparedTarget.messageThreadId != null ? {
                    messageThreadId: preparedTarget.messageThreadId
                } : {}
            });
            return {
                chatId: result.chatId,
                messageId: result.messageId
            };
        }
    },
    interactions: {
        clearPendingActions: async ({ cfg, accountId, context, entry })=>{
            const resolved = resolveHandlerContext({
                cfg,
                accountId,
                context
            });
            if (!resolved) {
                return;
            }
            const editReplyMarkup = resolved.context.deps?.editReplyMarkup ?? _send.editMessageReplyMarkupTelegram;
            await editReplyMarkup(entry.chatId, entry.messageId, [], {
                cfg,
                token: resolved.context.token,
                accountId: resolved.accountId
            });
        }
    },
    observe: {
        onDeliveryError: ({ error, request })=>{
            log.error(`telegram approvals: failed to send request ${request.id}: ${String(error)}`);
        }
    }
});

//# sourceMappingURL=approval-handler.runtime.js.map