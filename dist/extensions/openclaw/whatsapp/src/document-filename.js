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
    get resolveWhatsAppDefaultDocumentFileName () {
        return resolveWhatsAppDefaultDocumentFileName;
    },
    get resolveWhatsAppDocumentFileName () {
        return resolveWhatsAppDocumentFileName;
    }
});
const _mediamime = require("../../../../common/openclaw/plugin-sdk/media-mime");
const WHATSAPP_DEFAULT_DOCUMENT_FILE_NAME = "file";
function resolveWhatsAppDefaultDocumentFileName(mimetype) {
    const extension = (0, _mediamime.extensionForMime)(mimetype);
    return extension ? `${WHATSAPP_DEFAULT_DOCUMENT_FILE_NAME}${extension}` : WHATSAPP_DEFAULT_DOCUMENT_FILE_NAME;
}
function resolveWhatsAppDocumentFileName(params) {
    const fallbackName = resolveWhatsAppDefaultDocumentFileName(params.mimetype);
    const stripped = stripAsciiControlCharacters(params.fileName ?? "").trim();
    return stripped || fallbackName;
}
function stripAsciiControlCharacters(value) {
    let stripped = "";
    for (const char of value){
        const code = char.charCodeAt(0);
        if (code > 0x1f && code !== 0x7f) {
            stripped += char;
        }
    }
    return stripped;
}

//# sourceMappingURL=document-filename.js.map