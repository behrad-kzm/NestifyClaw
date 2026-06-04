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
    get createChannelMessageReplyPipeline () {
        return _runtimeapi.createChannelMessageReplyPipeline;
    },
    get dispatchReplyWithBufferedBlockDispatcher () {
        return _runtimeapi.dispatchReplyWithBufferedBlockDispatcher;
    },
    get finalizeInboundContext () {
        return _runtimeapi.finalizeInboundContext;
    },
    get getAgentScopedMediaLocalRoots () {
        return _runtimeapi.getAgentScopedMediaLocalRoots;
    },
    get jidToE164 () {
        return _runtimeapi.jidToE164;
    },
    get logVerbose () {
        return _runtimeapi.logVerbose;
    },
    get resolveChannelMessageSourceReplyDeliveryMode () {
        return _runtimeapi.resolveChannelMessageSourceReplyDeliveryMode;
    },
    get resolveChunkMode () {
        return _runtimeapi.resolveChunkMode;
    },
    get resolveIdentityNamePrefix () {
        return _runtimeapi.resolveIdentityNamePrefix;
    },
    get resolveInboundLastRouteSessionKey () {
        return _runtimeapi.resolveInboundLastRouteSessionKey;
    },
    get resolveMarkdownTableMode () {
        return _runtimeapi.resolveMarkdownTableMode;
    },
    get resolveSendableOutboundReplyParts () {
        return _runtimeapi.resolveSendableOutboundReplyParts;
    },
    get resolveTextChunkLimit () {
        return _runtimeapi.resolveTextChunkLimit;
    },
    get shouldLogVerbose () {
        return _runtimeapi.shouldLogVerbose;
    },
    get toLocationContext () {
        return _runtimeapi.toLocationContext;
    }
});
const _runtimeapi = require("./runtime-api.js");

//# sourceMappingURL=inbound-dispatch.runtime.js.map