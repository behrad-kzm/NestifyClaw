"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveStickerVisionSupportRuntime", {
    enumerable: true,
    get: function() {
        return resolveStickerVisionSupportRuntime;
    }
});
const _agentruntime = require("../../../../common/openclaw/plugin-sdk/agent-runtime");
async function resolveStickerVisionSupportRuntime(params) {
    const catalog = await (0, _agentruntime.loadModelCatalog)({
        config: params.cfg
    });
    const defaultModel = (0, _agentruntime.resolveDefaultModelForAgent)({
        cfg: params.cfg,
        agentId: params.agentId
    });
    const entry = (0, _agentruntime.findModelInCatalog)(catalog, defaultModel.provider, defaultModel.model);
    if (!entry) {
        return false;
    }
    return (0, _agentruntime.modelSupportsVision)(entry);
}

//# sourceMappingURL=sticker-vision.runtime.js.map