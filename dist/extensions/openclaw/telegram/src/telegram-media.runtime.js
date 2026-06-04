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
    get MediaFetchError () {
        return _mediaruntime.MediaFetchError;
    },
    get readRemoteMediaBuffer () {
        return _mediaruntime.readRemoteMediaBuffer;
    },
    get saveMediaBuffer () {
        return _mediaruntime.saveMediaBuffer;
    },
    get saveRemoteMedia () {
        return _mediaruntime.saveRemoteMedia;
    }
});
const _mediaruntime = require("../../../../common/openclaw/plugin-sdk/media-runtime");

//# sourceMappingURL=telegram-media.runtime.js.map