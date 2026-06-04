"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createTelegramDraftStream", {
    enumerable: true,
    get: function() {
        return createTelegramDraftStream;
    }
});
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _helpers = require("./bot/helpers.js");
const _networkerrors = require("./network-errors.js");
const _outboundparams = require("./outbound-params.js");
const TELEGRAM_STREAM_MAX_CHARS = 4096;
const DEFAULT_THROTTLE_MS = 1000;
function renderTelegramDraftPreview(text, renderText) {
    const trimmed = text.trimEnd();
    return renderText?.(trimmed) ?? {
        text: trimmed
    };
}
function findTelegramDraftChunkLength(text, maxChars, renderText) {
    let best = 0;
    let low = 1;
    let high = text.length;
    while(low <= high){
        const mid = Math.floor((low + high) / 2);
        const renderedText = renderTelegramDraftPreview(text.slice(0, mid), renderText).text.trimEnd();
        if (renderedText && renderedText.length <= maxChars) {
            best = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return best;
}
function createTelegramDraftStream(params) {
    const maxChars = Math.min(params.maxChars ?? TELEGRAM_STREAM_MAX_CHARS, TELEGRAM_STREAM_MAX_CHARS);
    const throttleMs = Math.max(250, params.throttleMs ?? DEFAULT_THROTTLE_MS);
    const minInitialChars = params.minInitialChars;
    const chatId = params.chatId;
    const threadParams = (0, _helpers.buildTelegramThreadParams)(params.thread);
    const replyToMessageId = (0, _outboundparams.normalizeTelegramReplyToMessageId)(params.replyToMessageId);
    const replyParams = replyToMessageId != null ? {
        ...threadParams,
        reply_to_message_id: replyToMessageId,
        allow_sending_without_reply: true
    } : threadParams;
    const streamState = {
        stopped: false,
        final: false
    };
    let messageSendAttempted = false;
    let streamMessageId;
    let streamVisibleSinceMs;
    let lastSentText = "";
    let lastDeliveredText = "";
    let lastRequestedText = "";
    let lastSentParseMode;
    let previewRevision = 0;
    let generation = 0;
    let deliveredTextOffset = 0;
    const sendRenderedMessage = async (sendArgs)=>{
        const sendParams = sendArgs.renderedParseMode ? {
            ...replyParams,
            parse_mode: sendArgs.renderedParseMode
        } : replyParams;
        return await params.api.sendMessage(chatId, sendArgs.renderedText, sendParams);
    };
    const sendMessageTransportPreview = async ({ renderedText, renderedParseMode, sendGeneration })=>{
        if (typeof streamMessageId === "number") {
            streamVisibleSinceMs ??= Date.now();
            if (renderedParseMode) {
                await params.api.editMessageText(chatId, streamMessageId, renderedText, {
                    parse_mode: renderedParseMode
                });
            } else {
                await params.api.editMessageText(chatId, streamMessageId, renderedText);
            }
            return true;
        }
        messageSendAttempted = true;
        let sent;
        try {
            sent = await sendRenderedMessage({
                renderedText,
                renderedParseMode
            });
        } catch (err) {
            if ((0, _networkerrors.isSafeToRetrySendError)(err) || (0, _networkerrors.isTelegramClientRejection)(err)) {
                messageSendAttempted = false;
            }
            throw err;
        }
        const sentMessageId = sent?.message_id;
        if (typeof sentMessageId !== "number" || !Number.isFinite(sentMessageId)) {
            streamState.stopped = true;
            params.warn?.("telegram stream preview stopped (missing message id from sendMessage)");
            return false;
        }
        const normalizedMessageId = Math.trunc(sentMessageId);
        const visibleSinceMs = Date.now();
        if (sendGeneration !== generation) {
            params.onSupersededPreview?.({
                messageId: normalizedMessageId,
                textSnapshot: renderedText,
                parseMode: renderedParseMode,
                visibleSinceMs
            });
            return true;
        }
        streamMessageId = normalizedMessageId;
        streamVisibleSinceMs = visibleSinceMs;
        return true;
    };
    const stopOversizedPreview = (renderedText)=>{
        streamState.stopped = true;
        params.warn?.(`telegram stream preview stopped (text length ${renderedText.length} > ${maxChars})`);
        return false;
    };
    const sendOrEditStreamMessage = async (text)=>{
        if (streamState.stopped && !streamState.final) {
            return false;
        }
        const trimmed = text.trimEnd();
        if (!trimmed) {
            return false;
        }
        const currentText = trimmed.slice(deliveredTextOffset).trimStart();
        if (!currentText) {
            return false;
        }
        const rendered = renderTelegramDraftPreview(currentText, params.renderText);
        const renderedText = rendered.text.trimEnd();
        const renderedParseMode = rendered.parseMode;
        if (!renderedText) {
            return false;
        }
        if (renderedText.length > maxChars) {
            const chunkLength = findTelegramDraftChunkLength(currentText, maxChars, params.renderText);
            if (!streamState.final) {
                if (chunkLength > 0) {
                    return await sendOrEditStreamMessage(trimmed.slice(0, deliveredTextOffset) + currentText.slice(0, chunkLength));
                }
                return stopOversizedPreview(renderedText);
            }
            if (lastDeliveredText.length > deliveredTextOffset) {
                const supersededMessageId = streamMessageId;
                const supersededTextSnapshot = lastSentText;
                const supersededParseMode = lastSentParseMode;
                const supersededVisibleSinceMs = streamVisibleSinceMs;
                deliveredTextOffset = lastDeliveredText.length;
                resetStreamToNewMessage({
                    keepFinal: true,
                    keepPending: true,
                    resetOffset: false
                });
                if (typeof supersededMessageId === "number") {
                    params.onSupersededPreview?.({
                        messageId: supersededMessageId,
                        textSnapshot: supersededTextSnapshot,
                        parseMode: supersededParseMode,
                        visibleSinceMs: supersededVisibleSinceMs,
                        retain: true
                    });
                }
                return await sendOrEditStreamMessage(trimmed);
            }
            if (chunkLength > 0) {
                const sent = await sendOrEditStreamMessage(trimmed.slice(0, deliveredTextOffset) + currentText.slice(0, chunkLength));
                if (!sent) {
                    return false;
                }
                return await sendOrEditStreamMessage(trimmed);
            }
            return stopOversizedPreview(renderedText);
        }
        if (renderedText === lastSentText && renderedParseMode === lastSentParseMode) {
            return true;
        }
        const sendGeneration = generation;
        if (typeof streamMessageId !== "number" && minInitialChars != null && !streamState.final) {
            if (renderedText.length < minInitialChars) {
                return false;
            }
        }
        lastSentText = renderedText;
        lastSentParseMode = renderedParseMode;
        try {
            const sent = await sendMessageTransportPreview({
                renderedText,
                renderedParseMode,
                sendGeneration
            });
            if (sent) {
                previewRevision += 1;
                lastDeliveredText = trimmed;
            }
            return sent;
        } catch (err) {
            streamState.stopped = true;
            params.warn?.(`telegram stream preview failed: ${(0, _errorruntime.formatErrorMessage)(err)}`);
            return false;
        }
    };
    const { loop, update: updateDraft, stopForClear } = (0, _channeloutbound.createFinalizableDraftStreamControlsForState)({
        throttleMs,
        state: streamState,
        sendOrEditStreamMessage
    });
    const update = (text)=>{
        if (streamState.stopped || streamState.final) {
            return;
        }
        lastRequestedText = text;
        updateDraft(text);
    };
    const stop = async ()=>{
        streamState.final = true;
        await loop.flush();
        if (streamState.stopped) {
            return;
        }
        const finalText = lastRequestedText.trimEnd();
        if (finalText && finalText !== lastDeliveredText.trimEnd()) {
            await sendOrEditStreamMessage(finalText);
        }
        streamState.final = true;
    };
    const resetStreamToNewMessage = (options)=>{
        streamState.stopped = false;
        streamState.final = options?.keepFinal === true;
        generation += 1;
        messageSendAttempted = false;
        streamMessageId = undefined;
        streamVisibleSinceMs = undefined;
        lastSentText = "";
        lastSentParseMode = undefined;
        if (options?.resetOffset !== false) {
            deliveredTextOffset = 0;
            lastRequestedText = "";
        }
        if (!options?.keepPending) {
            loop.resetPending();
        }
        loop.resetThrottleWindow();
    };
    const clear = async ()=>{
        const messageId = await (0, _channeloutbound.takeMessageIdAfterStop)({
            stopForClear,
            readMessageId: ()=>streamMessageId,
            clearMessageId: ()=>{
                streamMessageId = undefined;
            }
        });
        if (typeof messageId === "number" && Number.isFinite(messageId)) {
            try {
                await params.api.deleteMessage(chatId, messageId);
                params.log?.(`telegram stream preview deleted (chat=${chatId}, message=${messageId})`);
            } catch (err) {
                params.warn?.(`telegram stream preview cleanup failed: ${(0, _errorruntime.formatErrorMessage)(err)}`);
            }
        }
    };
    const discard = async ()=>{
        await stopForClear();
    };
    const forceNewMessage = ()=>{
        resetStreamToNewMessage();
    };
    const materialize = async ()=>{
        await stop();
        return streamMessageId;
    };
    params.log?.(`telegram stream preview ready (maxChars=${maxChars}, throttleMs=${throttleMs})`);
    return {
        update,
        flush: loop.flush,
        messageId: ()=>streamMessageId,
        visibleSinceMs: ()=>streamVisibleSinceMs,
        previewRevision: ()=>previewRevision,
        lastDeliveredText: ()=>lastDeliveredText,
        clear,
        stop,
        discard,
        materialize,
        forceNewMessage,
        sendMayHaveLanded: ()=>messageSendAttempted && typeof streamMessageId !== "number"
    };
}

//# sourceMappingURL=draft-stream.js.map