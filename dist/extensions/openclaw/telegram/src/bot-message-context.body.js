"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramInboundBody", {
    enumerable: true,
    get: function() {
        return resolveTelegramInboundBody;
    }
});
const _channelinbound = require("../../../../common/openclaw/plugin-sdk/channel-inbound");
const _channelpolicy = require("../../../../common/openclaw/plugin-sdk/channel-policy");
const _commanddetection = require("../../../../common/openclaw/plugin-sdk/command-detection");
const _hookruntime = require("../../../../common/openclaw/plugin-sdk/hook-runtime");
const _replyhistory = require("../../../../common/openclaw/plugin-sdk/reply-history");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _bodyhelpers = require("./bot/body-helpers.js");
const _helpers = require("./bot/helpers.js");
const _forumservicemessage = require("./forum-service-message.js");
const _ingress = require("./ingress.js");
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
let stickerVisionRuntimePromise;
let mediaUnderstandingRuntimePromise;
function loadStickerVisionRuntime() {
    stickerVisionRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./sticker-vision.runtime.js")));
    return stickerVisionRuntimePromise;
}
function loadMediaUnderstandingRuntime() {
    mediaUnderstandingRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./media-understanding.runtime.js")));
    return mediaUnderstandingRuntimePromise;
}
function formatAudioTranscriptForAgent(transcript) {
    return `[Audio transcript (machine-generated, untrusted)]: ${JSON.stringify(transcript)}`;
}
function resolveSavedMediaKind(contentType) {
    const normalized = contentType?.split(";")[0]?.trim().toLowerCase();
    if (normalized?.startsWith("audio/")) {
        return "audio";
    }
    if (normalized?.startsWith("image/")) {
        return "image";
    }
    if (normalized?.startsWith("video/")) {
        return "video";
    }
    return "document";
}
function formatSavedMediaPlaceholder(allMedia) {
    if (allMedia.length === 0) {
        return undefined;
    }
    const kinds = allMedia.map((media)=>resolveSavedMediaKind(media.contentType));
    const firstKind = kinds[0] ?? "document";
    const kind = kinds.every((candidate)=>candidate === firstKind) ? firstKind : "document";
    if (allMedia.length === 1) {
        return `<media:${kind}>`;
    }
    if (kind === "image") {
        return `<media:image> (${allMedia.length} images)`;
    }
    if (kind === "video") {
        return `<media:video> (${allMedia.length} videos)`;
    }
    if (kind === "audio") {
        return `<media:audio> (${allMedia.length} audio attachments)`;
    }
    return `<media:document> (${allMedia.length} attachments)`;
}
async function resolveStickerVisionSupport(params) {
    try {
        const { resolveStickerVisionSupportRuntime } = await loadStickerVisionRuntime();
        return await resolveStickerVisionSupportRuntime(params);
    } catch  {
        return false;
    }
}
async function resolveTelegramInboundBody(params) {
    const { cfg, primaryCtx, msg, allMedia, isGroup, chatId, accountId, senderId, senderUsername, sessionKey, resolvedThreadId, replyThreadId, originatingTo: providedOriginatingTo, routeAgentId, effectiveGroupAllow, effectiveDmAllow, groupConfig, topicConfig, providerMentionPatterns, requireMention, options, groupHistories, historyLimit, logger } = params;
    const botUsername = (0, _stringcoerceruntime.normalizeOptionalLowercaseString)(primaryCtx.me?.username);
    const mentionRegexes = (0, _channelinbound.buildMentionRegexes)(cfg, routeAgentId, {
        provider: "telegram",
        conversationId: isGroup ? (0, _helpers.buildTelegramGroupPeerId)(chatId, resolvedThreadId) : String(chatId),
        providerPolicy: providerMentionPatterns
    });
    const messageTextParts = (0, _bodyhelpers.getTelegramTextParts)(msg);
    const allowForCommands = isGroup ? effectiveGroupAllow : effectiveDmAllow;
    const useAccessGroups = cfg.commands?.useAccessGroups !== false;
    const hasControlCommandInMessage = (0, _commanddetection.hasControlCommand)(messageTextParts.text, cfg, {
        botUsername
    });
    const commandGate = await (0, _ingress.resolveTelegramCommandIngressAuthorization)({
        accountId: accountId ?? "default",
        cfg,
        dmPolicy: "pairing",
        isGroup,
        chatId,
        resolvedThreadId,
        senderId,
        effectiveDmAllow,
        effectiveGroupAllow,
        ownerAccess: {
            ownerList: [],
            senderIsOwner: false
        },
        eventKind: "message",
        allowTextCommands: true,
        hasControlCommand: hasControlCommandInMessage,
        modeWhenAccessGroupsOff: "allow",
        includeDmAllowForGroupCommands: false
    });
    const commandAuthorized = commandGate.authorized;
    const historyKey = isGroup ? (0, _helpers.buildTelegramGroupPeerId)(chatId, resolvedThreadId) : undefined;
    const originatingTo = providedOriginatingTo ?? (0, _helpers.buildTelegramInboundOriginTarget)(chatId);
    const primaryMedia = (0, _bodyhelpers.resolveTelegramPrimaryMedia)(msg);
    let placeholder = primaryMedia?.placeholder ?? "";
    const cachedStickerDescription = allMedia[0]?.stickerMetadata?.cachedDescription;
    const stickerSupportsVision = msg.sticker ? await resolveStickerVisionSupport({
        cfg,
        agentId: routeAgentId
    }) : false;
    const stickerCacheHit = Boolean(cachedStickerDescription) && !stickerSupportsVision;
    if (stickerCacheHit) {
        const emoji = allMedia[0]?.stickerMetadata?.emoji;
        const setName = allMedia[0]?.stickerMetadata?.setName;
        const stickerContext = [
            emoji,
            setName ? `from "${setName}"` : null
        ].filter(Boolean).join(" ");
        placeholder = `[Sticker${stickerContext ? ` ${stickerContext}` : ""}] ${cachedStickerDescription}`;
    }
    const locationData = (0, _bodyhelpers.extractTelegramLocation)(msg);
    const locationText = locationData ? (0, _channelinbound.formatLocationText)(locationData) : undefined;
    const rawText = (0, _bodyhelpers.renderTelegramTextEntities)(messageTextParts.text, messageTextParts.entities).trim();
    const hasUserText = Boolean(rawText || locationText);
    let rawBody = [
        rawText,
        locationText
    ].filter(Boolean).join("\n").trim();
    if (!rawBody) {
        rawBody = placeholder;
    }
    if (!rawBody && allMedia.length === 0) {
        return null;
    }
    let bodyText = rawBody;
    if (allMedia.length === 0 && placeholder && rawBody !== placeholder) {
        const mediaTag = primaryMedia?.fileRef.file_id ? `${placeholder} [file_id:${primaryMedia.fileRef.file_id}]` : placeholder;
        bodyText = `${mediaTag}\n${bodyText}`.trim();
    }
    const hasAudio = allMedia.some((media)=>media.contentType?.startsWith("audio/"));
    const disableAudioPreflight = (topicConfig?.disableAudioPreflight ?? groupConfig?.disableAudioPreflight) === true;
    const senderAllowedForAudioPreflight = !useAccessGroups || !allowForCommands.hasEntries || commandAuthorized;
    let preflightTranscript;
    const needsPreflightTranscription = hasAudio && !hasUserText && (!isGroup || requireMention && mentionRegexes.length > 0 && !disableAudioPreflight && senderAllowedForAudioPreflight);
    if (needsPreflightTranscription) {
        try {
            const { transcribeFirstAudio } = await loadMediaUnderstandingRuntime();
            const tempCtx = {
                Provider: "telegram",
                Surface: "telegram",
                OriginatingChannel: "telegram",
                OriginatingTo: originatingTo,
                AccountId: accountId,
                MessageThreadId: replyThreadId,
                MediaPaths: allMedia.length > 0 ? allMedia.map((m)=>m.path) : undefined,
                MediaTypes: allMedia.length > 0 ? allMedia.map((m)=>m.contentType).filter(Boolean) : undefined
            };
            preflightTranscript = await transcribeFirstAudio({
                ctx: tempCtx,
                cfg,
                agentDir: undefined
            });
        } catch (err) {
            (0, _runtimeenv.logVerbose)(`telegram: audio preflight transcription failed: ${String(err)}`);
        }
    }
    const audioTranscribedMediaIndex = preflightTranscript === undefined ? undefined : allMedia.findIndex((media)=>media.contentType?.startsWith("audio/"));
    if (hasAudio && bodyText === "<media:audio>" && preflightTranscript) {
        bodyText = formatAudioTranscriptForAgent(preflightTranscript);
    }
    const savedMediaPlaceholder = formatSavedMediaPlaceholder(allMedia);
    if (!hasAudio && savedMediaPlaceholder && placeholder && bodyText === placeholder) {
        bodyText = savedMediaPlaceholder;
    }
    if (!bodyText && allMedia.length > 0) {
        if (hasAudio) {
            bodyText = preflightTranscript ? formatAudioTranscriptForAgent(preflightTranscript) : "<media:audio>";
        } else {
            bodyText = savedMediaPlaceholder ?? "<media:document>";
        }
    }
    const hasAnyMention = messageTextParts.entities.some((ent)=>ent.type === "mention");
    const explicitlyMentioned = botUsername ? (0, _bodyhelpers.hasBotMention)(msg, botUsername) : false;
    const computedWasMentioned = (0, _channelinbound.matchesMentionWithExplicit)({
        text: messageTextParts.text,
        mentionRegexes,
        explicit: {
            hasAnyMention,
            isExplicitlyMentioned: explicitlyMentioned,
            canResolveExplicit: Boolean(botUsername)
        },
        transcript: preflightTranscript
    });
    const wasMentioned = options?.forceWasMentioned === true ? true : computedWasMentioned;
    if (isGroup && commandGate.shouldBlockControlCommand) {
        (0, _channelinbound.logInboundDrop)({
            log: _runtimeenv.logVerbose,
            channel: "telegram",
            reason: "control command (unauthorized)",
            target: senderId ?? "unknown"
        });
        return null;
    }
    const botId = primaryCtx.me?.id;
    const replyFromId = msg.reply_to_message?.from?.id;
    const replyToBotMessage = botId != null && replyFromId === botId;
    const isReplyToServiceMessage = replyToBotMessage && (0, _forumservicemessage.isTelegramForumServiceMessage)(msg.reply_to_message);
    const implicitMentionKinds = (0, _channelinbound.implicitMentionKindWhen)("reply_to_bot", replyToBotMessage && !isReplyToServiceMessage);
    const canDetectMention = Boolean(botUsername) || mentionRegexes.length > 0;
    const mentionDecision = (0, _channelinbound.resolveInboundMentionDecision)({
        facts: {
            canDetectMention,
            wasMentioned,
            hasAnyMention,
            implicitMentionKinds: isGroup ? implicitMentionKinds : []
        },
        policy: {
            isGroup,
            requireMention: Boolean(requireMention),
            allowTextCommands: true,
            hasControlCommand: hasControlCommandInMessage,
            commandAuthorized
        }
    });
    const effectiveWasMentioned = mentionDecision.effectiveWasMentioned;
    if (isGroup && requireMention && canDetectMention && mentionDecision.shouldSkip) {
        logger.info({
            chatId,
            reason: "no-mention"
        }, "skipping group message");
        (0, _replyhistory.createChannelHistoryWindow)({
            historyMap: groupHistories
        }).record({
            historyKey: historyKey ?? "",
            limit: historyLimit,
            entry: historyKey ? {
                sender: (0, _bodyhelpers.buildSenderLabel)(msg, senderId || chatId),
                body: rawBody,
                timestamp: msg.date ? msg.date * 1000 : undefined,
                messageId: typeof msg.message_id === "number" ? String(msg.message_id) : undefined
            } : null
        });
        const telegramGroupPolicy = (0, _channelpolicy.resolveChannelGroupPolicy)({
            cfg,
            channel: "telegram",
            groupId: String(chatId),
            accountId
        });
        const ingestEnabled = topicConfig?.ingest ?? telegramGroupPolicy.groupConfig?.ingest ?? telegramGroupPolicy.defaultConfig?.ingest;
        if (ingestEnabled === true && sessionKey) {
            (0, _hookruntime.fireAndForgetHook)((0, _hookruntime.triggerInternalHook)((0, _hookruntime.createInternalHookEvent)("message", "received", sessionKey, (0, _hookruntime.toInternalMessageReceivedContext)({
                from: `telegram:group:${historyKey ?? chatId}`,
                to: originatingTo,
                content: rawBody,
                timestamp: msg.date ? msg.date * 1000 : undefined,
                channelId: "telegram",
                accountId,
                conversationId: originatingTo,
                messageId: typeof msg.message_id === "number" ? String(msg.message_id) : undefined,
                senderId: senderId || undefined,
                senderName: (0, _bodyhelpers.buildSenderName)(msg),
                senderUsername: senderUsername || undefined,
                provider: "telegram",
                surface: "telegram",
                threadId: resolvedThreadId,
                originatingChannel: "telegram",
                originatingTo,
                isGroup: true,
                groupId: `telegram:${chatId}`
            }))), "telegram: mention-skip message hook failed");
        }
        return null;
    }
    return {
        bodyText,
        rawBody,
        historyKey,
        commandAuthorized,
        effectiveWasMentioned,
        canDetectMention,
        shouldBypassMention: mentionDecision.shouldBypassMention,
        hasControlCommand: hasControlCommandInMessage,
        ...audioTranscribedMediaIndex !== undefined && audioTranscribedMediaIndex >= 0 ? {
            audioTranscribedMediaIndex
        } : {},
        stickerCacheHit,
        locationData: locationData ?? undefined
    };
}

//# sourceMappingURL=bot-message-context.body.js.map