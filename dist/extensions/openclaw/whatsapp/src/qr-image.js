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
    get renderQrPngBase64 () {
        return _mediaruntime.renderQrPngBase64;
    },
    get renderQrPngDataUrl () {
        return _mediaruntime.renderQrPngDataUrl;
    }
});
const _mediaruntime = require("../../../../common/openclaw/plugin-sdk/media-runtime");

//# sourceMappingURL=qr-image.js.map