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
        return _replyparameters.buildTelegramSendParams;
    },
    get sendTelegramText () {
        return sendTelegramText;
    },
    get sendTelegramWithThreadFallback () {
        return sendTelegramWithThreadFallback;
    }
});
const _grammy = require("grammy");
const _retryruntime = require("../../../../../common/openclaw/plugin-sdk/retry-runtime");
const _ssrfruntime = require("../../../../../common/openclaw/plugin-sdk/ssrf-runtime");
const _apilogging = require("../api-logging.js");
const _format = require("../format.js");
const _networkerrors = require("../network-errors.js");
const _replyparameters = require("../reply-parameters.js");
const PARSE_ERR_RE = /can't parse entities|parse entities|find end of the entity/i;
const EMPTY_TEXT_ERR_RE = /message text is empty/i;
const QUOTE_PARAM_RE = /\bquote not found\b|\bQUOTE_TEXT_INVALID\b|\bquote text invalid\b/i;
const GrammyErrorCtor = typeof _grammy.GrammyError === "function" ? _grammy.GrammyError : undefined;
function isTelegramQuoteParamError(err) {
    if (GrammyErrorCtor && err instanceof GrammyErrorCtor) {
        return QUOTE_PARAM_RE.test(err.description);
    }
    return QUOTE_PARAM_RE.test((0, _ssrfruntime.formatErrorMessage)(err));
}
function createTelegramDeliverySendRetry() {
    return (0, _retryruntime.createTelegramRetryRunner)({
        shouldRetry: (err)=>(0, _networkerrors.isSafeToRetrySendError)(err) || (0, _networkerrors.isTelegramRateLimitError)(err),
        strictShouldRetry: true
    });
}
async function sendTelegramWithThreadFallback(params) {
    const hasNativeQuote = (0, _replyparameters.getTelegramNativeQuoteReplyMessageId)(params.requestParams) != null;
    const shouldSuppressFirstErrorLog = (err)=>hasNativeQuote && isTelegramQuoteParamError(err);
    const mergedShouldLog = params.shouldLog ? (err)=>params.shouldLog(err) && !shouldSuppressFirstErrorLog(err) : (err)=>!shouldSuppressFirstErrorLog(err);
    const requestWithRetry = createTelegramDeliverySendRetry();
    const runLoggedSend = (operation, requestParams, shouldLog)=>(0, _apilogging.withTelegramApiErrorLogging)({
            operation,
            runtime: params.runtime,
            ...shouldLog ? {
                shouldLog
            } : {},
            fn: ()=>requestWithRetry(()=>params.send(requestParams), operation)
        });
    try {
        return await runLoggedSend(params.operation, params.requestParams, mergedShouldLog);
    } catch (err) {
        if (hasNativeQuote && isTelegramQuoteParamError(err)) {
            params.runtime.log?.(`telegram ${params.operation}: native quote rejected; retrying with legacy reply_to_message_id`);
            return await sendTelegramWithThreadFallback({
                ...params,
                operation: `${params.operation} (legacy reply retry)`,
                requestParams: (0, _replyparameters.removeTelegramNativeQuoteParam)(params.requestParams)
            });
        }
        throw err;
    }
}
async function sendTelegramText(bot, chatId, text, runtime, opts) {
    const baseParams = (0, _replyparameters.buildTelegramSendParams)({
        replyToMessageId: opts?.replyToMessageId,
        replyQuoteMessageId: opts?.replyQuoteMessageId,
        replyQuoteText: opts?.replyQuoteText,
        replyQuotePosition: opts?.replyQuotePosition,
        replyQuoteEntities: opts?.replyQuoteEntities,
        thread: opts?.thread,
        silent: opts?.silent
    });
    // Add link_preview_options when link preview is disabled.
    const linkPreviewEnabled = opts?.linkPreview ?? true;
    const linkPreviewOptions = linkPreviewEnabled ? undefined : {
        is_disabled: true
    };
    const textMode = opts?.textMode ?? "markdown";
    const htmlText = textMode === "html" ? text : (0, _format.markdownToTelegramHtml)(text);
    const fallbackText = opts?.plainText ?? text;
    const hasFallbackText = fallbackText.trim().length > 0;
    const sendPlainFallback = async ()=>{
        const res = await sendTelegramWithThreadFallback({
            operation: "sendMessage",
            runtime,
            thread: opts?.thread,
            requestParams: baseParams,
            send: (effectiveParams)=>bot.api.sendMessage(chatId, fallbackText, {
                    ...linkPreviewOptions ? {
                        link_preview_options: linkPreviewOptions
                    } : {},
                    ...opts?.replyMarkup ? {
                        reply_markup: opts.replyMarkup
                    } : {},
                    ...effectiveParams
                })
        });
        runtime.log?.(`telegram sendMessage ok chat=${chatId} message=${res.message_id} (plain)`);
        return res.message_id;
    };
    // Markdown can render to empty HTML for syntax-only chunks; recover with plain text.
    if (!htmlText.trim()) {
        if (!hasFallbackText) {
            throw new Error("telegram sendMessage failed: empty formatted text and empty plain fallback");
        }
        return await sendPlainFallback();
    }
    try {
        const res = await sendTelegramWithThreadFallback({
            operation: "sendMessage",
            runtime,
            thread: opts?.thread,
            requestParams: baseParams,
            shouldLog: (err)=>{
                const errText = (0, _ssrfruntime.formatErrorMessage)(err);
                return !PARSE_ERR_RE.test(errText) && !EMPTY_TEXT_ERR_RE.test(errText);
            },
            send: (effectiveParams)=>bot.api.sendMessage(chatId, htmlText, {
                    parse_mode: "HTML",
                    ...linkPreviewOptions ? {
                        link_preview_options: linkPreviewOptions
                    } : {},
                    ...opts?.replyMarkup ? {
                        reply_markup: opts.replyMarkup
                    } : {},
                    ...effectiveParams
                })
        });
        runtime.log?.(`telegram sendMessage ok chat=${chatId} message=${res.message_id}`);
        return res.message_id;
    } catch (err) {
        const errText = (0, _ssrfruntime.formatErrorMessage)(err);
        if (PARSE_ERR_RE.test(errText) || EMPTY_TEXT_ERR_RE.test(errText)) {
            if (!hasFallbackText) {
                throw err;
            }
            runtime.log?.(`telegram formatted send failed; retrying without formatting: ${errText}`);
            return await sendPlainFallback();
        }
        throw err;
    }
}

//# sourceMappingURL=delivery.send.js.map