/** Telegram forum-topic service-message fields (Bot API). */ "use strict";
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
    get TELEGRAM_FORUM_SERVICE_FIELDS () {
        return TELEGRAM_FORUM_SERVICE_FIELDS;
    },
    get isTelegramForumServiceMessage () {
        return isTelegramForumServiceMessage;
    }
});
const TELEGRAM_FORUM_SERVICE_FIELDS = [
    "forum_topic_created",
    "forum_topic_edited",
    "forum_topic_closed",
    "forum_topic_reopened",
    "general_forum_topic_hidden",
    "general_forum_topic_unhidden"
];
function isTelegramForumServiceMessage(msg) {
    if (!msg || typeof msg !== "object") {
        return false;
    }
    const messageRecord = msg;
    return TELEGRAM_FORUM_SERVICE_FIELDS.some((field)=>field in messageRecord && messageRecord[field] != null);
}

//# sourceMappingURL=forum-service-message.js.map