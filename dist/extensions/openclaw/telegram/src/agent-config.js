"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramConfigReasoningDefault", {
    enumerable: true,
    get: function() {
        return resolveTelegramConfigReasoningDefault;
    }
});
const DEFAULT_AGENT_ID = "main";
function normalizeAgentId(value) {
    const normalized = (value ?? "").trim().toLowerCase();
    return normalized || DEFAULT_AGENT_ID;
}
function resolveTelegramConfigReasoningDefault(cfg, agentId) {
    const id = normalizeAgentId(agentId);
    const agentDefault = cfg.agents?.list?.find((entry)=>normalizeAgentId(entry?.id) === id)?.reasoningDefault;
    return agentDefault ?? cfg.agents?.defaults?.reasoningDefault ?? "off";
}

//# sourceMappingURL=agent-config.js.map