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
    get buildOutboundMediaLoadOptions () {
        return _mediaruntime.buildOutboundMediaLoadOptions;
    },
    get getImageMetadata () {
        return _mediaruntime.getImageMetadata;
    },
    get isGifMedia () {
        return _mediaruntime.isGifMedia;
    },
    get kindFromMime () {
        return _mediaruntime.kindFromMime;
    },
    get loadWebMedia () {
        return _webmedia.loadWebMedia;
    },
    get normalizePollInput () {
        return _mediaruntime.normalizePollInput;
    },
    get probeVideoDimensions () {
        return _mediaruntime.probeVideoDimensions;
    },
    get requireRuntimeConfig () {
        return _pluginconfigruntime.requireRuntimeConfig;
    },
    get resolveMarkdownTableMode () {
        return _markdowntableruntime.resolveMarkdownTableMode;
    }
});
const _pluginconfigruntime = require("../../../../common/openclaw/plugin-sdk/plugin-config-runtime");
const _markdowntableruntime = require("../../../../common/openclaw/plugin-sdk/markdown-table-runtime");
const _mediaruntime = require("../../../../common/openclaw/plugin-sdk/media-runtime");
const _webmedia = require("../../../../common/openclaw/plugin-sdk/web-media");

//# sourceMappingURL=send.runtime.js.map