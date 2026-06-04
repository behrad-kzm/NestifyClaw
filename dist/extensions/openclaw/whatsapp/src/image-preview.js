"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "addWhatsAppImagePreviewFields", {
    enumerable: true,
    get: function() {
        return addWhatsAppImagePreviewFields;
    }
});
const _mediaruntime = require("../../../../common/openclaw/plugin-sdk/media-runtime");
const WHATSAPP_IMAGE_THUMBNAIL_SIDE = 32;
const WHATSAPP_IMAGE_THUMBNAIL_QUALITY = 50;
async function addWhatsAppImagePreviewFields(content) {
    const image = content.image;
    if (!Buffer.isBuffer(image)) {
        return content;
    }
    const current = content;
    const hasDimensions = typeof current.width === "number" && typeof current.height === "number";
    const hasThumbnail = typeof current.jpegThumbnail === "string";
    if (hasDimensions && hasThumbnail) {
        return content;
    }
    const metadata = hasDimensions ? null : await (0, _mediaruntime.getImageMetadata)(image).catch(()=>null);
    if (!hasDimensions && !metadata) {
        return content;
    }
    const thumbnail = hasThumbnail ? null : await (0, _mediaruntime.resizeToJpeg)({
        buffer: image,
        maxSide: WHATSAPP_IMAGE_THUMBNAIL_SIDE,
        quality: WHATSAPP_IMAGE_THUMBNAIL_QUALITY,
        withoutEnlargement: true
    }).catch(()=>null);
    return {
        ...content,
        ...metadata ? {
            width: metadata.width,
            height: metadata.height
        } : {},
        ...thumbnail ? {
            jpegThumbnail: thumbnail.toString("base64")
        } : {}
    };
}

//# sourceMappingURL=image-preview.js.map