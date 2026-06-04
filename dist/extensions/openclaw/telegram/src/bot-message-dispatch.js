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
    get dispatchTelegramMessage () {
        return dispatchTelegramMessage;
    },
    get getTelegramReplyFenceSizeForTests () {
        return _telegramreplyfence.getTelegramReplyFenceSizeForTests;
    },
    get pruneStickerMediaFromContext () {
        return _botmessagedispatchmedia.pruneStickerMediaFromContext;
    },
    get resetTelegramReplyFenceForTests () {
        return _telegramreplyfence.resetTelegramReplyFenceForTests;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _agentharnessruntime = require("../../../../common/openclaw/plugin-sdk/agent-harness-runtime");
const _channelfeedback = require("../../../../common/openclaw/plugin-sdk/channel-feedback");
const _channelinbound = require("../../../../common/openclaw/plugin-sdk/channel-inbound");
const _channelmentiongating = require("../../../../common/openclaw/plugin-sdk/channel-mention-gating");
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _interactiveruntime = require("../../../../common/openclaw/plugin-sdk/interactive-runtime");
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _replychunking = require("../../../../common/openclaw/plugin-sdk/reply-chunking");
const _replyhistory = require("../../../../common/openclaw/plugin-sdk/reply-history");
const _replypayload = require("../../../../common/openclaw/plugin-sdk/reply-payload");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _agentconfig = require("./agent-config.js");
const _apilogging = require("./api-logging.js");
const _botaccess = require("./bot-access.js");
const _botmessagedispatchagentruntime = require("./bot-message-dispatch.agent.runtime.js");
const _botmessagedispatchmediadedup = require("./bot-message-dispatch.media-dedup.js");
const _botmessagedispatchmedia = require("./bot-message-dispatch.media.js");
const _botmessagedispatchruntime = require("./bot-message-dispatch.runtime.js");
const _delivery = require("./bot/delivery.js");
const _helpers = require("./bot/helpers.js");
const _nativequote = require("./bot/native-quote.js");
const _buttontypes = require("./button-types.js");
const _draftstream = require("./draft-stream.js");
const _errorpolicy = require("./error-policy.js");
const _execapprovals = require("./exec-approvals.js");
const _format = require("./format.js");
const _inboundeventdelivery = require("./inbound-event-delivery.js");
const _lanedelivery = require("./lane-delivery.js");
const _nativetoolprogressdraft = require("./native-tool-progress-draft.js");
const _outboundmessagecontext = require("./outbound-message-context.js");
const _reasoninglanecoordinator = require("./reasoning-lane-coordinator.js");
const _send = require("./send.js");
const _sequentialkey = require("./sequential-key.js");
const _stickercache = require("./sticker-cache.js");
const _telegramreplyfence = require("./telegram-reply-fence.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
const EMPTY_RESPONSE_FALLBACK = "No response generated. Please try again.";
const silentReplyDispatchLogger = (0, _runtimeenv.createSubsystemLogger)("telegram/silent-reply-dispatch");
/** Minimum chars before sending first streaming message (improves push notification UX) */ const DRAFT_MIN_INITIAL_CHARS = 30;
function resolveDraftPartialText(previous, update) {
    const nextText = update.replace || update.isReasoningSnapshot || update.delta === undefined ? update.text : `${previous}${update.delta}`;
    if (nextText === previous) {
        return undefined;
    }
    return nextText;
}
function resolvePayloadTelegramInlineButtons(payload) {
    const telegramData = payload.channelData?.telegram;
    const presentation = (0, _interactiveruntime.normalizeMessagePresentation)(payload.presentation);
    return (0, _buttontypes.resolveTelegramInlineButtons)({
        buttons: telegramData?.buttons,
        presentation,
        interactive: payload.interactive
    });
}
function hasExecApprovalPayload(payload) {
    const channelData = payload.channelData;
    if (!channelData || typeof channelData !== "object" || Array.isArray(channelData)) {
        return false;
    }
    const execApproval = channelData.execApproval;
    return Boolean(execApproval && typeof execApproval === "object" && !Array.isArray(execApproval));
}
function canUseNativeToolProgressDraft(params) {
    return !params.reply.hasMedia && params.payload.isError !== true && !hasExecApprovalPayload(params.payload) && params.buttons === undefined;
}
function canUseNativeToolProgressDraftForChat(params) {
    if (!(0, _channeloutbound.resolveChannelStreamingPreviewNativeToolProgress)(params.telegramCfg)) {
        return false;
    }
    const allowFrom = (0, _channeloutbound.resolveChannelStreamingPreviewNativeToolProgressAllowFrom)(params.telegramCfg);
    if (!allowFrom || allowFrom.length === 0) {
        return true;
    }
    const normalized = (0, _botaccess.normalizeAllowFrom)(allowFrom);
    return normalized.hasWildcard || normalized.entries.includes(String(params.chatId));
}
async function resolveStickerVisionSupport(cfg, agentId) {
    try {
        const catalog = await (0, _botmessagedispatchagentruntime.loadModelCatalog)({
            config: cfg
        });
        const defaultModel = (0, _botmessagedispatchagentruntime.resolveDefaultModelForAgent)({
            cfg,
            agentId
        });
        const entry = (0, _botmessagedispatchagentruntime.findModelInCatalog)(catalog, defaultModel.provider, defaultModel.model);
        if (!entry) {
            return false;
        }
        return (0, _botmessagedispatchagentruntime.modelSupportsVision)(entry);
    } catch  {
        return false;
    }
}
function createFreshTelegramSessionStoreLoader(params) {
    const storesByPath = new Map();
    const load = (agentId)=>{
        const storePath = params.telegramDeps.resolveStorePath(params.cfg.session?.store, {
            agentId
        });
        const cachedStore = storesByPath.get(storePath);
        if (cachedStore) {
            return {
                storePath,
                store: cachedStore
            };
        }
        const store = (params.telegramDeps.loadSessionStore ?? _botmessagedispatchruntime.loadSessionStore)(storePath, {
            skipCache: true
        });
        storesByPath.set(storePath, store);
        return {
            storePath,
            store
        };
    };
    load.clear = ()=>storesByPath.clear();
    return load;
}
function resolveTelegramReasoningLevel(params) {
    const { cfg, sessionKey, agentId } = params;
    const configDefault = (0, _agentconfig.resolveTelegramConfigReasoningDefault)(cfg, agentId);
    if (!sessionKey) {
        return configDefault;
    }
    try {
        const { store } = params.loadFreshSessionStore(agentId);
        const entry = (0, _botmessagedispatchruntime.resolveSessionStoreEntry)({
            store,
            sessionKey
        }).existing;
        const level = entry?.reasoningLevel;
        if (level === "on" || level === "stream" || level === "off") {
            return level;
        }
    } catch  {
        return "off";
    }
    return configDefault;
}
function resolveTelegramMirroredTranscriptText(payload) {
    const mediaUrls = payload.mediaUrls?.filter((url)=>url.trim()) ?? [];
    if (mediaUrls.length > 0) {
        return mediaUrls.map((url)=>{
            const pathname = url.split("#")[0]?.split("?")[0] ?? url;
            const base = _nodepath.default.basename(pathname);
            return base && base !== "." && base !== "/" ? base : "media";
        }).join(", ");
    }
    const text = payload.text?.trim();
    return text ? text : null;
}
async function mirrorTelegramAssistantReplyToTranscript(params) {
    const text = resolveTelegramMirroredTranscriptText(params.payload);
    if (!text) {
        return;
    }
    const { storePath, store } = params.loadFreshSessionStore(params.route.agentId);
    const sessionEntry = (0, _botmessagedispatchruntime.resolveSessionStoreEntry)({
        store,
        sessionKey: params.sessionKey
    }).existing;
    if (!sessionEntry?.sessionId) {
        return;
    }
    const { sessionFile } = await (0, _botmessagedispatchruntime.resolveAndPersistSessionFile)({
        sessionId: sessionEntry.sessionId,
        sessionKey: params.sessionKey,
        sessionStore: store,
        storePath,
        sessionEntry,
        agentId: params.route.agentId,
        sessionsDir: _nodepath.default.dirname(storePath)
    });
    const message = {
        role: "assistant",
        content: [
            {
                type: "text",
                text
            }
        ],
        api: "openai-responses",
        provider: "openclaw",
        model: "delivery-mirror",
        usage: {
            input: 0,
            output: 0,
            total: 0,
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            cache: {
                read: 0,
                write: 0,
                cacheRead: 0,
                cacheWrite: 0,
                total: 0
            }
        },
        stopReason: "stop",
        timestamp: Date.now()
    };
    const { messageId, message: appendedMessage } = await (0, _agentharnessruntime.appendSessionTranscriptMessage)({
        transcriptPath: sessionFile,
        message,
        config: params.cfg
    });
    (0, _agentharnessruntime.emitSessionTranscriptUpdate)({
        sessionFile,
        sessionKey: params.sessionKey,
        agentId: params.route.agentId,
        message: appendedMessage,
        messageId
    });
}
const MAX_PROGRESS_MARKDOWN_TEXT_CHARS = 300;
const TELEGRAM_GENERAL_TOPIC_ID = 1;
function clipProgressMarkdownText(text) {
    if (text.length <= MAX_PROGRESS_MARKDOWN_TEXT_CHARS) {
        return text;
    }
    return `${text.slice(0, MAX_PROGRESS_MARKDOWN_TEXT_CHARS - 1).trimEnd()}…`;
}
function sanitizeProgressMarkdownText(text) {
    return text.replaceAll("`", "'");
}
function formatProgressAsMarkdownCode(text) {
    const clipped = clipProgressMarkdownText(text);
    return `\`${sanitizeProgressMarkdownText(clipped)}\``;
}
function normalizeTelegramThreadId(value) {
    return (0, _numberruntime.parseStrictPositiveInteger)(value);
}
function resolveTelegramForumThreadScopeFromSessionKey(sessionKey) {
    if (typeof sessionKey !== "string") {
        return undefined;
    }
    const match = /:telegram:group:(-?\d+):topic:(\d+)(?::|$)/.exec(sessionKey);
    const threadId = normalizeTelegramThreadId(match?.[2]);
    if (!match?.[1] || threadId == null) {
        return undefined;
    }
    return {
        chatId: match[1],
        threadId
    };
}
function resolveDispatchTelegramThreadSpec(params) {
    if (params.threadSpec.scope !== "forum" || params.threadSpec.id != null && params.threadSpec.id !== TELEGRAM_GENERAL_TOPIC_ID) {
        return params.threadSpec;
    }
    const scopedThread = resolveTelegramForumThreadScopeFromSessionKey(params.ctxPayload.SessionKey);
    const scopedThreadId = scopedThread?.chatId === String(params.chatId) ? scopedThread.threadId : undefined;
    const payloadThreadId = normalizeTelegramThreadId(params.ctxPayload.MessageThreadId) ?? normalizeTelegramThreadId(params.ctxPayload.TransportThreadId);
    // Missing forum IDs are normalized to General; topic-scoped turn facts are more specific.
    const recoveredThreadId = scopedThreadId ?? payloadThreadId;
    return recoveredThreadId == null || recoveredThreadId === params.threadSpec.id ? params.threadSpec : {
        ...params.threadSpec,
        id: recoveredThreadId
    };
}
function normalizeDispatchTelegramThreadPayload(params) {
    if (params.threadSpec.scope !== "forum" || params.threadSpec.id == null) {
        return params.context;
    }
    const messageThreadId = normalizeTelegramThreadId(params.context.ctxPayload.MessageThreadId);
    const transportThreadId = normalizeTelegramThreadId(params.context.ctxPayload.TransportThreadId);
    if (messageThreadId === params.threadSpec.id && transportThreadId === params.threadSpec.id) {
        return params.context;
    }
    return {
        ...params.context,
        ctxPayload: {
            ...params.context.ctxPayload,
            MessageThreadId: params.threadSpec.id,
            TransportThreadId: params.threadSpec.id
        }
    };
}
function extractCurrentTelegramBody(body) {
    if (!body) {
        return "";
    }
    const markerIndex = body.lastIndexOf(_channelmentiongating.CURRENT_MESSAGE_MARKER);
    if (markerIndex === -1) {
        return body;
    }
    return body.slice(markerIndex + _channelmentiongating.CURRENT_MESSAGE_MARKER.length).trimStart();
}
function buildRecoveredTelegramBody(params) {
    if (!params.context.isGroup || !params.historyKey || params.context.historyLimit <= 0) {
        return params.currentMessage;
    }
    const groupLabel = (0, _helpers.buildGroupLabel)(params.context.msg, params.context.chatId, params.threadSpec.id);
    const envelopeOptions = (0, _channelinbound.resolveEnvelopeFormatOptions)(params.cfg);
    return (0, _replyhistory.createChannelHistoryWindow)({
        historyMap: params.context.groupHistories
    }).buildPendingContext({
        historyKey: params.historyKey,
        limit: params.context.historyLimit,
        currentMessage: params.currentMessage,
        formatEntry: (entry)=>(0, _channelinbound.formatInboundEnvelope)({
                channel: "Telegram",
                from: groupLabel,
                timestamp: entry.timestamp,
                body: `${entry.body} [id:${entry.messageId ?? "unknown"} chat:${params.context.chatId}]`,
                chatType: "group",
                senderLabel: entry.sender,
                envelope: envelopeOptions
            })
    });
}
function buildRecoveredTelegramChatActionSender(params) {
    return async ()=>{
        try {
            await (0, _apilogging.withTelegramApiErrorLogging)({
                operation: "sendChatAction",
                fn: ()=>params.context.sendChatActionHandler.sendChatAction(params.context.chatId, params.action, (0, _helpers.buildTypingThreadParams)(params.threadId))
            });
        } catch (err) {
            if (params.action !== "record_voice") {
                throw err;
            }
            (0, _runtimeenv.logVerbose)(`telegram record_voice cue failed for chat ${params.context.chatId}: ${String(err)}`);
        }
    };
}
function migrateRecoveredTelegramRoomEventHistory(params) {
    const originalHistoryKey = params.context.historyKey;
    const recoveredHistoryKey = params.recoveredHistoryKey;
    if (!params.context.isGroup || params.context.ctxPayload.InboundEventKind !== "room_event" || !originalHistoryKey || !recoveredHistoryKey || originalHistoryKey === recoveredHistoryKey || params.context.historyLimit <= 0) {
        return;
    }
    const originalEntries = params.context.groupHistories.get(originalHistoryKey);
    if (!originalEntries?.length) {
        return;
    }
    const messageId = params.context.ctxPayload.MessageSid;
    const rawBody = params.context.ctxPayload.RawBody;
    const entryIndex = originalEntries.findLastIndex((entry)=>{
        if (messageId && entry.messageId === messageId) {
            return true;
        }
        return !messageId && typeof rawBody === "string" && entry.body === rawBody;
    });
    if (entryIndex === -1) {
        return;
    }
    const [entry] = originalEntries.splice(entryIndex, 1);
    if (!entry) {
        return;
    }
    (0, _replyhistory.createChannelHistoryWindow)({
        historyMap: params.context.groupHistories
    }).record({
        historyKey: recoveredHistoryKey,
        limit: params.context.historyLimit,
        entry
    });
}
function resolveDispatchTelegramContext(params) {
    const threadSpec = resolveDispatchTelegramThreadSpec({
        chatId: params.context.chatId,
        ctxPayload: params.context.ctxPayload,
        threadSpec: params.context.threadSpec
    });
    if (threadSpec === params.context.threadSpec || threadSpec.scope !== "forum") {
        return normalizeDispatchTelegramThreadPayload({
            context: params.context,
            threadSpec
        });
    }
    const recoveredRoutingTarget = (0, _helpers.buildTelegramInboundOriginTarget)(params.context.chatId, threadSpec);
    const recoveredFrom = params.context.isGroup ? (0, _helpers.buildTelegramGroupFrom)(params.context.chatId, threadSpec.id) : params.context.ctxPayload.From;
    const recoveredUpdateLastRoute = params.context.turn.record.updateLastRoute && threadSpec.id != null ? {
        ...params.context.turn.record.updateLastRoute,
        to: `telegram:${params.context.chatId}:topic:${threadSpec.id}`,
        threadId: String(threadSpec.id)
    } : params.context.turn.record.updateLastRoute;
    const recoveredHistoryKey = params.context.isGroup ? (0, _helpers.buildTelegramGroupPeerId)(params.context.chatId, threadSpec.id) : params.context.historyKey;
    migrateRecoveredTelegramRoomEventHistory({
        context: params.context,
        recoveredHistoryKey
    });
    const recoveredInboundHistory = params.context.isGroup && recoveredHistoryKey && params.context.historyLimit > 0 ? (0, _replyhistory.createChannelHistoryWindow)({
        historyMap: params.context.groupHistories
    }).buildInboundHistory({
        historyKey: recoveredHistoryKey,
        limit: params.context.historyLimit
    }) : params.context.ctxPayload.InboundHistory;
    const recoveredBodyForAgent = extractCurrentTelegramBody(params.context.ctxPayload.BodyForAgent ?? params.context.ctxPayload.Body);
    const recoveredBody = buildRecoveredTelegramBody({
        cfg: params.cfg,
        context: params.context,
        currentMessage: recoveredBodyForAgent,
        historyKey: recoveredHistoryKey,
        threadSpec
    });
    const recoveredSendTyping = buildRecoveredTelegramChatActionSender({
        context: params.context,
        threadId: threadSpec.id,
        action: "typing"
    });
    const recoveredSendRecordVoice = buildRecoveredTelegramChatActionSender({
        context: params.context,
        threadId: threadSpec.id,
        action: "record_voice"
    });
    return {
        ...params.context,
        historyKey: recoveredHistoryKey,
        threadSpec,
        resolvedThreadId: threadSpec.id,
        replyThreadId: threadSpec.id,
        sendTyping: recoveredSendTyping,
        sendRecordVoice: recoveredSendRecordVoice,
        turn: {
            ...params.context.turn,
            record: {
                ...params.context.turn.record,
                updateLastRoute: recoveredUpdateLastRoute
            }
        },
        ctxPayload: threadSpec.id == null ? params.context.ctxPayload : {
            ...params.context.ctxPayload,
            Body: recoveredBody,
            BodyForAgent: recoveredBodyForAgent,
            From: recoveredFrom,
            InboundHistory: recoveredInboundHistory,
            MessageThreadId: threadSpec.id,
            OriginatingTo: recoveredRoutingTarget,
            To: recoveredRoutingTarget,
            TransportThreadId: threadSpec.id
        }
    };
}
const dispatchTelegramMessage = async ({ context, bot, cfg, runtime, replyToMode, streamMode, textLimit, telegramCfg, telegramDeps: injectedTelegramDeps, opts })=>{
    const dispatchStartedAt = Date.now();
    const dispatchContext = resolveDispatchTelegramContext({
        cfg,
        context
    });
    const telegramDeps = injectedTelegramDeps ?? (await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./bot-deps.js")))).defaultTelegramBotDeps;
    const loadFreshSessionStore = createFreshTelegramSessionStoreLoader({
        cfg,
        telegramDeps
    });
    const { ctxPayload, msg, chatId, isGroup, groupConfig, topicConfig, threadSpec, historyKey, historyLimit, groupHistories, route, skillFilter, sendTyping, sendRecordVoice, ackReactionPromise, reactionApi, removeAckAfterReply, statusReactionController: rawStatusReactionController } = dispatchContext;
    const isRoomEvent = ctxPayload.InboundEventKind === "room_event";
    const statusReactionController = isRoomEvent ? null : rawStatusReactionController;
    const statusReactionTiming = {
        ..._channelfeedback.DEFAULT_TIMING,
        ...cfg.messages?.statusReactions?.timing
    };
    const clearTelegramStatusReaction = async ()=>{
        if (!msg.message_id || !reactionApi) {
            return;
        }
        await reactionApi(chatId, msg.message_id, []);
    };
    const finalizeTelegramStatusReaction = async (params)=>{
        if (!statusReactionController) {
            return;
        }
        if (params.outcome === "done") {
            await statusReactionController.setDone();
            if (removeAckAfterReply) {
                await (0, _runtimeenv.sleepWithAbort)(statusReactionTiming.doneHoldMs);
                await clearTelegramStatusReaction();
            } else {
                await statusReactionController.restoreInitial();
            }
            return;
        }
        await statusReactionController.setError();
        if (params.hasFinalResponse) {
            if (removeAckAfterReply) {
                await (0, _runtimeenv.sleepWithAbort)(statusReactionTiming.errorHoldMs);
                await clearTelegramStatusReaction();
            } else {
                await statusReactionController.restoreInitial();
            }
            return;
        }
        if (removeAckAfterReply) {
            await (0, _runtimeenv.sleepWithAbort)(statusReactionTiming.errorHoldMs);
        }
        await statusReactionController.restoreInitial();
    };
    const replyFenceKey = (0, _telegramreplyfence.resolveTelegramReplyFenceKey)({
        ctxPayload,
        chatId,
        threadSpec
    });
    const replyFenceLaneKey = (0, _sequentialkey.getTelegramSequentialKey)({
        message: msg,
        ...context.primaryCtx.me ? {
            me: context.primaryCtx.me
        } : {}
    });
    const scopedReplyFenceLaneKey = (0, _telegramreplyfence.buildTelegramReplyFenceLaneKey)({
        accountId: route.accountId,
        sequentialKey: replyFenceLaneKey
    });
    let activeReplyFenceKey = replyFenceKey.activeKey;
    let replyFenceGeneration;
    const replyAbortController = new AbortController();
    let replyAbortControllerQueued = false;
    let dispatchWasSuperseded;
    const isDispatchSuperseded = ()=>replyFenceGeneration !== undefined && (0, _telegramreplyfence.isTelegramReplyFenceSuperseded)({
            key: activeReplyFenceKey,
            generation: replyFenceGeneration
        });
    const releaseReplyFence = ()=>{
        if (replyFenceGeneration === undefined) {
            return;
        }
        (0, _telegramreplyfence.endTelegramReplyFence)(activeReplyFenceKey, replyAbortControllerQueued ? undefined : replyAbortController);
        replyFenceGeneration = undefined;
    };
    const draftMaxChars = Math.min(textLimit, 4096);
    const tableMode = (0, _botmessagedispatchruntime.resolveMarkdownTableMode)({
        cfg,
        channel: "telegram",
        accountId: route.accountId
    });
    const renderStreamText = (text)=>({
            text: (0, _format.renderTelegramHtmlText)(text, {
                tableMode
            }),
            parseMode: "HTML"
        });
    const accountBlockStreamingEnabled = (0, _channeloutbound.resolveChannelStreamingBlockEnabled)(telegramCfg) ?? cfg.agents?.defaults?.blockStreamingDefault === "on";
    const resolvedReasoningLevel = resolveTelegramReasoningLevel({
        cfg,
        sessionKey: ctxPayload.SessionKey,
        agentId: route.agentId,
        loadFreshSessionStore
    });
    const forceBlockStreamingForReasoning = resolvedReasoningLevel === "on";
    const streamReasoningDraft = resolvedReasoningLevel === "stream";
    const streamDeliveryEnabled = !isRoomEvent && streamMode !== "off";
    const rawReplyQuoteText = ctxPayload.ReplyToIsQuote && typeof ctxPayload.ReplyToQuoteText === "string" ? ctxPayload.ReplyToQuoteText : undefined;
    const replyQuoteText = ctxPayload.ReplyToIsQuote ? rawReplyQuoteText?.trim() ? rawReplyQuoteText : ctxPayload.ReplyToBody?.trim() || undefined : undefined;
    const replyQuoteMessageId = replyQuoteText && !ctxPayload.ReplyToIsExternal ? (0, _helpers.resolveTelegramReplyId)(ctxPayload.ReplyToId) : undefined;
    const replyQuoteByMessageId = {};
    if (replyToMode !== "off") {
        if (replyQuoteText && replyQuoteMessageId != null) {
            (0, _nativequote.addTelegramNativeQuoteCandidate)(replyQuoteByMessageId, replyQuoteMessageId, {
                text: replyQuoteText,
                ...typeof ctxPayload.ReplyToQuotePosition === "number" ? {
                    position: ctxPayload.ReplyToQuotePosition
                } : {},
                ...Array.isArray(ctxPayload.ReplyToQuoteEntities) ? {
                    entities: ctxPayload.ReplyToQuoteEntities
                } : {}
            });
        }
        (0, _nativequote.addTelegramNativeQuoteCandidate)(replyQuoteByMessageId, ctxPayload.MessageSid ?? msg.message_id, (0, _nativequote.buildTelegramNativeQuoteCandidate)((0, _helpers.getTelegramTextParts)(msg)));
        if (!ctxPayload.ReplyToIsExternal && typeof ctxPayload.ReplyToQuoteSourceText === "string") {
            (0, _nativequote.addTelegramNativeQuoteCandidate)(replyQuoteByMessageId, ctxPayload.ReplyToId, (0, _nativequote.buildTelegramNativeQuoteCandidate)({
                text: ctxPayload.ReplyToQuoteSourceText,
                entities: Array.isArray(ctxPayload.ReplyToQuoteSourceEntities) ? ctxPayload.ReplyToQuoteSourceEntities : undefined
            }));
        }
    }
    const hasTelegramQuoteReply = replyToMode !== "off" && replyQuoteText != null;
    const canStreamAnswerDraft = streamDeliveryEnabled && !hasTelegramQuoteReply && !accountBlockStreamingEnabled && !forceBlockStreamingForReasoning;
    const canStreamReasoningDraft = !isRoomEvent && streamReasoningDraft;
    const draftReplyToMessageId = replyToMode !== "off" && typeof msg.message_id === "number" ? replyQuoteMessageId ?? msg.message_id : undefined;
    const draftMinInitialChars = streamMode === "progress" ? 0 : DRAFT_MIN_INITIAL_CHARS;
    const progressSeed = `${route.accountId}:${chatId}:${threadSpec.id ?? ""}`;
    const mediaLocalRoots = (0, _botmessagedispatchruntime.getAgentScopedMediaLocalRoots)(cfg, route.agentId);
    const createDraftLane = (laneName, enabled)=>{
        const stream = enabled ? (telegramDeps.createTelegramDraftStream ?? _draftstream.createTelegramDraftStream)({
            api: bot.api,
            chatId,
            maxChars: draftMaxChars,
            thread: threadSpec,
            replyToMessageId: draftReplyToMessageId,
            minInitialChars: draftMinInitialChars,
            renderText: renderStreamText,
            onSupersededPreview: (superseded)=>{
                if (superseded.retain) {
                    return;
                }
                void bot.api.deleteMessage(chatId, superseded.messageId).catch((err)=>{
                    (0, _runtimeenv.logVerbose)(`telegram: superseded ${laneName} stream cleanup failed (${superseded.messageId}): ${String(err)}`);
                });
            },
            log: _runtimeenv.logVerbose,
            warn: _runtimeenv.logVerbose
        }) : undefined;
        return {
            stream,
            lastPartialText: "",
            hasStreamedMessage: false,
            finalized: false
        };
    };
    const lanes = {
        answer: createDraftLane("answer", canStreamAnswerDraft),
        reasoning: createDraftLane("reasoning", canStreamReasoningDraft)
    };
    const answerLane = lanes.answer;
    const reasoningLane = lanes.reasoning;
    const streamToolProgressEnabled = Boolean(answerLane.stream) && (0, _channeloutbound.resolveChannelStreamingPreviewToolProgress)(telegramCfg);
    const nativeToolProgressDraft = streamToolProgressEnabled && !isRoomEvent && !isGroup && threadSpec.scope === "dm" && canUseNativeToolProgressDraftForChat({
        telegramCfg,
        chatId
    }) ? (telegramDeps.createNativeTelegramToolProgressDraft ?? _nativetoolprogressdraft.createNativeTelegramToolProgressDraft)({
        api: bot.api,
        chatId,
        thread: threadSpec,
        log: _runtimeenv.logVerbose
    }) : undefined;
    let streamToolProgressSuppressed = false;
    let streamToolProgressLines = [];
    let lastAnswerPartialText = "";
    let activeAnswerDraftIsToolProgressOnly = false;
    function resetAnswerToolProgressDraft() {
        activeAnswerDraftIsToolProgressOnly = false;
    }
    async function prepareAnswerLaneForToolProgress() {
        if (activeAnswerDraftIsToolProgressOnly) {
            return;
        }
        if (answerLane.hasStreamedMessage) {
            await rotateLaneForNewMessage(answerLane);
        }
        activeAnswerDraftIsToolProgressOnly = true;
    }
    const renderProgressDraft = async (options)=>{
        if (!answerLane.stream || streamMode !== "progress") {
            return false;
        }
        const streamText = (0, _channeloutbound.formatChannelProgressDraftText)({
            entry: telegramCfg,
            lines: streamToolProgressLines,
            seed: progressSeed,
            formatLine: formatProgressAsMarkdownCode
        });
        if (!streamText || streamText === answerLane.lastPartialText) {
            return false;
        }
        await prepareAnswerLaneForToolProgress();
        answerLane.lastPartialText = streamText;
        answerLane.hasStreamedMessage = true;
        answerLane.finalized = false;
        answerLane.stream.update(streamText);
        if (options?.flush) {
            await answerLane.stream.flush();
        }
        return true;
    };
    const progressDraftGate = (0, _channeloutbound.createChannelProgressDraftGate)({
        onStart: async ()=>{
            await renderProgressDraft({
                flush: true
            });
        }
    });
    let finalAnswerDeliveryStarted = false;
    let finalAnswerDelivered = false;
    const pushStreamToolProgress = async (line, options)=>{
        if (!answerLane.stream) {
            return false;
        }
        if (answerLane.finalized || finalAnswerDeliveryStarted || finalAnswerDelivered) {
            return false;
        }
        if (options?.toolName !== undefined && !(0, _channeloutbound.isChannelProgressDraftWorkToolName)(options.toolName)) {
            return false;
        }
        const rawText = typeof line === "string" ? line : line?.text;
        const normalized = sanitizeProgressMarkdownText(rawText?.replace(/\s+/g, " ").trim() ?? "");
        if (streamToolProgressSuppressed) {
            return false;
        }
        if (streamMode !== "progress" && !streamToolProgressEnabled) {
            return false;
        }
        const shouldUpdateProgressLines = streamToolProgressEnabled && !streamToolProgressSuppressed && Boolean(normalized);
        if (!shouldUpdateProgressLines && streamMode !== "progress") {
            return false;
        }
        const progressLine = typeof line === "object" && line !== undefined ? {
            ...line,
            text: normalized
        } : normalized;
        const nextLines = shouldUpdateProgressLines ? (0, _channeloutbound.mergeChannelProgressDraftLine)(streamToolProgressLines, progressLine, {
            maxLines: (0, _channeloutbound.resolveChannelProgressDraftMaxLines)(telegramCfg)
        }) : streamToolProgressLines;
        if (shouldUpdateProgressLines && nextLines === streamToolProgressLines) {
            return false;
        }
        if (nativeToolProgressDraft && shouldUpdateProgressLines) {
            const streamText = (0, _channeloutbound.formatChannelProgressDraftText)({
                entry: telegramCfg,
                lines: nextLines,
                seed: progressSeed
            });
            if (streamText && await nativeToolProgressDraft.update(streamText)) {
                streamToolProgressLines = nextLines;
                return true;
            }
        }
        if (streamMode !== "progress") {
            streamToolProgressLines = nextLines;
            const streamText = (0, _channeloutbound.formatChannelProgressDraftText)({
                entry: telegramCfg,
                lines: streamToolProgressLines,
                seed: progressSeed,
                formatLine: formatProgressAsMarkdownCode
            });
            await prepareAnswerLaneForToolProgress();
            answerLane.lastPartialText = streamText;
            answerLane.hasStreamedMessage = true;
            answerLane.finalized = false;
            answerLane.stream.update(streamText);
            return true;
        }
        streamToolProgressLines = nextLines;
        if (options?.startImmediately) {
            await progressDraftGate.startNow();
            if (progressDraftGate.hasStarted) {
                await renderProgressDraft();
                return true;
            }
            return progressDraftGate.hasStarted;
        }
        const alreadyStarted = progressDraftGate.hasStarted;
        const progressActive = await progressDraftGate.noteWork();
        if ((alreadyStarted || progressActive) && progressDraftGate.hasStarted) {
            await renderProgressDraft();
            return true;
        }
        return false;
    };
    let splitReasoningOnNextStream = false;
    let draftLaneEventQueue = Promise.resolve();
    const reasoningStepState = (0, _reasoninglanecoordinator.createTelegramReasoningStepState)();
    const enqueueDraftLaneEvent = (task)=>{
        const next = draftLaneEventQueue.then(async ()=>{
            if (isDispatchSuperseded()) {
                return;
            }
            await task();
        });
        draftLaneEventQueue = next.catch((err)=>{
            (0, _runtimeenv.logVerbose)(`telegram: draft lane callback failed: ${String(err)}`);
        });
        return draftLaneEventQueue;
    };
    const splitTextIntoLaneSegments = (update, isReasoning)=>{
        const split = (0, _reasoninglanecoordinator.splitTelegramReasoningText)(update.text, isReasoning);
        const splitSegments = [];
        const useDelta = !update.replace && update.isReasoningSnapshot !== true && update.delta !== undefined;
        const segments = [];
        const suppressReasoning = resolvedReasoningLevel === "off";
        if (split.reasoningText && !suppressReasoning) {
            splitSegments.push({
                lane: "reasoning",
                text: split.reasoningText
            });
        }
        if (split.answerText) {
            splitSegments.push({
                lane: "answer",
                text: split.answerText
            });
        }
        for (const segment of splitSegments){
            const canApplyDelta = useDelta && splitSegments.length === 1;
            segments.push({
                lane: segment.lane,
                update: {
                    text: segment.text,
                    ...canApplyDelta ? {
                        delta: update.delta
                    } : {},
                    ...update.replace ? {
                        replace: true
                    } : {},
                    ...update.isReasoningSnapshot ? {
                        isReasoningSnapshot: true
                    } : {}
                }
            });
        }
        return {
            segments,
            suppressedReasoningOnly: Boolean(split.reasoningText) && suppressReasoning && !split.answerText
        };
    };
    const resetDraftLaneState = (lane)=>{
        lane.lastPartialText = "";
        if (lane === answerLane) {
            lastAnswerPartialText = "";
        }
        lane.hasStreamedMessage = false;
        lane.finalized = false;
        if (lane === answerLane) {
            resetAnswerToolProgressDraft();
        }
    };
    const rotateLaneForNewMessage = async (lane)=>{
        if (!lane.hasStreamedMessage && typeof lane.stream?.messageId() !== "number") {
            resetDraftLaneState(lane);
            return;
        }
        await lane.stream?.stop();
        lane.stream?.forceNewMessage();
        resetDraftLaneState(lane);
    };
    const rotateAnswerLaneAfterToolProgress = async ()=>{
        nativeToolProgressDraft?.stop();
        if (!activeAnswerDraftIsToolProgressOnly) {
            return false;
        }
        await answerLane.stream?.clear();
        answerLane.stream?.forceNewMessage();
        resetDraftLaneState(answerLane);
        streamToolProgressSuppressed = true;
        streamToolProgressLines = [];
        return true;
    };
    const prepareAnswerLaneForText = async ()=>{
        nativeToolProgressDraft?.stop();
        if (await rotateAnswerLaneAfterToolProgress()) {
            return;
        }
        if (!answerLane.finalized) {
            return;
        }
        await rotateLaneForNewMessage(answerLane);
    };
    const updateDraftFromPartial = (lane, update)=>{
        const laneStream = lane.stream;
        if (!laneStream || !update.text) {
            return;
        }
        const previousText = lane === answerLane ? lastAnswerPartialText : lane.lastPartialText;
        const nextText = resolveDraftPartialText(previousText, update);
        if (!nextText) {
            return;
        }
        if (lane === answerLane) {
            if (streamMode === "progress") {
                return;
            }
            resetAnswerToolProgressDraft();
            streamToolProgressSuppressed = true;
            streamToolProgressLines = [];
        }
        lane.hasStreamedMessage = true;
        lane.finalized = false;
        if (lane === answerLane) {
            lastAnswerPartialText = nextText;
        }
        lane.lastPartialText = nextText;
        laneStream.update(nextText);
    };
    const ingestDraftLaneSegments = async (update, isReasoning)=>{
        const split = splitTextIntoLaneSegments(update, isReasoning);
        for (const segment of split.segments){
            if (segment.lane === "answer") {
                await prepareAnswerLaneForText();
            }
            if (segment.lane === "reasoning") {
                reasoningStepState.noteReasoningHint();
                reasoningStepState.noteReasoningDelivered();
            }
            updateDraftFromPartial(lanes[segment.lane], segment.update);
        }
    };
    const flushDraftLane = async (lane)=>{
        if (!lane.stream) {
            return;
        }
        await lane.stream.flush();
    };
    const resolvedBlockStreamingEnabled = (0, _channeloutbound.resolveChannelStreamingBlockEnabled)(telegramCfg);
    const disableBlockStreaming = !streamDeliveryEnabled ? true : forceBlockStreamingForReasoning ? false : typeof resolvedBlockStreamingEnabled === "boolean" ? !resolvedBlockStreamingEnabled : canStreamAnswerDraft ? true : undefined;
    const chunkMode = (0, _botmessagedispatchruntime.resolveChunkMode)(cfg, "telegram", route.accountId);
    const supersedeReplyFence = (0, _telegramreplyfence.shouldSupersedeTelegramReplyFence)(ctxPayload);
    activeReplyFenceKey = supersedeReplyFence ? replyFenceKey.activeKey : (0, _telegramreplyfence.buildTelegramNonInterruptingReplyFenceKey)({
        activeKey: replyFenceKey.activeKey,
        laneKey: scopedReplyFenceLaneKey
    });
    if (!isRoomEvent && supersedeReplyFence) {
        (0, _telegramreplyfence.supersedeTelegramReplyFence)(replyFenceKey.roomEventKey);
    }
    replyFenceGeneration = (0, _telegramreplyfence.beginTelegramReplyFence)({
        key: activeReplyFenceKey,
        supersede: supersedeReplyFence,
        abortController: replyAbortController,
        laneKey: scopedReplyFenceLaneKey
    });
    const implicitQuoteReplyTargetId = replyQuoteMessageId != null ? String(replyQuoteMessageId) : undefined;
    const currentMessageIdForQuoteReply = implicitQuoteReplyTargetId && ctxPayload.MessageSid ? ctxPayload.MessageSid : undefined;
    const replyQuotePosition = typeof ctxPayload.ReplyToQuotePosition === "number" ? ctxPayload.ReplyToQuotePosition : undefined;
    const replyQuoteEntities = Array.isArray(ctxPayload.ReplyToQuoteEntities) ? ctxPayload.ReplyToQuoteEntities : undefined;
    const deliveryState = (0, _lanedelivery.createLaneDeliveryStateTracker)();
    const clearGroupHistory = ()=>{
        if (isGroup && historyKey) {
            (0, _replyhistory.createChannelHistoryWindow)({
                historyMap: groupHistories
            }).clear({
                historyKey,
                limit: historyLimit
            });
        }
    };
    const beginDeliveryCorrelation = ()=>(0, _inboundeventdelivery.beginTelegramInboundEventDeliveryCorrelation)(ctxPayload.SessionKey, {
            outboundTo: historyKey || String(chatId),
            outboundAccountId: route.accountId,
            markInboundEventDelivered: ()=>{
                deliveryState.markDelivered();
                if (isRoomEvent) {
                    clearGroupHistory();
                }
            }
        }, {
            inboundEventKind: ctxPayload.InboundEventKind
        });
    const endTelegramInboundEventDeliveryCorrelation = beginDeliveryCorrelation();
    const sessionKey = ctxPayload.SessionKey;
    const resolveCurrentTurnTranscriptFinalText = async ()=>{
        if (!sessionKey) {
            return undefined;
        }
        try {
            const { storePath, store } = loadFreshSessionStore(route.agentId);
            const sessionEntry = (0, _botmessagedispatchruntime.resolveSessionStoreEntry)({
                store,
                sessionKey
            }).existing;
            if (!sessionEntry?.sessionId) {
                return undefined;
            }
            const { sessionFile } = await (0, _botmessagedispatchruntime.resolveAndPersistSessionFile)({
                sessionId: sessionEntry.sessionId,
                sessionKey,
                sessionStore: store,
                storePath,
                sessionEntry,
                agentId: route.agentId,
                sessionsDir: _nodepath.default.dirname(storePath)
            });
            const latest = await (0, _botmessagedispatchruntime.readLatestAssistantTextFromSessionTranscript)(sessionFile);
            if (!latest?.timestamp || latest.timestamp < dispatchStartedAt) {
                return undefined;
            }
            return latest.text;
        } catch (err) {
            (0, _runtimeenv.logVerbose)(`telegram transcript final candidate lookup failed: ${(0, _errorruntime.formatErrorMessage)(err)}`);
            return undefined;
        }
    };
    const deliveryBaseOptions = {
        chatId: String(chatId),
        accountId: route.accountId,
        sessionKeyForInternalHooks: ctxPayload.SessionKey,
        mirrorIsGroup: isGroup,
        mirrorGroupId: isGroup ? String(chatId) : undefined,
        token: opts.token,
        runtime,
        bot,
        mediaLocalRoots,
        mediaMaxBytes: (opts.mediaMaxMb ?? telegramCfg.mediaMaxMb ?? 100) * 1024 * 1024,
        replyToMode,
        textLimit,
        thread: threadSpec,
        tableMode,
        chunkMode,
        linkPreview: telegramCfg.linkPreview,
        replyQuoteMessageId,
        replyQuoteText,
        replyQuotePosition,
        replyQuoteEntities,
        replyQuoteByMessageId,
        transcriptMirror: sessionKey ? async (payload)=>{
            await mirrorTelegramAssistantReplyToTranscript({
                cfg,
                route,
                sessionKey,
                loadFreshSessionStore,
                payload
            });
        } : undefined
    };
    const silentErrorReplies = telegramCfg.silentErrorReplies === true;
    const isDmTopic = !isGroup && threadSpec.scope === "dm" && threadSpec.id != null;
    let queuedFinal = false;
    let suppressSilentReplyFallback = false;
    let hadErrorReplyFailureOrSkip = false;
    let isFirstTurnInSession = false;
    let dispatchError;
    try {
        const sticker = ctxPayload.Sticker;
        if (sticker?.fileId && sticker.fileUniqueId && ctxPayload.MediaPath) {
            const agentDir = (0, _botmessagedispatchagentruntime.resolveAgentDir)(cfg, route.agentId);
            const stickerSupportsVision = await resolveStickerVisionSupport(cfg, route.agentId);
            let description = sticker.cachedDescription ?? null;
            if (!description) {
                description = await (0, _stickercache.describeStickerImage)({
                    imagePath: ctxPayload.MediaPath,
                    cfg,
                    agentDir,
                    agentId: route.agentId
                });
            }
            if (description) {
                const stickerContext = [
                    sticker.emoji,
                    sticker.setName ? `from "${sticker.setName}"` : null
                ].filter(Boolean).join(" ");
                const formattedDesc = `[Sticker${stickerContext ? ` ${stickerContext}` : ""}] ${description}`;
                sticker.cachedDescription = description;
                if (!stickerSupportsVision) {
                    ctxPayload.Body = formattedDesc;
                    ctxPayload.BodyForAgent = formattedDesc;
                    (0, _botmessagedispatchmedia.pruneStickerMediaFromContext)(ctxPayload, {
                        stickerMediaIncluded: ctxPayload.StickerMediaIncluded
                    });
                }
                (0, _stickercache.cacheSticker)({
                    fileId: sticker.fileId,
                    fileUniqueId: sticker.fileUniqueId,
                    emoji: sticker.emoji,
                    setName: sticker.setName,
                    description,
                    cachedAt: new Date().toISOString(),
                    receivedFrom: ctxPayload.From
                });
                (0, _runtimeenv.logVerbose)(`telegram: cached sticker description for ${sticker.fileUniqueId}`);
            }
        }
        const applyTextToPayload = (payload, text)=>{
            if (payload.text === text) {
                return payload;
            }
            return {
                ...payload,
                text
            };
        };
        const applyTextToFollowUpPayload = (payload, text)=>{
            const next = applyTextToPayload(payload, text);
            const { replyToId: _replyToId, replyToCurrent: _replyToCurrent, replyToTag: _replyToTag, ...followUp } = next;
            return followUp;
        };
        const splitFinalTextForStream = (text)=>{
            const markdownChunks = chunkMode === "newline" ? (0, _replychunking.chunkMarkdownTextWithMode)(text, draftMaxChars, chunkMode) : [
                text
            ];
            return markdownChunks.flatMap((chunk)=>(0, _format.markdownToTelegramChunks)(chunk, draftMaxChars, {
                    tableMode
                }).map((telegramChunk)=>telegramChunk.text));
        };
        const applyQuoteReplyTarget = (payload)=>{
            if (!implicitQuoteReplyTargetId || !currentMessageIdForQuoteReply || payload.replyToId !== currentMessageIdForQuoteReply || payload.replyToTag || payload.replyToCurrent) {
                return payload;
            }
            return {
                ...payload,
                replyToId: implicitQuoteReplyTargetId
            };
        };
        const usesNativeTelegramQuote = (payload)=>{
            if (replyQuoteText != null) {
                return true;
            }
            return payload.replyToId != null && replyQuoteByMessageId[payload.replyToId] != null;
        };
        const sendPayload = async (payload, options)=>{
            if (isDispatchSuperseded()) {
                return false;
            }
            const deliverablePayload = applyQuoteReplyTarget(payload);
            const silent = options?.silent ?? (silentErrorReplies && payload.isError === true);
            const durableDelivery = telegramDeps.deliverInboundReplyWithMessageSendContext;
            if (options?.durable && durableDelivery) {
                const durable = await durableDelivery({
                    cfg,
                    channel: "telegram",
                    to: String(chatId),
                    accountId: route.accountId,
                    agentId: route.agentId,
                    ctxPayload,
                    payload: deliverablePayload,
                    info: {
                        kind: "final"
                    },
                    replyToMode,
                    threadId: threadSpec.id,
                    formatting: {
                        textLimit,
                        tableMode,
                        chunkMode
                    },
                    silent,
                    requiredCapabilities: (0, _channeloutbound.deriveDurableFinalDeliveryRequirements)({
                        payload: deliverablePayload,
                        replyToId: deliverablePayload.replyToId,
                        threadId: threadSpec.id,
                        silent,
                        payloadTransport: true,
                        extraCapabilities: {
                            nativeQuote: usesNativeTelegramQuote(deliverablePayload)
                        }
                    })
                });
                if (durable.status === "failed") {
                    throw durable.error;
                }
                if (durable.status === "handled_visible") {
                    deliveryState.markDelivered();
                    return true;
                }
                if (durable.status === "handled_no_send") {
                    return false;
                }
            }
            const result = await (telegramDeps.deliverReplies ?? _delivery.deliverReplies)({
                ...deliveryBaseOptions,
                transcriptMirror: options?.durable ? deliveryBaseOptions.transcriptMirror : undefined,
                replies: [
                    deliverablePayload
                ],
                onVoiceRecording: sendRecordVoice,
                silent,
                mediaLoader: telegramDeps.loadWebMedia
            });
            if (result.delivered) {
                deliveryState.markDelivered();
            }
            return result.delivered;
        };
        const emitPreviewFinalizedHook = async (result)=>{
            if (isDispatchSuperseded() || result.kind !== "preview-finalized") {
                return;
            }
            (telegramDeps.emitInternalMessageSentHook ?? _delivery.emitInternalMessageSentHook)({
                sessionKeyForInternalHooks: deliveryBaseOptions.sessionKeyForInternalHooks,
                chatId: deliveryBaseOptions.chatId,
                accountId: deliveryBaseOptions.accountId,
                content: result.delivery.content,
                success: true,
                messageId: result.delivery.messageId,
                isGroup: deliveryBaseOptions.mirrorIsGroup,
                groupId: deliveryBaseOptions.mirrorGroupId
            });
            try {
                await (telegramDeps.recordOutboundMessageForPromptContext ?? _outboundmessagecontext.recordOutboundMessageForPromptContext)({
                    cfg,
                    account: {
                        accountId: route.accountId
                    },
                    chatId: deliveryBaseOptions.chatId,
                    message: {
                        message_id: result.delivery.messageId
                    },
                    messageId: result.delivery.messageId,
                    text: result.delivery.promptContextContent ?? result.delivery.content,
                    ...threadSpec.id !== undefined ? {
                        messageThreadId: threadSpec.id
                    } : {}
                });
            } catch (error) {
                (0, _runtimeenv.logVerbose)(`telegram: failed to record streamed reply for prompt context: ${(0, _errorruntime.formatErrorMessage)(error)}`);
            }
            if (deliveryBaseOptions.transcriptMirror && result.delivery.content) {
                void deliveryBaseOptions.transcriptMirror({
                    text: result.delivery.content
                }).catch((err)=>{
                    (0, _runtimeenv.logVerbose)(`telegram preview-finalized transcriptMirror failed: ${(0, _errorruntime.formatErrorMessage)(err)}`);
                });
            }
        };
        const deliverLaneText = (0, _lanedelivery.createLaneTextDeliverer)({
            lanes,
            draftMaxChars,
            applyTextToPayload,
            applyTextToFollowUpPayload,
            splitFinalTextForStream,
            sendPayload,
            flushDraftLane,
            stopDraftLane: async (lane)=>{
                await lane.stream?.stop();
            },
            clearDraftLane: async (lane)=>{
                await lane.stream?.clear();
            },
            editStreamMessage: async ({ messageId, text, buttons })=>{
                if (isDispatchSuperseded()) {
                    return;
                }
                await (telegramDeps.editMessageTelegram ?? _send.editMessageTelegram)(chatId, messageId, text, {
                    api: bot.api,
                    cfg,
                    accountId: route.accountId,
                    linkPreview: telegramCfg.linkPreview,
                    buttons
                });
            },
            resolveFinalTextCandidate: ()=>resolveCurrentTurnTranscriptFinalText(),
            log: _runtimeenv.logVerbose,
            markDelivered: ()=>{
                deliveryState.markDelivered();
            }
        });
        const deliverProgressModeFinalAnswer = async (payload, text)=>{
            if (activeAnswerDraftIsToolProgressOnly) {
                await rotateAnswerLaneAfterToolProgress();
            } else {
                await answerLane.stream?.clear();
                resetDraftLaneState(answerLane);
            }
            const delivered = await sendPayload(applyTextToPayload(payload, text), {
                durable: true
            });
            if (!delivered) {
                return {
                    kind: "skipped"
                };
            }
            answerLane.finalized = true;
            finalAnswerDelivered = true;
            return {
                kind: "sent"
            };
        };
        const resolveTranscriptBackedFinalText = async (text)=>await (0, _channeloutbound.resolveTranscriptBackedChannelFinalText)({
                finalText: text,
                resolveCandidateText: resolveCurrentTurnTranscriptFinalText
            });
        if (isDmTopic) {
            try {
                const { store } = loadFreshSessionStore(route.agentId);
                const sessionKeyLocal = ctxPayload.SessionKey;
                if (sessionKeyLocal) {
                    const entry = (0, _botmessagedispatchruntime.resolveSessionStoreEntry)({
                        store,
                        sessionKey: sessionKeyLocal
                    }).existing;
                    isFirstTurnInSession = !entry?.systemSent;
                } else {
                    (0, _runtimeenv.logVerbose)("auto-topic-label: SessionKey is absent, skipping first-turn detection");
                }
            } catch (err) {
                (0, _runtimeenv.logVerbose)(`auto-topic-label: session store error: ${(0, _errorruntime.formatErrorMessage)(err)}`);
            }
        }
        loadFreshSessionStore.clear();
        if (statusReactionController && !isRoomEvent) {
            void statusReactionController.setThinking();
        }
        const { onModelSelected, ...replyPipeline } = (telegramDeps.createChannelMessageReplyPipeline ?? _channeloutbound.createChannelMessageReplyPipeline)({
            cfg,
            agentId: route.agentId,
            channel: "telegram",
            accountId: route.accountId,
            typing: {
                start: sendTyping,
                onStartError: (err)=>{
                    (0, _channelfeedback.logTypingFailure)({
                        log: _runtimeenv.logVerbose,
                        channel: "telegram",
                        target: String(chatId),
                        error: err
                    });
                }
            }
        });
        try {
            const turnResult = await (0, _channelinbound.runChannelInboundEvent)({
                channel: "telegram",
                accountId: route.accountId,
                raw: dispatchContext,
                adapter: {
                    ingest: ()=>({
                            id: ctxPayload.MessageSid ?? `${chatId}:${Date.now()}`,
                            timestamp: typeof ctxPayload.Timestamp === "number" ? ctxPayload.Timestamp : undefined,
                            rawText: ctxPayload.RawBody ?? "",
                            textForAgent: ctxPayload.BodyForAgent,
                            textForCommands: ctxPayload.CommandBody,
                            raw: dispatchContext
                        }),
                    resolveTurn: ()=>({
                            channel: "telegram",
                            accountId: route.accountId,
                            routeSessionKey: route.sessionKey,
                            storePath: dispatchContext.turn.storePath,
                            ctxPayload,
                            recordInboundSession: dispatchContext.turn.recordInboundSession,
                            record: dispatchContext.turn.record,
                            runDispatch: ()=>{
                                const sentBlockMediaUrls = new Set();
                                return telegramDeps.dispatchReplyWithBufferedBlockDispatcher({
                                    ctx: ctxPayload,
                                    cfg,
                                    dispatcherOptions: {
                                        ...replyPipeline,
                                        beforeDeliver: async (payload)=>payload,
                                        deliver: async (payload, info)=>{
                                            if (isDispatchSuperseded()) {
                                                return;
                                            }
                                            if (payload.isError === true) {
                                                hadErrorReplyFailureOrSkip = true;
                                            }
                                            const deduped = info.kind === "final" ? (0, _botmessagedispatchmediadedup.deduplicateBlockSentMedia)(payload, sentBlockMediaUrls) : payload;
                                            if (deduped === undefined) {
                                                return;
                                            }
                                            const effectivePayload = deduped;
                                            if ((0, _execapprovals.shouldSuppressLocalTelegramExecApprovalPrompt)({
                                                cfg,
                                                accountId: route.accountId,
                                                payload
                                            })) {
                                                queuedFinal = true;
                                                return;
                                            }
                                            const telegramButtons = resolvePayloadTelegramInlineButtons(effectivePayload);
                                            const split = splitTextIntoLaneSegments({
                                                text: effectivePayload.text
                                            }, payload.isReasoning);
                                            const segments = split.segments;
                                            const reply = (0, _replypayload.resolveSendableOutboundReplyParts)(effectivePayload);
                                            if (info.kind === "final" && (reply.text.length > 0 || reply.hasMedia)) {
                                                finalAnswerDeliveryStarted = true;
                                            }
                                            if (info.kind === "final") {
                                                await enqueueDraftLaneEvent(async ()=>{});
                                            }
                                            if (info.kind === "tool" && (finalAnswerDeliveryStarted || finalAnswerDelivered) && !reply.hasMedia && !hasExecApprovalPayload(effectivePayload)) {
                                                return;
                                            }
                                            const deliverFinalAnswerText = async (answerPayload, text, buttons)=>{
                                                const finalText = await resolveTranscriptBackedFinalText(text);
                                                if (streamMode === "progress") {
                                                    return deliverProgressModeFinalAnswer(answerPayload, finalText);
                                                }
                                                await rotateAnswerLaneAfterToolProgress();
                                                const result = await deliverLaneText({
                                                    laneName: "answer",
                                                    text: finalText,
                                                    payload: answerPayload,
                                                    infoKind: "final",
                                                    buttons
                                                });
                                                if (result.kind !== "skipped") {
                                                    finalAnswerDelivered = true;
                                                }
                                                return result;
                                            };
                                            const flushBufferedFinalAnswer = async ()=>{
                                                const buffered = reasoningStepState.takeBufferedFinalAnswer(replyFenceGeneration);
                                                if (!buffered) {
                                                    return;
                                                }
                                                const bufferedButtons = resolvePayloadTelegramInlineButtons(buffered.payload);
                                                await deliverFinalAnswerText(buffered.payload, buffered.text, bufferedButtons);
                                                reasoningStepState.resetForNextStep();
                                            };
                                            let blockDelivered = false;
                                            for (const segment of segments){
                                                if (segment.lane === "answer" && info.kind === "final" && reasoningStepState.shouldBufferFinalAnswer()) {
                                                    reasoningStepState.bufferFinalAnswer({
                                                        payload: effectivePayload,
                                                        text: segment.update.text,
                                                        bufferedGeneration: replyFenceGeneration
                                                    });
                                                    continue;
                                                }
                                                if (segment.lane === "reasoning") {
                                                    reasoningStepState.noteReasoningHint();
                                                }
                                                if (segment.lane === "answer" && info.kind === "tool") {
                                                    const canRepresentAsTransientProgress = canUseNativeToolProgressDraft({
                                                        payload: effectivePayload,
                                                        reply,
                                                        buttons: telegramButtons
                                                    });
                                                    if (nativeToolProgressDraft && canRepresentAsTransientProgress) {
                                                        if (await pushStreamToolProgress(segment.update.text)) {
                                                            blockDelivered = true;
                                                            continue;
                                                        }
                                                    }
                                                    if (canRepresentAsTransientProgress && streamMode === "progress" && answerLane.stream) {
                                                        continue;
                                                    }
                                                    await prepareAnswerLaneForToolProgress();
                                                }
                                                const result = segment.lane === "answer" && info.kind === "final" ? await deliverFinalAnswerText(effectivePayload, segment.update.text, telegramButtons) : await deliverLaneText({
                                                    laneName: segment.lane,
                                                    text: segment.update.text,
                                                    payload: effectivePayload,
                                                    infoKind: info.kind,
                                                    buttons: telegramButtons
                                                });
                                                if (info.kind === "final") {
                                                    await emitPreviewFinalizedHook(result);
                                                }
                                                blockDelivered = blockDelivered || result.kind !== "skipped";
                                                if (segment.lane === "reasoning") {
                                                    if (result.kind !== "skipped") {
                                                        reasoningStepState.noteReasoningDelivered();
                                                        await flushBufferedFinalAnswer();
                                                    }
                                                    continue;
                                                }
                                                if (info.kind === "final") {
                                                    reasoningStepState.resetForNextStep();
                                                }
                                            }
                                            const trackBlockMedia = (delivered)=>{
                                                if (delivered && info.kind === "block" && payload.mediaUrls?.length) {
                                                    for (const url of payload.mediaUrls){
                                                        sentBlockMediaUrls.add(url);
                                                    }
                                                }
                                            };
                                            if (segments.length > 0) {
                                                trackBlockMedia(blockDelivered);
                                                return;
                                            }
                                            if (split.suppressedReasoningOnly) {
                                                let delivered = false;
                                                if (reply.hasMedia) {
                                                    const payloadWithoutSuppressedReasoning = typeof effectivePayload.text === "string" ? {
                                                        ...effectivePayload,
                                                        text: ""
                                                    } : effectivePayload;
                                                    delivered = await sendPayload(payloadWithoutSuppressedReasoning, {
                                                        durable: info.kind === "final"
                                                    });
                                                }
                                                if (info.kind === "final" && delivered) {
                                                    finalAnswerDelivered = true;
                                                }
                                                if (info.kind === "final") {
                                                    await flushBufferedFinalAnswer();
                                                }
                                                trackBlockMedia(delivered);
                                                return;
                                            }
                                            if (info.kind === "final") {
                                                await rotateAnswerLaneAfterToolProgress();
                                                await answerLane.stream?.stop();
                                                await reasoningLane.stream?.stop();
                                                reasoningStepState.resetForNextStep();
                                            }
                                            const canSendAsIs = reply.hasMedia || reply.text.length > 0;
                                            if (!canSendAsIs) {
                                                if (info.kind === "final") {
                                                    await flushBufferedFinalAnswer();
                                                }
                                                return;
                                            }
                                            const delivered = await sendPayload(effectivePayload, {
                                                durable: info.kind === "final"
                                            });
                                            if (info.kind === "final" && delivered) {
                                                finalAnswerDelivered = true;
                                            }
                                            if (info.kind === "final") {
                                                await flushBufferedFinalAnswer();
                                            }
                                            trackBlockMedia(delivered);
                                        },
                                        onSkip: (payload, info)=>{
                                            if (payload.isError === true) {
                                                hadErrorReplyFailureOrSkip = true;
                                            }
                                            if (info.reason !== "silent") {
                                                deliveryState.markNonSilentSkip();
                                            }
                                        },
                                        onError: (err, info)=>{
                                            const errorPolicy = (0, _errorpolicy.resolveTelegramErrorPolicy)({
                                                accountConfig: telegramCfg,
                                                groupConfig,
                                                topicConfig
                                            });
                                            if ((0, _errorpolicy.isSilentErrorPolicy)(errorPolicy.policy)) {
                                                return;
                                            }
                                            if (errorPolicy.policy === "once" && (0, _errorpolicy.shouldSuppressTelegramError)({
                                                scopeKey: (0, _errorpolicy.buildTelegramErrorScopeKey)({
                                                    accountId: route.accountId,
                                                    chatId,
                                                    threadId: threadSpec.id
                                                }),
                                                cooldownMs: errorPolicy.cooldownMs,
                                                errorMessage: String(err)
                                            })) {
                                                return;
                                            }
                                            deliveryState.markNonSilentFailure();
                                            runtime.error?.((0, _runtimeenv.danger)(`telegram ${info.kind} reply failed: ${String(err)}`));
                                        }
                                    },
                                    replyOptions: {
                                        skillFilter,
                                        disableBlockStreaming,
                                        abortSignal: replyAbortController.signal,
                                        sourceReplyDeliveryMode: isRoomEvent ? "message_tool_only" : undefined,
                                        queuedDeliveryCorrelations: isRoomEvent ? [
                                            {
                                                begin: beginDeliveryCorrelation
                                            }
                                        ] : undefined,
                                        queuedFollowupLifecycle: isRoomEvent ? {
                                            onEnqueued: ()=>{
                                                replyAbortControllerQueued = true;
                                            },
                                            onComplete: ()=>{
                                                replyAbortControllerQueued = false;
                                                (0, _telegramreplyfence.releaseTelegramReplyFenceAbortController)(activeReplyFenceKey, replyAbortController);
                                            }
                                        } : undefined,
                                        suppressTyping: isRoomEvent,
                                        onPartialReply: answerLane.stream || reasoningLane.stream ? (payload)=>enqueueDraftLaneEvent(async ()=>{
                                                await ingestDraftLaneSegments(payload);
                                            }) : undefined,
                                        onReasoningStream: reasoningLane.stream ? (payload)=>enqueueDraftLaneEvent(async ()=>{
                                                if (splitReasoningOnNextStream) {
                                                    reasoningLane.stream?.forceNewMessage();
                                                    resetDraftLaneState(reasoningLane);
                                                    splitReasoningOnNextStream = false;
                                                }
                                                await ingestDraftLaneSegments(payload, true);
                                            }) : undefined,
                                        onAssistantMessageStart: answerLane.stream ? ()=>enqueueDraftLaneEvent(async ()=>{
                                                reasoningStepState.resetForNextStep();
                                                streamToolProgressSuppressed = false;
                                                streamToolProgressLines = [];
                                                if (answerLane.finalized) {
                                                    await rotateLaneForNewMessage(answerLane);
                                                }
                                            }) : undefined,
                                        onReasoningEnd: reasoningLane.stream ? ()=>enqueueDraftLaneEvent(async ()=>{
                                                splitReasoningOnNextStream = reasoningLane.hasStreamedMessage;
                                                streamToolProgressSuppressed = false;
                                                streamToolProgressLines = [];
                                            }) : undefined,
                                        suppressDefaultToolProgressMessages: !streamDeliveryEnabled || Boolean(answerLane.stream),
                                        allowProgressCallbacksWhenSourceDeliverySuppressed: !isRoomEvent && Boolean(answerLane.stream),
                                        onToolStart: async (payload)=>{
                                            const toolName = payload.name?.trim();
                                            const progressPromise = pushStreamToolProgress((0, _channeloutbound.formatChannelProgressDraftLineForEntry)(telegramCfg, {
                                                event: "tool",
                                                name: toolName,
                                                phase: payload.phase,
                                                args: payload.args
                                            }, payload.detailMode ? {
                                                detailMode: payload.detailMode
                                            } : undefined), {
                                                toolName,
                                                startImmediately: true
                                            });
                                            if (statusReactionController && toolName) {
                                                await statusReactionController.setTool(toolName);
                                            }
                                            await progressPromise;
                                        },
                                        onItemEvent: async (payload)=>{
                                            await pushStreamToolProgress((0, _channeloutbound.buildChannelProgressDraftLineForEntry)(telegramCfg, {
                                                event: "item",
                                                itemId: payload.itemId,
                                                itemKind: payload.kind,
                                                title: payload.title,
                                                name: payload.name,
                                                phase: payload.phase,
                                                status: payload.status,
                                                summary: payload.summary,
                                                progressText: payload.progressText,
                                                meta: payload.meta
                                            }));
                                        },
                                        onPlanUpdate: async (payload)=>{
                                            if (payload.phase !== "update") {
                                                return;
                                            }
                                            await pushStreamToolProgress((0, _channeloutbound.formatChannelProgressDraftLine)({
                                                event: "plan",
                                                phase: payload.phase,
                                                title: payload.title,
                                                explanation: payload.explanation,
                                                steps: payload.steps
                                            }));
                                        },
                                        onApprovalEvent: async (payload)=>{
                                            if (payload.phase !== "requested") {
                                                return;
                                            }
                                            await pushStreamToolProgress((0, _channeloutbound.formatChannelProgressDraftLine)({
                                                event: "approval",
                                                phase: payload.phase,
                                                title: payload.title,
                                                command: payload.command,
                                                reason: payload.reason,
                                                message: payload.message
                                            }));
                                        },
                                        onCommandOutput: async (payload)=>{
                                            if (payload.phase !== "end") {
                                                return;
                                            }
                                            await pushStreamToolProgress((0, _channeloutbound.formatChannelProgressDraftLine)({
                                                event: "command-output",
                                                phase: payload.phase,
                                                title: payload.title,
                                                name: payload.name,
                                                status: payload.status,
                                                exitCode: payload.exitCode
                                            }));
                                        },
                                        onPatchSummary: async (payload)=>{
                                            if (payload.phase !== "end") {
                                                return;
                                            }
                                            await pushStreamToolProgress((0, _channeloutbound.formatChannelProgressDraftLine)({
                                                event: "patch",
                                                phase: payload.phase,
                                                title: payload.title,
                                                name: payload.name,
                                                added: payload.added,
                                                modified: payload.modified,
                                                deleted: payload.deleted,
                                                summary: payload.summary
                                            }));
                                        },
                                        onCompactionStart: statusReactionController ? async ()=>{
                                            await statusReactionController.setCompacting();
                                        } : undefined,
                                        onCompactionEnd: statusReactionController ? async ()=>{
                                            statusReactionController.cancelPending();
                                            await statusReactionController.setThinking();
                                        } : undefined,
                                        onModelSelected
                                    }
                                });
                            }
                        })
                }
            });
            if (!turnResult.dispatched) {
                return;
            }
            ({ queuedFinal } = turnResult.dispatchResult);
            suppressSilentReplyFallback = turnResult.dispatchResult.sourceReplyDeliveryMode === "message_tool_only";
        } catch (err) {
            dispatchError = err;
            runtime.error?.((0, _runtimeenv.danger)(`telegram dispatch failed: ${String(err)}`));
        } finally{
            progressDraftGate.cancel();
            await draftLaneEventQueue;
            nativeToolProgressDraft?.stop();
            const lanesToCleanup = [
                {
                    laneName: "answer",
                    lane: answerLane
                },
                {
                    laneName: "reasoning",
                    lane: reasoningLane
                }
            ];
            for (const { lane } of lanesToCleanup){
                const stream = lane.stream;
                if (!stream) {
                    continue;
                }
                if (isDispatchSuperseded()) {
                    await (typeof stream.discard === "function" ? stream.discard() : stream.stop());
                    continue;
                }
                if (lane.finalized) {
                    await stream.stop();
                } else {
                    await stream.clear();
                }
            }
        }
    } finally{
        dispatchWasSuperseded = isDispatchSuperseded();
        releaseReplyFence();
        endTelegramInboundEventDeliveryCorrelation();
    }
    if (dispatchWasSuperseded) {
        if (statusReactionController) {
            void finalizeTelegramStatusReaction({
                outcome: "done",
                hasFinalResponse: true
            }).catch((err)=>{
                (0, _runtimeenv.logVerbose)(`telegram: status reaction finalize failed: ${String(err)}`);
            });
        } else {
            (0, _channelfeedback.removeAckReactionAfterReply)({
                removeAfterReply: removeAckAfterReply,
                ackReactionPromise,
                ackReactionValue: ackReactionPromise ? "ack" : null,
                remove: ()=>(reactionApi?.(chatId, msg.message_id ?? 0, []) ?? Promise.resolve()).then(()=>{}),
                onError: (err)=>{
                    if (!msg.message_id) {
                        return;
                    }
                    (0, _channelfeedback.logAckFailure)({
                        log: _runtimeenv.logVerbose,
                        channel: "telegram",
                        target: `${chatId}/${msg.message_id}`,
                        error: err
                    });
                }
            });
        }
        if (!isRoomEvent || deliveryState.snapshot().delivered) {
            clearGroupHistory();
        }
        return;
    }
    let sentFallback = false;
    const deliverySummary = deliveryState.snapshot();
    const shouldSendFailureFallback = !isRoomEvent && (dispatchError || !deliverySummary.delivered && (deliverySummary.skippedNonSilent > 0 || deliverySummary.failedNonSilent > 0));
    if (shouldSendFailureFallback) {
        const fallbackText = dispatchError ? "Something went wrong while processing your request. Please try again." : EMPTY_RESPONSE_FALLBACK;
        const result = await (telegramDeps.deliverReplies ?? _delivery.deliverReplies)({
            replies: [
                {
                    text: fallbackText
                }
            ],
            ...deliveryBaseOptions,
            silent: silentErrorReplies && (dispatchError != null || hadErrorReplyFailureOrSkip),
            mediaLoader: telegramDeps.loadWebMedia
        });
        sentFallback = result.delivered;
    }
    if (!sentFallback && !dispatchError && !deliverySummary.delivered && !suppressSilentReplyFallback && !queuedFinal && isGroup) {
        const policySessionKey = ctxPayload.CommandSource === "native" ? ctxPayload.CommandTargetSessionKey ?? ctxPayload.SessionKey : ctxPayload.SessionKey;
        const silentReplyFallback = (0, _channeloutbound.projectOutboundPayloadPlanForDelivery)((0, _channeloutbound.createOutboundPayloadPlan)([
            {
                text: "NO_REPLY"
            }
        ], {
            cfg,
            sessionKey: policySessionKey,
            surface: "telegram"
        }));
        if (silentReplyFallback.length > 0) {
            const result = await (telegramDeps.deliverReplies ?? _delivery.deliverReplies)({
                replies: silentReplyFallback,
                ...deliveryBaseOptions,
                silent: false,
                mediaLoader: telegramDeps.loadWebMedia
            });
            sentFallback = result.delivered;
        }
        silentReplyDispatchLogger.debug("telegram turn ended without visible final response", {
            hasSessionKey: Boolean(policySessionKey),
            hasChatId: chatId != null,
            queuedFinal,
            sentFallback
        });
    }
    const hasFinalResponse = deliverySummary.delivered || sentFallback || suppressSilentReplyFallback || queuedFinal;
    if (statusReactionController && !hasFinalResponse) {
        void finalizeTelegramStatusReaction({
            outcome: "error",
            hasFinalResponse: false
        }).catch((err)=>{
            (0, _runtimeenv.logVerbose)(`telegram: status reaction error finalize failed: ${String(err)}`);
        });
    }
    const shouldClearGroupHistory = !isRoomEvent || deliverySummary.delivered || sentFallback || queuedFinal;
    if (!hasFinalResponse) {
        if (!shouldClearGroupHistory) {
            return;
        }
        clearGroupHistory();
        return;
    }
    // Fire-and-forget: auto-rename DM topic on first message.
    if (isDmTopic && isFirstTurnInSession) {
        const userMessage = (ctxPayload.RawBody ?? ctxPayload.Body ?? "").slice(0, 500);
        if (userMessage.trim()) {
            const agentDir = (0, _botmessagedispatchagentruntime.resolveAgentDir)(cfg, route.agentId);
            const directAutoTopicLabel = !isGroup && groupConfig && "autoTopicLabel" in groupConfig ? groupConfig.autoTopicLabel : undefined;
            const accountAutoTopicLabel = telegramCfg?.autoTopicLabel;
            const autoTopicConfig = (0, _botmessagedispatchruntime.resolveAutoTopicLabelConfig)(directAutoTopicLabel, accountAutoTopicLabel);
            if (autoTopicConfig) {
                const topicThreadId = threadSpec.id;
                void (async ()=>{
                    try {
                        const label = await (0, _botmessagedispatchruntime.generateTopicLabel)({
                            userMessage,
                            prompt: autoTopicConfig.prompt,
                            cfg,
                            agentId: route.agentId,
                            agentDir
                        });
                        if (!label) {
                            (0, _runtimeenv.logVerbose)("auto-topic-label: LLM returned empty label");
                            return;
                        }
                        (0, _runtimeenv.logVerbose)(`auto-topic-label: generated label (len=${label.length})`);
                        await bot.api.editForumTopic(chatId, topicThreadId, {
                            name: label
                        });
                        (0, _runtimeenv.logVerbose)(`auto-topic-label: renamed topic ${chatId}/${topicThreadId}`);
                    } catch (err) {
                        (0, _runtimeenv.logVerbose)(`auto-topic-label: failed: ${(0, _errorruntime.formatErrorMessage)(err)}`);
                    }
                })();
            }
        }
    }
    if (statusReactionController) {
        const statusReactionOutcome = dispatchError || sentFallback ? "error" : "done";
        void finalizeTelegramStatusReaction({
            outcome: statusReactionOutcome,
            hasFinalResponse: true
        }).catch((err)=>{
            (0, _runtimeenv.logVerbose)(`telegram: status reaction finalize failed: ${String(err)}`);
        });
    } else {
        (0, _channelfeedback.removeAckReactionAfterReply)({
            removeAfterReply: removeAckAfterReply,
            ackReactionPromise,
            ackReactionValue: ackReactionPromise ? "ack" : null,
            remove: ()=>(reactionApi?.(chatId, msg.message_id ?? 0, []) ?? Promise.resolve()).then(()=>{}),
            onError: (err)=>{
                if (!msg.message_id) {
                    return;
                }
                (0, _channelfeedback.logAckFailure)({
                    log: _runtimeenv.logVerbose,
                    channel: "telegram",
                    target: `${chatId}/${msg.message_id}`,
                    error: err
                });
            }
        });
    }
    if (shouldClearGroupHistory) {
        clearGroupHistory();
    }
};

//# sourceMappingURL=bot-message-dispatch.js.map