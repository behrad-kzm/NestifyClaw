"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "buildTelegramMessageContext", {
    enumerable: true,
    get: function() {
        return buildTelegramMessageContext;
    }
});
const _channelfeedback = require("../../../../common/openclaw/plugin-sdk/channel-feedback");
const _channelinbound = require("../../../../common/openclaw/plugin-sdk/channel-inbound");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _accessgroups = require("./access-groups.js");
const _accounts = require("./accounts.js");
const _apilogging = require("./api-logging.js");
const _botaccess = require("./bot-access.js");
const _botmessagecontextbody = require("./bot-message-context.body.js");
const _botmessagecontextsession = require("./bot-message-context.session.js");
const _helpers = require("./bot/helpers.js");
const _conversationroute = require("./conversation-route.js");
const _dmaccess = require("./dm-access.js");
const _groupaccess = require("./group-access.js");
const _statusreactionvariants = require("./status-reaction-variants.js");
const _topicnamecache = require("./topic-name-cache.js");
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
let telegramMessageContextRuntimePromise;
async function loadTelegramMessageContextRuntime() {
    telegramMessageContextRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./bot-message-context.runtime.js")));
    return await telegramMessageContextRuntimePromise;
}
const buildTelegramMessageContext = async ({ primaryCtx, allMedia, replyMedia = [], replyChain = [], promptContext = [], storeAllowFrom, options, bot, cfg, account, historyLimit, groupHistories, dmPolicy, allowFrom, groupAllowFrom, ackReactionScope, logger, resolveGroupActivation, resolveGroupRequireMention, resolveTelegramGroupConfig, loadFreshConfig, runtime, sessionRuntime, upsertPairingRequest, sendChatActionHandler })=>{
    const msg = primaryCtx.message;
    const chatId = msg.chat.id;
    const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    const senderId = msg.from?.id ? String(msg.from.id) : "";
    const messageThreadId = msg.message_thread_id;
    const reactionApi = typeof bot.api.setMessageReaction === "function" ? bot.api.setMessageReaction.bind(bot.api) : null;
    const getChatApi = typeof bot.api.getChat === "function" ? bot.api.getChat.bind(bot.api) : undefined;
    const isForum = await (0, _helpers.resolveTelegramForumFlag)({
        chatId,
        chatType: msg.chat.type,
        isGroup,
        isForum: (0, _helpers.extractTelegramForumFlag)(msg.chat),
        isTopicMessage: msg.is_topic_message,
        getChat: getChatApi
    });
    const threadSpec = (0, _helpers.resolveTelegramThreadSpec)({
        isGroup,
        isForum,
        messageThreadId
    });
    const resolvedThreadId = threadSpec.scope === "forum" ? threadSpec.id : undefined;
    const replyThreadId = threadSpec.id;
    const dmThreadId = threadSpec.scope === "dm" ? threadSpec.id : undefined;
    let topicName;
    if (isForum && resolvedThreadId != null) {
        const topicNameCacheScope = (0, _topicnamecache.resolveTopicNameCacheScope)(await (0, _botmessagecontextsession.resolveTelegramMessageContextStorePath)({
            cfg,
            agentId: account.accountId,
            sessionRuntime
        }));
        const ftCreated = msg.forum_topic_created;
        const ftEdited = msg.forum_topic_edited;
        const ftClosed = msg.forum_topic_closed;
        const ftReopened = msg.forum_topic_reopened;
        const topicPatch = ftCreated?.name ? {
            name: ftCreated.name,
            iconColor: ftCreated.icon_color,
            iconCustomEmojiId: ftCreated.icon_custom_emoji_id,
            closed: false
        } : ftEdited?.name ? {
            name: ftEdited.name,
            iconCustomEmojiId: ftEdited.icon_custom_emoji_id
        } : ftClosed ? {
            closed: true
        } : ftReopened ? {
            closed: false
        } : undefined;
        if (topicPatch) {
            await (0, _topicnamecache.updateTopicName)(chatId, resolvedThreadId, topicPatch, topicNameCacheScope);
        }
        topicName = await (0, _topicnamecache.getTopicName)(chatId, resolvedThreadId, topicNameCacheScope);
        if (!topicName) {
            const replyFtCreated = msg.reply_to_message?.forum_topic_created;
            if (replyFtCreated?.name) {
                await (0, _topicnamecache.updateTopicName)(chatId, resolvedThreadId, {
                    name: replyFtCreated.name,
                    iconColor: replyFtCreated.icon_color,
                    iconCustomEmojiId: replyFtCreated.icon_custom_emoji_id
                }, topicNameCacheScope);
                topicName = replyFtCreated.name;
            }
        }
    }
    const threadIdForConfig = resolvedThreadId ?? dmThreadId;
    const { groupConfig, topicConfig } = resolveTelegramGroupConfig(chatId, threadIdForConfig);
    const directConfig = !isGroup ? groupConfig : undefined;
    const telegramGroupConfig = isGroup ? groupConfig : undefined;
    const effectiveDmPolicy = (0, _botaccess.resolveTelegramEffectiveDmPolicy)({
        isGroup,
        groupConfig,
        dmPolicy
    });
    const freshCfg = loadFreshConfig?.() ?? (runtime?.getRuntimeConfig ?? (await loadTelegramMessageContextRuntime()).getRuntimeConfig)();
    const conversationRoute = (0, _conversationroute.resolveTelegramConversationRoute)({
        cfg: freshCfg,
        accountId: account.accountId,
        chatId,
        isGroup,
        resolvedThreadId,
        replyThreadId,
        senderId,
        topicAgentId: topicConfig?.agentId
    });
    const { bindingMode } = conversationRoute;
    let { route } = conversationRoute;
    const requiresExplicitAccountBinding = (candidate)=>(0, _routing.normalizeAccountId)(candidate.accountId) !== (0, _routing.normalizeAccountId)((0, _accounts.resolveDefaultTelegramAccountId)(freshCfg)) && candidate.matchedBy === "default";
    const isNamedAccountFallback = requiresExplicitAccountBinding(route);
    // Named-account groups still require an explicit binding; DMs get a
    // per-account fallback session key below to preserve isolation.
    if (isNamedAccountFallback && isGroup) {
        (0, _channelinbound.logInboundDrop)({
            log: _runtimeenv.logVerbose,
            channel: "telegram",
            reason: "non-default account requires explicit binding",
            target: route.accountId
        });
        return null;
    }
    const groupAllowOverride = (0, _botaccess.firstDefined)(topicConfig?.allowFrom, groupConfig?.allowFrom);
    const dmAllow = await (0, _accessgroups.resolveTelegramDmAllow)({
        cfg: freshCfg,
        groupAllowOverride,
        allowFrom,
        accountId: account.accountId,
        senderId,
        storeAllowFrom,
        dmPolicy: effectiveDmPolicy
    });
    const expandedGroupAllowFrom = await (0, _accessgroups.expandTelegramAllowFromWithAccessGroups)({
        cfg: freshCfg,
        allowFrom: groupAllowOverride ?? groupAllowFrom,
        accountId: account.accountId,
        senderId
    });
    const effectiveGroupAllow = (0, _botaccess.normalizeAllowFrom)(expandedGroupAllowFrom);
    const hasGroupAllowOverride = groupAllowOverride !== undefined;
    const senderUsername = msg.from?.username ?? "";
    const baseAccess = (0, _groupaccess.evaluateTelegramGroupBaseAccess)({
        isGroup,
        groupConfig,
        topicConfig,
        hasGroupAllowOverride,
        effectiveGroupAllow,
        senderId,
        senderUsername,
        enforceAllowOverride: true,
        requireSenderForAllowOverride: false
    });
    if (!baseAccess.allowed) {
        if (baseAccess.reason === "group-disabled") {
            (0, _runtimeenv.logVerbose)(`Blocked telegram group ${chatId} (group disabled)`);
            return null;
        }
        if (baseAccess.reason === "topic-disabled") {
            (0, _runtimeenv.logVerbose)(`Blocked telegram topic ${chatId} (${resolvedThreadId ?? "unknown"}) (topic disabled)`);
            return null;
        }
        (0, _runtimeenv.logVerbose)(isGroup ? `Blocked telegram group sender ${senderId || "unknown"} (group allowFrom override)` : `Blocked telegram DM sender ${senderId || "unknown"} (DM allowFrom override)`);
        return null;
    }
    const requireTopic = directConfig?.requireTopic;
    const topicRequiredButMissing = !isGroup && requireTopic === true && dmThreadId == null;
    if (topicRequiredButMissing) {
        (0, _runtimeenv.logVerbose)(`Blocked telegram DM ${chatId}: requireTopic=true but no topic present`);
        return null;
    }
    const sendTyping = async ()=>{
        await (0, _apilogging.withTelegramApiErrorLogging)({
            operation: "sendChatAction",
            fn: ()=>sendChatActionHandler.sendChatAction(chatId, "typing", (0, _helpers.buildTypingThreadParams)(replyThreadId))
        });
    };
    const sendRecordVoice = async ()=>{
        try {
            await (0, _apilogging.withTelegramApiErrorLogging)({
                operation: "sendChatAction",
                fn: ()=>sendChatActionHandler.sendChatAction(chatId, "record_voice", (0, _helpers.buildTypingThreadParams)(replyThreadId))
            });
        } catch (err) {
            (0, _runtimeenv.logVerbose)(`telegram record_voice cue failed for chat ${chatId}: ${String(err)}`);
        }
    };
    if (!await (0, _dmaccess.enforceTelegramDmAccess)({
        isGroup,
        dmPolicy: effectiveDmPolicy,
        msg,
        chatId,
        effectiveDmAllow: dmAllow.effectiveAllow,
        accountId: account.accountId,
        bot,
        logger,
        upsertPairingRequest
    })) {
        return null;
    }
    let initialTypingCueSent = false;
    const ensureConfiguredBindingReady = async ()=>{
        if (bindingMode.kind !== "configured") {
            return true;
        }
        const ensureConfiguredBindingRouteReady = runtime?.ensureConfiguredBindingRouteReady ?? (await loadTelegramMessageContextRuntime()).ensureConfiguredBindingRouteReady;
        const ensured = await ensureConfiguredBindingRouteReady({
            cfg: freshCfg,
            bindingResolution: bindingMode.binding
        });
        if (ensured.ok) {
            (0, _runtimeenv.logVerbose)(`telegram: using configured ACP binding for ${bindingMode.binding.record.conversation.conversationId} -> ${bindingMode.sessionKey}`);
            return true;
        }
        (0, _runtimeenv.logVerbose)(`telegram: configured ACP binding unavailable for ${bindingMode.binding.record.conversation.conversationId}: ${ensured.error}`);
        (0, _channelinbound.logInboundDrop)({
            log: _runtimeenv.logVerbose,
            channel: "telegram",
            reason: "configured ACP binding unavailable",
            target: bindingMode.binding.record.conversation.conversationId
        });
        return false;
    };
    const baseSessionKey = (0, _conversationroute.resolveTelegramConversationBaseSessionKey)({
        cfg: freshCfg,
        route,
        chatId,
        isGroup,
        senderId
    });
    const useDmThreadSession = (0, _helpers.shouldUseTelegramDmThreadSession)({
        dmThreadId,
        botHasTopicsEnabled: (0, _helpers.resolveTelegramBotHasTopicsEnabled)(primaryCtx.me)
    });
    const threadKeys = useDmThreadSession && dmThreadId != null ? (0, _routing.resolveThreadSessionKeys)({
        baseSessionKey,
        threadId: `${chatId}:${dmThreadId}`
    }) : null;
    const sessionKey = threadKeys?.sessionKey ?? baseSessionKey;
    route = {
        ...route,
        sessionKey,
        lastRoutePolicy: (0, _routing.deriveLastRoutePolicy)({
            sessionKey,
            mainSessionKey: route.mainSessionKey
        })
    };
    const activationOverride = resolveGroupActivation({
        chatId,
        messageThreadId: resolvedThreadId,
        sessionKey,
        agentId: route.agentId
    });
    const baseRequireMention = resolveGroupRequireMention(chatId);
    const requireMention = isGroup && bindingMode.kind === "plugin-owned-runtime" ? false : (0, _botaccess.firstDefined)(topicConfig?.requireMention, activationOverride, telegramGroupConfig?.requireMention, baseRequireMention);
    const recordChannelActivity = runtime?.recordChannelActivity ?? (await loadTelegramMessageContextRuntime()).recordChannelActivity;
    recordChannelActivity({
        channel: "telegram",
        accountId: account.accountId,
        direction: "inbound"
    });
    const originatingTo = (0, _helpers.buildTelegramInboundOriginTarget)(chatId, threadSpec);
    const bodyResult = await (0, _botmessagecontextbody.resolveTelegramInboundBody)({
        cfg,
        primaryCtx,
        msg,
        allMedia,
        isGroup,
        chatId,
        accountId: account.accountId,
        senderId,
        senderUsername,
        resolvedThreadId,
        replyThreadId,
        originatingTo,
        routeAgentId: route.agentId,
        sessionKey,
        effectiveGroupAllow,
        effectiveDmAllow: dmAllow.effectiveAllow,
        groupConfig,
        topicConfig,
        providerMentionPatterns: cfg.channels?.telegram?.accounts?.[account.accountId]?.mentionPatterns,
        requireMention,
        options,
        groupHistories,
        historyLimit,
        logger
    });
    if (!bodyResult) {
        return null;
    }
    if (!await ensureConfiguredBindingReady()) {
        return null;
    }
    // Direct chats are now reply-eligible; send the first typing cue before
    // expensive context/session construction without showing typing for dropped turns.
    if (!isGroup) {
        initialTypingCueSent = true;
        void sendTyping().catch((err)=>{
            (0, _runtimeenv.logVerbose)(`telegram early direct typing cue failed for chat ${chatId}: ${String(err)}`);
        });
    }
    const { ctxPayload, skillFilter, turn } = await (0, _botmessagecontextsession.buildTelegramInboundContextPayload)({
        cfg,
        primaryCtx,
        msg,
        allMedia,
        replyMedia,
        replyChain,
        promptContext,
        isGroup,
        isForum,
        chatId,
        senderId,
        senderUsername,
        resolvedThreadId,
        dmThreadId,
        threadSpec,
        route,
        rawBody: bodyResult.rawBody,
        bodyText: bodyResult.bodyText,
        historyKey: bodyResult.historyKey ?? "",
        historyLimit,
        groupHistories,
        groupConfig,
        topicConfig,
        stickerCacheHit: bodyResult.stickerCacheHit,
        effectiveWasMentioned: bodyResult.effectiveWasMentioned,
        hasControlCommand: bodyResult.hasControlCommand,
        ...bodyResult.audioTranscribedMediaIndex !== undefined ? {
            audioTranscribedMediaIndex: bodyResult.audioTranscribedMediaIndex
        } : {},
        locationData: bodyResult.locationData,
        options,
        dmAllowFrom: dmAllow.allowFrom,
        effectiveGroupAllow,
        commandAuthorized: bodyResult.commandAuthorized,
        topicName,
        sessionRuntime
    });
    const canShowStatusReaction = ctxPayload.InboundEventKind !== "room_event";
    const ackReaction = (0, _channelfeedback.resolveAckReaction)(cfg, route.agentId, {
        channel: "telegram",
        accountId: account.accountId
    });
    const ackReactionEmoji = ackReaction && (0, _statusreactionvariants.isTelegramSupportedReactionEmoji)(ackReaction) ? ackReaction : undefined;
    const removeAckAfterReply = cfg.messages?.removeAckAfterReply ?? false;
    const shouldSendAckReaction = Boolean(canShowStatusReaction && ackReaction && (0, _channelfeedback.shouldAckReaction)({
        scope: ackReactionScope,
        isDirect: !isGroup,
        isGroup,
        isMentionableGroup: isGroup,
        requireMention: Boolean(requireMention),
        canDetectMention: bodyResult.canDetectMention,
        effectiveWasMentioned: bodyResult.effectiveWasMentioned,
        shouldBypassMention: bodyResult.shouldBypassMention
    }));
    const statusReactionsConfig = cfg.messages?.statusReactions;
    const statusReactionsEnabled = statusReactionsConfig?.enabled === true && Boolean(reactionApi) && shouldSendAckReaction;
    const resolvedStatusReactionEmojis = statusReactionsEnabled ? (0, _statusreactionvariants.resolveTelegramStatusReactionEmojis)({
        initialEmoji: ackReaction,
        overrides: statusReactionsConfig?.emojis
    }) : null;
    const statusReactionVariantsByEmoji = resolvedStatusReactionEmojis ? (0, _statusreactionvariants.buildTelegramStatusReactionVariants)(resolvedStatusReactionEmojis) : new Map();
    let allowedStatusReactionEmojisPromise = null;
    const createStatusReactionController = statusReactionsEnabled && resolvedStatusReactionEmojis && msg.message_id ? runtime?.createStatusReactionController ?? (await loadTelegramMessageContextRuntime()).createStatusReactionController : null;
    const statusReactionController = createStatusReactionController ? createStatusReactionController({
        enabled: true,
        adapter: {
            setReaction: async (emoji)=>{
                if (reactionApi) {
                    if (!allowedStatusReactionEmojisPromise) {
                        allowedStatusReactionEmojisPromise = (0, _statusreactionvariants.resolveTelegramAllowedEmojiReactions)({
                            chat: msg.chat,
                            chatId,
                            getChat: getChatApi ?? undefined
                        }).catch((err)=>{
                            (0, _runtimeenv.logVerbose)(`telegram status-reaction available_reactions lookup failed for chat ${chatId}: ${String(err)}`);
                            return null;
                        });
                    }
                    const allowedStatusReactionEmojis = await allowedStatusReactionEmojisPromise;
                    const resolvedEmoji = (0, _statusreactionvariants.resolveTelegramReactionVariant)({
                        requestedEmoji: emoji,
                        variantsByRequestedEmoji: statusReactionVariantsByEmoji,
                        allowedEmojiReactions: allowedStatusReactionEmojis
                    });
                    if (!resolvedEmoji) {
                        return;
                    }
                    await reactionApi(chatId, msg.message_id, [
                        {
                            type: "emoji",
                            emoji: resolvedEmoji
                        }
                    ]);
                }
            }
        },
        initialEmoji: ackReaction,
        emojis: resolvedStatusReactionEmojis ?? undefined,
        timing: statusReactionsConfig?.timing,
        onError: (err)=>{
            (0, _runtimeenv.logVerbose)(`telegram status-reaction error for chat ${chatId}: ${String(err)}`);
        }
    }) : null;
    const ackReactionPromise = statusReactionController ? shouldSendAckReaction ? Promise.resolve(statusReactionController.setQueued()).then(()=>true, ()=>false) : null : shouldSendAckReaction && msg.message_id && reactionApi && ackReactionEmoji ? (0, _apilogging.withTelegramApiErrorLogging)({
        operation: "setMessageReaction",
        fn: ()=>reactionApi(chatId, msg.message_id, [
                {
                    type: "emoji",
                    emoji: ackReactionEmoji
                }
            ])
    }).then(()=>true, (err)=>{
        (0, _runtimeenv.logVerbose)(`telegram react failed for chat ${chatId}: ${String(err)}`);
        return false;
    }) : null;
    return {
        ctxPayload,
        turn,
        primaryCtx,
        msg,
        chatId,
        isGroup,
        groupConfig,
        topicConfig,
        resolvedThreadId,
        threadSpec,
        replyThreadId,
        isForum,
        historyKey: bodyResult.historyKey ?? "",
        historyLimit,
        groupHistories,
        route,
        skillFilter,
        sendTyping,
        sendRecordVoice,
        sendChatActionHandler,
        initialTypingCueSent,
        ackReactionPromise,
        reactionApi,
        removeAckAfterReply,
        statusReactionController,
        accountId: account.accountId
    };
};

//# sourceMappingURL=bot-message-context.js.map