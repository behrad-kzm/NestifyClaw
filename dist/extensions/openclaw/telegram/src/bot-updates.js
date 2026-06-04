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
    get MEDIA_GROUP_TIMEOUT_MS () {
        return MEDIA_GROUP_TIMEOUT_MS;
    },
    get buildTelegramUpdateKey () {
        return buildTelegramUpdateKey;
    },
    get createTelegramUpdateDedupe () {
        return createTelegramUpdateDedupe;
    },
    get resolveTelegramUpdateId () {
        return resolveTelegramUpdateId;
    }
});
const _deduperuntime = require("../../../../common/openclaw/plugin-sdk/dedupe-runtime");
const MEDIA_GROUP_TIMEOUT_MS = 500;
const RECENT_TELEGRAM_UPDATE_TTL_MS = 5 * 60_000;
const RECENT_TELEGRAM_UPDATE_MAX = 2000;
const resolveTelegramUpdateId = (ctx)=>ctx.update?.update_id ?? ctx.update_id;
const buildTelegramUpdateKey = (ctx)=>{
    const updateId = resolveTelegramUpdateId(ctx);
    if (typeof updateId === "number") {
        return `update:${updateId}`;
    }
    const callbackId = ctx.callbackQuery?.id;
    if (callbackId) {
        return `callback:${callbackId}`;
    }
    const editedMsg = ctx.editedMessage ?? ctx.editedChannelPost ?? ctx.update?.edited_message ?? ctx.update?.edited_channel_post;
    const editedChatId = editedMsg?.chat?.id;
    const editedMessageId = editedMsg?.message_id;
    if (editedChatId !== undefined && typeof editedMessageId === "number") {
        return `edited-message:${editedChatId}:${editedMessageId}`;
    }
    const msg = ctx.message ?? ctx.channelPost ?? ctx.update?.message ?? ctx.update?.channel_post ?? ctx.callbackQuery?.message;
    const chatId = msg?.chat?.id;
    const messageId = msg?.message_id;
    if (chatId !== undefined && typeof messageId === "number") {
        return `message:${chatId}:${messageId}`;
    }
    return undefined;
};
const createTelegramUpdateDedupe = ()=>(0, _deduperuntime.createDedupeCache)({
        ttlMs: RECENT_TELEGRAM_UPDATE_TTL_MS,
        maxSize: RECENT_TELEGRAM_UPDATE_MAX
    });

//# sourceMappingURL=bot-updates.js.map