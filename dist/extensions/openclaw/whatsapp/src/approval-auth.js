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
    get getWhatsAppApprovalApprovers () {
        return getWhatsAppApprovalApprovers;
    },
    get normalizeWhatsAppApproverId () {
        return normalizeWhatsAppApproverId;
    },
    get whatsappApprovalAuth () {
        return whatsappApprovalAuth;
    }
});
const _approvalauthruntime = require("../../../../common/openclaw/plugin-sdk/approval-auth-runtime");
const _accounts = require("./accounts.js");
const _normalize = require("./normalize.js");
function normalizeWhatsAppApproverId(value) {
    const normalized = (0, _normalize.normalizeWhatsAppTarget)(String(value));
    if (!normalized || normalized.endsWith("@g.us")) {
        return undefined;
    }
    return normalized;
}
function normalizeWhatsAppApproverEntry(value) {
    return String(value).trim() === "*" ? "*" : normalizeWhatsAppApproverId(value);
}
function getWhatsAppApprovalApprovers(params) {
    const account = (0, _accounts.resolveWhatsAppAccount)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    return (0, _approvalauthruntime.resolveApprovalApprovers)({
        allowFrom: account.allowFrom,
        normalizeApprover: normalizeWhatsAppApproverEntry
    });
}
const whatsappResolvedApproverAuth = (0, _approvalauthruntime.createResolvedApproverActionAuthAdapter)({
    channelLabel: "WhatsApp",
    resolveApprovers: ({ cfg, accountId })=>getWhatsAppApprovalApprovers({
            cfg,
            accountId
        }),
    normalizeSenderId: (value)=>normalizeWhatsAppApproverId(value)
});
const whatsappApprovalAuth = {
    authorizeActorAction ({ cfg, accountId, senderId, approvalKind }) {
        if (getWhatsAppApprovalApprovers({
            cfg,
            accountId
        }).includes("*")) {
            return {
                authorized: true
            };
        }
        return whatsappResolvedApproverAuth.authorizeActorAction({
            cfg,
            accountId,
            senderId,
            action: "approve",
            approvalKind
        });
    }
};

//# sourceMappingURL=approval-auth.js.map