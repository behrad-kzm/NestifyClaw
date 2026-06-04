"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramInteractiveTextFallback", {
    enumerable: true,
    get: function() {
        return resolveTelegramInteractiveTextFallback;
    }
});
const _interactiveruntime = require("../../../../common/openclaw/plugin-sdk/interactive-runtime");
function resolveTelegramInteractiveTextFallback(params) {
    const interactive = (0, _interactiveruntime.normalizeInteractiveReply)(params.interactive);
    const text = (0, _interactiveruntime.resolveInteractiveTextFallback)({
        text: params.text ?? undefined,
        interactive
    });
    if (text?.trim()) {
        return text;
    }
    const presentation = (0, _interactiveruntime.normalizeMessagePresentation)(params.presentation);
    if (presentation) {
        const fallback = (0, _interactiveruntime.renderMessagePresentationFallbackText)({
            text: params.text ?? undefined,
            presentation
        });
        if (fallback.trim()) {
            return fallback;
        }
    }
    if (!interactive) {
        return text;
    }
    const interactivePresentation = (0, _interactiveruntime.interactiveReplyToPresentation)(interactive);
    if (!interactivePresentation) {
        return text;
    }
    const fallback = (0, _interactiveruntime.renderMessagePresentationFallbackText)({
        presentation: interactivePresentation
    });
    return fallback.trim() ? fallback : text;
}

//# sourceMappingURL=interactive-fallback.js.map