"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveAuthorizedWhatsAppOutboundTarget", {
    enumerable: true,
    get: function() {
        return resolveAuthorizedWhatsAppOutboundTarget;
    }
});
const _channelactions = require("../../../../common/openclaw/plugin-sdk/channel-actions");
const _accounts = require("./accounts.js");
const _resolveoutboundtarget = require("./resolve-outbound-target.js");
function resolveAuthorizedWhatsAppOutboundTarget(params) {
    const account = (0, _accounts.resolveWhatsAppAccount)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    const resolution = (0, _resolveoutboundtarget.resolveWhatsAppOutboundTarget)({
        to: params.chatJid,
        allowFrom: account.allowFrom ?? [],
        mode: "implicit"
    });
    if (!resolution.ok) {
        throw new _channelactions.ToolAuthorizationError(`WhatsApp ${params.actionLabel} blocked: chatJid "${params.chatJid}" is not in the configured allowFrom list for account "${account.accountId}".`);
    }
    return {
        to: resolution.to,
        accountId: account.accountId
    };
}

//# sourceMappingURL=action-runtime-target-auth.js.map