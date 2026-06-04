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
    get handleTelegramAction () {
        return handleTelegramAction;
    },
    get telegramActionRuntime () {
        return telegramActionRuntime;
    }
});
const _booleanparam = require("../../../../common/openclaw/plugin-sdk/boolean-param");
const _channelactions = require("../../../../common/openclaw/plugin-sdk/channel-actions");
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _interactiveruntime = require("../../../../common/openclaw/plugin-sdk/interactive-runtime");
const _sessionstoreruntime = require("../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _accounts = require("./accounts.js");
const _buttontypes = require("./button-types.js");
const _inboundeventdelivery = require("./inbound-event-delivery.js");
const _inlinebuttons = require("./inline-buttons.js");
const _interactivefallback = require("./interactive-fallback.js");
const _pollvisibility = require("./poll-visibility.js");
const _reactionlevel = require("./reaction-level.js");
const _send = require("./send.js");
const _stickercache = require("./sticker-cache.js");
const _targets = require("./targets.js");
const _token = require("./token.js");
const _topicnamecache = require("./topic-name-cache.js");
const telegramActionRuntime = {
    createForumTopicTelegram: _send.createForumTopicTelegram,
    deleteMessageTelegram: _send.deleteMessageTelegram,
    editForumTopicTelegram: _send.editForumTopicTelegram,
    editMessageReplyMarkupTelegram: _send.editMessageReplyMarkupTelegram,
    editMessageTelegram: _send.editMessageTelegram,
    getCacheStats: _stickercache.getCacheStats,
    pinMessageTelegram: _send.pinMessageTelegram,
    reactMessageTelegram: _send.reactMessageTelegram,
    searchStickers: _stickercache.searchStickers,
    sendDurableMessageBatch: _channeloutbound.sendDurableMessageBatch,
    sendMessageTelegram: _send.sendMessageTelegram,
    sendPollTelegram: _send.sendPollTelegram,
    sendStickerTelegram: _send.sendStickerTelegram
};
const TELEGRAM_FORUM_TOPIC_ICON_COLORS = [
    0x6fb9f0,
    0xffd67e,
    0xcb86db,
    0x8eee98,
    0xff93b2,
    0xfb6f5f
];
const TELEGRAM_ACTION_ALIASES = {
    createForumTopic: "createForumTopic",
    delete: "deleteMessage",
    deleteMessage: "deleteMessage",
    edit: "editMessage",
    editForumTopic: "editForumTopic",
    editMessage: "editMessage",
    poll: "poll",
    react: "react",
    searchSticker: "searchSticker",
    send: "sendMessage",
    sendMessage: "sendMessage",
    sendSticker: "sendSticker",
    sticker: "sendSticker",
    stickerCacheStats: "stickerCacheStats",
    "sticker-search": "searchSticker",
    "topic-create": "createForumTopic",
    "topic-edit": "editForumTopic"
};
function readTelegramForumTopicIconColor(params) {
    const iconColor = (0, _channelactions.readPositiveIntegerParam)(params, "iconColor", {
        message: "iconColor must be one of Telegram's supported forum topic colors."
    });
    if (iconColor == null) {
        return undefined;
    }
    if (!TELEGRAM_FORUM_TOPIC_ICON_COLORS.includes(iconColor)) {
        throw new Error("iconColor must be one of Telegram's supported forum topic colors.");
    }
    return iconColor;
}
function normalizeTelegramActionName(action) {
    const normalized = TELEGRAM_ACTION_ALIASES[action];
    if (!normalized) {
        throw new Error(`Unsupported Telegram action: ${action}`);
    }
    return normalized;
}
function readTelegramChatId(params) {
    return (0, _channelactions.readStringOrNumberParam)(params, "chatId") ?? (0, _channelactions.readStringOrNumberParam)(params, "channelId") ?? (0, _channelactions.readStringOrNumberParam)(params, "to", {
        required: true
    });
}
function readTelegramThreadId(params) {
    return (0, _channelactions.readPositiveIntegerParam)(params, "messageThreadId", {
        message: "messageThreadId must be a positive integer."
    }) ?? (0, _channelactions.readPositiveIntegerParam)(params, "threadId", {
        message: "threadId must be a positive integer."
    });
}
function resolveActionTopicNameCacheScope(cfg, accountId) {
    const storePath = (0, _sessionstoreruntime.resolveStorePath)(cfg.session?.store, {
        agentId: accountId ?? (0, _accounts.resolveDefaultTelegramAccountId)(cfg)
    });
    return (0, _topicnamecache.resolveTopicNameCacheScope)(storePath);
}
function formatTelegramDeliveryTarget(to, messageThreadId) {
    const parsed = (0, _targets.parseTelegramTarget)(to);
    const topicId = parsed.messageThreadId ?? messageThreadId;
    if (topicId == null) {
        return to;
    }
    return `${parsed.chatId}:topic:${topicId}`;
}
function readTelegramReplyToMessageId(params) {
    return (0, _channelactions.readPositiveIntegerParam)(params, "replyToMessageId", {
        message: "replyToMessageId must be a positive integer."
    }) ?? (0, _channelactions.readPositiveIntegerParam)(params, "replyTo", {
        message: "replyTo must be a positive integer."
    });
}
function pushTelegramMediaUrl(mediaUrls, seen, value) {
    if (typeof value !== "string") {
        return;
    }
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) {
        return;
    }
    seen.add(normalized);
    mediaUrls.push(normalized);
}
function readTelegramSendMediaUrls(params) {
    const mediaUrls = [];
    const seen = new Set();
    pushTelegramMediaUrl(mediaUrls, seen, params.mediaUrl);
    pushTelegramMediaUrl(mediaUrls, seen, params.media);
    pushTelegramMediaUrl(mediaUrls, seen, params.path);
    pushTelegramMediaUrl(mediaUrls, seen, params.filePath);
    pushTelegramMediaUrl(mediaUrls, seen, params.fileUrl);
    if (Array.isArray(params.mediaUrls)) {
        for (const mediaUrl of params.mediaUrls){
            pushTelegramMediaUrl(mediaUrls, seen, mediaUrl);
        }
    }
    if (Array.isArray(params.attachments)) {
        for (const attachment of params.attachments){
            if (!attachment || typeof attachment !== "object" || Array.isArray(attachment)) {
                continue;
            }
            const record = attachment;
            pushTelegramMediaUrl(mediaUrls, seen, record.media);
            pushTelegramMediaUrl(mediaUrls, seen, record.mediaUrl);
            pushTelegramMediaUrl(mediaUrls, seen, record.path);
            pushTelegramMediaUrl(mediaUrls, seen, record.filePath);
            pushTelegramMediaUrl(mediaUrls, seen, record.fileUrl);
            pushTelegramMediaUrl(mediaUrls, seen, record.url);
        }
    }
    return mediaUrls;
}
function resolveTelegramButtonsFromParams(params, presentation = (0, _interactiveruntime.normalizeMessagePresentation)(params.presentation)) {
    return (0, _buttontypes.resolveTelegramInlineButtons)({
        presentation,
        interactive: params.interactive
    });
}
function readTelegramSendContent(params) {
    const explicitContent = (0, _channelactions.readStringParam)(params.args, "content", {
        allowEmpty: true
    }) ?? (0, _channelactions.readStringParam)(params.args, "message", {
        allowEmpty: true
    }) ?? (0, _channelactions.readStringParam)(params.args, "caption", {
        allowEmpty: true
    });
    const presentationText = explicitContent == null && params.presentation ? (0, _interactiveruntime.renderMessagePresentationFallbackText)({
        presentation: params.presentation
    }) : undefined;
    const interactiveText = explicitContent == null && !params.presentation ? (0, _interactivefallback.resolveTelegramInteractiveTextFallback)({
        interactive: params.interactive
    }) : undefined;
    let content = explicitContent ?? (presentationText?.trim() ? presentationText : undefined) ?? (interactiveText?.trim() ? interactiveText : undefined);
    if ((content == null || content.trim().length === 0) && !params.mediaUrl && params.hasButtons) {
        const fallback = presentationText?.trim() ? presentationText : interactiveText;
        if (fallback?.trim()) {
            content = fallback;
        }
    }
    if (content == null && !params.mediaUrl && !params.hasButtons) {
        throw new Error("content required.");
    }
    return content ?? "";
}
function normalizeTelegramDeliveryPin(params) {
    const delivery = params.delivery;
    const pin = delivery && typeof delivery === "object" && !Array.isArray(delivery) ? delivery.pin : params.pin === true ? true : undefined;
    if (pin === true) {
        return {
            enabled: true
        };
    }
    if (!pin || typeof pin !== "object" || Array.isArray(pin)) {
        return undefined;
    }
    const raw = pin;
    if (raw.enabled !== true) {
        return undefined;
    }
    return {
        enabled: true,
        ...raw.notify === true ? {
            notify: true
        } : {},
        ...raw.required === true ? {
            required: true
        } : {}
    };
}
function buildTelegramActionSendPayload(params) {
    const telegramData = params.buttons || params.quoteText ? {
        ...params.buttons ? {
            buttons: params.buttons
        } : {},
        ...params.quoteText ? {
            quoteText: params.quoteText
        } : {}
    } : undefined;
    return {
        text: params.content,
        ...params.mediaUrls.length > 0 ? {
            mediaUrls: params.mediaUrls
        } : {},
        ...params.asVoice === true ? {
            audioAsVoice: true
        } : {},
        ...params.pin ? {
            delivery: {
                pin: params.pin
            }
        } : {},
        ...telegramData ? {
            channelData: {
                telegram: telegramData
            }
        } : {}
    };
}
function getLastDurableTelegramActionResult(result) {
    const lastResult = result.results.at(-1);
    const receipt = result.receipt;
    return {
        messageId: lastResult?.messageId ?? receipt.primaryPlatformMessageId ?? receipt.platformMessageIds.at(-1),
        chatId: lastResult?.chatId
    };
}
async function handleTelegramAction(params, cfg, options) {
    const { action, accountId } = {
        action: normalizeTelegramActionName((0, _channelactions.readStringParam)(params, "action", {
            required: true
        })),
        accountId: (0, _channelactions.readStringParam)(params, "accountId")
    };
    const isActionEnabled = (0, _accounts.createTelegramActionGate)({
        cfg,
        accountId
    });
    const notifyVisibleOutboundSuccess = (to, messageThreadId)=>{
        (0, _inboundeventdelivery.notifyTelegramInboundEventOutboundSuccess)({
            sessionKey: options?.sessionKey ?? undefined,
            to: formatTelegramDeliveryTarget(to, messageThreadId),
            accountId,
            inboundEventKind: options?.inboundEventKind
        });
    };
    if (action === "react") {
        // All react failures return soft results (jsonResult with ok:false) instead
        // of throwing, because hard tool errors can trigger model re-generation
        // loops and duplicate content.
        const reactionLevelInfo = (0, _reactionlevel.resolveTelegramReactionLevel)({
            cfg,
            accountId: accountId ?? undefined
        });
        if (!reactionLevelInfo.agentReactionsEnabled) {
            return (0, _channelactions.jsonResult)({
                ok: false,
                reason: "disabled",
                hint: `Telegram agent reactions disabled (reactionLevel="${reactionLevelInfo.level}"). Do not retry.`
            });
        }
        if (!isActionEnabled("reactions")) {
            return (0, _channelactions.jsonResult)({
                ok: false,
                reason: "disabled",
                hint: "Telegram reactions are disabled via actions.reactions. Do not retry."
            });
        }
        const chatId = readTelegramChatId(params);
        let explicitMessageId;
        try {
            explicitMessageId = (0, _channelactions.readPositiveIntegerParam)(params, "messageId", {
                message: "messageId must be a positive integer."
            });
        } catch  {
            return (0, _channelactions.jsonResult)({
                ok: false,
                reason: "missing_message_id",
                hint: "Telegram reaction requires a valid messageId (or inbound context fallback). Do not retry."
            });
        }
        const messageId = explicitMessageId ?? (0, _channelactions.resolveReactionMessageId)({
            args: params
        });
        if (typeof messageId !== "number" || !Number.isFinite(messageId) || messageId <= 0) {
            return (0, _channelactions.jsonResult)({
                ok: false,
                reason: "missing_message_id",
                hint: "Telegram reaction requires a valid messageId (or inbound context fallback). Do not retry."
            });
        }
        const { emoji, remove, isEmpty } = (0, _channelactions.readReactionParams)(params, {
            removeErrorMessage: "Emoji is required to remove a Telegram reaction."
        });
        const token = (0, _token.resolveTelegramToken)(cfg, {
            accountId
        }).token;
        if (!token) {
            return (0, _channelactions.jsonResult)({
                ok: false,
                reason: "missing_token",
                hint: "Telegram bot token missing. Do not retry."
            });
        }
        let reactionResult;
        try {
            reactionResult = await telegramActionRuntime.reactMessageTelegram(chatId ?? "", messageId ?? 0, emoji ?? "", {
                cfg,
                token,
                remove,
                accountId: accountId ?? undefined,
                gatewayClientScopes: options?.gatewayClientScopes
            });
        } catch (err) {
            const isInvalid = String(err).includes("REACTION_INVALID");
            return (0, _channelactions.jsonResult)({
                ok: false,
                reason: isInvalid ? "REACTION_INVALID" : "error",
                emoji,
                hint: isInvalid ? "This emoji is not supported for Telegram reactions. Add it to your reaction disallow list so you do not try it again." : "Reaction failed. Do not retry."
            });
        }
        if (!reactionResult.ok) {
            return (0, _channelactions.jsonResult)({
                ok: false,
                warning: reactionResult.warning,
                ...remove || isEmpty ? {
                    removed: true
                } : {
                    added: emoji
                }
            });
        }
        if (!remove && !isEmpty) {
            return (0, _channelactions.jsonResult)({
                ok: true,
                added: emoji
            });
        }
        return (0, _channelactions.jsonResult)({
            ok: true,
            removed: true
        });
    }
    if (action === "sendMessage") {
        if (!isActionEnabled("sendMessage")) {
            throw new Error("Telegram sendMessage is disabled.");
        }
        const to = (0, _targets.normalizeTelegramOutboundTarget)((0, _channelactions.readStringParam)(params, "to", {
            required: true
        }));
        const mediaUrls = readTelegramSendMediaUrls(params);
        const firstMediaUrl = mediaUrls[0];
        const presentation = (0, _interactiveruntime.normalizeMessagePresentation)(params.presentation);
        const buttons = resolveTelegramButtonsFromParams(params, presentation);
        const content = readTelegramSendContent({
            args: params,
            mediaUrl: firstMediaUrl,
            hasButtons: Array.isArray(buttons) && buttons.length > 0,
            interactive: params.interactive,
            presentation
        });
        if (buttons) {
            const inlineButtonsScope = (0, _inlinebuttons.resolveTelegramInlineButtonsScope)({
                cfg,
                accountId: accountId ?? undefined
            });
            if (inlineButtonsScope === "off") {
                throw new Error('Telegram inline buttons are disabled. Set channels.telegram.capabilities.inlineButtons to "dm", "group", "all", or "allowlist".');
            }
            if (inlineButtonsScope === "dm" || inlineButtonsScope === "group") {
                const targetType = (0, _inlinebuttons.resolveTelegramTargetChatType)(to);
                if (targetType === "unknown") {
                    throw new Error(`Telegram inline buttons require a numeric chat id when inlineButtons="${inlineButtonsScope}".`);
                }
                if (inlineButtonsScope === "dm" && targetType !== "direct") {
                    throw new Error('Telegram inline buttons are limited to DMs when inlineButtons="dm".');
                }
                if (inlineButtonsScope === "group" && targetType !== "group") {
                    throw new Error('Telegram inline buttons are limited to groups when inlineButtons="group".');
                }
            }
        }
        // Optional threading parameters for forum topics and reply chains
        const replyToMessageId = readTelegramReplyToMessageId(params);
        const messageThreadId = readTelegramThreadId(params);
        const quoteText = (0, _channelactions.readStringParam)(params, "quoteText");
        const token = (0, _token.resolveTelegramToken)(cfg, {
            accountId
        }).token;
        if (!token) {
            throw new Error("Telegram bot token missing. Set TELEGRAM_BOT_TOKEN or channels.telegram.botToken.");
        }
        const sendOptions = {
            cfg,
            accountId: accountId ?? undefined,
            gatewayClientScopes: options?.gatewayClientScopes,
            replyToMessageId: replyToMessageId ?? undefined,
            messageThreadId: messageThreadId ?? undefined,
            quoteText: quoteText ?? undefined,
            asVoice: (0, _booleanparam.readBooleanParam)(params, "asVoice"),
            silent: (0, _booleanparam.readBooleanParam)(params, "silent"),
            forceDocument: (0, _booleanparam.readBooleanParam)(params, "forceDocument") ?? (0, _booleanparam.readBooleanParam)(params, "asDocument") ?? false
        };
        const payload = buildTelegramActionSendPayload({
            content,
            mediaUrls,
            asVoice: sendOptions.asVoice,
            pin: normalizeTelegramDeliveryPin(params),
            buttons,
            quoteText
        });
        const mediaAccess = options?.mediaLocalRoots || options?.mediaReadFile ? {
            ...options.mediaLocalRoots ? {
                localRoots: options.mediaLocalRoots
            } : {},
            ...options.mediaReadFile ? {
                readFile: options.mediaReadFile
            } : {}
        } : undefined;
        const outboundSession = (0, _channeloutbound.buildOutboundSessionContext)({
            cfg,
            sessionKey: options?.sessionKey,
            requesterAccountId: accountId
        });
        const durableResult = await telegramActionRuntime.sendDurableMessageBatch({
            cfg,
            channel: "telegram",
            to,
            accountId: accountId ?? undefined,
            payloads: [
                payload
            ],
            replyToId: replyToMessageId == null ? undefined : String(replyToMessageId),
            threadId: messageThreadId,
            forceDocument: sendOptions.forceDocument,
            silent: sendOptions.silent,
            durability: "required",
            gatewayClientScopes: options?.gatewayClientScopes,
            ...mediaAccess ? {
                mediaAccess
            } : {},
            ...outboundSession ? {
                session: outboundSession
            } : {}
        });
        if (durableResult.status === "failed" || durableResult.status === "partial_failed") {
            throw durableResult.error;
        }
        if (durableResult.status === "suppressed") {
            throw new Error("Telegram sendMessage was suppressed before delivery.");
        }
        const result = getLastDurableTelegramActionResult(durableResult);
        notifyVisibleOutboundSuccess(to, messageThreadId);
        return (0, _channelactions.jsonResult)({
            ok: true,
            messageId: result.messageId,
            chatId: result.chatId
        });
    }
    if (action === "poll") {
        const pollActionState = (0, _accounts.resolveTelegramPollActionGateState)(isActionEnabled);
        if (!pollActionState.sendMessageEnabled) {
            throw new Error("Telegram sendMessage is disabled.");
        }
        if (!pollActionState.pollEnabled) {
            throw new Error("Telegram polls are disabled.");
        }
        const to = (0, _channelactions.readStringParam)(params, "to", {
            required: true
        });
        const question = (0, _channelactions.readStringParam)(params, "question") ?? (0, _channelactions.readStringParam)(params, "pollQuestion", {
            required: true
        });
        const answers = (0, _channelactions.readStringArrayParam)(params, "answers") ?? (0, _channelactions.readStringArrayParam)(params, "pollOption", {
            required: true
        });
        const allowMultiselect = (0, _booleanparam.readBooleanParam)(params, "allowMultiselect") ?? (0, _booleanparam.readBooleanParam)(params, "pollMulti");
        const durationSeconds = (0, _channelactions.readPositiveIntegerParam)(params, "durationSeconds", {
            message: "durationSeconds must be a positive integer."
        }) ?? (0, _channelactions.readPositiveIntegerParam)(params, "pollDurationSeconds", {
            message: "pollDurationSeconds must be a positive integer."
        });
        const durationHours = (0, _channelactions.readPositiveIntegerParam)(params, "durationHours", {
            message: "durationHours must be a positive integer."
        }) ?? (0, _channelactions.readPositiveIntegerParam)(params, "pollDurationHours", {
            message: "pollDurationHours must be a positive integer."
        });
        const replyToMessageId = readTelegramReplyToMessageId(params);
        const messageThreadId = readTelegramThreadId(params);
        const isAnonymous = (0, _booleanparam.readBooleanParam)(params, "isAnonymous") ?? (0, _pollvisibility.resolveTelegramPollVisibility)({
            pollAnonymous: (0, _booleanparam.readBooleanParam)(params, "pollAnonymous"),
            pollPublic: (0, _booleanparam.readBooleanParam)(params, "pollPublic")
        });
        const silent = (0, _booleanparam.readBooleanParam)(params, "silent");
        const token = (0, _token.resolveTelegramToken)(cfg, {
            accountId
        }).token;
        if (!token) {
            throw new Error("Telegram bot token missing. Set TELEGRAM_BOT_TOKEN or channels.telegram.botToken.");
        }
        const result = await telegramActionRuntime.sendPollTelegram(to, {
            question,
            options: answers,
            maxSelections: (0, _channelactions.resolvePollMaxSelections)(answers.length, allowMultiselect ?? false),
            durationSeconds: durationSeconds ?? undefined,
            durationHours: durationHours ?? undefined
        }, {
            cfg,
            token,
            accountId: accountId ?? undefined,
            replyToMessageId: replyToMessageId ?? undefined,
            messageThreadId: messageThreadId ?? undefined,
            isAnonymous: isAnonymous ?? undefined,
            silent: silent ?? undefined,
            gatewayClientScopes: options?.gatewayClientScopes
        });
        notifyVisibleOutboundSuccess(to, messageThreadId);
        return (0, _channelactions.jsonResult)({
            ok: true,
            messageId: result.messageId,
            chatId: result.chatId,
            pollId: result.pollId
        });
    }
    if (action === "deleteMessage") {
        if (!isActionEnabled("deleteMessage")) {
            throw new Error("Telegram deleteMessage is disabled.");
        }
        const chatId = readTelegramChatId(params);
        const messageId = (0, _channelactions.readPositiveIntegerParam)(params, "messageId", {
            message: "messageId must be a positive integer."
        });
        if (messageId === undefined) {
            throw new Error("messageId required");
        }
        const token = (0, _token.resolveTelegramToken)(cfg, {
            accountId
        }).token;
        if (!token) {
            throw new Error("Telegram bot token missing. Set TELEGRAM_BOT_TOKEN or channels.telegram.botToken.");
        }
        const result = await telegramActionRuntime.deleteMessageTelegram(chatId ?? "", messageId ?? 0, {
            cfg,
            token,
            accountId: accountId ?? undefined,
            gatewayClientScopes: options?.gatewayClientScopes
        });
        if (!result.ok) {
            return (0, _channelactions.jsonResult)({
                ok: false,
                deleted: false,
                warning: result.warning
            });
        }
        return (0, _channelactions.jsonResult)({
            ok: true,
            deleted: true
        });
    }
    if (action === "editMessage") {
        if (!isActionEnabled("editMessage")) {
            throw new Error("Telegram editMessage is disabled.");
        }
        const chatId = readTelegramChatId(params);
        const messageId = (0, _channelactions.readPositiveIntegerParam)(params, "messageId", {
            message: "messageId must be a positive integer."
        });
        if (messageId === undefined) {
            throw new Error("messageId required");
        }
        const content = (0, _channelactions.readStringParam)(params, "content", {
            allowEmpty: false
        }) ?? (0, _channelactions.readStringParam)(params, "message", {
            allowEmpty: false
        });
        const caption = (0, _channelactions.readStringParam)(params, "caption", {
            allowEmpty: false
        });
        const buttons = resolveTelegramButtonsFromParams(params);
        if (content == null && caption == null && buttons === undefined) {
            throw new Error("content required.");
        }
        if (buttons !== undefined) {
            const inlineButtonsScope = (0, _inlinebuttons.resolveTelegramInlineButtonsScope)({
                cfg,
                accountId: accountId ?? undefined
            });
            if (inlineButtonsScope === "off") {
                throw new Error('Telegram inline buttons are disabled. Set channels.telegram.capabilities.inlineButtons to "dm", "group", "all", or "allowlist".');
            }
        }
        const token = (0, _token.resolveTelegramToken)(cfg, {
            accountId
        }).token;
        if (!token) {
            throw new Error("Telegram bot token missing. Set TELEGRAM_BOT_TOKEN or channels.telegram.botToken.");
        }
        if (content == null && caption == null && buttons !== undefined) {
            const result = await telegramActionRuntime.editMessageReplyMarkupTelegram(chatId ?? "", messageId ?? 0, buttons, {
                cfg,
                token,
                accountId: accountId ?? undefined,
                gatewayClientScopes: options?.gatewayClientScopes
            });
            return (0, _channelactions.jsonResult)({
                ok: true,
                messageId: result.messageId,
                chatId: result.chatId
            });
        }
        const result = await telegramActionRuntime.editMessageTelegram(chatId ?? "", messageId ?? 0, caption ?? content ?? "", {
            cfg,
            token,
            accountId: accountId ?? undefined,
            buttons,
            editMode: caption != null ? "caption" : "auto",
            gatewayClientScopes: options?.gatewayClientScopes
        });
        return (0, _channelactions.jsonResult)({
            ok: true,
            messageId: result.messageId,
            chatId: result.chatId
        });
    }
    if (action === "sendSticker") {
        if (!isActionEnabled("sticker", false)) {
            throw new Error("Telegram sticker actions are disabled. Set channels.telegram.actions.sticker to true.");
        }
        const to = (0, _channelactions.readStringParam)(params, "to") ?? (0, _channelactions.readStringParam)(params, "target", {
            required: true
        });
        const fileId = (0, _channelactions.readStringParam)(params, "fileId") ?? (0, _channelactions.readStringArrayParam)(params, "stickerId")?.[0];
        if (!fileId) {
            throw new Error("fileId is required.");
        }
        const replyToMessageId = readTelegramReplyToMessageId(params);
        const messageThreadId = readTelegramThreadId(params);
        const token = (0, _token.resolveTelegramToken)(cfg, {
            accountId
        }).token;
        if (!token) {
            throw new Error("Telegram bot token missing. Set TELEGRAM_BOT_TOKEN or channels.telegram.botToken.");
        }
        const result = await telegramActionRuntime.sendStickerTelegram(to, fileId, {
            cfg,
            token,
            accountId: accountId ?? undefined,
            replyToMessageId: replyToMessageId ?? undefined,
            messageThreadId: messageThreadId ?? undefined,
            gatewayClientScopes: options?.gatewayClientScopes
        });
        notifyVisibleOutboundSuccess(to, messageThreadId);
        return (0, _channelactions.jsonResult)({
            ok: true,
            messageId: result.messageId,
            chatId: result.chatId
        });
    }
    if (action === "searchSticker") {
        if (!isActionEnabled("sticker", false)) {
            throw new Error("Telegram sticker actions are disabled. Set channels.telegram.actions.sticker to true.");
        }
        const query = (0, _channelactions.readStringParam)(params, "query", {
            required: true
        });
        const limit = (0, _channelactions.readPositiveIntegerParam)(params, "limit", {
            message: "limit must be a positive integer."
        }) ?? 5;
        const results = telegramActionRuntime.searchStickers(query, limit);
        return (0, _channelactions.jsonResult)({
            ok: true,
            count: results.length,
            stickers: results.map((s)=>({
                    fileId: s.fileId,
                    emoji: s.emoji,
                    description: s.description,
                    setName: s.setName
                }))
        });
    }
    if (action === "stickerCacheStats") {
        const stats = telegramActionRuntime.getCacheStats();
        return (0, _channelactions.jsonResult)({
            ok: true,
            ...stats
        });
    }
    if (action === "createForumTopic") {
        if (!isActionEnabled("createForumTopic")) {
            throw new Error("Telegram createForumTopic is disabled.");
        }
        const chatId = readTelegramChatId(params);
        const name = (0, _channelactions.readStringParam)(params, "name", {
            required: true
        });
        const iconColor = readTelegramForumTopicIconColor(params);
        const iconCustomEmojiId = (0, _channelactions.readStringParam)(params, "iconCustomEmojiId");
        const token = (0, _token.resolveTelegramToken)(cfg, {
            accountId
        }).token;
        if (!token) {
            throw new Error("Telegram bot token missing. Set TELEGRAM_BOT_TOKEN or channels.telegram.botToken.");
        }
        const result = await telegramActionRuntime.createForumTopicTelegram(chatId ?? "", name, {
            cfg,
            token,
            accountId: accountId ?? undefined,
            iconColor,
            iconCustomEmojiId: iconCustomEmojiId ?? undefined,
            gatewayClientScopes: options?.gatewayClientScopes
        });
        if (result.topicId != null && result.chatId) {
            await (0, _topicnamecache.updateTopicName)(result.chatId, result.topicId, {
                name,
                ...iconColor != null ? {
                    iconColor
                } : {},
                ...iconCustomEmojiId ? {
                    iconCustomEmojiId
                } : {}
            }, resolveActionTopicNameCacheScope(cfg, accountId)).catch(()=>{});
        }
        return (0, _channelactions.jsonResult)({
            ok: true,
            topicId: result.topicId,
            name: result.name,
            chatId: result.chatId
        });
    }
    if (action === "editForumTopic") {
        if (!isActionEnabled("editForumTopic")) {
            throw new Error("Telegram editForumTopic is disabled.");
        }
        const chatId = readTelegramChatId(params);
        const messageThreadId = readTelegramThreadId(params);
        if (typeof messageThreadId !== "number") {
            throw new Error("messageThreadId or threadId is required.");
        }
        const name = (0, _channelactions.readStringParam)(params, "name");
        const iconCustomEmojiId = (0, _channelactions.readStringParam)(params, "iconCustomEmojiId");
        const token = (0, _token.resolveTelegramToken)(cfg, {
            accountId
        }).token;
        if (!token) {
            throw new Error("Telegram bot token missing. Set TELEGRAM_BOT_TOKEN or channels.telegram.botToken.");
        }
        const result = await telegramActionRuntime.editForumTopicTelegram(chatId ?? "", messageThreadId, {
            cfg,
            token,
            accountId: accountId ?? undefined,
            name: name ?? undefined,
            iconCustomEmojiId: iconCustomEmojiId ?? undefined,
            gatewayClientScopes: options?.gatewayClientScopes
        });
        if (result.chatId) {
            const patch = {};
            if (name) {
                patch.name = name;
            }
            if (iconCustomEmojiId) {
                patch.iconCustomEmojiId = iconCustomEmojiId;
            }
            if (Object.keys(patch).length > 0) {
                await (0, _topicnamecache.updateTopicName)(result.chatId, result.messageThreadId, patch, resolveActionTopicNameCacheScope(cfg, accountId)).catch(()=>{});
            }
        }
        return (0, _channelactions.jsonResult)(result);
    }
    throw new Error(`Unsupported Telegram action: ${String(action)}`);
}

//# sourceMappingURL=action-runtime.js.map