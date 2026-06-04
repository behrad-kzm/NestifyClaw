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
    get buildTelegramSendParams () {
        return buildTelegramSendParams;
    },
    get buildTelegramThreadReplyParams () {
        return buildTelegramThreadReplyParams;
    },
    get getTelegramNativeQuoteReplyMessageId () {
        return getTelegramNativeQuoteReplyMessageId;
    },
    get removeTelegramNativeQuoteParam () {
        return removeTelegramNativeQuoteParam;
    },
    get resolveTelegramSendThreadSpec () {
        return resolveTelegramSendThreadSpec;
    }
});
const _helpers = require("./bot/helpers.js");
const _outboundparams = require("./outbound-params.js");
function resolveTelegramSendThreadSpec(params) {
    const messageThreadId = params.messageThreadId != null ? params.messageThreadId : params.targetMessageThreadId;
    if (messageThreadId == null) {
        return undefined;
    }
    // Telegram supports DM topics; keep direct chat thread IDs and let invalid
    // topics fail closed instead of sending to the base chat.
    return {
        id: messageThreadId,
        scope: params.chatType === "direct" ? "dm" : "forum"
    };
}
function buildTelegramThreadReplyParams(opts) {
    const params = {};
    const threadParams = (0, _helpers.buildTelegramThreadParams)(opts?.thread);
    if (threadParams) {
        params.message_thread_id = threadParams.message_thread_id;
    }
    const replyToMessageId = (0, _outboundparams.normalizeTelegramReplyToMessageId)(opts?.replyToMessageId);
    if (replyToMessageId == null) {
        return params;
    }
    const defaultQuoteMessageId = opts?.useReplyIdAsQuoteSource === true ? replyToMessageId : undefined;
    const replyQuoteMessageId = (0, _outboundparams.normalizeTelegramReplyToMessageId)(opts?.replyQuoteMessageId ?? defaultQuoteMessageId);
    const replyQuoteTextRaw = replyQuoteMessageId === replyToMessageId ? opts?.replyQuoteText : undefined;
    const replyQuoteText = replyQuoteTextRaw?.trim() ? replyQuoteTextRaw : undefined;
    if (!replyQuoteText) {
        params.reply_to_message_id = replyToMessageId;
        params.allow_sending_without_reply = true;
        return params;
    }
    const replyParameters = {
        message_id: replyToMessageId,
        quote: replyQuoteText,
        allow_sending_without_reply: true
    };
    if (typeof opts?.replyQuotePosition === "number" && Number.isFinite(opts.replyQuotePosition)) {
        replyParameters.quote_position = Math.trunc(opts.replyQuotePosition);
    }
    if (Array.isArray(opts?.replyQuoteEntities) && opts.replyQuoteEntities.length > 0) {
        replyParameters.quote_entities = opts.replyQuoteEntities;
    }
    params.reply_parameters = replyParameters;
    return params;
}
function buildTelegramSendParams(opts) {
    const params = {
        ...buildTelegramThreadReplyParams(opts)
    };
    if (opts?.silent === true) {
        params.disable_notification = true;
    }
    return params;
}
function getTelegramNativeQuoteReplyMessageId(params) {
    const replyParameters = params?.reply_parameters;
    if (!replyParameters || typeof replyParameters !== "object") {
        return undefined;
    }
    const messageId = replyParameters.message_id;
    return typeof messageId === "number" && Number.isFinite(messageId) ? messageId : undefined;
}
function removeTelegramNativeQuoteParam(params) {
    if (!params) {
        return {};
    }
    const replyMessageId = getTelegramNativeQuoteReplyMessageId(params);
    const { reply_parameters: _ignored, ...rest } = params;
    if (replyMessageId != null) {
        rest.reply_to_message_id = replyMessageId;
        rest.allow_sending_without_reply = true;
    }
    return rest;
}

//# sourceMappingURL=reply-parameters.js.map