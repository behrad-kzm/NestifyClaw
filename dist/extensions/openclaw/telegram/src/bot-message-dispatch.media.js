"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "pruneStickerMediaFromContext", {
    enumerable: true,
    get: function() {
        return pruneStickerMediaFromContext;
    }
});
function pruneStickerMediaFromContext(ctxPayload, opts) {
    if (opts?.stickerMediaIncluded === false) {
        return;
    }
    const nextMediaPaths = Array.isArray(ctxPayload.MediaPaths) ? ctxPayload.MediaPaths.slice(1) : undefined;
    const nextMediaUrls = Array.isArray(ctxPayload.MediaUrls) ? ctxPayload.MediaUrls.slice(1) : undefined;
    const nextMediaTypes = Array.isArray(ctxPayload.MediaTypes) ? ctxPayload.MediaTypes.slice(1) : undefined;
    ctxPayload.MediaPaths = nextMediaPaths && nextMediaPaths.length > 0 ? nextMediaPaths : undefined;
    ctxPayload.MediaUrls = nextMediaUrls && nextMediaUrls.length > 0 ? nextMediaUrls : undefined;
    ctxPayload.MediaTypes = nextMediaTypes && nextMediaTypes.length > 0 ? nextMediaTypes : undefined;
    ctxPayload.MediaPath = ctxPayload.MediaPaths?.[0];
    ctxPayload.MediaUrl = ctxPayload.MediaUrls?.[0] ?? ctxPayload.MediaPath;
    ctxPayload.MediaType = ctxPayload.MediaTypes?.[0];
}

//# sourceMappingURL=bot-message-dispatch.media.js.map