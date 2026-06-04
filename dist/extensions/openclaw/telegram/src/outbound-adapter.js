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
    get TELEGRAM_POLL_OPTION_LIMIT () {
        return TELEGRAM_POLL_OPTION_LIMIT;
    },
    get TELEGRAM_TEXT_CHUNK_LIMIT () {
        return TELEGRAM_TEXT_CHUNK_LIMIT;
    },
    get createTelegramOutboundAdapter () {
        return createTelegramOutboundAdapter;
    },
    get sendTelegramPayloadMessages () {
        return sendTelegramPayloadMessages;
    },
    get telegramOutbound () {
        return telegramOutbound;
    }
});
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _channelsendresult = require("../../../../common/openclaw/plugin-sdk/channel-send-result");
const _interactiveruntime = require("../../../../common/openclaw/plugin-sdk/interactive-runtime");
const _replypayload = require("../../../../common/openclaw/plugin-sdk/reply-payload");
const _buttontypes = require("./button-types.js");
const _format = require("./format.js");
const _interactivefallback = require("./interactive-fallback.js");
const _outboundparams = require("./outbound-params.js");
const _targets = require("./targets.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const TELEGRAM_TEXT_CHUNK_LIMIT = 4000;
const TELEGRAM_POLL_OPTION_LIMIT = 10;
let telegramSendModulePromise;
async function loadTelegramSendModule() {
    telegramSendModulePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./send.js")));
    return await telegramSendModulePromise;
}
async function resolveDefaultTelegramSend(deps) {
    return (0, _channeloutbound.resolveOutboundSendDep)(deps, "telegram") ?? (await loadTelegramSendModule()).sendMessageTelegram;
}
function chunkTelegramOutboundText(text, limit, ctx) {
    return ctx?.formatting?.parseMode === "HTML" ? (0, _format.splitTelegramHtmlChunks)(text, limit) : (0, _format.markdownToTelegramHtmlChunks)(text, limit, {
        tableMode: ctx?.formatting?.tableMode
    });
}
async function resolveTelegramSendContext(params) {
    const send = await params.resolveSend(params.deps);
    return {
        send,
        baseOpts: {
            verbose: false,
            cfg: params.cfg,
            messageThreadId: (0, _outboundparams.parseTelegramThreadId)(params.threadId),
            replyToMessageId: (0, _outboundparams.parseTelegramReplyToMessageId)(params.replyToId),
            accountId: params.accountId ?? undefined,
            silent: params.silent,
            gatewayClientScopes: params.gatewayClientScopes,
            ...params.formatting?.parseMode === "HTML" ? {
                textMode: "html"
            } : {}
        }
    };
}
async function resolveTelegramOutboundSendContext(params) {
    const outboundTo = (0, _targets.normalizeTelegramOutboundTarget)(params.to);
    const { send, baseOpts } = await resolveTelegramSendContext(params);
    return {
        outboundTo,
        send,
        baseOpts
    };
}
async function sendTelegramPayloadMessages(params) {
    const telegramData = params.payload.channelData?.telegram;
    const quoteText = typeof telegramData?.quoteText === "string" ? telegramData.quoteText : undefined;
    const presentation = (0, _interactiveruntime.normalizeMessagePresentation)(params.payload.presentation);
    const text = (0, _interactivefallback.resolveTelegramInteractiveTextFallback)({
        text: params.payload.text,
        interactive: params.payload.interactive,
        presentation
    }) ?? "";
    const mediaUrls = (0, _replypayload.resolvePayloadMediaUrls)(params.payload);
    const buttons = (0, _buttontypes.resolveTelegramInlineButtons)({
        buttons: telegramData?.buttons,
        presentation,
        interactive: params.payload.interactive
    });
    const payloadOpts = {
        ...params.baseOpts,
        quoteText,
        ...params.payload.audioAsVoice === true ? {
            asVoice: true
        } : {}
    };
    // Telegram allows reply_markup on media; attach buttons only to the first send.
    return await (0, _replypayload.sendPayloadMediaSequenceOrFallback)({
        text,
        mediaUrls,
        fallbackResult: {
            messageId: "unknown",
            chatId: params.to
        },
        sendNoMedia: async ()=>await params.send(params.to, text, {
                ...payloadOpts,
                buttons
            }),
        send: async ({ text: textLocal, mediaUrl, isFirst })=>await params.send(params.to, textLocal, {
                ...payloadOpts,
                mediaUrl,
                ...isFirst ? {
                    buttons
                } : {}
            })
    });
}
function createTelegramOutboundAdapter(options = {}) {
    const resolveSend = options.resolveSend ?? resolveDefaultTelegramSend;
    const loadSendModule = options.loadSendModule ?? loadTelegramSendModule;
    return {
        deliveryMode: "direct",
        chunker: chunkTelegramOutboundText,
        chunkerMode: "markdown",
        chunkedTextFormatting: {
            parseMode: "HTML"
        },
        extractMarkdownImages: true,
        textChunkLimit: TELEGRAM_TEXT_CHUNK_LIMIT,
        shouldSuppressLocalPayloadPrompt: options.shouldSuppressLocalPayloadPrompt,
        beforeDeliverPayload: options.beforeDeliverPayload,
        shouldTreatDeliveredTextAsVisible: options.shouldTreatDeliveredTextAsVisible,
        targetsMatchForReplySuppression: options.targetsMatchForReplySuppression,
        preferFinalAssistantVisibleText: options.preferFinalAssistantVisibleText,
        presentationCapabilities: {
            supported: true,
            buttons: true,
            selects: true,
            context: true,
            divider: false,
            limits: {
                actions: {
                    maxActions: 100,
                    maxActionsPerRow: 3,
                    maxLabelLength: 64,
                    supportsStyles: false
                },
                selects: {
                    maxOptions: 100,
                    maxLabelLength: 64
                },
                text: {
                    markdownDialect: "html"
                }
            }
        },
        deliveryCapabilities: {
            pin: true,
            durableFinal: {
                text: true,
                media: true,
                payload: true,
                silent: true,
                replyTo: true,
                thread: true,
                nativeQuote: false,
                messageSendingHooks: true,
                batch: true
            }
        },
        renderPresentation: ({ payload, presentation })=>{
            const telegramData = payload.channelData?.telegram;
            const hasExplicitButtons = telegramData && "buttons" in telegramData || payload.interactive;
            const buttons = hasExplicitButtons ? undefined : (0, _buttontypes.resolveTelegramInlineButtons)({
                presentation
            });
            return {
                ...payload,
                text: (0, _interactiveruntime.renderMessagePresentationFallbackText)({
                    text: payload.text,
                    presentation
                }),
                channelData: {
                    ...payload.channelData,
                    telegram: {
                        ...telegramData,
                        ...buttons ? {
                            buttons
                        } : {}
                    }
                }
            };
        },
        pinDeliveredMessage: async ({ cfg, target, messageId, pin, gatewayClientScopes })=>{
            const { pinMessageTelegram } = await loadSendModule();
            const outboundTo = (0, _targets.normalizeTelegramOutboundTarget)(target.to);
            const pinTarget = (0, _targets.parseTelegramTarget)(outboundTo);
            await pinMessageTelegram(pinTarget.chatId, messageId, {
                cfg,
                accountId: target.accountId ?? undefined,
                notify: pin.notify,
                verbose: false,
                gatewayClientScopes
            });
        },
        resolveEffectiveTextChunkLimit: ({ fallbackLimit })=>typeof fallbackLimit === "number" ? Math.min(fallbackLimit, 4096) : 4096,
        pollMaxOptions: TELEGRAM_POLL_OPTION_LIMIT,
        supportsPollDurationSeconds: true,
        supportsAnonymousPolls: true,
        ...(0, _channelsendresult.createAttachedChannelResultAdapter)({
            channel: "telegram",
            sendText: async (params)=>{
                const { outboundTo, send, baseOpts } = await resolveTelegramOutboundSendContext({
                    ...params,
                    resolveSend
                });
                return await send(outboundTo, params.text, {
                    ...baseOpts
                });
            },
            sendMedia: async (params)=>{
                const { outboundTo, send, baseOpts } = await resolveTelegramOutboundSendContext({
                    ...params,
                    resolveSend
                });
                return await send(outboundTo, params.text, {
                    ...baseOpts,
                    mediaUrl: params.mediaUrl,
                    mediaLocalRoots: params.mediaLocalRoots,
                    mediaReadFile: params.mediaReadFile,
                    forceDocument: params.forceDocument ?? false
                });
            }
        }),
        sendPayload: async (params)=>{
            const { outboundTo, send, baseOpts } = await resolveTelegramOutboundSendContext({
                ...params,
                resolveSend
            });
            const result = await sendTelegramPayloadMessages({
                send,
                to: outboundTo,
                payload: params.payload,
                baseOpts: {
                    ...baseOpts,
                    mediaLocalRoots: params.mediaLocalRoots,
                    mediaReadFile: params.mediaReadFile,
                    forceDocument: params.forceDocument ?? false
                }
            });
            return (0, _channelsendresult.attachChannelToResult)("telegram", result);
        },
        sendPoll: async ({ cfg, to, poll, accountId, threadId, silent, isAnonymous, gatewayClientScopes })=>{
            const outboundTo = (0, _targets.normalizeTelegramOutboundTarget)(to);
            const { sendPollTelegram } = await loadSendModule();
            return await sendPollTelegram(outboundTo, poll, {
                cfg,
                accountId: accountId ?? undefined,
                messageThreadId: (0, _outboundparams.parseTelegramThreadId)(threadId),
                silent: silent ?? undefined,
                isAnonymous: isAnonymous ?? undefined,
                gatewayClientScopes
            });
        }
    };
}
const telegramOutbound = createTelegramOutboundAdapter();

//# sourceMappingURL=outbound-adapter.js.map