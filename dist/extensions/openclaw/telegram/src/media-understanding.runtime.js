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
    get describeImageWithModel () {
        return describeImageWithModel;
    },
    get transcribeFirstAudio () {
        return transcribeFirstAudio;
    }
});
const _mediaruntime = require("../../../../common/openclaw/plugin-sdk/media-runtime");
async function describeImageWithModel(...args) {
    return await (0, _mediaruntime.describeImageWithModel)(...args);
}
async function transcribeFirstAudio(...args) {
    return await (0, _mediaruntime.transcribeFirstAudio)(...args);
}

//# sourceMappingURL=media-understanding.runtime.js.map