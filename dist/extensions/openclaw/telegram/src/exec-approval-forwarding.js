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
    get buildTelegramExecApprovalPendingPayload () {
        return buildTelegramExecApprovalPendingPayload;
    },
    get shouldSuppressTelegramExecApprovalForwardingFallback () {
        return shouldSuppressTelegramExecApprovalForwardingFallback;
    }
});
const _approvalreplyruntime = require("../../../../common/openclaw/plugin-sdk/approval-reply-runtime");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _execapprovals = require("./exec-approvals.js");
function shouldSuppressTelegramExecApprovalForwardingFallback(params) {
    const channel = (0, _routing.normalizeMessageChannel)(params.target.channel) ?? params.target.channel;
    if (channel !== "telegram") {
        return false;
    }
    const requestChannel = (0, _routing.normalizeMessageChannel)(params.request.request.turnSourceChannel ?? "");
    if (requestChannel !== "telegram") {
        return false;
    }
    const accountId = params.target.accountId?.trim() || params.request.request.turnSourceAccountId?.trim();
    return (0, _execapprovals.isTelegramExecApprovalClientEnabled)({
        cfg: params.cfg,
        accountId
    });
}
function buildTelegramExecApprovalPendingPayload(params) {
    return (0, _approvalreplyruntime.buildExecApprovalPendingReplyPayload)({
        approvalId: params.request.id,
        approvalSlug: params.request.id.slice(0, 8),
        approvalCommandId: params.request.id,
        warningText: params.request.request.warningText ?? undefined,
        command: (0, _approvalreplyruntime.resolveExecApprovalCommandDisplay)(params.request.request).commandText,
        cwd: params.request.request.cwd ?? undefined,
        host: params.request.request.host === "node" ? "node" : "gateway",
        nodeId: params.request.request.nodeId ?? undefined,
        allowedDecisions: (0, _approvalreplyruntime.resolveExecApprovalRequestAllowedDecisions)(params.request.request),
        expiresAtMs: params.request.expiresAtMs,
        nowMs: params.nowMs
    });
}

//# sourceMappingURL=exec-approval-forwarding.js.map