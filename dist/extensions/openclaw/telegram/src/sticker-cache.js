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
    get cacheSticker () {
        return _stickercachestore.cacheSticker;
    },
    get describeStickerImage () {
        return describeStickerImage;
    },
    get getAllCachedStickers () {
        return _stickercachestore.getAllCachedStickers;
    },
    get getCacheStats () {
        return _stickercachestore.getCacheStats;
    },
    get getCachedSticker () {
        return _stickercachestore.getCachedSticker;
    },
    get searchStickers () {
        return _stickercachestore.searchStickers;
    }
});
const _agentruntime = require("../../../../common/openclaw/plugin-sdk/agent-runtime");
const _mediaruntime = require("../../../../common/openclaw/plugin-sdk/media-runtime");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _runtime = require("./runtime.js");
const _stickercachestore = require("./sticker-cache-store.js");
const STICKER_DESCRIPTION_PROMPT = "Describe this sticker image in 1-2 sentences. Focus on what the sticker depicts (character, object, action, emotion). Be concise and objective.";
function isMinimaxVlmProvider(provider) {
    const normalized = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(provider);
    return normalized === "minimax" || normalized === "minimax-cn" || normalized === "minimax-portal" || normalized === "minimax-portal-cn";
}
async function describeStickerImage(params) {
    const { imagePath, cfg, agentDir, agentId } = params;
    const defaultModel = (0, _agentruntime.resolveDefaultModelForAgent)({
        cfg,
        agentId
    });
    let activeModel = undefined;
    let catalog = [];
    try {
        catalog = await (0, _agentruntime.loadModelCatalog)({
            config: cfg
        });
        const entry = (0, _agentruntime.findModelInCatalog)(catalog, defaultModel.provider, defaultModel.model);
        const supportsVision = (0, _agentruntime.modelSupportsVision)(entry);
        if (supportsVision) {
            const model = isMinimaxVlmProvider(defaultModel.provider) ? (0, _mediaruntime.resolveDefaultMediaModel)({
                cfg,
                providerId: defaultModel.provider,
                capability: "image",
                includeConfiguredImageModels: false
            }) : defaultModel.model;
            if (model) {
                activeModel = {
                    provider: defaultModel.provider,
                    model
                };
            }
        }
    } catch  {
    // Ignore catalog failures; fall back to auto selection.
    }
    const hasProviderKey = async (provider)=>{
        try {
            await (0, _agentruntime.resolveApiKeyForProvider)({
                provider,
                cfg,
                agentDir
            });
            return true;
        } catch  {
            return false;
        }
    };
    const autoProviders = (0, _mediaruntime.resolveAutoMediaKeyProviders)({
        cfg,
        capability: "image"
    });
    const selectCatalogModel = (provider)=>{
        const entries = catalog.filter((entry)=>(0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(entry.provider) === (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(provider) && (0, _agentruntime.modelSupportsVision)(entry));
        if (entries.length === 0) {
            return undefined;
        }
        const defaultId = (0, _mediaruntime.resolveDefaultMediaModel)({
            cfg,
            providerId: provider,
            capability: "image",
            includeConfiguredImageModels: !isMinimaxVlmProvider(provider)
        });
        const preferred = entries.find((entry)=>entry.id === defaultId);
        if (isMinimaxVlmProvider(provider)) {
            return preferred;
        }
        return preferred ?? entries[0];
    };
    let resolved = null;
    if (activeModel && autoProviders.includes(activeModel.provider) && await hasProviderKey(activeModel.provider)) {
        resolved = activeModel;
    }
    if (!resolved) {
        for (const provider of autoProviders){
            if (!await hasProviderKey(provider)) {
                continue;
            }
            const entry = selectCatalogModel(provider);
            if (entry) {
                resolved = {
                    provider,
                    model: entry.id
                };
                break;
            }
        }
    }
    if (!resolved) {
        resolved = await (0, _mediaruntime.resolveAutoImageModel)({
            cfg,
            agentDir,
            activeModel
        });
    }
    if (!resolved?.model) {
        (0, _runtimeenv.logVerbose)("telegram: no vision provider available for sticker description");
        return null;
    }
    const { provider, model } = resolved;
    (0, _runtimeenv.logVerbose)(`telegram: describing sticker with ${provider}/${model}`);
    try {
        const result = await (0, _runtime.getTelegramRuntime)().mediaUnderstanding.describeImageFileWithModel({
            filePath: imagePath,
            mime: "image/webp",
            cfg,
            agentDir,
            provider,
            model,
            prompt: STICKER_DESCRIPTION_PROMPT,
            maxTokens: 150,
            timeoutMs: 30_000
        });
        return result.text ?? null;
    } catch (err) {
        (0, _runtimeenv.logVerbose)(`telegram: failed to describe sticker: ${String(err)}`);
        return null;
    }
}

//# sourceMappingURL=sticker-cache.js.map