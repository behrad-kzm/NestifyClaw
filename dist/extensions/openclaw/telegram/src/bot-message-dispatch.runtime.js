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
    get generateTopicLabel () {
        return _autotopiclabel.generateTelegramTopicLabel;
    },
    get getAgentScopedMediaLocalRoots () {
        return _mediaruntime.getAgentScopedMediaLocalRoots;
    },
    get loadSessionStore () {
        return _sessionstoreruntime.loadSessionStore;
    },
    get readLatestAssistantTextFromSessionTranscript () {
        return _sessionstoreruntime.readLatestAssistantTextFromSessionTranscript;
    },
    get resolveAndPersistSessionFile () {
        return _sessionstoreruntime.resolveAndPersistSessionFile;
    },
    get resolveAutoTopicLabelConfig () {
        return _autotopiclabel.resolveAutoTopicLabelConfig;
    },
    get resolveChunkMode () {
        return _replydispatchruntime.resolveChunkMode;
    },
    get resolveMarkdownTableMode () {
        return _markdowntableruntime.resolveMarkdownTableMode;
    },
    get resolveSessionStoreEntry () {
        return _sessionstoreruntime.resolveSessionStoreEntry;
    }
});
const _sessionstoreruntime = require("../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _markdowntableruntime = require("../../../../common/openclaw/plugin-sdk/markdown-table-runtime");
const _mediaruntime = require("../../../../common/openclaw/plugin-sdk/media-runtime");
const _replydispatchruntime = require("../../../../common/openclaw/plugin-sdk/reply-dispatch-runtime");
const _autotopiclabel = require("./auto-topic-label.js");

//# sourceMappingURL=bot-message-dispatch.runtime.js.map