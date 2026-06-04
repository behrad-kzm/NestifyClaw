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
    get TELEGRAM_MAX_CAPTION_LENGTH () {
        return TELEGRAM_MAX_CAPTION_LENGTH;
    },
    get splitTelegramCaption () {
        return splitTelegramCaption;
    }
});
const TELEGRAM_MAX_CAPTION_LENGTH = 1024;
function splitTelegramCaption(text) {
    const trimmed = text?.trim() ?? "";
    if (!trimmed) {
        return {
            caption: undefined,
            followUpText: undefined
        };
    }
    if (trimmed.length > TELEGRAM_MAX_CAPTION_LENGTH) {
        return {
            caption: undefined,
            followUpText: trimmed
        };
    }
    return {
        caption: trimmed,
        followUpText: undefined
    };
}

//# sourceMappingURL=caption.js.map