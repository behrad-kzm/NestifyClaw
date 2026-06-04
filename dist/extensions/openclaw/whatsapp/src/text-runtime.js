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
    get assertWebChannel () {
        return _targetsruntime.assertWebChannel;
    },
    get convertMarkdownTables () {
        return _textchunking.convertMarkdownTables;
    },
    get isSelfChatMode () {
        return _targetsruntime.isSelfChatMode;
    },
    get jidToE164 () {
        return _targetsruntime.jidToE164;
    },
    get markdownToWhatsApp () {
        return _targetsruntime.markdownToWhatsApp;
    },
    get normalizeE164 () {
        return _textutilityruntime.normalizeE164;
    },
    get resolveJidToE164 () {
        return _targetsruntime.resolveJidToE164;
    },
    get resolveUserPath () {
        return _textutilityruntime.resolveUserPath;
    },
    get sanitizeAssistantVisibleText () {
        return _textchunking.sanitizeAssistantVisibleText;
    },
    get sanitizeAssistantVisibleTextWithProfile () {
        return _textchunking.sanitizeAssistantVisibleTextWithProfile;
    },
    get sleep () {
        return _textutilityruntime.sleep;
    },
    get stripToolCallXmlTags () {
        return _textchunking.stripToolCallXmlTags;
    },
    get toWhatsappJid () {
        return _targetsruntime.toWhatsappJid;
    },
    get toWhatsappJidWithLid () {
        return _targetsruntime.toWhatsappJidWithLid;
    }
});
const _textchunking = require("../../../../common/openclaw/plugin-sdk/text-chunking");
const _textutilityruntime = require("../../../../common/openclaw/plugin-sdk/text-utility-runtime");
const _targetsruntime = require("./targets-runtime.js");

//# sourceMappingURL=text-runtime.js.map