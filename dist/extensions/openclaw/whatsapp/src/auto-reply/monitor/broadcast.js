"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "maybeBroadcastMessage", {
    enumerable: true,
    get: function() {
        return maybeBroadcastMessage;
    }
});
const _routing = require("../../../../../../common/openclaw/plugin-sdk/routing");
const _groupsessionkey = require("../../group-session-key.js");
const _session = require("../../session.js");
const _loggers = require("../loggers.js");
function buildBroadcastRouteKeys(params) {
    const sessionKey = (0, _routing.buildAgentSessionKey)({
        agentId: params.agentId,
        channel: "whatsapp",
        accountId: params.route.accountId,
        peer: {
            kind: params.msg.chatType === "group" ? "group" : "direct",
            id: params.peerId
        },
        dmScope: params.cfg.session?.dmScope,
        identityLinks: params.cfg.session?.identityLinks
    });
    const mainSessionKey = (0, _routing.buildAgentMainSessionKey)({
        agentId: params.agentId,
        mainKey: _routing.DEFAULT_MAIN_KEY
    });
    return {
        sessionKey,
        mainSessionKey,
        lastRoutePolicy: (0, _routing.deriveLastRoutePolicy)({
            sessionKey,
            mainSessionKey
        })
    };
}
async function maybeBroadcastMessage(params) {
    const broadcastAgents = params.cfg.broadcast?.[params.peerId];
    if (!broadcastAgents || !Array.isArray(broadcastAgents)) {
        return false;
    }
    if (broadcastAgents.length === 0) {
        return false;
    }
    const strategy = params.cfg.broadcast?.strategy || "parallel";
    _loggers.whatsappInboundLog.info(`Broadcasting message to ${broadcastAgents.length} agents (${strategy})`);
    const agentIds = params.cfg.agents?.list?.map((agent)=>(0, _routing.normalizeAgentId)(agent.id));
    const hasKnownAgents = (agentIds?.length ?? 0) > 0;
    const groupHistorySnapshot = params.msg.chatType === "group" ? params.groupHistories.get(params.groupHistoryKey) ?? [] : undefined;
    const processForAgent = async (agentId)=>{
        const normalizedAgentId = (0, _routing.normalizeAgentId)(agentId);
        if (hasKnownAgents && !agentIds?.includes(normalizedAgentId)) {
            _loggers.whatsappInboundLog.warn(`Broadcast agent ${agentId} not found in agents.list; skipping`);
            return false;
        }
        const routeKeys = buildBroadcastRouteKeys({
            cfg: params.cfg,
            msg: params.msg,
            route: params.route,
            peerId: params.peerId,
            agentId: normalizedAgentId
        });
        const baseAgentRoute = {
            ...params.route,
            agentId: normalizedAgentId,
            ...routeKeys
        };
        const agentRoute = params.msg.chatType === "group" ? (0, _groupsessionkey.resolveWhatsAppGroupSessionRoute)(baseAgentRoute) : baseAgentRoute;
        try {
            const opts = {
                groupHistory: groupHistorySnapshot,
                suppressGroupHistoryClear: true
            };
            if (params.preflightAudioTranscript !== undefined) {
                opts.preflightAudioTranscript = params.preflightAudioTranscript;
            }
            if (params.ackAlreadySent === true) {
                opts.ackAlreadySent = true;
            }
            if (params.ackReaction !== undefined) {
                opts.ackReaction = params.ackReaction;
            }
            return await params.processMessage(params.msg, agentRoute, params.groupHistoryKey, opts);
        } catch (err) {
            _loggers.whatsappInboundLog.error(`Broadcast agent ${agentId} failed: ${(0, _session.formatError)(err)}`);
            return false;
        }
    };
    if (strategy === "sequential") {
        for (const agentId of broadcastAgents){
            await processForAgent(agentId);
        }
    } else {
        await Promise.allSettled(broadcastAgents.map(processForAgent));
    }
    if (params.msg.chatType === "group") {
        params.groupHistories.set(params.groupHistoryKey, []);
    }
    return true;
}

//# sourceMappingURL=broadcast.js.map