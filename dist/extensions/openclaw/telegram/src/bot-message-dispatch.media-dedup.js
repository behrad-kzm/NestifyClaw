"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "deduplicateBlockSentMedia", {
    enumerable: true,
    get: function() {
        return deduplicateBlockSentMedia;
    }
});
function deduplicateBlockSentMedia(payload, sentBlockMediaUrls) {
    if (!payload.mediaUrls?.length || sentBlockMediaUrls.size === 0) {
        return payload;
    }
    const remainingMedia = payload.mediaUrls.filter((url)=>!sentBlockMediaUrls.has(url));
    if (remainingMedia.length === payload.mediaUrls.length) {
        return payload;
    }
    if (remainingMedia.length === 0 && !payload.text) {
        return undefined;
    }
    return {
        ...payload,
        mediaUrls: remainingMedia,
        mediaUrl: remainingMedia.length === 0 ? undefined : payload.mediaUrl
    };
}

//# sourceMappingURL=bot-message-dispatch.media-dedup.js.map