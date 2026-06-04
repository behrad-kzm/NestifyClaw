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
    get buildChannelInboundEventContext () {
        return _channelinbound.buildChannelInboundEventContext;
    },
    get readSessionUpdatedAt () {
        return _sessionstoreruntime.readSessionUpdatedAt;
    },
    get recordInboundSession () {
        return _conversationruntime.recordInboundSession;
    },
    get resolveInboundLastRouteSessionKey () {
        return _routing.resolveInboundLastRouteSessionKey;
    },
    get resolvePinnedMainDmOwnerFromAllowlist () {
        return _securityruntime.resolvePinnedMainDmOwnerFromAllowlist;
    },
    get resolveStorePath () {
        return _sessionstoreruntime.resolveStorePath;
    }
});
const _channelinbound = require("../../../../common/openclaw/plugin-sdk/channel-inbound");
const _sessionstoreruntime = require("../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _conversationruntime = require("../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _securityruntime = require("../../../../common/openclaw/plugin-sdk/security-runtime");

//# sourceMappingURL=bot-message-context.session.runtime.js.map