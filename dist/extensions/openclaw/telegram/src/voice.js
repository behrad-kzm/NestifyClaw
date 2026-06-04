"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramVoiceSend", {
    enumerable: true,
    get: function() {
        return resolveTelegramVoiceSend;
    }
});
const _mediaruntime = require("../../../../common/openclaw/plugin-sdk/media-runtime");
function resolveTelegramVoiceDecision(opts) {
    if (!opts.wantsVoice) {
        return {
            useVoice: false
        };
    }
    if ((0, _mediaruntime.isVoiceCompatibleAudio)(opts)) {
        return {
            useVoice: true
        };
    }
    const contentType = opts.contentType ?? "unknown";
    const fileName = opts.fileName ?? "unknown";
    return {
        useVoice: false,
        reason: `media is ${contentType} (${fileName})`
    };
}
function resolveTelegramVoiceSend(opts) {
    const decision = resolveTelegramVoiceDecision(opts);
    if (decision.reason && opts.logFallback) {
        opts.logFallback(`Telegram voice requested but ${decision.reason}; sending as audio file instead.`);
    }
    return {
        useVoice: decision.useVoice
    };
}

//# sourceMappingURL=voice.js.map