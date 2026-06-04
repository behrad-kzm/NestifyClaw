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
    get deliverReplies () {
        return deliverReplies;
    },
    get emitInternalMessageSentHook () {
        return emitInternalMessageSentHook;
    },
    get emitTelegramMessageSentHooks () {
        return emitTelegramMessageSentHooks;
    }
});
const _grammy = require("grammy");
const _channeloutbound = require("../../../../../common/openclaw/plugin-sdk/channel-outbound");
const _hookruntime = require("../../../../../common/openclaw/plugin-sdk/hook-runtime");
const _interactiveruntime = require("../../../../../common/openclaw/plugin-sdk/interactive-runtime");
const _mediaruntime = require("../../../../../common/openclaw/plugin-sdk/media-runtime");
const _pluginruntime = require("../../../../../common/openclaw/plugin-sdk/plugin-runtime");
const _replychunking = require("../../../../../common/openclaw/plugin-sdk/reply-chunking");
const _runtimeenv = require("../../../../../common/openclaw/plugin-sdk/runtime-env");
const _ssrfruntime = require("../../../../../common/openclaw/plugin-sdk/ssrf-runtime");
const _webmedia = require("../../../../../common/openclaw/plugin-sdk/web-media");
const _buttontypes = require("../button-types.js");
const _caption = require("../caption.js");
const _format = require("../format.js");
const _interactivefallback = require("../interactive-fallback.js");
const _send = require("../send.js");
const _voice = require("../voice.js");
const _deliverysend = require("./delivery.send.js");
const _helpers = require("./helpers.js");
const _replythreading = require("./reply-threading.js");
const VOICE_FORBIDDEN_MARKER = "VOICE_MESSAGES_FORBIDDEN";
const CAPTION_TOO_LONG_RE = /caption is too long/i;
const GrammyErrorCtor = typeof _grammy.GrammyError === "function" ? _grammy.GrammyError : undefined;
const silentReplyLogger = (0, _runtimeenv.createSubsystemLogger)("telegram/silent-reply");
function buildChunkTextResolver(params) {
    return (markdown)=>{
        const markdownChunks = params.chunkMode === "newline" ? (0, _replychunking.chunkMarkdownTextWithMode)(markdown, params.textLimit, params.chunkMode) : [
            markdown
        ];
        const chunks = [];
        for (const chunk of markdownChunks){
            const nested = (0, _format.markdownToTelegramChunks)(chunk, params.textLimit, {
                tableMode: params.tableMode
            });
            if (!nested.length && chunk) {
                chunks.push({
                    html: (0, _format.wrapFileReferencesInHtml)((0, _format.markdownToTelegramHtml)(chunk, {
                        tableMode: params.tableMode,
                        wrapFileRefs: false
                    })),
                    text: chunk
                });
                continue;
            }
            chunks.push(...nested);
        }
        return chunks;
    };
}
function markDelivered(progress) {
    progress.hasDelivered = true;
    progress.deliveredCount += 1;
}
function filterEmptyTelegramTextChunks(chunks) {
    // Telegram rejects whitespace-only text payloads; drop them before sendMessage so
    // hook-mutated or model-emitted empty replies become a no-op instead of a 400.
    return chunks.filter((chunk)=>chunk.text.trim().length > 0);
}
function resolveReplyQuoteForSend(params) {
    if (params.replyToId != null) {
        const mapped = params.replyQuoteByMessageId?.[String(params.replyToId)];
        if (mapped?.text) {
            const quote = {
                messageId: params.replyToId,
                text: mapped.text
            };
            if (typeof mapped.position === "number") {
                quote.position = mapped.position;
            }
            if (mapped.entities) {
                quote.entities = mapped.entities;
            }
            return quote;
        }
    }
    const quote = {};
    if (params.replyQuoteMessageId != null) {
        quote.messageId = params.replyQuoteMessageId;
    }
    if (params.replyQuoteText != null) {
        quote.text = params.replyQuoteText;
    }
    if (params.replyQuotePosition != null) {
        quote.position = params.replyQuotePosition;
    }
    if (params.replyQuoteEntities != null) {
        quote.entities = params.replyQuoteEntities;
    }
    return quote;
}
async function deliverTextReply(params) {
    let firstDeliveredMessageId;
    const chunks = filterEmptyTelegramTextChunks(params.chunkText(params.replyText));
    await (0, _replythreading.sendChunkedTelegramReplyText)({
        chunks,
        progress: params.progress,
        replyToId: params.replyToId,
        replyToMode: params.replyToMode,
        replyMarkup: params.replyMarkup,
        replyQuoteText: params.replyQuoteText,
        markDelivered,
        sendChunk: async ({ chunk, replyToMessageId, replyMarkup, replyQuoteText })=>{
            const messageId = await (0, _deliverysend.sendTelegramText)(params.bot, params.chatId, chunk.html, params.runtime, {
                replyToMessageId,
                replyQuoteMessageId: params.replyQuoteMessageId,
                replyQuoteText,
                replyQuotePosition: params.replyQuotePosition,
                replyQuoteEntities: params.replyQuoteEntities,
                thread: params.thread,
                textMode: "html",
                plainText: chunk.text,
                linkPreview: params.linkPreview,
                silent: params.silent,
                replyMarkup
            });
            if (firstDeliveredMessageId == null) {
                firstDeliveredMessageId = messageId;
            }
        }
    });
    return firstDeliveredMessageId;
}
async function sendPendingFollowUpText(params) {
    const chunks = filterEmptyTelegramTextChunks(params.chunkText(params.text));
    await (0, _replythreading.sendChunkedTelegramReplyText)({
        chunks,
        progress: params.progress,
        replyToId: params.replyToId,
        replyToMode: params.replyToMode,
        replyMarkup: params.replyMarkup,
        markDelivered,
        sendChunk: async ({ chunk, replyToMessageId, replyMarkup })=>{
            await (0, _deliverysend.sendTelegramText)(params.bot, params.chatId, chunk.html, params.runtime, {
                replyToMessageId,
                thread: params.thread,
                textMode: "html",
                plainText: chunk.text,
                linkPreview: params.linkPreview,
                silent: params.silent,
                replyMarkup
            });
        }
    });
}
function isVoiceMessagesForbidden(err) {
    if (GrammyErrorCtor && err instanceof GrammyErrorCtor) {
        return err.description.includes(VOICE_FORBIDDEN_MARKER);
    }
    return (0, _ssrfruntime.formatErrorMessage)(err).includes(VOICE_FORBIDDEN_MARKER);
}
function isCaptionTooLong(err) {
    if (GrammyErrorCtor && err instanceof GrammyErrorCtor) {
        return CAPTION_TOO_LONG_RE.test(err.description);
    }
    return CAPTION_TOO_LONG_RE.test((0, _ssrfruntime.formatErrorMessage)(err));
}
function resolveVoiceFallbackText(reply) {
    if (reply.text?.trim()) {
        return reply.text;
    }
    if (reply.spokenText?.trim()) {
        return reply.spokenText;
    }
    return undefined;
}
async function sendTelegramVoiceFallbackText(opts) {
    let firstDeliveredMessageId;
    const chunks = filterEmptyTelegramTextChunks(opts.chunkText(opts.text));
    let appliedReplyTo = false;
    for (const chunk of chunks){
        // Only apply reply reference, quote text, and buttons to the first chunk.
        const replyToForChunk = !appliedReplyTo ? opts.replyToId : undefined;
        const applyQuoteForChunk = !appliedReplyTo;
        const messageId = await (0, _deliverysend.sendTelegramText)(opts.bot, opts.chatId, chunk.html, opts.runtime, {
            replyToMessageId: replyToForChunk,
            replyQuoteMessageId: applyQuoteForChunk ? opts.replyQuoteMessageId : undefined,
            replyQuoteText: applyQuoteForChunk ? opts.replyQuoteText : undefined,
            replyQuotePosition: applyQuoteForChunk ? opts.replyQuotePosition : undefined,
            replyQuoteEntities: applyQuoteForChunk ? opts.replyQuoteEntities : undefined,
            thread: opts.thread,
            textMode: "html",
            plainText: chunk.text,
            linkPreview: opts.linkPreview,
            silent: opts.silent,
            replyMarkup: !appliedReplyTo ? opts.replyMarkup : undefined
        });
        if (firstDeliveredMessageId == null) {
            firstDeliveredMessageId = messageId;
        }
        if (replyToForChunk) {
            appliedReplyTo = true;
        }
    }
    return firstDeliveredMessageId;
}
async function deliverMediaReply(params) {
    let firstDeliveredMessageId;
    let visibleFallbackText;
    let first = true;
    let pendingFollowUpText;
    for (const mediaUrl of params.mediaList){
        const isFirstMedia = first;
        const media = await params.mediaLoader(mediaUrl, (0, _mediaruntime.buildOutboundMediaLoadOptions)({
            mediaLocalRoots: params.mediaLocalRoots,
            maxBytes: params.mediaMaxBytes
        }));
        const kind = (0, _mediaruntime.kindFromMime)(media.contentType ?? undefined);
        const isGif = (0, _mediaruntime.isGifMedia)({
            contentType: media.contentType,
            fileName: media.fileName
        });
        const fileName = media.fileName ?? (isGif ? "animation.gif" : "file");
        const file = new _grammy.InputFile(media.buffer, fileName);
        const { caption, followUpText } = (0, _caption.splitTelegramCaption)(isFirstMedia ? params.reply.text ?? undefined : undefined);
        const htmlCaption = caption ? (0, _format.renderTelegramHtmlText)(caption, {
            tableMode: params.tableMode
        }) : undefined;
        if (followUpText) {
            pendingFollowUpText = followUpText;
        }
        first = false;
        const replyToMessageId = (0, _replythreading.resolveReplyToForSend)({
            replyToId: params.replyToId,
            replyToMode: params.replyToMode,
            progress: params.progress
        });
        const shouldAttachButtonsToMedia = isFirstMedia && params.replyMarkup && !followUpText;
        const videoDimensions = kind === "video" ? await (0, _mediaruntime.probeVideoDimensions)(media.buffer) : undefined;
        const mediaParams = {
            caption: htmlCaption,
            ...htmlCaption ? {
                parse_mode: "HTML"
            } : {},
            ...shouldAttachButtonsToMedia ? {
                reply_markup: params.replyMarkup
            } : {},
            ...videoDimensions ? {
                width: videoDimensions.width,
                height: videoDimensions.height
            } : {},
            ...(0, _deliverysend.buildTelegramSendParams)({
                replyToMessageId,
                replyQuoteMessageId: params.replyQuoteMessageId,
                replyQuoteText: params.replyQuoteText,
                replyQuotePosition: params.replyQuotePosition,
                replyQuoteEntities: params.replyQuoteEntities,
                thread: params.thread,
                silent: params.silent
            })
        };
        if (isGif) {
            const result = await (0, _deliverysend.sendTelegramWithThreadFallback)({
                operation: "sendAnimation",
                runtime: params.runtime,
                thread: params.thread,
                requestParams: mediaParams,
                send: (effectiveParams)=>params.bot.api.sendAnimation(params.chatId, file, {
                        ...effectiveParams
                    })
            });
            if (firstDeliveredMessageId == null) {
                firstDeliveredMessageId = result.message_id;
            }
            markDelivered(params.progress);
        } else if (kind === "image") {
            const result = await (0, _deliverysend.sendTelegramWithThreadFallback)({
                operation: "sendPhoto",
                runtime: params.runtime,
                thread: params.thread,
                requestParams: mediaParams,
                send: (effectiveParams)=>params.bot.api.sendPhoto(params.chatId, file, {
                        ...effectiveParams
                    })
            });
            if (firstDeliveredMessageId == null) {
                firstDeliveredMessageId = result.message_id;
            }
            markDelivered(params.progress);
        } else if (kind === "video") {
            const result = await (0, _deliverysend.sendTelegramWithThreadFallback)({
                operation: "sendVideo",
                runtime: params.runtime,
                thread: params.thread,
                requestParams: mediaParams,
                send: (effectiveParams)=>params.bot.api.sendVideo(params.chatId, file, {
                        ...effectiveParams
                    })
            });
            if (firstDeliveredMessageId == null) {
                firstDeliveredMessageId = result.message_id;
            }
            markDelivered(params.progress);
        } else if (kind === "audio") {
            const { useVoice } = (0, _voice.resolveTelegramVoiceSend)({
                wantsVoice: params.reply.audioAsVoice === true,
                contentType: media.contentType,
                fileName,
                logFallback: _runtimeenv.logVerbose
            });
            if (useVoice) {
                const sendVoiceMedia = async (requestParams, shouldLog)=>{
                    const result = await (0, _deliverysend.sendTelegramWithThreadFallback)({
                        operation: "sendVoice",
                        runtime: params.runtime,
                        thread: params.thread,
                        requestParams,
                        shouldLog,
                        send: (effectiveParams)=>params.bot.api.sendVoice(params.chatId, file, {
                                ...effectiveParams
                            })
                    });
                    if (firstDeliveredMessageId == null) {
                        firstDeliveredMessageId = result.message_id;
                    }
                    markDelivered(params.progress);
                };
                await params.onVoiceRecording?.();
                try {
                    await sendVoiceMedia(mediaParams, (err)=>!isVoiceMessagesForbidden(err));
                } catch (voiceErr) {
                    if (isVoiceMessagesForbidden(voiceErr)) {
                        const fallbackText = resolveVoiceFallbackText(params.reply);
                        if (!fallbackText || !fallbackText.trim()) {
                            throw voiceErr;
                        }
                        (0, _runtimeenv.logVerbose)("telegram sendVoice forbidden (recipient has voice messages blocked in privacy settings); falling back to text");
                        const voiceFallbackReplyTo = (0, _replythreading.resolveReplyToForSend)({
                            replyToId: params.replyToId,
                            replyToMode: params.replyToMode,
                            progress: params.progress
                        });
                        const fallbackMessageId = await sendTelegramVoiceFallbackText({
                            bot: params.bot,
                            chatId: params.chatId,
                            runtime: params.runtime,
                            text: fallbackText,
                            chunkText: params.chunkText,
                            replyToId: voiceFallbackReplyTo,
                            replyQuoteMessageId: params.replyQuoteMessageId,
                            replyQuotePosition: params.replyQuotePosition,
                            replyQuoteEntities: params.replyQuoteEntities,
                            thread: params.thread,
                            linkPreview: params.linkPreview,
                            silent: params.silent,
                            replyMarkup: params.replyMarkup,
                            replyQuoteText: params.replyQuoteText
                        });
                        if (firstDeliveredMessageId == null) {
                            firstDeliveredMessageId = fallbackMessageId;
                        }
                        visibleFallbackText = fallbackText;
                        (0, _replythreading.markReplyApplied)(params.progress, voiceFallbackReplyTo);
                        markDelivered(params.progress);
                        continue;
                    }
                    if (isCaptionTooLong(voiceErr)) {
                        (0, _runtimeenv.logVerbose)("telegram sendVoice caption too long; resending voice without caption + text separately");
                        const noCaptionParams = {
                            ...mediaParams
                        };
                        delete noCaptionParams.caption;
                        delete noCaptionParams.parse_mode;
                        await sendVoiceMedia(noCaptionParams);
                        const fallbackText = resolveVoiceFallbackText(params.reply);
                        if (fallbackText?.trim()) {
                            await sendTelegramVoiceFallbackText({
                                bot: params.bot,
                                chatId: params.chatId,
                                runtime: params.runtime,
                                text: fallbackText,
                                chunkText: params.chunkText,
                                replyToId: undefined,
                                thread: params.thread,
                                linkPreview: params.linkPreview,
                                silent: params.silent,
                                replyMarkup: params.replyMarkup
                            });
                            visibleFallbackText = fallbackText;
                        }
                        (0, _replythreading.markReplyApplied)(params.progress, replyToMessageId);
                        continue;
                    }
                    throw voiceErr;
                }
            } else {
                const result = await (0, _deliverysend.sendTelegramWithThreadFallback)({
                    operation: "sendAudio",
                    runtime: params.runtime,
                    thread: params.thread,
                    requestParams: mediaParams,
                    send: (effectiveParams)=>params.bot.api.sendAudio(params.chatId, file, {
                            ...effectiveParams
                        })
                });
                if (firstDeliveredMessageId == null) {
                    firstDeliveredMessageId = result.message_id;
                }
                markDelivered(params.progress);
            }
        } else {
            const result = await (0, _deliverysend.sendTelegramWithThreadFallback)({
                operation: "sendDocument",
                runtime: params.runtime,
                thread: params.thread,
                requestParams: mediaParams,
                send: (effectiveParams)=>params.bot.api.sendDocument(params.chatId, file, {
                        ...effectiveParams
                    })
            });
            if (firstDeliveredMessageId == null) {
                firstDeliveredMessageId = result.message_id;
            }
            markDelivered(params.progress);
        }
        (0, _replythreading.markReplyApplied)(params.progress, replyToMessageId);
        if (pendingFollowUpText && isFirstMedia) {
            await sendPendingFollowUpText({
                bot: params.bot,
                chatId: params.chatId,
                runtime: params.runtime,
                thread: params.thread,
                chunkText: params.chunkText,
                text: pendingFollowUpText,
                replyMarkup: params.replyMarkup,
                linkPreview: params.linkPreview,
                silent: params.silent,
                replyToId: params.replyToId,
                replyToMode: params.replyToMode,
                progress: params.progress
            });
            pendingFollowUpText = undefined;
        }
    }
    return {
        firstDeliveredMessageId,
        visibleFallbackText
    };
}
async function maybePinFirstDeliveredMessage(params) {
    const shouldPin = params.pin === true || typeof params.pin === "object" && params.pin.enabled;
    if (!shouldPin || typeof params.firstDeliveredMessageId !== "number") {
        return;
    }
    const notify = typeof params.pin === "object" && params.pin.notify === true;
    try {
        await params.bot.api.pinChatMessage(params.chatId, params.firstDeliveredMessageId, {
            disable_notification: !notify
        });
    } catch (err) {
        (0, _runtimeenv.logVerbose)(`telegram pinChatMessage failed chat=${params.chatId} message=${params.firstDeliveredMessageId}: ${(0, _ssrfruntime.formatErrorMessage)(err)}`);
    }
}
function buildTelegramSentHookContext(params) {
    return (0, _hookruntime.buildCanonicalSentMessageHookContext)({
        to: params.chatId,
        content: params.content,
        success: params.success,
        error: params.error,
        channelId: "telegram",
        accountId: params.accountId,
        conversationId: params.chatId,
        messageId: typeof params.messageId === "number" ? String(params.messageId) : undefined,
        isGroup: params.isGroup,
        groupId: params.groupId
    });
}
function emitInternalMessageSentHook(params) {
    if (!params.sessionKeyForInternalHooks) {
        return;
    }
    const canonical = buildTelegramSentHookContext(params);
    (0, _hookruntime.fireAndForgetHook)((0, _hookruntime.triggerInternalHook)((0, _hookruntime.createInternalHookEvent)("message", "sent", params.sessionKeyForInternalHooks, (0, _hookruntime.toInternalMessageSentContext)(canonical))), "telegram: message:sent internal hook failed");
}
function emitMessageSentHooks(params) {
    if (!params.enabled && !params.sessionKeyForInternalHooks) {
        return;
    }
    const canonical = buildTelegramSentHookContext(params);
    if (params.enabled) {
        (0, _hookruntime.fireAndForgetHook)(Promise.resolve(params.hookRunner.runMessageSent((0, _hookruntime.toPluginMessageSentEvent)(canonical), (0, _hookruntime.toPluginMessageContext)(canonical))), "telegram: message_sent plugin hook failed");
    }
    emitInternalMessageSentHook(params);
}
function emitTelegramMessageSentHooks(params) {
    const hookRunner = (0, _pluginruntime.getGlobalHookRunner)();
    emitMessageSentHooks({
        ...params,
        hookRunner,
        enabled: hookRunner?.hasHooks("message_sent") ?? false
    });
}
async function deliverReplies(params) {
    const progress = {
        hasReplied: false,
        hasDelivered: false,
        deliveredCount: 0
    };
    const mediaLoader = params.mediaLoader ?? _webmedia.loadWebMedia;
    const transcriptMirror = params.transcriptMirror;
    const deliveredContents = [];
    const hookRunner = (0, _pluginruntime.getGlobalHookRunner)();
    const hasMessageSendingHooks = hookRunner?.hasHooks("message_sending") ?? false;
    const hasMessageSentHooks = hookRunner?.hasHooks("message_sent") ?? false;
    const chunkText = buildChunkTextResolver({
        textLimit: params.textLimit,
        chunkMode: params.chunkMode ?? "length",
        tableMode: params.tableMode
    });
    const candidateReplies = [];
    for (const reply of params.replies){
        if (!reply || typeof reply !== "object") {
            params.runtime.error?.((0, _runtimeenv.danger)("reply missing text/media"));
            continue;
        }
        candidateReplies.push(reply);
    }
    const normalizedReplies = (0, _channeloutbound.projectOutboundPayloadPlanForDelivery)((0, _channeloutbound.createOutboundPayloadPlan)(candidateReplies, {
        cfg: params.cfg,
        sessionKey: params.policySessionKey ?? params.sessionKeyForInternalHooks,
        surface: "telegram"
    }));
    const originalExactSilentCount = candidateReplies.filter((reply)=>typeof reply.text === "string" && reply.text.trim().toUpperCase() === "NO_REPLY").length;
    if (originalExactSilentCount > 0) {
        silentReplyLogger.debug("telegram delivery normalized NO_REPLY candidates", {
            hasSessionKey: Boolean(params.sessionKeyForInternalHooks),
            hasChatId: params.chatId.length > 0,
            originalCount: candidateReplies.length,
            normalizedCount: normalizedReplies.length,
            originalExactSilentCount
        });
    }
    for (const originalReply of normalizedReplies){
        let reply = originalReply;
        const mediaList = reply?.mediaUrls?.length ? reply.mediaUrls : reply?.mediaUrl ? [
            reply.mediaUrl
        ] : [];
        const hasMedia = mediaList.length > 0;
        const presentation = (0, _interactiveruntime.normalizeMessagePresentation)(reply?.presentation);
        const interactive = reply?.interactive;
        const resolvedReplyText = (0, _interactivefallback.resolveTelegramInteractiveTextFallback)({
            text: reply?.text,
            interactive,
            presentation
        }) ?? reply?.text ?? "";
        if (reply && resolvedReplyText !== (reply.text ?? "")) {
            reply = {
                ...reply,
                text: resolvedReplyText
            };
        }
        if (!resolvedReplyText && !hasMedia) {
            if (reply?.audioAsVoice) {
                (0, _runtimeenv.logVerbose)("telegram reply has audioAsVoice without media/text; skipping");
                continue;
            }
            params.runtime.error?.((0, _runtimeenv.danger)("reply missing text/media"));
            continue;
        }
        const rawContent = resolvedReplyText;
        const spokenHookContent = !rawContent && reply.audioAsVoice === true && reply.spokenText?.trim() ? reply.spokenText : undefined;
        const hookContent = spokenHookContent ?? rawContent;
        const replyToId = params.replyToMode === "off" ? undefined : (0, _helpers.resolveTelegramReplyId)(reply.replyToId);
        const replyQuote = resolveReplyQuoteForSend({
            replyToId,
            replyQuoteByMessageId: params.replyQuoteByMessageId,
            replyQuoteMessageId: params.replyQuoteMessageId,
            replyQuoteText: params.replyQuoteText,
            replyQuotePosition: params.replyQuotePosition,
            replyQuoteEntities: params.replyQuoteEntities
        });
        if (hasMessageSendingHooks) {
            const hookResult = await hookRunner?.runMessageSending({
                to: params.chatId,
                content: hookContent,
                replyToId,
                threadId: params.thread?.id,
                metadata: {
                    channel: "telegram",
                    mediaUrls: mediaList,
                    threadId: params.thread?.id
                }
            }, {
                channelId: "telegram",
                accountId: params.accountId,
                conversationId: params.chatId
            });
            if (hookResult?.cancel) {
                continue;
            }
            if (typeof hookResult?.content === "string" && hookResult.content !== hookContent) {
                reply = spokenHookContent ? {
                    ...reply,
                    spokenText: hookResult.content
                } : {
                    ...reply,
                    text: hookResult.content
                };
            }
        }
        let contentForSentHook = reply.text || (reply.audioAsVoice === true ? resolveVoiceFallbackText(reply) : "") || "";
        try {
            const deliveredCountBeforeReply = progress.deliveredCount;
            const telegramData = reply.channelData?.telegram;
            const replyMarkup = (0, _send.buildInlineKeyboard)((0, _buttontypes.resolveTelegramInlineButtons)({
                buttons: telegramData?.buttons,
                presentation,
                interactive
            }));
            let firstDeliveredMessageId;
            if (mediaList.length === 0) {
                firstDeliveredMessageId = await deliverTextReply({
                    bot: params.bot,
                    chatId: params.chatId,
                    runtime: params.runtime,
                    thread: params.thread,
                    chunkText,
                    replyText: reply.text || "",
                    replyMarkup,
                    replyQuoteMessageId: replyQuote.messageId,
                    replyQuoteText: replyQuote.text,
                    replyQuotePosition: replyQuote.position,
                    replyQuoteEntities: replyQuote.entities,
                    linkPreview: params.linkPreview,
                    silent: params.silent,
                    replyToId,
                    replyToMode: params.replyToMode,
                    progress
                });
            } else {
                const mediaDelivery = await deliverMediaReply({
                    reply,
                    mediaList,
                    bot: params.bot,
                    chatId: params.chatId,
                    runtime: params.runtime,
                    thread: params.thread,
                    tableMode: params.tableMode,
                    mediaLocalRoots: params.mediaLocalRoots,
                    mediaMaxBytes: params.mediaMaxBytes,
                    chunkText,
                    mediaLoader,
                    onVoiceRecording: params.onVoiceRecording,
                    linkPreview: params.linkPreview,
                    silent: params.silent,
                    replyQuoteMessageId: replyQuote.messageId,
                    replyQuoteText: replyQuote.text,
                    replyQuotePosition: replyQuote.position,
                    replyQuoteEntities: replyQuote.entities,
                    replyMarkup,
                    replyToId,
                    replyToMode: params.replyToMode,
                    progress
                });
                firstDeliveredMessageId = mediaDelivery.firstDeliveredMessageId;
                if (mediaDelivery.visibleFallbackText) {
                    contentForSentHook = mediaDelivery.visibleFallbackText;
                }
            }
            await maybePinFirstDeliveredMessage({
                pin: reply.delivery?.pin,
                bot: params.bot,
                chatId: params.chatId,
                runtime: params.runtime,
                firstDeliveredMessageId
            });
            if (progress.deliveredCount > deliveredCountBeforeReply && transcriptMirror) {
                deliveredContents.push({
                    text: contentForSentHook,
                    mediaUrls: mediaList
                });
            }
            emitMessageSentHooks({
                hookRunner,
                enabled: hasMessageSentHooks,
                sessionKeyForInternalHooks: params.sessionKeyForInternalHooks,
                chatId: params.chatId,
                accountId: params.accountId,
                content: contentForSentHook,
                success: progress.deliveredCount > deliveredCountBeforeReply,
                messageId: firstDeliveredMessageId,
                isGroup: params.mirrorIsGroup,
                groupId: params.mirrorGroupId
            });
        } catch (error) {
            emitMessageSentHooks({
                hookRunner,
                enabled: hasMessageSentHooks,
                sessionKeyForInternalHooks: params.sessionKeyForInternalHooks,
                chatId: params.chatId,
                accountId: params.accountId,
                content: contentForSentHook,
                success: false,
                error: (0, _ssrfruntime.formatErrorMessage)(error),
                isGroup: params.mirrorIsGroup,
                groupId: params.mirrorGroupId
            });
            throw error;
        }
    }
    if (progress.hasDelivered && transcriptMirror) {
        const text = deliveredContents.map((content)=>content.text).filter(Boolean).join("\n\n");
        const mediaUrls = deliveredContents.flatMap((content)=>content.mediaUrls);
        if (text || mediaUrls.length > 0) {
            try {
                await transcriptMirror({
                    text: text || undefined,
                    mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
                });
            } catch (mirrorErr) {
                (0, _runtimeenv.logVerbose)(`telegram transcriptMirror failed: ${(0, _ssrfruntime.formatErrorMessage)(mirrorErr)}`);
            }
        }
    }
    return {
        delivered: progress.hasDelivered
    };
}

//# sourceMappingURL=delivery.replies.js.map