"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramExecApproval", {
    enumerable: true,
    get: function() {
        return resolveTelegramExecApproval;
    }
});
const _approvalgatewayruntime = require("../../../../common/openclaw/plugin-sdk/approval-gateway-runtime");
async function resolveTelegramExecApproval(params) {
    await (0, _approvalgatewayruntime.resolveApprovalOverGateway)({
        cfg: params.cfg,
        approvalId: params.approvalId,
        decision: params.decision,
        senderId: params.senderId,
        gatewayUrl: params.gatewayUrl,
        allowPluginFallback: params.allowPluginFallback,
        clientDisplayName: `Telegram approval (${params.senderId?.trim() || "unknown"})`
    });
}

//# sourceMappingURL=exec-approval-resolver.js.map