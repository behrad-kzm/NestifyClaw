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
    get isApprovalNotFoundError () {
        return _errorruntime.isApprovalNotFoundError;
    },
    get resolveWhatsAppApproval () {
        return resolveWhatsAppApproval;
    }
});
const _approvalgatewayruntime = require("../../../../common/openclaw/plugin-sdk/approval-gateway-runtime");
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
async function resolveWhatsAppApproval(params) {
    await (0, _approvalgatewayruntime.resolveApprovalOverGateway)({
        cfg: params.cfg,
        approvalId: params.approvalId,
        decision: params.decision,
        senderId: params.senderId,
        gatewayUrl: params.gatewayUrl,
        clientDisplayName: `WhatsApp approval (${params.senderId?.trim() || "unknown"})`
    });
}

//# sourceMappingURL=approval-resolver.js.map