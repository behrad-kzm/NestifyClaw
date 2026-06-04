"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramPollVisibility", {
    enumerable: true,
    get: function() {
        return resolveTelegramPollVisibility;
    }
});
function resolveTelegramPollVisibility(params) {
    if (params.pollAnonymous && params.pollPublic) {
        throw new Error("pollAnonymous and pollPublic are mutually exclusive");
    }
    if (params.pollAnonymous) {
        return true;
    }
    if (params.pollPublic) {
        return false;
    }
    return undefined;
}

//# sourceMappingURL=poll-visibility.js.map