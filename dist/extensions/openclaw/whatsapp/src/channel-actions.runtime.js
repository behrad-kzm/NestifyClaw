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
    get createActionGate () {
        return _channelactions.createActionGate;
    },
    get listWhatsAppAccountIds () {
        return _accounts.listWhatsAppAccountIds;
    },
    get resolveWhatsAppAccount () {
        return _accounts.resolveWhatsAppAccount;
    },
    get resolveWhatsAppReactionLevel () {
        return _reactionlevel.resolveWhatsAppReactionLevel;
    }
});
const _channelactions = require("../../../../common/openclaw/plugin-sdk/channel-actions");
const _accounts = require("./accounts.js");
const _reactionlevel = require("./reaction-level.js");

//# sourceMappingURL=channel-actions.runtime.js.map