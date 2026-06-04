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
    get resolveAgentDir () {
        return _agentruntime.resolveAgentDir;
    },
    get resolveDefaultAgentId () {
        return _agentruntime.resolveDefaultAgentId;
    },
    get resolveDefaultModelForAgent () {
        return _agentruntime.resolveDefaultModelForAgent;
    }
});
const _agentruntime = require("../../../../common/openclaw/plugin-sdk/agent-runtime");

//# sourceMappingURL=bot-handlers.agent.runtime.js.map