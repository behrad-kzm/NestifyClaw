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
    get resolveTelegramConversationBaseSessionKey () {
        return resolveTelegramConversationBaseSessionKey;
    },
    get resolveTelegramConversationRoute () {
        return resolveTelegramConversationRoute;
    }
});
const _conversationruntime = require("../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accounts = require("./accounts.js");
const _helpers = require("./bot/helpers.js");
function resolveTelegramConversationRoute(params) {
    const peerId = params.isGroup ? (0, _helpers.buildTelegramGroupPeerId)(params.chatId, params.resolvedThreadId) : (0, _helpers.resolveTelegramDirectPeerId)({
        chatId: params.chatId,
        senderId: params.senderId
    });
    const parentPeer = (0, _helpers.buildTelegramParentPeer)({
        isGroup: params.isGroup,
        resolvedThreadId: params.resolvedThreadId,
        chatId: params.chatId
    });
    let route = (0, _routing.resolveAgentRoute)({
        cfg: params.cfg,
        channel: "telegram",
        accountId: params.accountId,
        peer: {
            kind: params.isGroup ? "group" : "direct",
            id: peerId
        },
        parentPeer
    });
    const rawTopicAgentId = params.topicAgentId?.trim();
    if (rawTopicAgentId) {
        // Preserve the configured topic agent ID so topic-bound sessions stay stable
        // even when that agent is not present in the current config snapshot.
        const topicAgentId = (0, _routing.sanitizeAgentId)(rawTopicAgentId);
        const sessionKey = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)((0, _routing.buildAgentSessionKey)({
            agentId: topicAgentId,
            channel: "telegram",
            accountId: params.accountId,
            peer: {
                kind: params.isGroup ? "group" : "direct",
                id: peerId
            },
            dmScope: params.cfg.session?.dmScope,
            identityLinks: params.cfg.session?.identityLinks
        }));
        const mainSessionKey = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)((0, _routing.buildAgentMainSessionKey)({
            agentId: topicAgentId
        }));
        route = {
            ...route,
            agentId: topicAgentId,
            sessionKey,
            mainSessionKey,
            lastRoutePolicy: (0, _routing.deriveLastRoutePolicy)({
                sessionKey,
                mainSessionKey
            })
        };
        (0, _runtimeenv.logVerbose)(`telegram: topic route override: topic=${params.resolvedThreadId ?? params.replyThreadId} agent=${topicAgentId} sessionKey=${route.sessionKey}`);
    }
    const configuredRoute = (0, _conversationruntime.resolveConfiguredBindingRoute)({
        cfg: params.cfg,
        route,
        conversation: {
            channel: "telegram",
            accountId: params.accountId,
            conversationId: peerId,
            parentConversationId: params.isGroup ? String(params.chatId) : undefined
        }
    });
    route = configuredRoute.route;
    let bindingMode = configuredRoute.bindingResolution ? {
        kind: "configured",
        binding: configuredRoute.bindingResolution,
        sessionKey: configuredRoute.boundSessionKey ?? route.sessionKey
    } : {
        kind: "none"
    };
    const runtimeBindingConversationId = params.replyThreadId != null ? `${params.chatId}:topic:${params.replyThreadId}` : String(params.chatId);
    const runtimeRoute = (0, _conversationruntime.resolveRuntimeConversationBindingRoute)({
        route,
        conversation: {
            channel: "telegram",
            accountId: params.accountId,
            conversationId: runtimeBindingConversationId
        }
    });
    route = runtimeRoute.route;
    if (runtimeRoute.bindingRecord) {
        bindingMode = runtimeRoute.boundSessionKey ? {
            kind: "runtime-bound",
            sessionKey: runtimeRoute.boundSessionKey
        } : {
            kind: "plugin-owned-runtime"
        };
        (0, _runtimeenv.logVerbose)(runtimeRoute.boundSessionKey ? `telegram: routed via bound conversation ${runtimeBindingConversationId} -> ${runtimeRoute.boundSessionKey}` : `telegram: plugin-bound conversation ${runtimeBindingConversationId}`);
    }
    return {
        route,
        bindingMode
    };
}
function resolveTelegramConversationBaseSessionKey(params) {
    const routeAccountId = (0, _routing.normalizeAccountId)(params.route.accountId);
    const defaultAccountId = (0, _routing.normalizeAccountId)((0, _accounts.resolveDefaultTelegramAccountId)(params.cfg));
    const isNamedAccountFallback = routeAccountId !== defaultAccountId && params.route.matchedBy === "default";
    if (!isNamedAccountFallback || params.isGroup) {
        return params.route.sessionKey;
    }
    return (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)((0, _routing.buildAgentSessionKey)({
        agentId: params.route.agentId,
        channel: "telegram",
        accountId: params.route.accountId,
        peer: {
            kind: "direct",
            id: (0, _helpers.resolveTelegramDirectPeerId)({
                chatId: params.chatId,
                senderId: params.senderId
            })
        },
        dmScope: "per-account-channel-peer",
        identityLinks: params.cfg.session?.identityLinks
    }));
}

//# sourceMappingURL=conversation-route.js.map