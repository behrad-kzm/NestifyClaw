"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createLaneTextDeliverer", {
    enumerable: true,
    get: function() {
        return createLaneTextDeliverer;
    }
});
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _replypayload = require("../../../../common/openclaw/plugin-sdk/reply-payload");
function result(kind, delivery) {
    if (kind === "preview-finalized") {
        const finalized = delivery;
        return {
            kind,
            delivery: {
                ...finalized,
                receipt: finalized.receipt ?? (0, _channeloutbound.createPreviewMessageReceipt)({
                    id: finalized.messageId
                })
            }
        };
    }
    return {
        kind
    };
}
function compactChunks(chunks) {
    const out = [];
    let whitespace = "";
    for (const chunk of chunks){
        if (!chunk) {
            continue;
        }
        if (chunk.trim().length === 0) {
            whitespace += chunk;
            continue;
        }
        out.push(`${whitespace}${chunk}`);
        whitespace = "";
    }
    if (whitespace && out.length > 0) {
        out[out.length - 1] = `${out[out.length - 1]}${whitespace}`;
    }
    return out;
}
function isDeliveredPrefix(params) {
    if (!params.deliveredText || params.deliveredText.length === 0) {
        return false;
    }
    return params.finalText === params.deliveredText || params.finalText.startsWith(params.deliveredText);
}
function createLaneTextDeliverer(params) {
    const followUpPayload = (payload, text)=>params.applyTextToFollowUpPayload ? params.applyTextToFollowUpPayload(payload, text) : params.applyTextToPayload(payload, text);
    const textOnlyPayload = (payload)=>{
        const { mediaUrl: _mediaUrl, mediaUrls: _mediaUrls, audioAsVoice: _audioAsVoice, spokenText: _spokenText, ...rest } = payload;
        return rest;
    };
    const mediaChannelData = (channelData, options)=>{
        if (!options?.stripButtons) {
            return channelData;
        }
        const telegramData = channelData?.telegram;
        if (!telegramData || typeof telegramData !== "object" || Array.isArray(telegramData)) {
            return channelData;
        }
        const { buttons: _buttons, ...telegramRest } = telegramData;
        if (_buttons === undefined) {
            return channelData;
        }
        const next = {
            ...channelData
        };
        if (Object.keys(telegramRest).length > 0) {
            next.telegram = telegramRest;
        } else {
            delete next.telegram;
        }
        return Object.keys(next).length > 0 ? next : undefined;
    };
    const withMediaChannelData = (payload, options)=>{
        const channelData = mediaChannelData(payload.channelData, options);
        if (channelData === payload.channelData) {
            return payload;
        }
        if (channelData) {
            return {
                ...payload,
                channelData
            };
        }
        const { channelData: _channelData, ...rest } = payload;
        return rest;
    };
    const withFallbackTelegramButtons = (payload, buttons)=>{
        if (!buttons) {
            return payload;
        }
        const channelData = payload.channelData ?? {};
        const telegramData = channelData.telegram;
        if (telegramData && typeof telegramData === "object" && !Array.isArray(telegramData) && "buttons" in telegramData) {
            return payload;
        }
        const telegramRest = telegramData && typeof telegramData === "object" && !Array.isArray(telegramData) ? telegramData : {};
        return {
            ...payload,
            channelData: {
                ...channelData,
                telegram: {
                    ...telegramRest,
                    buttons
                }
            }
        };
    };
    const mediaOnlyPayload = (payload, text, options)=>{
        if ((0, _replypayload.getReplyPayloadTtsSupplement)(payload)) {
            return withFallbackTelegramButtons(withMediaChannelData((0, _replypayload.buildTtsSupplementMediaPayload)(params.applyTextToPayload(payload, text)), options), options?.fallbackButtons);
        }
        if (payload.audioAsVoice === true) {
            const { text: _text, presentation: _presentation, interactive: _interactive, btw: _btw, spokenText: _spokenText, ...voicePayload } = params.applyTextToPayload(payload, text);
            return withFallbackTelegramButtons(withMediaChannelData({
                ...voicePayload,
                spokenText: text
            }, options), options?.fallbackButtons);
        }
        const { text: _text, presentation: _presentation, interactive: _interactive, btw: _btw, ...rest } = payload;
        return withFallbackTelegramButtons(withMediaChannelData(rest, options), options?.fallbackButtons);
    };
    const clearUnfinalizedStream = async (lane)=>{
        if (!lane.stream || lane.finalized) {
            return;
        }
        await params.clearDraftLane(lane);
        lane.lastPartialText = "";
        lane.hasStreamedMessage = false;
    };
    const streamText = async (laneName, lane, text, payload, isFinal, buttons)=>{
        const stream = lane.stream;
        if (!stream || text.length === 0 || payload.isError) {
            return undefined;
        }
        const chunks = text.length > params.draftMaxChars ? compactChunks(params.splitFinalTextForStream?.(text) ?? []) : [
            text
        ];
        const [firstChunk, ...remainingChunks] = chunks;
        if (!firstChunk || firstChunk.length > params.draftMaxChars) {
            return undefined;
        }
        const finalText = text.trimEnd();
        const deliveredStreamTextBeforeUpdate = stream.lastDeliveredText?.();
        const deliveredPrefixBeforeUpdate = isFinal && deliveredStreamTextBeforeUpdate !== undefined && isDeliveredPrefix({
            deliveredText: deliveredStreamTextBeforeUpdate,
            finalText
        }) && deliveredStreamTextBeforeUpdate.length > firstChunk.trimEnd().length;
        const finalizeDeliveredPrefix = async (deliveredStreamText, messageId)=>{
            lane.finalized = true;
            params.markDelivered();
            let buttonsAttached = false;
            if (buttons) {
                const deliveredChunks = compactChunks(params.splitFinalTextForStream?.(deliveredStreamText) ?? []);
                const currentChunk = deliveredChunks.at(-1);
                if (currentChunk && currentChunk.length <= params.draftMaxChars) {
                    try {
                        await params.editStreamMessage({
                            laneName,
                            messageId,
                            text: currentChunk,
                            buttons
                        });
                        buttonsAttached = true;
                    } catch (err) {
                        params.log(`telegram: ${laneName} stream button edit failed: ${String(err)}`);
                    }
                }
            }
            const suffix = finalText.slice(deliveredStreamText.length);
            if (suffix.trim().length > 0) {
                for (const chunk of compactChunks(params.splitFinalTextForStream?.(suffix) ?? [])){
                    if (chunk.trim().length === 0) {
                        continue;
                    }
                    await params.sendPayload(followUpPayload(payload, chunk));
                }
            }
            return result("preview-finalized", {
                content: text,
                promptContextContent: deliveredStreamText,
                messageId,
                buttonsAttached
            });
        };
        const retainedPreview = isFinal && remainingChunks.length === 0 && (0, _channeloutbound.isPotentialTruncatedFinal)(text) ? (0, _channeloutbound.selectLongerFinalText)({
            finalText: text,
            candidateTexts: [
                await params.resolveFinalTextCandidate?.({
                    finalText: text,
                    laneName
                }),
                stream.lastDeliveredText?.(),
                lane.lastPartialText
            ]
        }) : undefined;
        if (retainedPreview && (!buttons || retainedPreview.length <= params.draftMaxChars)) {
            const previewText = retainedPreview;
            lane.lastPartialText = previewText;
            lane.hasStreamedMessage = true;
            await params.stopDraftLane(lane);
            const messageId = stream.messageId();
            if (typeof messageId !== "number") {
                if (stream.sendMayHaveLanded?.()) {
                    lane.finalized = true;
                    params.markDelivered();
                    return result("preview-retained");
                }
                return undefined;
            }
            const deliveredStreamTextAfterStop = stream.lastDeliveredText?.();
            if (deliveredStreamTextAfterStop !== undefined && deliveredStreamTextAfterStop !== previewText) {
                return undefined;
            }
            let buttonsAttached = false;
            if (buttons) {
                try {
                    await params.editStreamMessage({
                        laneName,
                        messageId,
                        text: previewText,
                        buttons
                    });
                    buttonsAttached = true;
                } catch (err) {
                    params.log(`telegram: ${laneName} stream button edit failed: ${String(err)}`);
                }
            }
            for (const chunk of remainingChunks){
                if (chunk.trim().length === 0) {
                    continue;
                }
                await params.sendPayload(followUpPayload(payload, chunk));
            }
            lane.finalized = true;
            params.markDelivered();
            return result("preview-finalized", {
                content: previewText,
                messageId,
                buttonsAttached
            });
        }
        if (!deliveredPrefixBeforeUpdate) {
            lane.lastPartialText = firstChunk;
            lane.hasStreamedMessage = true;
            lane.finalized = false;
            stream.update(firstChunk);
        }
        if (isFinal) {
            await params.stopDraftLane(lane);
        } else {
            await params.flushDraftLane(lane);
        }
        const messageId = stream.messageId();
        if (typeof messageId !== "number") {
            if (isFinal && stream.sendMayHaveLanded?.()) {
                lane.finalized = true;
                params.markDelivered();
                return result("preview-retained");
            }
            return undefined;
        }
        const deliveredStreamTextAfterStop = stream.lastDeliveredText?.();
        if (isFinal && deliveredStreamTextAfterStop !== undefined && deliveredStreamTextAfterStop !== firstChunk.trimEnd()) {
            if (isDeliveredPrefix({
                deliveredText: deliveredStreamTextAfterStop,
                finalText
            }) && deliveredStreamTextAfterStop.length > firstChunk.trimEnd().length) {
                return await finalizeDeliveredPrefix(deliveredStreamTextAfterStop, messageId);
            }
            return undefined;
        }
        if (deliveredPrefixBeforeUpdate && deliveredStreamTextAfterStop === undefined) {
            return await finalizeDeliveredPrefix(deliveredStreamTextBeforeUpdate, messageId);
        }
        params.markDelivered();
        let buttonsAttached = false;
        if (buttons) {
            try {
                await params.editStreamMessage({
                    laneName,
                    messageId,
                    text: firstChunk,
                    buttons
                });
                buttonsAttached = true;
            } catch (err) {
                params.log(`telegram: ${laneName} stream button edit failed: ${String(err)}`);
            }
        }
        if (isFinal) {
            lane.finalized = true;
            for (const chunk of remainingChunks){
                if (chunk.trim().length === 0) {
                    continue;
                }
                await params.sendPayload(followUpPayload(payload, chunk));
            }
            return result("preview-finalized", {
                content: text,
                promptContextContent: firstChunk,
                messageId,
                buttonsAttached
            });
        }
        return result("preview-updated");
    };
    return async ({ laneName, text, payload, infoKind, buttons })=>{
        const lane = params.lanes[laneName];
        const reply = (0, _replypayload.resolveSendableOutboundReplyParts)(payload, {
            text
        });
        const isFinal = infoKind === "final";
        const streamed = !reply.hasMedia ? await streamText(laneName, lane, text, payload, isFinal, buttons) : undefined;
        if (streamed) {
            return streamed;
        }
        if (isFinal && reply.hasMedia && lane.stream && lane.hasStreamedMessage && !lane.finalized && text.trim().length > 0) {
            const finalizedPreview = await streamText(laneName, lane, text, textOnlyPayload(payload), true, buttons);
            if (finalizedPreview) {
                const stripButtons = finalizedPreview.kind === "preview-finalized" && finalizedPreview.delivery.buttonsAttached === true;
                const mediaText = finalizedPreview.kind === "preview-finalized" ? finalizedPreview.delivery.content : text;
                await params.sendPayload(mediaOnlyPayload(payload, mediaText, {
                    stripButtons,
                    fallbackButtons: stripButtons ? undefined : buttons
                }), {
                    durable: true
                });
                return finalizedPreview;
            }
        }
        if (isFinal) {
            await clearUnfinalizedStream(lane);
        }
        const delivered = await params.sendPayload(params.applyTextToPayload(payload, text), {
            durable: isFinal
        });
        if (delivered && isFinal) {
            lane.finalized = true;
        }
        return delivered ? result("sent") : result("skipped");
    };
}

//# sourceMappingURL=lane-delivery-text-deliverer.js.map