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
    get buildTelegramInboundContextPayload () {
        return buildTelegramInboundContextPayload;
    },
    get resolveTelegramMessageContextStorePath () {
        return resolveTelegramMessageContextStorePath;
    }
});
const _channelinbound = require("../../../../common/openclaw/plugin-sdk/channel-inbound");
const _commandprimitivesruntime = require("../../../../common/openclaw/plugin-sdk/command-primitives-runtime");
const _commandsurface = require("../../../../common/openclaw/plugin-sdk/command-surface");
const _contextvisibilityruntime = require("../../../../common/openclaw/plugin-sdk/context-visibility-runtime");
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _replyhistory = require("../../../../common/openclaw/plugin-sdk/reply-history");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _securityruntime = require("../../../../common/openclaw/plugin-sdk/security-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _botaccess = require("./bot-access.js");
const _helpers = require("./bot/helpers.js");
const _groupconfighelpers = require("./group-config-helpers.js");
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
const sessionRuntimeMethods = [
    "buildChannelInboundEventContext",
    "readSessionUpdatedAt",
    "recordInboundSession",
    "resolveInboundLastRouteSessionKey",
    "resolvePinnedMainDmOwnerFromAllowlist",
    "resolveStorePath"
];
function hasCompleteSessionRuntime(runtime) {
    return Boolean(runtime && sessionRuntimeMethods.every((method)=>typeof runtime[method] === "function"));
}
async function loadTelegramMessageContextSessionRuntime(runtime) {
    if (hasCompleteSessionRuntime(runtime)) {
        return runtime;
    }
    return {
        ...await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./bot-message-context.session.runtime.js"))),
        ...runtime
    };
}
async function resolveTelegramMessageContextStorePath(params) {
    const sessionRuntime = await loadTelegramMessageContextSessionRuntime(params.sessionRuntime);
    return sessionRuntime.resolveStorePath(params.cfg.session?.store, {
        agentId: params.agentId
    });
}
function replyTargetToChainEntry(replyTarget) {
    return {
        ...replyTarget.id ? {
            messageId: replyTarget.id
        } : {},
        sender: replyTarget.sender,
        ...replyTarget.senderId ? {
            senderId: replyTarget.senderId
        } : {},
        ...replyTarget.senderUsername ? {
            senderUsername: replyTarget.senderUsername
        } : {},
        ...replyTarget.body ? {
            body: replyTarget.body
        } : {},
        ...replyTarget.kind === "quote" ? {
            isQuote: true
        } : {},
        ...replyTarget.forwardedFrom?.from ? {
            forwardedFrom: replyTarget.forwardedFrom.from
        } : {},
        ...replyTarget.forwardedFrom?.fromId ? {
            forwardedFromId: replyTarget.forwardedFrom.fromId
        } : {},
        ...replyTarget.forwardedFrom?.fromUsername ? {
            forwardedFromUsername: replyTarget.forwardedFrom.fromUsername
        } : {},
        ...replyTarget.forwardedFrom?.date ? {
            forwardedDate: replyTarget.forwardedFrom.date * 1000
        } : {}
    };
}
function stripReplyChainForwarded(entry) {
    const { forwardedFrom: _forwardedFrom, forwardedFromId: _forwardedFromId, forwardedFromUsername: _forwardedFromUsername, forwardedDate: _forwardedDate, ...withoutForwarded } = entry;
    return withoutForwarded;
}
function formatReplyChainEntry(entry, index) {
    const forwardedAt = (0, _numberruntime.timestampMsToIsoString)(entry.forwardedDate);
    const labels = [
        `${index + 1}. ${entry.sender ?? "unknown sender"}`,
        entry.messageId ? `id:${entry.messageId}` : undefined,
        entry.replyToId ? `reply_to:${entry.replyToId}` : undefined,
        entry.timestamp ? (0, _numberruntime.timestampMsToIsoString)(entry.timestamp) : undefined
    ].filter(Boolean);
    const bodyLines = [
        entry.forwardedFrom ? `[Forwarded from ${entry.forwardedFrom}${forwardedAt ? ` at ${forwardedAt}` : ""}]` : undefined,
        entry.isQuote && entry.body ? `"${entry.body}"` : entry.body,
        entry.mediaType ? `<media:${entry.mediaType}>` : undefined,
        entry.mediaPath ? `[media_path:${entry.mediaPath}]` : undefined,
        entry.mediaRef ? `[media_ref:${entry.mediaRef}]` : undefined
    ].filter(Boolean);
    return `[${labels.join(" ")}]\n${bodyLines.join("\n")}`;
}
async function buildTelegramInboundContextPayload(params) {
    const { cfg, primaryCtx, msg, allMedia, replyMedia, replyChain, promptContext, isGroup, isForum, chatId, senderId, senderUsername, resolvedThreadId, dmThreadId, threadSpec, route, rawBody, bodyText, historyKey, historyLimit, groupHistories, groupConfig, topicConfig, stickerCacheHit, effectiveWasMentioned, hasControlCommand, audioTranscribedMediaIndex, commandAuthorized, locationData, options, dmAllowFrom, effectiveGroupAllow, topicName, sessionRuntime: sessionRuntimeOverride } = params;
    const replyTarget = (0, _helpers.describeReplyTarget)(msg);
    const forwardOrigin = (0, _helpers.normalizeForwardedContext)(msg);
    const contextVisibilityMode = (0, _contextvisibilityruntime.resolveChannelContextVisibilityMode)({
        cfg,
        channel: "telegram",
        accountId: route.accountId
    });
    const shouldIncludeGroupSupplementalContext = (paramsLocal)=>{
        if (!isGroup) {
            return true;
        }
        const senderAllowed = effectiveGroupAllow?.hasEntries ? (0, _botaccess.isSenderAllowed)({
            allow: effectiveGroupAllow,
            senderId: paramsLocal.senderId,
            senderUsername: paramsLocal.senderUsername
        }) : true;
        return (0, _securityruntime.evaluateSupplementalContextVisibility)({
            mode: contextVisibilityMode,
            kind: paramsLocal.kind,
            senderAllowed
        }).include;
    };
    const includeReplyTarget = replyTarget ? shouldIncludeGroupSupplementalContext({
        kind: "quote",
        senderId: replyTarget.senderId,
        senderUsername: replyTarget.senderUsername
    }) : false;
    const includeForwardOrigin = forwardOrigin ? shouldIncludeGroupSupplementalContext({
        kind: "forwarded",
        senderId: forwardOrigin.fromId,
        senderUsername: forwardOrigin.fromUsername
    }) : false;
    const visibleReplyForwardedFrom = includeReplyTarget && replyTarget?.forwardedFrom ? shouldIncludeGroupSupplementalContext({
        kind: "forwarded",
        senderId: replyTarget.forwardedFrom.fromId,
        senderUsername: replyTarget.forwardedFrom.fromUsername
    }) ? replyTarget.forwardedFrom : undefined : undefined;
    const visibleReplyTarget = includeReplyTarget && replyTarget ? {
        ...replyTarget,
        forwardedFrom: visibleReplyForwardedFrom
    } : null;
    const visibleReplyTargetEntry = visibleReplyTarget ? replyTargetToChainEntry(visibleReplyTarget) : undefined;
    const visibleReplyTargetById = new Map(visibleReplyTargetEntry?.messageId ? [
        [
            visibleReplyTargetEntry.messageId,
            visibleReplyTargetEntry
        ]
    ] : []);
    const rawReplyChain = replyChain.length > 0 ? replyChain : visibleReplyTargetEntry ? [
        visibleReplyTargetEntry
    ] : [];
    const visibleReplyChain = rawReplyChain.flatMap((entry)=>{
        const visibleEntry = {
            ...entry,
            ...entry.messageId ? visibleReplyTargetById.get(entry.messageId) : undefined
        };
        if (!shouldIncludeGroupSupplementalContext({
            kind: "quote",
            senderId: visibleEntry.senderId,
            senderUsername: visibleEntry.senderUsername
        })) {
            return [];
        }
        const includeForwarded = visibleEntry.forwardedFrom && shouldIncludeGroupSupplementalContext({
            kind: "forwarded",
            senderId: visibleEntry.forwardedFromId,
            senderUsername: visibleEntry.forwardedFromUsername
        });
        return [
            includeForwarded ? visibleEntry : stripReplyChainForwarded(visibleEntry)
        ];
    });
    const visibleForwardOrigin = includeForwardOrigin ? forwardOrigin : null;
    const visibleForwardOriginAt = (0, _numberruntime.timestampMsToIsoString)(visibleForwardOrigin?.date ? visibleForwardOrigin.date * 1000 : undefined);
    const replySuffix = visibleReplyChain.length > 0 ? `\n\n[Reply chain - nearest first]\n${visibleReplyChain.map(formatReplyChainEntry).join("\n")}\n[/Reply chain]` : "";
    const forwardPrefix = visibleForwardOrigin ? `[Forwarded from ${visibleForwardOrigin.from}${visibleForwardOriginAt ? ` at ${visibleForwardOriginAt}` : ""}]\n` : "";
    const groupLabel = isGroup ? (0, _helpers.buildGroupLabel)(msg, chatId, resolvedThreadId) : undefined;
    const senderName = (0, _helpers.buildSenderName)(msg);
    const conversationLabel = isGroup ? groupLabel ?? `group:${chatId}` : (0, _helpers.buildSenderLabel)(msg, senderId || chatId);
    const sessionRuntime = await loadTelegramMessageContextSessionRuntime(sessionRuntimeOverride);
    const storePath = await resolveTelegramMessageContextStorePath({
        cfg,
        agentId: route.agentId,
        sessionRuntime: sessionRuntimeOverride
    });
    const envelopeOptions = (0, _channelinbound.resolveEnvelopeFormatOptions)(cfg);
    const previousTimestamp = sessionRuntime.readSessionUpdatedAt({
        storePath,
        sessionKey: route.sessionKey
    });
    const body = (0, _channelinbound.formatInboundEnvelope)({
        channel: "Telegram",
        from: conversationLabel,
        timestamp: msg.date ? msg.date * 1000 : undefined,
        body: `${forwardPrefix}${bodyText}${replySuffix}`,
        chatType: isGroup ? "group" : "direct",
        sender: {
            name: senderName,
            username: senderUsername || undefined,
            id: senderId || undefined
        },
        previousTimestamp,
        envelope: envelopeOptions
    });
    const channelHistory = (0, _replyhistory.createChannelHistoryWindow)({
        historyMap: groupHistories
    });
    let combinedBody = body;
    if (isGroup && historyKey && historyLimit > 0) {
        combinedBody = channelHistory.buildPendingContext({
            historyKey,
            limit: historyLimit,
            currentMessage: combinedBody,
            formatEntry: (entry)=>(0, _channelinbound.formatInboundEnvelope)({
                    channel: "Telegram",
                    from: groupLabel ?? `group:${chatId}`,
                    timestamp: entry.timestamp,
                    body: `${entry.body} [id:${entry.messageId ?? "unknown"} chat:${chatId}]`,
                    chatType: "group",
                    senderLabel: entry.sender,
                    envelope: envelopeOptions
                })
        });
    }
    const { skillFilter, groupSystemPrompt } = (0, _groupconfighelpers.resolveTelegramGroupPromptSettings)({
        groupConfig,
        topicConfig
    });
    const commandBody = (0, _commandsurface.normalizeCommandBody)(rawBody, {
        botUsername: (0, _stringcoerceruntime.normalizeOptionalLowercaseString)(primaryCtx.me?.username)
    });
    const inboundHistory = isGroup && historyKey && historyLimit > 0 ? channelHistory.buildInboundHistory({
        historyKey,
        limit: historyLimit
    }) : undefined;
    const currentMediaForContext = stickerCacheHit ? [] : allMedia;
    const replyHead = visibleReplyChain[0];
    const toInboundMedia = (media, index)=>({
            path: media.path,
            url: media.path,
            contentType: media.contentType,
            transcribed: index !== undefined && audioTranscribedMediaIndex === index
        });
    const currentMediaFacts = currentMediaForContext.map(toInboundMedia);
    const replyMediaFacts = visibleReplyChain.length > 0 ? visibleReplyChain.flatMap((entry)=>entry.mediaPath ? [
            {
                path: entry.mediaPath,
                url: entry.mediaPath,
                contentType: entry.mediaType
            }
        ] : []) : visibleReplyTarget ? replyMedia.map((media)=>toInboundMedia(media)) : [];
    const telegramFrom = isGroup ? (0, _helpers.buildTelegramGroupFrom)(chatId, resolvedThreadId) : `telegram:${chatId}`;
    const telegramTo = (0, _helpers.buildTelegramInboundOriginTarget)(chatId, threadSpec);
    const locationContext = locationData ? (0, _channelinbound.toLocationContext)(locationData) : undefined;
    const commandSource = options?.commandSource;
    const unmentionedGroupPolicy = (0, _channelinbound.resolveUnmentionedGroupInboundPolicy)({
        cfg,
        agentId: route.agentId
    });
    const hasAbortRequest = (0, _commandprimitivesruntime.isAbortRequestText)(rawBody, {
        botUsername: (0, _stringcoerceruntime.normalizeOptionalLowercaseString)(primaryCtx.me?.username)
    });
    const conversationKind = isGroup ? "group" : "direct";
    const inboundEventKind = (0, _channelinbound.classifyChannelInboundEvent)({
        conversation: {
            kind: conversationKind
        },
        unmentionedGroupPolicy,
        wasMentioned: effectiveWasMentioned,
        hasControlCommand,
        hasAbortRequest,
        commandSource
    });
    const ctxPayload = await sessionRuntime.buildChannelInboundEventContext({
        channel: "telegram",
        resolveSupplementalMedia: true,
        accountId: route.accountId,
        messageId: options?.messageIdOverride ?? String(msg.message_id),
        timestamp: msg.date ? msg.date * 1000 : undefined,
        from: telegramFrom,
        sender: {
            ...senderId ? {
                id: senderId
            } : {},
            name: senderName,
            username: senderUsername || undefined
        },
        conversation: {
            kind: conversationKind,
            id: String(chatId),
            label: conversationLabel,
            threadId: threadSpec.id != null ? String(threadSpec.id) : undefined
        },
        route: {
            agentId: route.agentId,
            accountId: route.accountId,
            routeSessionKey: route.sessionKey,
            mainSessionKey: route.mainSessionKey
        },
        reply: {
            to: telegramTo,
            replyToId: replyHead?.messageId ?? visibleReplyTarget?.id,
            messageThreadId: threadSpec.id
        },
        message: {
            inboundEventKind,
            body: combinedBody,
            rawBody,
            bodyForAgent: bodyText,
            commandBody,
            inboundHistory
        },
        access: {
            commands: {
                authorized: commandAuthorized
            }
        },
        command: commandSource === "native" ? {
            kind: "native",
            authorized: commandAuthorized,
            body: commandBody
        } : commandSource === "text" ? {
            kind: "text-slash",
            authorized: commandAuthorized,
            body: commandBody
        } : undefined,
        media: currentMediaFacts,
        supplemental: {
            quote: replyHead || visibleReplyTarget ? {
                id: replyHead?.messageId ?? visibleReplyTarget?.id,
                body: replyHead?.body ?? visibleReplyTarget?.body,
                sender: replyHead?.sender ?? visibleReplyTarget?.sender,
                senderAllowed: true,
                isQuote: replyHead?.isQuote ?? (visibleReplyTarget?.kind === "quote" ? true : undefined),
                media: replyMediaFacts
            } : undefined,
            forwarded: visibleForwardOrigin ? {
                from: visibleForwardOrigin.from,
                fromType: visibleForwardOrigin.fromType,
                fromId: visibleForwardOrigin.fromId,
                date: visibleForwardOrigin.date ? visibleForwardOrigin.date * 1000 : undefined,
                senderAllowed: true
            } : undefined,
            groupSystemPrompt: isGroup || !isGroup && groupConfig ? groupSystemPrompt : undefined,
            untrustedContext: promptContext.length > 0 ? promptContext : undefined
        },
        contextVisibility: contextVisibilityMode,
        extra: {
            BotUsername: primaryCtx.me?.username ?? undefined,
            GroupSubject: isGroup ? msg.chat.title ?? undefined : undefined,
            ReplyChain: visibleReplyChain.length > 0 ? visibleReplyChain : undefined,
            ReplyToIsExternal: visibleReplyTarget?.source === "external_reply" ? true : undefined,
            ReplyToQuoteText: visibleReplyTarget?.quoteText,
            ReplyToQuotePosition: visibleReplyTarget?.quotePosition,
            ReplyToQuoteEntities: visibleReplyTarget?.quoteEntities,
            ReplyToQuoteSourceText: visibleReplyTarget?.quoteSourceText,
            ReplyToQuoteSourceEntities: visibleReplyTarget?.quoteSourceEntities,
            ReplyToForwardedFrom: visibleReplyTarget?.forwardedFrom?.from,
            ReplyToForwardedFromType: visibleReplyTarget?.forwardedFrom?.fromType,
            ReplyToForwardedFromId: visibleReplyTarget?.forwardedFrom?.fromId,
            ReplyToForwardedFromUsername: visibleReplyTarget?.forwardedFrom?.fromUsername,
            ReplyToForwardedFromTitle: visibleReplyTarget?.forwardedFrom?.fromTitle,
            ReplyToForwardedDate: visibleReplyTarget?.forwardedFrom?.date ? visibleReplyTarget.forwardedFrom.date * 1000 : undefined,
            ForwardedFromUsername: visibleForwardOrigin?.fromUsername,
            ForwardedFromTitle: visibleForwardOrigin?.fromTitle,
            ForwardedFromSignature: visibleForwardOrigin?.fromSignature,
            ForwardedFromChatType: visibleForwardOrigin?.fromChatType,
            ForwardedFromMessageId: visibleForwardOrigin?.fromMessageId,
            WasMentioned: isGroup ? effectiveWasMentioned : undefined,
            Sticker: allMedia[0]?.stickerMetadata,
            StickerMediaIncluded: allMedia[0]?.stickerMetadata ? !stickerCacheHit : undefined,
            ...locationContext,
            IsForum: isForum,
            TopicName: isForum && topicName ? topicName : undefined
        }
    });
    if (inboundEventKind === "room_event" && historyKey) {
        channelHistory.record({
            historyKey,
            limit: historyLimit,
            entry: {
                sender: (0, _helpers.buildSenderLabel)(msg, senderId || chatId),
                body: rawBody,
                timestamp: msg.date ? msg.date * 1000 : undefined,
                messageId: typeof msg.message_id === "number" ? String(msg.message_id) : undefined
            }
        });
    }
    const pinnedMainDmOwner = !isGroup ? sessionRuntime.resolvePinnedMainDmOwnerFromAllowlist({
        dmScope: cfg.session?.dmScope,
        allowFrom: dmAllowFrom,
        normalizeEntry: (entry)=>(0, _botaccess.normalizeAllowFrom)([
                entry
            ]).entries[0]
    }) : null;
    const updateLastRouteSessionKey = sessionRuntime.resolveInboundLastRouteSessionKey({
        route,
        sessionKey: route.sessionKey
    });
    const shouldPersistGroupLastRouteThread = isGroup && route.matchedBy !== "binding.channel";
    const updateLastRouteThreadId = isGroup ? shouldPersistGroupLastRouteThread && resolvedThreadId != null ? String(resolvedThreadId) : undefined : dmThreadId != null ? String(dmThreadId) : undefined;
    const updateLastRoute = !isGroup || updateLastRouteThreadId != null ? {
        sessionKey: updateLastRouteSessionKey,
        channel: "telegram",
        to: isGroup && updateLastRouteThreadId != null ? `telegram:${chatId}:topic:${updateLastRouteThreadId}` : `telegram:${chatId}`,
        accountId: route.accountId,
        threadId: updateLastRouteThreadId,
        mainDmOwnerPin: !isGroup && updateLastRouteSessionKey === route.mainSessionKey && pinnedMainDmOwner && senderId ? {
            ownerRecipient: pinnedMainDmOwner,
            senderRecipient: senderId,
            onSkip: (skipParams)=>{
                (0, _runtimeenv.logVerbose)(`telegram: skip main-session last route for ${skipParams.senderRecipient} (pinned owner ${skipParams.ownerRecipient})`);
            }
        } : undefined
    } : undefined;
    if (visibleReplyTarget && (0, _runtimeenv.shouldLogVerbose)()) {
        const preview = (visibleReplyTarget.body ?? "").replace(/\s+/g, " ").slice(0, 120);
        (0, _runtimeenv.logVerbose)(`telegram reply-context: replyToId=${visibleReplyTarget.id} replyToSender=${visibleReplyTarget.sender} replyToBody="${preview}"`);
    }
    if (visibleForwardOrigin && (0, _runtimeenv.shouldLogVerbose)()) {
        (0, _runtimeenv.logVerbose)(`telegram forward-context: forwardedFrom="${visibleForwardOrigin.from}" type=${visibleForwardOrigin.fromType}`);
    }
    if ((0, _runtimeenv.shouldLogVerbose)()) {
        const preview = body.slice(0, 200).replace(/\n/g, "\\n");
        const mediaInfo = allMedia.length > 1 ? ` mediaCount=${allMedia.length}` : "";
        const topicInfo = resolvedThreadId != null ? ` topic=${resolvedThreadId}` : "";
        (0, _runtimeenv.logVerbose)(`telegram inbound: chatId=${chatId} from=${ctxPayload.From} len=${body.length}${mediaInfo}${topicInfo} preview="${preview}"`);
    }
    return {
        ctxPayload,
        skillFilter,
        turn: {
            storePath,
            recordInboundSession: sessionRuntime.recordInboundSession,
            record: {
                updateLastRoute,
                onRecordError: (err)=>{
                    (0, _runtimeenv.logVerbose)(`telegram: failed updating session meta: ${String(err)}`);
                }
            }
        }
    };
}

//# sourceMappingURL=bot-message-context.session.js.map