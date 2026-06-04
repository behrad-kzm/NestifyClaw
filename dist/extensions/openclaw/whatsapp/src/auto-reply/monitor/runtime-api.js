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
    get buildHistoryContextFromEntries () {
        return _replyhistory.buildHistoryContextFromEntries;
    },
    get createChannelMessageReplyPipeline () {
        return _channeloutbound.createChannelMessageReplyPipeline;
    },
    get dispatchReplyWithBufferedBlockDispatcher () {
        return _replyruntime.dispatchReplyWithBufferedBlockDispatcher;
    },
    get finalizeInboundContext () {
        return _replyruntime.finalizeInboundContext;
    },
    get formatInboundEnvelope () {
        return _channelinbound.formatInboundEnvelope;
    },
    get getAgentScopedMediaLocalRoots () {
        return _mediaruntime.getAgentScopedMediaLocalRoots;
    },
    get isControlCommandMessage () {
        return _commanddetection.isControlCommandMessage;
    },
    get jidToE164 () {
        return _textruntime.jidToE164;
    },
    get logVerbose () {
        return _runtimeenv.logVerbose;
    },
    get normalizeE164 () {
        return _textruntime.normalizeE164;
    },
    get resolveChannelContextVisibilityMode () {
        return _configruntime.resolveChannelContextVisibilityMode;
    },
    get resolveChannelMessageSourceReplyDeliveryMode () {
        return _channeloutbound.resolveChannelMessageSourceReplyDeliveryMode;
    },
    get resolveChunkMode () {
        return _replyruntime.resolveChunkMode;
    },
    get resolveIdentityNamePrefix () {
        return _agentruntime.resolveIdentityNamePrefix;
    },
    get resolveInboundLastRouteSessionKey () {
        return _routing.resolveInboundLastRouteSessionKey;
    },
    get resolveInboundSessionEnvelopeContext () {
        return _channelinbound.resolveInboundSessionEnvelopeContext;
    },
    get resolveMarkdownTableMode () {
        return _markdowntableruntime.resolveMarkdownTableMode;
    },
    get resolvePinnedMainDmOwnerFromAllowlist () {
        return _securityruntime.resolvePinnedMainDmOwnerFromAllowlist;
    },
    get resolveSendableOutboundReplyParts () {
        return _replypayload.resolveSendableOutboundReplyParts;
    },
    get resolveTextChunkLimit () {
        return _replyruntime.resolveTextChunkLimit;
    },
    get shouldComputeCommandAuthorized () {
        return _commanddetection.shouldComputeCommandAuthorized;
    },
    get shouldLogVerbose () {
        return _runtimeenv.shouldLogVerbose;
    },
    get toLocationContext () {
        return _channelinbound.toLocationContext;
    }
});
const _agentruntime = require("../../../../../../common/openclaw/plugin-sdk/agent-runtime");
const _channelinbound = require("../../../../../../common/openclaw/plugin-sdk/channel-inbound");
const _channeloutbound = require("../../../../../../common/openclaw/plugin-sdk/channel-outbound");
const _commanddetection = require("../../../../../../common/openclaw/plugin-sdk/command-detection");
const _configruntime = require("../config.runtime.js");
const _mediaruntime = require("../../../../../../common/openclaw/plugin-sdk/media-runtime");
const _replyhistory = require("../../../../../../common/openclaw/plugin-sdk/reply-history");
const _replypayload = require("../../../../../../common/openclaw/plugin-sdk/reply-payload");
const _replyruntime = require("../../../../../../common/openclaw/plugin-sdk/reply-runtime");
const _routing = require("../../../../../../common/openclaw/plugin-sdk/routing");
const _runtimeenv = require("../../../../../../common/openclaw/plugin-sdk/runtime-env");
const _securityruntime = require("../../../../../../common/openclaw/plugin-sdk/security-runtime");
const _markdowntableruntime = require("../../../../../../common/openclaw/plugin-sdk/markdown-table-runtime");
const _textruntime = require("../../text-runtime.js");

//# sourceMappingURL=runtime-api.js.map