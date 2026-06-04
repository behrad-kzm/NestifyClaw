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
    get LocalMediaAccessError () {
        return _webmedia.LocalMediaAccessError;
    },
    get getDefaultLocalRoots () {
        return _webmedia.getDefaultLocalRoots;
    },
    get loadWebMedia () {
        return _webmedia.loadWebMedia;
    },
    get loadWebMediaRaw () {
        return _webmedia.loadWebMediaRaw;
    },
    get optimizeImageToJpeg () {
        return _webmedia.optimizeImageToJpeg;
    },
    get optimizeImageToPng () {
        return _webmedia.optimizeImageToPng;
    }
});
const _webmedia = require("../../../../common/openclaw/plugin-sdk/web-media");

//# sourceMappingURL=media.js.map