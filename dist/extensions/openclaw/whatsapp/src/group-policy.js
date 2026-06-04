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
    get resolveWhatsAppGroupRequireMention () {
        return resolveWhatsAppGroupRequireMention;
    },
    get resolveWhatsAppGroupToolPolicy () {
        return resolveWhatsAppGroupToolPolicy;
    }
});
const _channelpolicy = require("../../../../common/openclaw/plugin-sdk/channel-policy");
function resolveWhatsAppGroupRequireMention(params) {
    return (0, _channelpolicy.resolveChannelGroupRequireMention)({
        cfg: params.cfg,
        channel: "whatsapp",
        groupId: params.groupId,
        accountId: params.accountId
    });
}
function resolveWhatsAppGroupToolPolicy(params) {
    return (0, _channelpolicy.resolveChannelGroupToolsPolicy)({
        cfg: params.cfg,
        channel: "whatsapp",
        groupId: params.groupId,
        accountId: params.accountId,
        senderId: params.senderId,
        senderName: params.senderName,
        senderUsername: params.senderUsername,
        senderE164: params.senderE164
    });
}

//# sourceMappingURL=group-policy.js.map