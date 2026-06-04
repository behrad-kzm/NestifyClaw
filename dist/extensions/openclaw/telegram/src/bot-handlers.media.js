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
    get hasInboundMedia () {
        return hasInboundMedia;
    },
    get hasReplyTargetMedia () {
        return hasReplyTargetMedia;
    },
    get isMediaSizeLimitError () {
        return isMediaSizeLimitError;
    },
    get isRecoverableMediaGroupError () {
        return isRecoverableMediaGroupError;
    },
    get resolveInboundMediaFileId () {
        return resolveInboundMediaFileId;
    }
});
const _mediaruntime = require("../../../../common/openclaw/plugin-sdk/media-runtime");
function isMediaSizeLimitError(err) {
    const errMsg = String(err);
    return errMsg.includes("exceeds") && errMsg.includes("MB limit");
}
function isRecoverableMediaGroupError(err) {
    return err instanceof _mediaruntime.MediaFetchError || isMediaSizeLimitError(err);
}
function hasInboundMedia(msg) {
    return Boolean(msg.media_group_id) || Array.isArray(msg.photo) && msg.photo.length > 0 || Boolean(msg.video ?? msg.video_note ?? msg.document ?? msg.audio ?? msg.voice ?? msg.sticker);
}
function hasReplyTargetMedia(msg) {
    const externalReply = msg.external_reply;
    const replyTarget = msg.reply_to_message ?? externalReply;
    return Boolean(replyTarget && hasInboundMedia(replyTarget));
}
function resolveInboundMediaFileId(msg) {
    return msg.sticker?.file_id ?? msg.photo?.[msg.photo.length - 1]?.file_id ?? msg.video?.file_id ?? msg.video_note?.file_id ?? msg.document?.file_id ?? msg.audio?.file_id ?? msg.voice?.file_id;
}

//# sourceMappingURL=bot-handlers.media.js.map