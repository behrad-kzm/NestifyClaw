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
    get formatInboundEnvelope () {
        return _channelinbound.formatInboundEnvelope;
    },
    get resolveMessagePrefix () {
        return resolveMessagePrefix;
    }
});
const _channelinbound = require("../../../../../../common/openclaw/plugin-sdk/channel-inbound");
function normalizeAgentId(agentId) {
    return agentId.trim().toLowerCase() || "main";
}
function resolveIdentityNamePrefix(cfg, agentId) {
    const normalizedAgentId = normalizeAgentId(agentId);
    const identityName = cfg.agents?.list?.find((agent)=>normalizeAgentId(agent.id ?? "") === normalizedAgentId)?.identity?.name?.trim();
    return identityName ? `[${identityName}]` : undefined;
}
function resolveMessagePrefix(cfg, agentId, opts) {
    const configured = opts?.configured ?? cfg.messages?.messagePrefix;
    if (configured !== undefined) {
        return configured;
    }
    if (opts?.hasAllowFrom === true) {
        return "";
    }
    return resolveIdentityNamePrefix(cfg, agentId) ?? opts?.fallback ?? "[openclaw]";
}

//# sourceMappingURL=message-line.runtime.js.map