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
    get findModelInCatalog () {
        return _agentruntime.findModelInCatalog;
    },
    get loadModelCatalog () {
        return _agentruntime.loadModelCatalog;
    },
    get modelSupportsVision () {
        return _agentruntime.modelSupportsVision;
    },
    get resolveAgentDir () {
        return _agentruntime.resolveAgentDir;
    },
    get resolveDefaultModelForAgent () {
        return _agentruntime.resolveDefaultModelForAgent;
    }
});
const _agentruntime = require("../../../../common/openclaw/plugin-sdk/agent-runtime");

//# sourceMappingURL=bot-message-dispatch.agent.runtime.js.map