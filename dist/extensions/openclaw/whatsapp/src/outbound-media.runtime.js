"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "loadOutboundMediaFromUrl", {
    enumerable: true,
    get: function() {
        return loadOutboundMediaFromUrl;
    }
});
const _webmedia = require("../../../../common/openclaw/plugin-sdk/web-media");
async function loadOutboundMediaFromUrl(mediaUrl, options = {}) {
    const readFile = options.mediaAccess?.readFile ?? options.mediaReadFile;
    const localRoots = options.mediaAccess?.localRoots?.length && options.mediaAccess.localRoots.length > 0 ? options.mediaAccess.localRoots : options.mediaLocalRoots && options.mediaLocalRoots.length > 0 ? options.mediaLocalRoots : undefined;
    const sharedOptions = {
        ...options.maxBytes !== undefined ? {
            maxBytes: options.maxBytes
        } : {},
        ...options.optimizeImages !== undefined ? {
            optimizeImages: options.optimizeImages
        } : {}
    };
    return await (0, _webmedia.loadWebMedia)(mediaUrl, readFile ? {
        ...sharedOptions,
        localRoots: "any",
        readFile,
        hostReadCapability: true
    } : {
        ...sharedOptions,
        ...localRoots ? {
            localRoots
        } : {}
    });
}

//# sourceMappingURL=outbound-media.runtime.js.map