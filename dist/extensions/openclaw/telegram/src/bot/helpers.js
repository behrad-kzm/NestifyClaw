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
    get TelegramPairingStoreReadError () {
        return TelegramPairingStoreReadError;
    },
    get buildGroupLabel () {
        return buildGroupLabel;
    },
    get buildSenderLabel () {
        return _bodyhelpers.buildSenderLabel;
    },
    get buildSenderName () {
        return _bodyhelpers.buildSenderName;
    },
    get buildTelegramGroupFrom () {
        return buildTelegramGroupFrom;
    },
    get buildTelegramGroupPeerId () {
        return buildTelegramGroupPeerId;
    },
    get buildTelegramInboundOriginTarget () {
        return buildTelegramInboundOriginTarget;
    },
    get buildTelegramParentPeer () {
        return buildTelegramParentPeer;
    },
    get buildTelegramRoutingTarget () {
        return buildTelegramRoutingTarget;
    },
    get buildTelegramThreadParams () {
        return buildTelegramThreadParams;
    },
    get buildTypingThreadParams () {
        return buildTypingThreadParams;
    },
    get describeReplyTarget () {
        return describeReplyTarget;
    },
    get extractTelegramForumFlag () {
        return extractTelegramForumFlag;
    },
    get extractTelegramLocation () {
        return _bodyhelpers.extractTelegramLocation;
    },
    get getTelegramTextParts () {
        return _bodyhelpers.getTelegramTextParts;
    },
    get hasBotMention () {
        return _bodyhelpers.hasBotMention;
    },
    get isBinaryContent () {
        return _bodyhelpers.isBinaryContent;
    },
    get isTelegramCommandsAllowFromConfigured () {
        return isTelegramCommandsAllowFromConfigured;
    },
    get loadTelegramPairingStoreIfNeeded () {
        return loadTelegramPairingStoreIfNeeded;
    },
    get normalizeForwardedContext () {
        return _bodyhelpers.normalizeForwardedContext;
    },
    get renderTelegramTextEntities () {
        return _bodyhelpers.renderTelegramTextEntities;
    },
    get resetTelegramForumFlagCacheForTest () {
        return resetTelegramForumFlagCacheForTest;
    },
    get resolveTelegramBotHasTopicsEnabled () {
        return resolveTelegramBotHasTopicsEnabled;
    },
    get resolveTelegramCommandAuthorization () {
        return resolveTelegramCommandAuthorization;
    },
    get resolveTelegramDirectPeerId () {
        return resolveTelegramDirectPeerId;
    },
    get resolveTelegramForumFlag () {
        return resolveTelegramForumFlag;
    },
    get resolveTelegramForumThreadId () {
        return resolveTelegramForumThreadId;
    },
    get resolveTelegramGroupAllowFromContext () {
        return resolveTelegramGroupAllowFromContext;
    },
    get resolveTelegramMediaPlaceholder () {
        return _bodyhelpers.resolveTelegramMediaPlaceholder;
    },
    get resolveTelegramMessageForumFlagHint () {
        return resolveTelegramMessageForumFlagHint;
    },
    get resolveTelegramReplyId () {
        return resolveTelegramReplyId;
    },
    get resolveTelegramStreamMode () {
        return resolveTelegramStreamMode;
    },
    get resolveTelegramThreadSpec () {
        return resolveTelegramThreadSpec;
    },
    get shouldUseTelegramDmThreadSession () {
        return shouldUseTelegramDmThreadSession;
    },
    get withResolvedTelegramForumFlag () {
        return withResolvedTelegramForumFlag;
    }
});
const _channelinbound = require("../../../../../common/openclaw/plugin-sdk/channel-inbound");
const _commandauthnative = require("../../../../../common/openclaw/plugin-sdk/command-auth-native");
const _conversationruntime = require("../../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _numberruntime = require("../../../../../common/openclaw/plugin-sdk/number-runtime");
const _routing = require("../../../../../common/openclaw/plugin-sdk/routing");
const _stringcoerceruntime = require("../../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accessgroups = require("../access-groups.js");
const _botaccess = require("../bot-access.js");
const _outboundparams = require("../outbound-params.js");
const _previewstreaming = require("../preview-streaming.js");
const _bodyhelpers = require("./body-helpers.js");
const TELEGRAM_GENERAL_TOPIC_ID = 1;
const TELEGRAM_FORUM_FLAG_CACHE_MAX_CHATS = 1024;
const TELEGRAM_FORUM_FLAG_CACHE_TTL_MS = 10 * 60_000;
const telegramForumFlagByChatId = new Map();
function resetTelegramForumFlagCacheForTest() {
    telegramForumFlagByChatId.clear();
}
function cacheTelegramForumFlag(chatId, isForum, nowMs = Date.now()) {
    const cacheKey = String(chatId);
    const expiresAtMs = (0, _numberruntime.resolveExpiresAtMsFromDurationMs)(TELEGRAM_FORUM_FLAG_CACHE_TTL_MS, {
        nowMs
    });
    if (expiresAtMs === undefined) {
        telegramForumFlagByChatId.delete(cacheKey);
        return;
    }
    if (!telegramForumFlagByChatId.has(cacheKey) && telegramForumFlagByChatId.size >= TELEGRAM_FORUM_FLAG_CACHE_MAX_CHATS) {
        const oldestKey = telegramForumFlagByChatId.keys().next().value;
        if (oldestKey !== undefined) {
            telegramForumFlagByChatId.delete(oldestKey);
        }
    }
    telegramForumFlagByChatId.set(cacheKey, {
        expiresAtMs,
        isForum
    });
}
function hadUnsafeTelegramText(raw, sanitized) {
    return typeof raw === "string" && raw.trim().length > 0 && sanitized.trim().length === 0;
}
function shouldUseTelegramDmThreadSession(params) {
    return params.dmThreadId != null && params.botHasTopicsEnabled === true;
}
function resolveTelegramBotHasTopicsEnabled(me) {
    return me !== null && typeof me === "object" && "has_topics_enabled" in me && me.has_topics_enabled === true;
}
function extractTelegramForumFlag(value) {
    if (!value || typeof value !== "object" || !("is_forum" in value)) {
        return undefined;
    }
    const forum = value.is_forum;
    return typeof forum === "boolean" ? forum : undefined;
}
function resolveTelegramMessageForumFlagHint(params) {
    if (params.chatType === "supergroup" && params.isTopicMessage === true) {
        return true;
    }
    return typeof params.isForum === "boolean" ? params.isForum : undefined;
}
async function resolveTelegramForumFlag(params) {
    const forumHint = resolveTelegramMessageForumFlagHint({
        chatType: params.chatType,
        isForum: params.isForum,
        isTopicMessage: params.isTopicMessage
    });
    if (typeof forumHint === "boolean") {
        if (params.isGroup && params.chatType === "supergroup") {
            cacheTelegramForumFlag(params.chatId, forumHint);
        }
        return forumHint;
    }
    if (!params.isGroup || params.chatType !== "supergroup" || !params.getChat) {
        return false;
    }
    const cacheKey = String(params.chatId);
    const rawNowMs = Date.now();
    const nowMs = (0, _numberruntime.asDateTimestampMs)(rawNowMs);
    const cached = telegramForumFlagByChatId.get(cacheKey);
    if (cached) {
        if (nowMs !== undefined && (0, _numberruntime.asDateTimestampMs)(cached.expiresAtMs) !== undefined && cached.expiresAtMs > nowMs) {
            return cached.isForum;
        }
        telegramForumFlagByChatId.delete(cacheKey);
    }
    try {
        const resolved = extractTelegramForumFlag(await params.getChat(params.chatId)) === true;
        cacheTelegramForumFlag(params.chatId, resolved, rawNowMs);
        return resolved;
    } catch  {
        return false;
    }
}
function withResolvedTelegramForumFlag(message, isForum) {
    const current = extractTelegramForumFlag(message.chat);
    if (current === isForum) {
        return message;
    }
    return {
        ...message,
        chat: {
            ...message.chat,
            is_forum: isForum
        }
    };
}
async function resolveTelegramGroupAllowFromContext(params) {
    const accountId = (0, _routing.normalizeAccountId)(params.accountId);
    // Use resolveTelegramThreadSpec to handle both forum groups AND DM topics
    const threadSpec = resolveTelegramThreadSpec({
        isGroup: params.isGroup ?? false,
        isForum: params.isForum,
        messageThreadId: params.messageThreadId
    });
    const resolvedThreadId = threadSpec.scope === "forum" ? threadSpec.id : undefined;
    const dmThreadId = threadSpec.scope === "dm" ? threadSpec.id : undefined;
    const threadIdForConfig = resolvedThreadId ?? dmThreadId;
    const { groupConfig, topicConfig } = params.resolveTelegramGroupConfig(params.chatId, threadIdForConfig);
    const groupAllowOverride = (0, _botaccess.firstDefined)(topicConfig?.allowFrom, groupConfig?.allowFrom);
    const effectiveDmPolicy = (0, _botaccess.resolveTelegramEffectiveDmPolicy)({
        isGroup: params.isGroup ?? false,
        groupConfig,
        dmPolicy: params.dmPolicy
    });
    const storeAllowFrom = await loadTelegramPairingStoreIfNeeded({
        cfg: params.cfg,
        allowFrom: params.allowFrom,
        groupAllowOverride,
        accountId,
        senderId: params.senderId,
        isGroup: params.isGroup ?? false,
        effectiveDmPolicy,
        skipPairingStoreRead: params.skipPairingStoreRead,
        readChannelAllowFromStore: params.readChannelAllowFromStore
    });
    const expandedGroupAllowFrom = await (0, _accessgroups.expandTelegramAllowFromWithAccessGroups)({
        cfg: params.cfg,
        allowFrom: groupAllowOverride ?? params.groupAllowFrom,
        accountId,
        senderId: params.senderId
    });
    // Group sender access must remain explicit (groupAllowFrom/per-group allowFrom only).
    // DM pairing store entries are not a group authorization source.
    const effectiveGroupAllow = (0, _botaccess.normalizeAllowFrom)(expandedGroupAllowFrom);
    const hasGroupAllowOverride = groupAllowOverride !== undefined;
    return {
        resolvedThreadId,
        dmThreadId,
        storeAllowFrom,
        groupConfig,
        topicConfig,
        groupAllowOverride,
        effectiveGroupAllow,
        hasGroupAllowOverride
    };
}
async function isTelegramDmAllowedByConfiguredAllowFrom(params) {
    const configuredAllowFrom = params.groupAllowOverride ?? params.allowFrom;
    if (!configuredAllowFrom || configuredAllowFrom.length === 0) {
        return false;
    }
    const expandedAllowFrom = await (0, _accessgroups.expandTelegramAllowFromWithAccessGroups)({
        cfg: params.cfg,
        allowFrom: configuredAllowFrom,
        accountId: params.accountId,
        senderId: params.senderId
    });
    const normalizedAllowFrom = (0, _botaccess.normalizeAllowFrom)(expandedAllowFrom);
    return normalizedAllowFrom.hasEntries && (0, _botaccess.isSenderAllowed)({
        allow: normalizedAllowFrom,
        senderId: params.senderId
    });
}
let TelegramPairingStoreReadError = class TelegramPairingStoreReadError extends Error {
    constructor(cause){
        super(`Telegram pairing store read failed: ${String(cause)}`);
        this.name = "TelegramPairingStoreReadError";
        this.cause = cause;
    }
};
async function loadTelegramPairingStoreIfNeeded(params) {
    if (params.skipPairingStoreRead || params.isGroup || params.effectiveDmPolicy !== "pairing") {
        return [];
    }
    const configuredDmAllowed = await isTelegramDmAllowedByConfiguredAllowFrom({
        cfg: params.cfg,
        allowFrom: params.allowFrom,
        groupAllowOverride: params.groupAllowOverride,
        accountId: params.accountId,
        senderId: params.senderId
    });
    if (configuredDmAllowed) {
        return [];
    }
    try {
        return await (params.readChannelAllowFromStore ?? _conversationruntime.readChannelAllowFromStore)("telegram", process.env, params.accountId);
    } catch (cause) {
        throw new TelegramPairingStoreReadError(cause);
    }
}
function resolveTelegramForumThreadId(params) {
    // Non-forum groups: ignore message_thread_id (reply threads are not real topics)
    if (!params.isForum) {
        return undefined;
    }
    // Forum groups: use the topic ID, defaulting to General topic
    if (params.messageThreadId == null) {
        return TELEGRAM_GENERAL_TOPIC_ID;
    }
    return params.messageThreadId;
}
function resolveTelegramThreadSpec(params) {
    if (params.isGroup) {
        const id = resolveTelegramForumThreadId({
            isForum: params.isForum,
            messageThreadId: params.messageThreadId
        });
        return {
            id,
            scope: params.isForum ? "forum" : "none"
        };
    }
    if (params.messageThreadId == null) {
        return {
            scope: "dm"
        };
    }
    return {
        id: params.messageThreadId,
        scope: "dm"
    };
}
function buildTelegramThreadParams(thread) {
    if (thread?.id == null) {
        return undefined;
    }
    const normalized = Math.trunc(thread.id);
    if (thread.scope === "dm") {
        return normalized > 0 ? {
            message_thread_id: normalized
        } : undefined;
    }
    // Telegram rejects message_thread_id=1 for General forum topic
    if (normalized === TELEGRAM_GENERAL_TOPIC_ID) {
        return undefined;
    }
    return {
        message_thread_id: normalized
    };
}
function buildTelegramRoutingTarget(chatId, thread) {
    const base = `telegram:${chatId}`;
    const threadParams = buildTelegramThreadParams(thread);
    const messageThreadId = threadParams?.message_thread_id;
    if (typeof messageThreadId !== "number") {
        return base;
    }
    return `${base}:topic:${messageThreadId}`;
}
function buildTelegramInboundOriginTarget(chatId, thread) {
    if (thread?.scope !== "forum") {
        return `telegram:${chatId}`;
    }
    return buildTelegramRoutingTarget(chatId, thread);
}
function buildTypingThreadParams(messageThreadId) {
    if (messageThreadId == null) {
        return undefined;
    }
    return {
        message_thread_id: Math.trunc(messageThreadId)
    };
}
function resolveTelegramStreamMode(telegramCfg) {
    return (0, _previewstreaming.resolveTelegramPreviewStreamMode)(telegramCfg);
}
function buildTelegramGroupPeerId(chatId, messageThreadId) {
    return messageThreadId != null ? `${chatId}:topic:${messageThreadId}` : String(chatId);
}
function resolveTelegramDirectPeerId(params) {
    const senderId = params.senderId != null ? (0, _stringcoerceruntime.normalizeOptionalString)(String(params.senderId)) ?? "" : "";
    if (senderId) {
        return senderId;
    }
    return String(params.chatId);
}
function buildTelegramGroupFrom(chatId, messageThreadId) {
    return `telegram:group:${buildTelegramGroupPeerId(chatId, messageThreadId)}`;
}
function isTelegramCommandsAllowFromConfigured(cfg) {
    const commandsAllowFrom = cfg.commands?.allowFrom;
    return commandsAllowFrom != null && typeof commandsAllowFrom === "object" && (Array.isArray(commandsAllowFrom.telegram) || Array.isArray(commandsAllowFrom["*"]));
}
function resolveTelegramCommandAuthorization(params) {
    return (0, _commandauthnative.resolveCommandAuthorization)({
        ctx: {
            Provider: "telegram",
            Surface: "telegram",
            OriginatingChannel: "telegram",
            AccountId: params.accountId,
            ChatType: params.isGroup ? "group" : "direct",
            From: params.isGroup ? buildTelegramGroupFrom(params.chatId, params.resolvedThreadId) : `telegram:${params.chatId}`,
            SenderId: params.senderId || undefined,
            SenderUsername: params.senderUsername || undefined
        },
        cfg: params.cfg,
        commandAuthorized: false
    });
}
function buildTelegramParentPeer(params) {
    if (!params.isGroup || params.resolvedThreadId == null) {
        return undefined;
    }
    return {
        kind: "group",
        id: String(params.chatId)
    };
}
function buildGroupLabel(msg, chatId, messageThreadId) {
    const title = msg.chat?.title;
    const topicSuffix = messageThreadId != null ? ` topic:${messageThreadId}` : "";
    if (title) {
        return `${title} id:${chatId}${topicSuffix}`;
    }
    return `group:${chatId}${topicSuffix}`;
}
function resolveTelegramReplyId(raw) {
    return (0, _outboundparams.normalizeTelegramReplyToMessageId)(raw);
}
function describeReplyTarget(msg) {
    const reply = msg.reply_to_message;
    const externalReply = msg.external_reply;
    const quote = msg.quote ?? externalReply?.quote;
    const rawQuoteText = quote?.text;
    const quoteText = (0, _bodyhelpers.resolveTelegramTextContent)(rawQuoteText);
    let body;
    let kind = "reply";
    const filteredQuoteText = hadUnsafeTelegramText(rawQuoteText, quoteText);
    body = quoteText.trim();
    if (body) {
        kind = "quote";
    }
    const replyLike = reply ?? externalReply;
    const rawReplyText = replyLike && typeof replyLike.text === "string" ? replyLike.text : replyLike && typeof replyLike.caption === "string" ? replyLike.caption : undefined;
    const safeReplyText = (0, _bodyhelpers.resolveTelegramTextContent)(rawReplyText);
    const replyTextParts = replyLike && safeReplyText ? (0, _bodyhelpers.getTelegramTextParts)(replyLike) : undefined;
    let filteredReplyText = false;
    if (!body && replyLike) {
        const replyBody = safeReplyText.trim();
        filteredReplyText = hadUnsafeTelegramText(rawReplyText, replyBody);
        body = replyBody;
        if (!body) {
            body = (0, _bodyhelpers.resolveTelegramMediaPlaceholder)(replyLike) ?? "";
            if (!body) {
                const locationData = (0, _bodyhelpers.extractTelegramLocation)(replyLike);
                if (locationData) {
                    body = (0, _channelinbound.formatLocationText)(locationData);
                }
            }
        }
    }
    if (!body && !replyLike) {
        return null;
    }
    if (!body && !filteredQuoteText && !filteredReplyText) {
        return null;
    }
    const sender = replyLike ? (0, _bodyhelpers.buildSenderName)(replyLike) : undefined;
    const senderLabel = sender ?? "unknown sender";
    const source = reply ? "reply_to_message" : "external_reply";
    const quotePosition = kind === "quote" && typeof quote?.position === "number" && Number.isFinite(quote.position) ? Math.trunc(quote.position) : undefined;
    const quoteEntities = kind === "quote" && Array.isArray(quote?.entities) ? quote.entities : undefined;
    // Extract forward context from the resolved reply target (reply_to_message or external_reply).
    const forwardedFrom = replyLike ? (0, _bodyhelpers.normalizeForwardedContext)(replyLike) ?? undefined : undefined;
    return {
        id: replyLike?.message_id ? String(replyLike.message_id) : undefined,
        sender: senderLabel,
        senderId: replyLike?.from?.id != null ? String(replyLike.from.id) : undefined,
        senderUsername: replyLike?.from?.username ?? undefined,
        body: body || undefined,
        kind,
        source,
        quoteText: kind === "quote" ? quoteText : undefined,
        quotePosition,
        quoteEntities,
        forwardedFrom,
        quoteSourceText: replyTextParts?.text || undefined,
        quoteSourceEntities: replyTextParts?.entities
    };
}

//# sourceMappingURL=helpers.js.map