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
    get handleWhatsAppAction () {
        return _actionruntime.handleWhatsAppAction;
    },
    get isWhatsAppGroupJid () {
        return _normalize.isWhatsAppGroupJid;
    },
    get normalizeWhatsAppTarget () {
        return _normalize.normalizeWhatsAppTarget;
    },
    get readStringOrNumberParam () {
        return _channelactions.readStringOrNumberParam;
    },
    get readStringParam () {
        return _channelactions.readStringParam;
    },
    get resolveAuthorizedWhatsAppOutboundTarget () {
        return _actionruntimetargetauth.resolveAuthorizedWhatsAppOutboundTarget;
    },
    get resolveReactionMessageId () {
        return _channelactions.resolveReactionMessageId;
    },
    get resolveWhatsAppAccount () {
        return _accounts.resolveWhatsAppAccount;
    },
    get resolveWhatsAppMediaMaxBytes () {
        return _accounts.resolveWhatsAppMediaMaxBytes;
    },
    get sendMessageWhatsApp () {
        return _send.sendMessageWhatsApp;
    }
});
const _channelactions = require("../../../../common/openclaw/plugin-sdk/channel-actions");
const _actionruntime = require("./action-runtime.js");
const _actionruntimetargetauth = require("./action-runtime-target-auth.js");
const _accounts = require("./accounts.js");
const _normalize = require("./normalize.js");
const _send = require("./send.js");

//# sourceMappingURL=channel-react-action.runtime.js.map