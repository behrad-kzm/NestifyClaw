"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "transcribeFirstAudio", {
    enumerable: true,
    get: function() {
        return transcribeFirstAudio;
    }
});
const _mediaruntime = require("../../../../../../common/openclaw/plugin-sdk/media-runtime");
async function transcribeFirstAudio(...args) {
    return await (0, _mediaruntime.transcribeFirstAudio)(...args);
}

//# sourceMappingURL=audio-preflight.runtime.js.map