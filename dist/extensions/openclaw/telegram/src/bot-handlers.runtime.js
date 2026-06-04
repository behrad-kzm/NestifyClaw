"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "registerTelegramHandlers", {
    enumerable: true,
    get: function() {
        return registerTelegramHandlers;
    }
});
const _approvalreplyruntime = require("../../../../common/openclaw/plugin-sdk/approval-reply-runtime");
const _channelconfighelpers = require("../../../../common/openclaw/plugin-sdk/channel-config-helpers");
const _channelinbound = require("../../../../common/openclaw/plugin-sdk/channel-inbound");
const _channelinbounddebounce = require("../../../../common/openclaw/plugin-sdk/channel-inbound-debounce");
const _commandauthnative = require("../../../../common/openclaw/plugin-sdk/command-auth-native");
const _commanddetection = require("../../../../common/openclaw/plugin-sdk/command-detection");
const _commandprimitivesruntime = require("../../../../common/openclaw/plugin-sdk/command-primitives-runtime");
const _commandstatus = require("../../../../common/openclaw/plugin-sdk/command-status");
const _configmutation = require("../../../../common/openclaw/plugin-sdk/config-mutation");
const _conversationruntime = require("../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _modelsessionruntime = require("../../../../common/openclaw/plugin-sdk/model-session-runtime");
const _modelsproviderruntime = require("../../../../common/openclaw/plugin-sdk/models-provider-runtime");
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _sessionstoreruntime = require("../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accessgroups = require("./access-groups.js");
const _accounts = require("./accounts.js");
const _apilogging = require("./api-logging.js");
const _botaccess = require("./bot-access.js");
const _bothandlersagentruntime = require("./bot-handlers.agent.runtime.js");
const _bothandlersdebouncekey = require("./bot-handlers.debounce-key.js");
const _bothandlersmedia = require("./bot-handlers.media.js");
const _botnativecommands = require("./bot-native-commands.js");
const _botupdates = require("./bot-updates.js");
const _deliveryresolvemedia = require("./bot/delivery.resolve-media.js");
const _helpers = require("./bot/helpers.js");
const _commandui = require("./command-ui.js");
const _conversationroute = require("./conversation-route.js");
const _dmaccess = require("./dm-access.js");
const _execapprovalresolver = require("./exec-approval-resolver.js");
const _execapprovals = require("./exec-approvals.js");
const _forumservicemessage = require("./forum-service-message.js");
const _groupaccess = require("./group-access.js");
const _groupmigration = require("./group-migration.js");
const _ingress = require("./ingress.js");
const _inlinebuttons = require("./inline-buttons.js");
const _interactivedispatch = require("./interactive-dispatch.js");
const _messagecache = require("./message-cache.js");
const _messagedispatchdedupe = require("./message-dispatch-dedupe.js");
const _modelbuttons = require("./model-buttons.js");
const _nativecommandcallbackdata = require("./native-command-callback-data.js");
const _send = require("./send.js");
const registerTelegramHandlers = ({ cfg, accountId, bot, opts, telegramTransport, runtime, mediaMaxBytes, telegramCfg, allowFrom, groupAllowFrom, resolveGroupPolicy, resolveTelegramGroupConfig, shouldSkipUpdate, processMessage, logger, telegramDeps, resolveGroupActivation, resolveGroupRequireMention })=>{
    const mediaRuntimeOptions = (0, _accounts.resolveTelegramMediaRuntimeOptions)({
        cfg,
        accountId,
        token: opts.token,
        transport: telegramTransport
    });
    const DEFAULT_TEXT_FRAGMENT_MAX_GAP_MS = 1500;
    const TELEGRAM_TEXT_FRAGMENT_START_THRESHOLD_CHARS = 4000;
    const TELEGRAM_TEXT_FRAGMENT_MAX_GAP_MS = typeof opts.testTimings?.textFragmentGapMs === "number" && Number.isFinite(opts.testTimings.textFragmentGapMs) ? Math.max(10, Math.floor(opts.testTimings.textFragmentGapMs)) : DEFAULT_TEXT_FRAGMENT_MAX_GAP_MS;
    const TELEGRAM_TEXT_FRAGMENT_MAX_ID_GAP = 1;
    const TELEGRAM_TEXT_FRAGMENT_MAX_PARTS = 12;
    const TELEGRAM_TEXT_FRAGMENT_MAX_TOTAL_CHARS = 50_000;
    const mediaGroupTimeoutMs = typeof opts.testTimings?.mediaGroupFlushMs === "number" && Number.isFinite(opts.testTimings.mediaGroupFlushMs) ? Math.max(10, Math.floor(opts.testTimings.mediaGroupFlushMs)) : typeof telegramCfg.mediaGroupFlushMs === "number" && Number.isFinite(telegramCfg.mediaGroupFlushMs) ? Math.max(10, Math.floor(telegramCfg.mediaGroupFlushMs)) : _botupdates.MEDIA_GROUP_TIMEOUT_MS;
    const mediaGroupBuffer = new Map();
    const mediaGroupProcessingByKey = new Map();
    const messageCache = (0, _messagecache.createTelegramMessageCache)({
        scope: (0, _messagecache.resolveTelegramMessageCacheScope)(telegramDeps.resolveStorePath(cfg.session?.store))
    });
    const messageDispatchReplayGuard = (0, _messagedispatchdedupe.createTelegramMessageDispatchReplayGuard)({
        storePath: telegramDeps.resolveStorePath(cfg.session?.store),
        onDiskError: (error)=>{
            runtime.error?.((0, _runtimeenv.danger)(`[telegram] message dispatch dedupe store failed: ${String(error)}`));
        }
    });
    const textFragmentBuffer = new Map();
    const textFragmentProcessingByKey = new Map();
    const queueBufferedProcessing = async (processingByKey, key, task)=>{
        const previous = processingByKey.get(key) ?? Promise.resolve();
        const current = previous.then(task).catch(()=>undefined);
        processingByKey.set(key, current);
        await current;
        if (processingByKey.get(key) === current) {
            processingByKey.delete(key);
        }
    };
    const debounceMs = (0, _channelinbounddebounce.resolveInboundDebounceMs)({
        cfg,
        channel: "telegram"
    });
    const FORWARD_BURST_DEBOUNCE_MS = 80;
    const normalizePromptContextMinTimestampMs = (timestampMs)=>typeof timestampMs === "number" && Number.isFinite(timestampMs) ? timestampMs : undefined;
    const promptContextBoundaryOptions = (timestampMs)=>{
        const promptContextMinTimestampMs = normalizePromptContextMinTimestampMs(timestampMs);
        return promptContextMinTimestampMs === undefined ? {} : {
            promptContextMinTimestampMs
        };
    };
    const latestPromptContextMinTimestampMs = (...timestamps)=>{
        let latest;
        for (const timestampMs of timestamps){
            const normalized = normalizePromptContextMinTimestampMs(timestampMs);
            if (normalized === undefined) {
                continue;
            }
            latest = latest === undefined ? normalized : Math.max(latest, normalized);
        }
        return latest;
    };
    const mergeDispatchDedupeKeys = (...groups)=>[
            ...new Set((0, _stringcoerceruntime.normalizeStringEntries)(groups.flatMap((group)=>group ?? [])))
        ];
    const releaseDispatchDedupeKeys = (keys, error)=>{
        (0, _messagedispatchdedupe.releaseTelegramMessageDispatchReplay)({
            guard: messageDispatchReplayGuard,
            accountId,
            keys,
            error
        });
    };
    const commitDispatchDedupeKeys = async (keys)=>{
        await (0, _messagedispatchdedupe.commitTelegramMessageDispatchReplay)({
            guard: messageDispatchReplayGuard,
            accountId,
            keys
        });
    };
    const claimMessageDispatchDedupe = async (msg)=>{
        const claim = await (0, _messagedispatchdedupe.claimTelegramMessageDispatchReplay)({
            guard: messageDispatchReplayGuard,
            accountId,
            msg
        });
        if (claim.kind === "duplicate") {
            (0, _runtimeenv.logVerbose)(`telegram dispatch dedupe: skipped message ${msg.chat.id}:${msg.message_id}`);
            return {
                process: false
            };
        }
        return {
            process: true,
            keys: claim.kind === "claimed" ? [
                claim.key
            ] : []
        };
    };
    const resolveTelegramDebounceLane = (msg)=>{
        const forwardMeta = msg;
        return forwardMeta.forward_origin ?? forwardMeta.forward_from ?? forwardMeta.forward_from_chat ?? forwardMeta.forward_sender_name ?? forwardMeta.forward_date ? "forward" : "default";
    };
    const buildSyntheticTextMessage = (params)=>({
            ...params.base,
            ...params.from ? {
                from: params.from
            } : {},
            text: params.text,
            caption: undefined,
            caption_entities: undefined,
            entities: undefined,
            ...params.date != null ? {
                date: params.date
            } : {}
        });
    const buildSyntheticContext = (ctx, message)=>{
        const getFile = typeof ctx.getFile === "function" ? ctx.getFile.bind(ctx) : async ()=>({});
        return {
            message,
            me: ctx.me,
            getFile
        };
    };
    const MULTI_SELECT_PREFIX = "OC_MULTI|";
    const MULTI_SELECT_TOGGLE_PREFIX = `${MULTI_SELECT_PREFIX}toggle|`;
    const SELECT_PREFIX = "OC_SELECT|";
    const SELECTED_PREFIX = "✅ ";
    const parseTelegramManagedSelectCallback = (data)=>{
        if (data.startsWith(MULTI_SELECT_TOGGLE_PREFIX)) {
            return {
                type: "multi-toggle",
                value: data.slice(MULTI_SELECT_TOGGLE_PREFIX.length)
            };
        }
        if (data === `${MULTI_SELECT_PREFIX}clear`) {
            return {
                type: "multi-clear"
            };
        }
        if (data === `${MULTI_SELECT_PREFIX}submit`) {
            return {
                type: "multi-submit"
            };
        }
        if (data.startsWith(SELECT_PREFIX)) {
            return {
                type: "select",
                value: data.slice(SELECT_PREFIX.length)
            };
        }
        return undefined;
    };
    const cloneInlineKeyboardButtons = (message)=>{
        const rows = message.reply_markup?.inline_keyboard;
        if (!Array.isArray(rows)) {
            return [];
        }
        return rows.map((row)=>Array.isArray(row) ? row.map((button)=>{
                const candidate = button;
                if (typeof candidate.text !== "string" || typeof candidate.callback_data !== "string") {
                    return null;
                }
                const style = candidate.style === "danger" || candidate.style === "success" || candidate.style === "primary" ? candidate.style : undefined;
                return {
                    text: candidate.text,
                    callback_data: candidate.callback_data,
                    ...style ? {
                        style
                    } : {}
                };
            }).filter((button)=>button !== null) : []).filter((row)=>row.length > 0);
    };
    const stripMultiSelectPrefix = (text)=>text.replace(/^✅\s*/, "");
    const isSelectedMultiButton = (button)=>/^✅\s*/.test(button.text);
    const isMultiToggleButton = (button)=>button.callback_data.startsWith(MULTI_SELECT_TOGGLE_PREFIX);
    const resolveMultiSelectedValues = (buttons)=>buttons.flatMap((row)=>row.flatMap((button)=>{
                if (!isMultiToggleButton(button) || !isSelectedMultiButton(button)) {
                    return [];
                }
                return [
                    button.callback_data.slice(MULTI_SELECT_TOGGLE_PREFIX.length)
                ];
            }));
    const updateMultiSelectKeyboard = (message, action, value = "")=>cloneInlineKeyboardButtons(message).map((row)=>row.map((button)=>{
                if (!isMultiToggleButton(button)) {
                    return button;
                }
                const buttonValue = button.callback_data.slice(MULTI_SELECT_TOGGLE_PREFIX.length);
                const baseText = stripMultiSelectPrefix(button.text);
                const selected = action === "clear" ? false : buttonValue === value ? !isSelectedMultiButton(button) : isSelectedMultiButton(button);
                return {
                    ...button,
                    text: selected ? `${SELECTED_PREFIX}${baseText}` : baseText
                };
            }));
    const buildCallbackSyntheticTextContext = (params)=>{
        const message = buildSyntheticTextMessage({
            base: (0, _helpers.withResolvedTelegramForumFlag)(params.callbackMessage, params.isForum),
            from: params.callback.from,
            text: params.text
        });
        return {
            ctx: buildSyntheticContext(params.ctx, message),
            message
        };
    };
    const inboundDebouncer = (0, _channelinbounddebounce.createInboundDebouncer)({
        debounceMs,
        serializeImmediate: true,
        resolveDebounceMs: (entry)=>entry.debounceLane === "forward" ? FORWARD_BURST_DEBOUNCE_MS : debounceMs,
        buildKey: (entry)=>entry.debounceKey,
        shouldDebounce: (entry)=>{
            const text = (0, _helpers.getTelegramTextParts)(entry.msg).text;
            const hasDebounceableText = (0, _channelinbound.shouldDebounceTextInbound)({
                text,
                cfg,
                commandOptions: {
                    botUsername: entry.botUsername
                }
            });
            if (entry.debounceLane === "forward") {
                // Forwarded bursts often split text + media into adjacent updates.
                // Debounce media-only forward entries too so they can coalesce.
                return hasDebounceableText || entry.allMedia.length > 0;
            }
            if (!hasDebounceableText) {
                return false;
            }
            return entry.allMedia.length === 0;
        },
        onFlush: async (entries)=>{
            const last = entries.at(-1);
            if (!last) {
                return;
            }
            if (entries.length === 1) {
                await processMessageWithReplyChain({
                    ctx: last.ctx,
                    msg: last.msg,
                    allMedia: last.allMedia,
                    storeAllowFrom: last.storeAllowFrom,
                    options: {
                        receivedAtMs: last.receivedAtMs,
                        ingressBuffer: "inbound-debounce",
                        ...promptContextBoundaryOptions(last.promptContextMinTimestampMs)
                    },
                    dispatchDedupeKeys: last.dispatchDedupeKeys
                });
                return;
            }
            const combinedText = entries.map((entry)=>(0, _helpers.getTelegramTextParts)(entry.msg).text).filter(Boolean).join("\n");
            const combinedMedia = entries.flatMap((entry)=>entry.allMedia);
            if (!combinedText.trim() && combinedMedia.length === 0) {
                return;
            }
            const first = entries[0];
            const promptContextMinTimestampMs = latestPromptContextMinTimestampMs(...entries.map((entry)=>entry.promptContextMinTimestampMs));
            const baseCtx = first.ctx;
            const syntheticMessage = buildSyntheticTextMessage({
                base: first.msg,
                text: combinedText,
                date: last.msg.date ?? first.msg.date
            });
            const messageIdOverride = last.msg.message_id ? String(last.msg.message_id) : undefined;
            const syntheticCtx = buildSyntheticContext(baseCtx, syntheticMessage);
            await processMessageWithReplyChain({
                ctx: syntheticCtx,
                msg: syntheticMessage,
                allMedia: combinedMedia,
                storeAllowFrom: first.storeAllowFrom,
                options: {
                    ...messageIdOverride ? {
                        messageIdOverride
                    } : {},
                    receivedAtMs: first.receivedAtMs,
                    ingressBuffer: "inbound-debounce",
                    ...promptContextBoundaryOptions(promptContextMinTimestampMs)
                },
                dispatchDedupeKeys: mergeDispatchDedupeKeys(...entries.map((entry)=>entry.dispatchDedupeKeys))
            });
        },
        onError: (err, items)=>{
            runtime.error?.((0, _runtimeenv.danger)(`telegram debounce flush failed: ${String(err)}`));
            const chatId = items[0]?.msg.chat.id;
            if (chatId != null) {
                const threadId = items[0]?.msg.message_thread_id;
                void bot.api.sendMessage(chatId, "Something went wrong while processing your message. Please try again.", threadId != null ? {
                    message_thread_id: threadId
                } : undefined).catch((sendErr)=>{
                    (0, _runtimeenv.logVerbose)(`telegram: error fallback send failed: ${String(sendErr)}`);
                });
            }
        },
        onCancel: (items)=>{
            releaseDispatchDedupeKeys(mergeDispatchDedupeKeys(...items.map((item)=>item.dispatchDedupeKeys)));
        }
    });
    const resolveTelegramSessionState = (params)=>{
        const runtimeCfg = params.runtimeCfg ?? telegramDeps.getRuntimeConfig();
        const resolvedThreadId = params.resolvedThreadId ?? (0, _helpers.resolveTelegramForumThreadId)({
            isForum: params.isForum,
            messageThreadId: params.messageThreadId
        });
        const dmThreadId = !params.isGroup ? params.messageThreadId : undefined;
        const topicThreadId = resolvedThreadId ?? dmThreadId;
        const { topicConfig } = resolveTelegramGroupConfig(params.chatId, topicThreadId);
        const { route } = (0, _conversationroute.resolveTelegramConversationRoute)({
            cfg: runtimeCfg,
            accountId,
            chatId: params.chatId,
            isGroup: params.isGroup,
            resolvedThreadId,
            replyThreadId: topicThreadId,
            senderId: params.senderId,
            topicAgentId: topicConfig?.agentId
        });
        const baseSessionKey = (0, _conversationroute.resolveTelegramConversationBaseSessionKey)({
            cfg: runtimeCfg,
            route,
            chatId: params.chatId,
            isGroup: params.isGroup,
            senderId: params.senderId
        });
        const threadKeys = (0, _helpers.shouldUseTelegramDmThreadSession)({
            dmThreadId,
            botHasTopicsEnabled: params.botHasTopicsEnabled
        }) && dmThreadId != null ? (0, _routing.resolveThreadSessionKeys)({
            baseSessionKey,
            threadId: `${params.chatId}:${dmThreadId}`
        }) : null;
        const sessionKey = threadKeys?.sessionKey ?? baseSessionKey;
        const storePath = telegramDeps.resolveStorePath(runtimeCfg.session?.store, {
            agentId: route.agentId
        });
        const store = (telegramDeps.loadSessionStore ?? _sessionstoreruntime.loadSessionStore)(storePath);
        const entry = (0, _sessionstoreruntime.resolveSessionStoreEntry)({
            store,
            sessionKey
        }).existing;
        const storedOverride = (0, _commandauthnative.resolveStoredModelOverride)({
            sessionEntry: entry,
            sessionStore: store,
            sessionKey,
            defaultProvider: (0, _bothandlersagentruntime.resolveDefaultModelForAgent)({
                cfg: runtimeCfg,
                agentId: route.agentId
            }).provider
        });
        if (storedOverride) {
            return {
                agentId: route.agentId,
                sessionEntry: entry,
                sessionKey,
                model: storedOverride.provider ? `${storedOverride.provider}/${storedOverride.model}` : storedOverride.model
            };
        }
        const provider = entry?.modelProvider?.trim();
        const model = entry?.model?.trim();
        if (provider && model) {
            return {
                agentId: route.agentId,
                sessionEntry: entry,
                sessionKey,
                model: `${provider}/${model}`
            };
        }
        const modelCfg = runtimeCfg.agents?.defaults?.model;
        return {
            agentId: route.agentId,
            sessionEntry: entry,
            sessionKey,
            model: typeof modelCfg === "string" ? modelCfg : modelCfg?.primary
        };
    };
    const mediaMayNeedDownloadForMentionDetection = (msg)=>{
        const textParts = (0, _helpers.getTelegramTextParts)(msg);
        if (textParts.text.trim()) {
            return false;
        }
        const documentMime = msg.document?.mime_type?.split(";")[0]?.trim().toLowerCase();
        return Boolean(msg.audio ?? msg.voice ?? documentMime?.startsWith("audio/"));
    };
    const shouldSkipMediaDownloadForUnaddressedMentionGroup = async (params)=>{
        const { ctx, msg, chatId, isGroup, isForum, resolvedThreadId, dmThreadId, senderId, effectiveGroupAllow, effectiveDmAllow, groupConfig, topicConfig } = params;
        if (!isGroup || mediaMayNeedDownloadForMentionDetection(msg)) {
            return false;
        }
        const runtimeCfg = telegramDeps.getRuntimeConfig();
        const sessionState = resolveTelegramSessionState({
            chatId,
            isGroup,
            isForum,
            resolvedThreadId,
            messageThreadId: resolvedThreadId ?? dmThreadId,
            senderId,
            runtimeCfg
        });
        const activationOverride = resolveGroupActivation({
            chatId,
            messageThreadId: resolvedThreadId,
            sessionKey: sessionState.sessionKey,
            agentId: sessionState.agentId
        });
        const requireMention = (0, _botaccess.firstDefined)(topicConfig?.requireMention, activationOverride, groupConfig?.requireMention, resolveGroupRequireMention(chatId));
        if (!requireMention) {
            return false;
        }
        const botUsername = ctx.me?.username?.trim().toLowerCase();
        const mentionRegexes = (0, _channelinbound.buildMentionRegexes)(runtimeCfg, sessionState.agentId);
        const messageTextParts = (0, _helpers.getTelegramTextParts)(msg);
        const hasAnyMention = messageTextParts.entities.some((ent)=>ent.type === "mention");
        const explicitlyMentioned = botUsername ? (0, _helpers.hasBotMention)(msg, botUsername) : false;
        const wasMentioned = (0, _channelinbound.matchesMentionWithExplicit)({
            text: messageTextParts.text,
            mentionRegexes,
            explicit: {
                hasAnyMention,
                isExplicitlyMentioned: explicitlyMentioned,
                canResolveExplicit: Boolean(botUsername)
            }
        });
        const botId = ctx.me?.id;
        const replyFromId = msg.reply_to_message?.from?.id;
        const replyToBotMessage = botId != null && replyFromId === botId;
        const isReplyToServiceMessage = replyToBotMessage && (0, _forumservicemessage.isTelegramForumServiceMessage)(msg.reply_to_message);
        const implicitMentionKinds = (0, _channelinbound.implicitMentionKindWhen)("reply_to_bot", replyToBotMessage && !isReplyToServiceMessage);
        const canDetectMention = Boolean(botUsername) || mentionRegexes.length > 0;
        const hasControlCommandInMessage = (0, _commanddetection.hasControlCommand)(messageTextParts.text, runtimeCfg, {
            botUsername
        });
        const commandGate = await (0, _ingress.resolveTelegramCommandIngressAuthorization)({
            accountId,
            cfg: runtimeCfg,
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
        const mentionDecision = (0, _channelinbound.resolveInboundMentionDecision)({
            facts: {
                canDetectMention,
                wasMentioned,
                hasAnyMention,
                implicitMentionKinds
            },
            policy: {
                isGroup,
                requireMention: true,
                allowTextCommands: true,
                hasControlCommand: hasControlCommandInMessage,
                commandAuthorized: commandGate.authorized
            }
        });
        if (mentionDecision.shouldSkip) {
            logger.info({
                chatId,
                reason: "no-mention"
            }, "skipping group media before download");
            return true;
        }
        return false;
    };
    const processMediaGroup = async (entry)=>{
        try {
            entry.messages.sort((a, b)=>a.msg.message_id - b.msg.message_id);
            const captionMsg = entry.messages.find((m)=>m.msg.caption || m.msg.text);
            const primaryEntry = captionMsg ?? entry.messages[0];
            if (!primaryEntry) {
                releaseDispatchDedupeKeys(entry.dispatchDedupeKeys);
                return;
            }
            if (await shouldSkipMediaDownloadForUnaddressedMentionGroup({
                ctx: primaryEntry.ctx,
                msg: primaryEntry.msg,
                chatId: primaryEntry.msg.chat.id,
                isGroup: entry.isGroup,
                isForum: entry.isForum,
                resolvedThreadId: entry.resolvedThreadId,
                dmThreadId: entry.dmThreadId,
                senderId: entry.senderId,
                effectiveGroupAllow: entry.effectiveGroupAllow,
                effectiveDmAllow: entry.effectiveDmAllow,
                groupConfig: entry.groupConfig,
                topicConfig: entry.topicConfig
            })) {
                releaseDispatchDedupeKeys(entry.dispatchDedupeKeys);
                return;
            }
            const allMedia = [];
            let skippedCount = 0;
            for (const { ctx } of entry.messages){
                let media;
                try {
                    media = await (0, _deliveryresolvemedia.resolveMedia)({
                        ctx,
                        maxBytes: mediaMaxBytes,
                        ...mediaRuntimeOptions
                    });
                } catch (mediaErr) {
                    if (!(0, _bothandlersmedia.isRecoverableMediaGroupError)(mediaErr)) {
                        throw mediaErr;
                    }
                    runtime.log?.((0, _runtimeenv.warn)(`media group: skipping photo that failed to fetch: ${String(mediaErr)}`));
                    skippedCount++;
                    continue;
                }
                if (media) {
                    allMedia.push({
                        path: media.path,
                        contentType: media.contentType,
                        stickerMetadata: media.stickerMetadata
                    });
                } else {
                    skippedCount++;
                }
            }
            if (skippedCount > 0) {
                const total = entry.messages.length;
                const wasOrWere = skippedCount === 1 ? "was" : "were";
                await (0, _apilogging.withTelegramApiErrorLogging)({
                    operation: "sendMessage",
                    runtime,
                    fn: ()=>bot.api.sendMessage(primaryEntry.msg.chat.id, `⚠️ Received ${allMedia.length} of ${total} images — ${skippedCount} could not be fetched and ${wasOrWere} skipped.`, {
                            reply_parameters: {
                                message_id: primaryEntry.msg.message_id,
                                allow_sending_without_reply: true
                            }
                        })
                }).catch(()=>{});
            }
            await processMessageWithReplyChain({
                ctx: primaryEntry.ctx,
                msg: primaryEntry.msg,
                allMedia,
                storeAllowFrom: entry.storeAllowFrom,
                options: promptContextBoundaryOptions(entry.promptContextMinTimestampMs),
                dispatchDedupeKeys: entry.dispatchDedupeKeys
            });
        } catch (err) {
            releaseDispatchDedupeKeys(entry.dispatchDedupeKeys, err);
            runtime.error?.((0, _runtimeenv.danger)(`media group handler failed: ${String(err)}`));
        }
    };
    const flushTextFragments = async (entry)=>{
        try {
            entry.messages.sort((a, b)=>a.msg.message_id - b.msg.message_id);
            const first = entry.messages[0];
            const last = entry.messages.at(-1);
            if (!first || !last) {
                releaseDispatchDedupeKeys(entry.dispatchDedupeKeys);
                return;
            }
            const combinedText = entry.messages.map((m)=>m.msg.text ?? "").join("");
            if (!combinedText.trim()) {
                releaseDispatchDedupeKeys(entry.dispatchDedupeKeys);
                return;
            }
            const syntheticMessage = buildSyntheticTextMessage({
                base: first.msg,
                text: combinedText,
                date: last.msg.date ?? first.msg.date
            });
            const storeAllowFrom = await loadStoreAllowFrom(first.msg);
            const baseCtx = first.ctx;
            const syntheticCtx = buildSyntheticContext(baseCtx, syntheticMessage);
            await processMessageWithReplyChain({
                ctx: syntheticCtx,
                msg: syntheticMessage,
                allMedia: [],
                storeAllowFrom,
                options: {
                    messageIdOverride: String(last.msg.message_id),
                    receivedAtMs: first.receivedAtMs,
                    ingressBuffer: "text-fragment",
                    ...promptContextBoundaryOptions(entry.promptContextMinTimestampMs)
                },
                dispatchDedupeKeys: entry.dispatchDedupeKeys
            });
        } catch (err) {
            releaseDispatchDedupeKeys(entry.dispatchDedupeKeys, err);
            runtime.error?.((0, _runtimeenv.danger)(`text fragment handler failed: ${String(err)}`));
        }
    };
    const queueTextFragmentFlush = async (entry)=>{
        await queueBufferedProcessing(textFragmentProcessingByKey, entry.key, async ()=>{
            await flushTextFragments(entry);
        });
    };
    const runTextFragmentFlush = async (entry)=>{
        textFragmentBuffer.delete(entry.key);
        await queueTextFragmentFlush(entry);
    };
    const scheduleTextFragmentFlush = (entry)=>{
        clearTimeout(entry.timer);
        entry.timer = setTimeout(()=>{
            void runTextFragmentFlush(entry);
        }, TELEGRAM_TEXT_FRAGMENT_MAX_GAP_MS);
    };
    const loadStoreAllowFrom = async (msg)=>{
        const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
        const { groupConfig, topicConfig } = resolveTelegramGroupConfig(msg.chat.id, msg.message_thread_id);
        const groupAllowOverride = (0, _botaccess.firstDefined)(topicConfig?.allowFrom, groupConfig?.allowFrom);
        const effectiveDmPolicy = (0, _botaccess.resolveTelegramEffectiveDmPolicy)({
            isGroup,
            groupConfig,
            dmPolicy: telegramCfg.dmPolicy
        });
        return (0, _helpers.loadTelegramPairingStoreIfNeeded)({
            cfg,
            allowFrom,
            groupAllowOverride,
            accountId,
            senderId: msg.from?.id != null ? String(msg.from.id) : undefined,
            isGroup,
            effectiveDmPolicy,
            readChannelAllowFromStore: telegramDeps.readChannelAllowFromStore
        });
    };
    const recordMessageForReplyChain = (msg, threadId)=>messageCache.record({
            accountId,
            chatId: msg.chat.id,
            msg,
            ...threadId != null ? {
                threadId
            } : {}
        });
    const buildReplyChainForMessage = (msg)=>(0, _messagecache.buildTelegramReplyChain)({
            cache: messageCache,
            accountId,
            chatId: msg.chat.id,
            msg
        });
    const toReplyChainEntry = (node, media)=>{
        const { sourceMessage: _sourceMessage, ...entry } = node;
        return {
            ...entry,
            ...media?.path ? {
                mediaPath: media.path
            } : {},
            ...media?.contentType ? {
                mediaType: media.contentType
            } : {}
        };
    };
    const toPromptContextMessage = (node, flags)=>({
            message_id: node.messageId,
            thread_id: node.threadId,
            sender: node.sender,
            sender_id: node.senderId,
            sender_username: node.senderUsername,
            timestamp_ms: node.timestamp,
            body: node.body,
            media_type: node.mediaType,
            media_ref: node.mediaRef,
            reply_to_id: node.replyToId,
            is_reply_target: flags?.replyTarget === true ? true : undefined
        });
    const buildPromptContextForMessage = async (msg, replyChainNodes, options)=>{
        const messageId = typeof msg.message_id === "number" ? String(msg.message_id) : undefined;
        const currentNode = await messageCache.get({
            accountId,
            chatId: msg.chat.id,
            messageId
        });
        const threadId = currentNode?.threadId ? Number(currentNode.threadId) : undefined;
        const conversationContext = await (0, _messagecache.buildTelegramConversationContext)({
            cache: messageCache,
            messageId,
            accountId,
            chatId: msg.chat.id,
            ...Number.isFinite(threadId) ? {
                threadId
            } : {},
            replyChainNodes,
            recentLimit: 10,
            replyTargetWindowSize: 2,
            ...options?.promptContextMinTimestampMs !== undefined ? {
                minTimestampMs: options.promptContextMinTimestampMs
            } : {}
        });
        return conversationContext.length > 0 ? [
            {
                label: "Conversation context",
                source: "telegram",
                type: "chat_window",
                payload: {
                    order: "chronological",
                    relation: "selected_for_current_message",
                    messages: conversationContext.map((entry)=>toPromptContextMessage(entry.node, {
                            replyTarget: entry.isReplyTarget
                        }))
                }
            }
        ] : [];
    };
    const resolveReplyMediaForChain = async (ctx, chain)=>{
        const replyMedia = [];
        const replyChain = [];
        for (const node of chain){
            let mediaRef;
            const replyFileId = (0, _bothandlersmedia.resolveInboundMediaFileId)(node.sourceMessage);
            if (replyFileId && (0, _bothandlersmedia.hasInboundMedia)(node.sourceMessage)) {
                try {
                    const media = await (0, _deliveryresolvemedia.resolveMedia)({
                        ctx: {
                            message: node.sourceMessage,
                            me: ctx.me,
                            getFile: async ()=>await bot.api.getFile(replyFileId)
                        },
                        maxBytes: mediaMaxBytes,
                        ...mediaRuntimeOptions
                    });
                    mediaRef = media ? {
                        path: media.path,
                        ...media.contentType ? {
                            contentType: media.contentType
                        } : {},
                        ...media.stickerMetadata ? {
                            stickerMetadata: media.stickerMetadata
                        } : {}
                    } : undefined;
                } catch (err) {
                    logger.warn({
                        chatId: ctx.message.chat.id,
                        error: String(err)
                    }, "reply media fetch failed");
                }
            }
            if (mediaRef) {
                replyMedia.push(mediaRef);
            }
            replyChain.push(toReplyChainEntry(node, mediaRef));
        }
        return {
            replyMedia,
            replyChain
        };
    };
    const processMessageWithReplyChain = async (params)=>{
        let dispatchDedupeCommitted = false;
        try {
            const replyChainNodes = await buildReplyChainForMessage(params.msg);
            const { replyMedia, replyChain } = await resolveReplyMediaForChain(params.ctx, replyChainNodes);
            const promptContext = await buildPromptContextForMessage(params.msg, replyChainNodes, params.options);
            const dispatched = await processMessage(params.ctx, params.allMedia, params.storeAllowFrom, params.options, replyMedia, replyChain, promptContext, {
                onDispatchStart: async ()=>{
                    await commitDispatchDedupeKeys(params.dispatchDedupeKeys ?? []);
                    dispatchDedupeCommitted = true;
                }
            });
            if (!dispatched && !dispatchDedupeCommitted) {
                releaseDispatchDedupeKeys(params.dispatchDedupeKeys ?? []);
            }
        } catch (err) {
            if (!dispatchDedupeCommitted) {
                releaseDispatchDedupeKeys(params.dispatchDedupeKeys ?? [], err);
            }
            throw err;
        }
    };
    const shouldSkipGroupMessage = (params)=>{
        const { isGroup, chatId, chatTitle, resolvedThreadId, senderId, senderUsername, effectiveGroupAllow, hasGroupAllowOverride, groupConfig, topicConfig } = params;
        const baseAccess = (0, _groupaccess.evaluateTelegramGroupBaseAccess)({
            isGroup,
            groupConfig,
            topicConfig,
            hasGroupAllowOverride,
            effectiveGroupAllow,
            senderId,
            senderUsername,
            enforceAllowOverride: true,
            requireSenderForAllowOverride: true
        });
        if (!baseAccess.allowed) {
            if (baseAccess.reason === "group-disabled") {
                (0, _runtimeenv.logVerbose)(`Blocked telegram group ${chatId} (group disabled)`);
                return true;
            }
            if (baseAccess.reason === "topic-disabled") {
                (0, _runtimeenv.logVerbose)(`Blocked telegram topic ${chatId} (${resolvedThreadId ?? "unknown"}) (topic disabled)`);
                return true;
            }
            (0, _runtimeenv.logVerbose)(`Blocked telegram group sender ${senderId || "unknown"} (group allowFrom override)`);
            return true;
        }
        if (!isGroup) {
            return false;
        }
        const policyAccess = (0, _groupaccess.evaluateTelegramGroupPolicyAccess)({
            isGroup,
            chatId,
            cfg,
            telegramCfg,
            topicConfig,
            groupConfig,
            effectiveGroupAllow,
            senderId,
            senderUsername,
            resolveGroupPolicy,
            enforcePolicy: true,
            useTopicAndGroupOverrides: true,
            enforceAllowlistAuthorization: true,
            allowEmptyAllowlistEntries: false,
            requireSenderForAllowlistAuthorization: true,
            checkChatAllowlist: true
        });
        if (!policyAccess.allowed) {
            if (policyAccess.reason === "group-policy-disabled") {
                (0, _runtimeenv.logVerbose)("Blocked telegram group message (groupPolicy: disabled)");
                return true;
            }
            if (policyAccess.reason === "group-policy-allowlist-no-sender") {
                (0, _runtimeenv.logVerbose)("Blocked telegram group message (no sender ID, groupPolicy: allowlist)");
                return true;
            }
            if (policyAccess.reason === "group-policy-allowlist-empty") {
                (0, _runtimeenv.logVerbose)("Blocked telegram group message (groupPolicy: allowlist, no group allowlist entries)");
                return true;
            }
            if (policyAccess.reason === "group-policy-allowlist-unauthorized") {
                (0, _runtimeenv.logVerbose)(`Blocked telegram group message from ${senderId} (groupPolicy: allowlist)`);
                return true;
            }
            logger.info({
                chatId,
                title: chatTitle,
                reason: "not-allowed"
            }, "skipping group message");
            return true;
        }
        return false;
    };
    const getChat = typeof bot.api.getChat === "function" ? bot.api.getChat.bind(bot.api) : undefined;
    const TELEGRAM_EVENT_AUTH_RULES = {
        reaction: {
            enforceDirectAuthorization: true,
            enforceGroupAllowlistAuthorization: false,
            deniedDmReason: "reaction unauthorized by dm policy/allowlist",
            deniedGroupReason: "reaction unauthorized by group allowlist"
        },
        "callback-scope": {
            enforceDirectAuthorization: false,
            enforceGroupAllowlistAuthorization: false,
            deniedDmReason: "callback unauthorized by inlineButtonsScope",
            deniedGroupReason: "callback unauthorized by inlineButtonsScope"
        },
        "callback-allowlist": {
            enforceDirectAuthorization: true,
            // Group auth is already enforced by shouldSkipGroupMessage (group policy + allowlist).
            // An extra allowlist gate here would block users whose original command was authorized.
            enforceGroupAllowlistAuthorization: false,
            deniedDmReason: "callback unauthorized by inlineButtonsScope allowlist",
            deniedGroupReason: "callback unauthorized by inlineButtonsScope allowlist"
        }
    };
    let TelegramRetryableCallbackError = class TelegramRetryableCallbackError extends Error {
        constructor(cause){
            super(String(cause));
            this.cause = cause;
            this.name = "TelegramRetryableCallbackError";
        }
    };
    const TELEGRAM_PERMANENT_CALLBACK_EDIT_ERROR_RE = /400:\s*Bad Request:\s*message to edit not found|400:\s*Bad Request:\s*there is no text in the message to edit|MESSAGE_ID_INVALID|400:\s*Bad Request:\s*message can't be edited/i;
    const isPermanentTelegramCallbackEditError = (err)=>TELEGRAM_PERMANENT_CALLBACK_EDIT_ERROR_RE.test(String(err));
    const resolveTelegramEventAuthorizationContext = async (params)=>{
        const groupAllowContext = params.groupAllowContext ?? await (0, _helpers.resolveTelegramGroupAllowFromContext)({
            cfg,
            chatId: params.chatId,
            accountId,
            dmPolicy: telegramCfg.dmPolicy,
            allowFrom,
            senderId: params.senderId,
            isGroup: params.isGroup,
            isForum: params.isForum,
            messageThreadId: params.messageThreadId,
            groupAllowFrom,
            readChannelAllowFromStore: telegramDeps.readChannelAllowFromStore,
            resolveTelegramGroupConfig
        });
        const effectiveDmPolicy = (0, _botaccess.resolveTelegramEffectiveDmPolicy)({
            isGroup: params.isGroup,
            groupConfig: groupAllowContext.groupConfig,
            dmPolicy: telegramCfg.dmPolicy
        });
        return {
            dmPolicy: effectiveDmPolicy,
            ...groupAllowContext
        };
    };
    const authorizeTelegramEventSender = async (params)=>{
        const { chatId, chatTitle, isGroup, senderId, senderUsername, mode, context } = params;
        const { dmPolicy, resolvedThreadId, storeAllowFrom, groupConfig, topicConfig, groupAllowOverride, effectiveGroupAllow, hasGroupAllowOverride } = context;
        const authRules = TELEGRAM_EVENT_AUTH_RULES[mode];
        const { enforceDirectAuthorization, enforceGroupAllowlistAuthorization, deniedDmReason, deniedGroupReason } = authRules;
        if (shouldSkipGroupMessage({
            isGroup,
            chatId,
            chatTitle,
            resolvedThreadId,
            senderId,
            senderUsername,
            effectiveGroupAllow,
            hasGroupAllowOverride,
            groupConfig,
            topicConfig
        })) {
            return false;
        }
        if (!isGroup && enforceDirectAuthorization) {
            // For DMs, prefer per-DM/topic allowFrom (groupAllowOverride) over account-level allowFrom.
            const dmAllowFrom = groupAllowOverride ?? allowFrom;
            const expandedDmAllowFrom = await (0, _accessgroups.expandTelegramAllowFromWithAccessGroups)({
                cfg,
                allowFrom: dmAllowFrom,
                accountId,
                senderId
            });
            const effectiveDmAllow = (0, _botaccess.normalizeDmAllowFromWithStore)({
                allowFrom: expandedDmAllowFrom,
                storeAllowFrom,
                dmPolicy
            });
            const eventAccess = await (0, _ingress.resolveTelegramEventIngressAuthorization)({
                accountId,
                dmPolicy,
                isGroup,
                chatId,
                resolvedThreadId,
                senderId,
                effectiveDmAllow,
                effectiveGroupAllow,
                enforceGroupAuthorization: false,
                eventKind: mode === "reaction" ? "reaction" : "button"
            });
            if (eventAccess.decision !== "allow") {
                if (eventAccess.reasonCode === "dm_policy_disabled") {
                    (0, _runtimeenv.logVerbose)(`Blocked telegram direct event from ${senderId || "unknown"} (${deniedDmReason})`);
                    return false;
                }
                (0, _runtimeenv.logVerbose)(`Blocked telegram direct sender ${senderId || "unknown"} (${deniedDmReason})`);
                return false;
            }
        }
        if (isGroup && enforceGroupAllowlistAuthorization) {
            const eventAccess = await (0, _ingress.resolveTelegramEventIngressAuthorization)({
                accountId,
                dmPolicy,
                isGroup,
                chatId,
                resolvedThreadId,
                senderId,
                effectiveDmAllow: (0, _botaccess.normalizeDmAllowFromWithStore)({
                    allowFrom: [],
                    dmPolicy
                }),
                effectiveGroupAllow,
                enforceGroupAuthorization: true,
                eventKind: mode === "reaction" ? "reaction" : "button"
            });
            if (eventAccess.decision !== "allow") {
                (0, _runtimeenv.logVerbose)(`Blocked telegram group sender ${senderId || "unknown"} (${deniedGroupReason})`);
                return false;
            }
        }
        return true;
    };
    const isTelegramModelCallbackAuthorized = async (params)=>{
        const { chatId, isGroup, senderId, senderUsername, context, cfg: cfgLocal } = params;
        const dmAllowFrom = context.groupAllowOverride ?? allowFrom;
        if ((0, _helpers.isTelegramCommandsAllowFromConfigured)(cfgLocal)) {
            return (0, _helpers.resolveTelegramCommandAuthorization)({
                cfg: cfgLocal,
                accountId,
                chatId,
                isGroup,
                resolvedThreadId: context.resolvedThreadId,
                senderId,
                senderUsername
            }).isAuthorizedSender;
        }
        const expandedDmAllowFrom = await (0, _accessgroups.expandTelegramAllowFromWithAccessGroups)({
            cfg: cfgLocal,
            allowFrom: dmAllowFrom,
            accountId,
            senderId
        });
        const dmAllow = (0, _botaccess.normalizeDmAllowFromWithStore)({
            allowFrom: expandedDmAllowFrom,
            storeAllowFrom: isGroup ? [] : context.storeAllowFrom,
            dmPolicy: context.dmPolicy
        });
        return (await (0, _ingress.resolveTelegramCommandIngressAuthorization)({
            accountId,
            cfg: cfgLocal,
            dmPolicy: context.dmPolicy,
            isGroup,
            chatId,
            resolvedThreadId: context.resolvedThreadId,
            senderId,
            effectiveDmAllow: dmAllow,
            effectiveGroupAllow: context.effectiveGroupAllow,
            ownerAccess: {
                ownerList: [],
                senderIsOwner: false
            },
            eventKind: "button"
        })).authorized;
    };
    // Handle emoji reactions to messages.
    bot.on("message_reaction", async (ctx)=>{
        try {
            const reaction = ctx.messageReaction;
            if (!reaction) {
                return;
            }
            if (shouldSkipUpdate(ctx)) {
                return;
            }
            const chatId = reaction.chat.id;
            const messageId = reaction.message_id;
            const user = reaction.user;
            const senderId = user?.id != null ? String(user.id) : "";
            const senderUsername = user?.username ?? "";
            const isGroup = reaction.chat.type === "group" || reaction.chat.type === "supergroup";
            const isForum = reaction.chat.is_forum === true;
            // Resolve reaction notification mode (default: "own").
            const reactionMode = telegramCfg.reactionNotifications ?? "own";
            if (reactionMode === "off") {
                return;
            }
            if (user?.is_bot) {
                return;
            }
            if (reactionMode === "own" && !telegramDeps.wasSentByBot(chatId, messageId, cfg)) {
                (0, _runtimeenv.logVerbose)(`telegram: skipped reaction on msg ${messageId} in chat ${chatId} (own mode, not sent by bot)`);
                return;
            }
            const eventAuthContext = await resolveTelegramEventAuthorizationContext({
                chatId,
                isGroup,
                isForum,
                senderId
            });
            const senderAuthorization = await authorizeTelegramEventSender({
                chatId,
                chatTitle: reaction.chat.title,
                isGroup,
                senderId,
                senderUsername,
                mode: "reaction",
                context: eventAuthContext
            });
            if (!senderAuthorization) {
                return;
            }
            // Enforce requireTopic for DM reactions: since Telegram doesn't provide messageThreadId
            // for reactions, we cannot determine if the reaction came from a topic, so block all
            // reactions if requireTopic is enabled for this DM.
            if (!isGroup) {
                const requireTopic = eventAuthContext.groupConfig?.requireTopic;
                if (requireTopic === true) {
                    (0, _runtimeenv.logVerbose)(`Blocked telegram reaction in DM ${chatId}: requireTopic=true but topic unknown for reactions`);
                    return;
                }
            }
            // Detect added reactions.
            const oldEmojis = new Set(reaction.old_reaction.filter((r)=>r.type === "emoji").map((r)=>r.emoji));
            const addedReactions = reaction.new_reaction.filter((r)=>r.type === "emoji").filter((r)=>!oldEmojis.has(r.emoji));
            if (addedReactions.length === 0) {
                return;
            }
            // Build sender label.
            const senderName = user ? [
                user.first_name,
                user.last_name
            ].filter(Boolean).join(" ").trim() || user.username : undefined;
            const senderUsernameLabel = user?.username ? `@${user.username}` : undefined;
            let senderLabel = senderName;
            if (senderName && senderUsernameLabel) {
                senderLabel = `${senderName} (${senderUsernameLabel})`;
            } else if (!senderName && senderUsernameLabel) {
                senderLabel = senderUsernameLabel;
            }
            if (!senderLabel && user?.id) {
                senderLabel = `id:${user.id}`;
            }
            senderLabel = senderLabel || "unknown";
            // Reactions target a specific message_id; the Telegram Bot API does not include
            // message_thread_id on MessageReactionUpdated, so we route to the chat-level
            // session (forum topic routing is not available for reactions).
            const resolvedThreadId = isForum ? (0, _helpers.resolveTelegramForumThreadId)({
                isForum,
                messageThreadId: undefined
            }) : undefined;
            const peerId = isGroup ? (0, _helpers.buildTelegramGroupPeerId)(chatId, resolvedThreadId) : String(chatId);
            const parentPeer = (0, _helpers.buildTelegramParentPeer)({
                isGroup,
                resolvedThreadId,
                chatId
            });
            // Fresh config for bindings lookup; other routing inputs are payload-derived.
            const route = (0, _routing.resolveAgentRoute)({
                cfg: telegramDeps.getRuntimeConfig(),
                channel: "telegram",
                accountId,
                peer: {
                    kind: isGroup ? "group" : "direct",
                    id: peerId
                },
                parentPeer
            });
            const sessionKey = route.sessionKey;
            // Enqueue system event for each added reaction.
            for (const r of addedReactions){
                const emoji = r.emoji;
                const text = `Telegram reaction added: ${emoji} by ${senderLabel} on msg ${messageId}`;
                telegramDeps.enqueueSystemEvent(text, {
                    sessionKey,
                    contextKey: `telegram:reaction:add:${chatId}:${messageId}:${user?.id ?? "anon"}:${emoji}`
                });
                (0, _runtimeenv.logVerbose)(`telegram: reaction event enqueued: ${text}`);
            }
        } catch (err) {
            runtime.error?.((0, _runtimeenv.danger)(`telegram reaction handler failed: ${String(err)}`));
            throw err;
        }
    });
    const processInboundMessage = async (params)=>{
        const { ctx, msg, chatId, isGroup, isForum, resolvedThreadId, dmThreadId, dmPolicy, storeAllowFrom, senderId, effectiveGroupAllow, effectiveDmAllow, groupConfig, topicConfig, sendOversizeWarning, oversizeLogMessage, promptContextMinTimestampMs, dispatchDedupeKeys } = params;
        const messageText = (0, _helpers.getTelegramTextParts)(msg).text;
        const botUsername = ctx.me?.username;
        const isAbortControlMessage = (0, _commandprimitivesruntime.isAbortRequestText)(messageText, {
            botUsername
        });
        let abortControlAuthorized;
        const isAuthorizedAbortControlMessage = ()=>{
            if (!isAbortControlMessage || !senderId) {
                return Promise.resolve(false);
            }
            abortControlAuthorized ??= (0, _ingress.resolveTelegramCommandIngressAuthorization)({
                accountId,
                cfg,
                dmPolicy,
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
                hasControlCommand: true,
                modeWhenAccessGroupsOff: "allow",
                includeDmAllowForGroupCommands: false
            }).then((gate)=>gate.authorized);
            return abortControlAuthorized;
        };
        // Text fragment handling - Telegram splits long pastes into multiple inbound messages (~4096 chars).
        // We buffer “near-limit” messages and append immediately-following parts.
        const text = typeof msg.text === "string" ? msg.text : undefined;
        const isCommandLike = (text ?? "").trim().startsWith("/");
        if (text && !isCommandLike && !isAbortControlMessage) {
            const nowMs = Date.now();
            const senderIdValue = msg.from?.id != null ? String(msg.from.id) : "unknown";
            // Use resolvedThreadId for forum groups, dmThreadId for DM topics
            const threadId = resolvedThreadId ?? dmThreadId;
            const key = `text:${chatId}:${threadId ?? "main"}:${senderIdValue}`;
            const existing = textFragmentBuffer.get(key);
            if (existing) {
                const last = existing.messages.at(-1);
                const lastMsgId = last?.msg.message_id;
                const lastReceivedAtMs = last?.receivedAtMs ?? nowMs;
                const idGap = typeof lastMsgId === "number" ? msg.message_id - lastMsgId : Infinity;
                const timeGapMs = nowMs - lastReceivedAtMs;
                const canAppend = idGap > 0 && idGap <= TELEGRAM_TEXT_FRAGMENT_MAX_ID_GAP && timeGapMs >= 0 && timeGapMs <= TELEGRAM_TEXT_FRAGMENT_MAX_GAP_MS;
                if (canAppend) {
                    const currentTotalChars = existing.messages.reduce((sum, m)=>sum + (m.msg.text?.length ?? 0), 0);
                    const nextTotalChars = currentTotalChars + text.length;
                    if (existing.messages.length + 1 <= TELEGRAM_TEXT_FRAGMENT_MAX_PARTS && nextTotalChars <= TELEGRAM_TEXT_FRAGMENT_MAX_TOTAL_CHARS) {
                        existing.messages.push({
                            msg,
                            ctx,
                            receivedAtMs: nowMs
                        });
                        existing.promptContextMinTimestampMs = latestPromptContextMinTimestampMs(existing.promptContextMinTimestampMs, promptContextMinTimestampMs);
                        existing.dispatchDedupeKeys = mergeDispatchDedupeKeys(existing.dispatchDedupeKeys, dispatchDedupeKeys);
                        scheduleTextFragmentFlush(existing);
                        return;
                    }
                }
                // Not appendable (or limits exceeded): flush buffered entry first, then continue normally.
                clearTimeout(existing.timer);
                textFragmentBuffer.delete(key);
                await queueTextFragmentFlush(existing);
            }
            const shouldStart = text.length >= TELEGRAM_TEXT_FRAGMENT_START_THRESHOLD_CHARS;
            if (shouldStart) {
                const entry = {
                    key,
                    messages: [
                        {
                            msg,
                            ctx,
                            receivedAtMs: nowMs
                        }
                    ],
                    dispatchDedupeKeys,
                    ...promptContextBoundaryOptions(promptContextMinTimestampMs),
                    timer: setTimeout(()=>{}, TELEGRAM_TEXT_FRAGMENT_MAX_GAP_MS)
                };
                textFragmentBuffer.set(key, entry);
                scheduleTextFragmentFlush(entry);
                return;
            }
        } else if (text && isAbortControlMessage && await isAuthorizedAbortControlMessage()) {
            const senderIdLocal = msg.from?.id != null ? String(msg.from.id) : "unknown";
            const threadId = resolvedThreadId ?? dmThreadId;
            const key = `text:${chatId}:${threadId ?? "main"}:${senderIdLocal}`;
            const existing = textFragmentBuffer.get(key);
            if (existing) {
                clearTimeout(existing.timer);
                textFragmentBuffer.delete(key);
                releaseDispatchDedupeKeys(existing.dispatchDedupeKeys);
            }
        }
        // Media group handling - buffer multi-image messages
        const mediaGroupId = msg.media_group_id;
        if (mediaGroupId) {
            const threadId = resolvedThreadId ?? dmThreadId;
            const mediaGroupKey = `media:${chatId}:${threadId ?? "main"}:${mediaGroupId}`;
            const existing = mediaGroupBuffer.get(mediaGroupKey);
            if (existing) {
                clearTimeout(existing.timer);
                existing.messages.push({
                    msg,
                    ctx
                });
                existing.promptContextMinTimestampMs = latestPromptContextMinTimestampMs(existing.promptContextMinTimestampMs, promptContextMinTimestampMs);
                existing.dispatchDedupeKeys = mergeDispatchDedupeKeys(existing.dispatchDedupeKeys, dispatchDedupeKeys);
                existing.timer = setTimeout(()=>{
                    mediaGroupBuffer.delete(mediaGroupKey);
                    void queueBufferedProcessing(mediaGroupProcessingByKey, mediaGroupKey, async ()=>{
                        await processMediaGroup(existing);
                    });
                }, mediaGroupTimeoutMs);
            } else {
                const entry = {
                    messages: [
                        {
                            msg,
                            ctx
                        }
                    ],
                    storeAllowFrom,
                    isGroup,
                    isForum,
                    resolvedThreadId,
                    dmThreadId,
                    senderId,
                    effectiveGroupAllow,
                    effectiveDmAllow,
                    groupConfig,
                    topicConfig,
                    dispatchDedupeKeys,
                    ...promptContextBoundaryOptions(promptContextMinTimestampMs),
                    timer: setTimeout(()=>{
                        mediaGroupBuffer.delete(mediaGroupKey);
                        void queueBufferedProcessing(mediaGroupProcessingByKey, mediaGroupKey, async ()=>{
                            await processMediaGroup(entry);
                        });
                    }, mediaGroupTimeoutMs)
                };
                mediaGroupBuffer.set(mediaGroupKey, entry);
            }
            return;
        }
        if (await shouldSkipMediaDownloadForUnaddressedMentionGroup({
            ctx,
            msg,
            chatId,
            isGroup,
            isForum,
            resolvedThreadId,
            dmThreadId,
            senderId,
            effectiveGroupAllow,
            effectiveDmAllow,
            groupConfig,
            topicConfig
        })) {
            releaseDispatchDedupeKeys(dispatchDedupeKeys);
            return;
        }
        let media;
        try {
            media = await (0, _deliveryresolvemedia.resolveMedia)({
                ctx,
                maxBytes: mediaMaxBytes,
                ...mediaRuntimeOptions
            });
        } catch (mediaErr) {
            if ((0, _bothandlersmedia.isMediaSizeLimitError)(mediaErr)) {
                if (sendOversizeWarning) {
                    const limitMb = Math.round(mediaMaxBytes / (1024 * 1024));
                    await (0, _apilogging.withTelegramApiErrorLogging)({
                        operation: "sendMessage",
                        runtime,
                        fn: ()=>bot.api.sendMessage(chatId, `⚠️ File too large. Maximum size is ${limitMb}MB.`, {
                                reply_parameters: {
                                    message_id: msg.message_id,
                                    allow_sending_without_reply: true
                                }
                            })
                    }).catch(()=>{});
                }
                logger.warn({
                    chatId,
                    error: String(mediaErr)
                }, oversizeLogMessage);
                releaseDispatchDedupeKeys(dispatchDedupeKeys);
                return;
            }
            logger.warn({
                chatId,
                error: String(mediaErr)
            }, "media fetch failed");
            await (0, _apilogging.withTelegramApiErrorLogging)({
                operation: "sendMessage",
                runtime,
                fn: ()=>bot.api.sendMessage(chatId, "⚠️ Failed to download media. Please try again.", {
                        reply_parameters: {
                            message_id: msg.message_id,
                            allow_sending_without_reply: true
                        }
                    })
            }).catch(()=>{});
            releaseDispatchDedupeKeys(dispatchDedupeKeys);
            return;
        }
        // Skip sticker-only messages where the sticker was skipped (animated/video)
        // These have no media and no text content to process.
        const hasText = Boolean((0, _helpers.getTelegramTextParts)(msg).text.trim());
        if (msg.sticker && !media && !hasText) {
            (0, _runtimeenv.logVerbose)("telegram: skipping sticker-only message (unsupported sticker type)");
            releaseDispatchDedupeKeys(dispatchDedupeKeys);
            return;
        }
        const allMedia = media ? [
            {
                path: media.path,
                contentType: media.contentType,
                stickerMetadata: media.stickerMetadata
            }
        ] : [];
        const conversationKey = (0, _bothandlersdebouncekey.buildTelegramInboundDebounceConversationKey)({
            chatId,
            threadId: resolvedThreadId ?? dmThreadId
        });
        const debounceLane = resolveTelegramDebounceLane(msg);
        const debounceKey = senderId ? (0, _bothandlersdebouncekey.buildTelegramInboundDebounceKey)({
            accountId,
            conversationKey,
            senderId,
            debounceLane
        }) : null;
        if (senderId && await isAuthorizedAbortControlMessage()) {
            for (const lane of [
                "default",
                "forward"
            ]){
                inboundDebouncer.cancelKey((0, _bothandlersdebouncekey.buildTelegramInboundDebounceKey)({
                    accountId,
                    conversationKey,
                    senderId,
                    debounceLane: lane
                }));
            }
        }
        await inboundDebouncer.enqueue({
            ctx,
            msg,
            allMedia,
            storeAllowFrom,
            receivedAtMs: Date.now(),
            debounceKey: isAbortControlMessage ? null : debounceKey,
            debounceLane,
            botUsername,
            ...promptContextBoundaryOptions(promptContextMinTimestampMs),
            dispatchDedupeKeys
        });
    };
    bot.on("callback_query", async (ctx)=>{
        const callback = ctx.callbackQuery;
        if (!callback) {
            return;
        }
        if (shouldSkipUpdate(ctx)) {
            return;
        }
        const answerCallbackQuery = typeof ctx.answerCallbackQuery === "function" ? ()=>ctx.answerCallbackQuery() : ()=>bot.api.answerCallbackQuery(callback.id);
        // Answer immediately to prevent Telegram from retrying while we process
        await (0, _apilogging.withTelegramApiErrorLogging)({
            operation: "answerCallbackQuery",
            runtime,
            fn: answerCallbackQuery
        }).catch(()=>{});
        try {
            const data = (callback.data ?? "").trim();
            const callbackMessage = callback.message;
            if (!data || !callbackMessage) {
                return;
            }
            const editCallbackMessage = async (text, params)=>{
                const editTextFn = ctx.editMessageText;
                if (typeof editTextFn === "function") {
                    return await ctx.editMessageText(text, params);
                }
                return await bot.api.editMessageText(callbackMessage.chat.id, callbackMessage.message_id, text, params);
            };
            const clearCallbackButtons = async ()=>{
                const emptyKeyboard = {
                    inline_keyboard: []
                };
                const replyMarkup = {
                    reply_markup: emptyKeyboard
                };
                const editReplyMarkupFn = ctx.editMessageReplyMarkup;
                if (typeof editReplyMarkupFn === "function") {
                    return await ctx.editMessageReplyMarkup(replyMarkup);
                }
                const apiEditReplyMarkupFn = bot.api.editMessageReplyMarkup;
                if (typeof apiEditReplyMarkupFn === "function") {
                    return await bot.api.editMessageReplyMarkup(callbackMessage.chat.id, callbackMessage.message_id, replyMarkup);
                }
                // Fallback path for older clients that do not expose editMessageReplyMarkup.
                const messageText = callbackMessage.text ?? callbackMessage.caption;
                if (typeof messageText !== "string" || messageText.trim().length === 0) {
                    return undefined;
                }
                return await editCallbackMessage(messageText, replyMarkup);
            };
            const editCallbackButtons = async (buttons)=>{
                const keyboard = (0, _send.buildInlineKeyboard)(buttons) ?? {
                    inline_keyboard: []
                };
                const replyMarkup = {
                    reply_markup: keyboard
                };
                const editReplyMarkupFn = ctx.editMessageReplyMarkup;
                if (typeof editReplyMarkupFn === "function") {
                    return await ctx.editMessageReplyMarkup(replyMarkup);
                }
                return await bot.api.editMessageReplyMarkup(callbackMessage.chat.id, callbackMessage.message_id, replyMarkup);
            };
            const deleteCallbackMessage = async ()=>{
                const deleteFn = ctx.deleteMessage;
                if (typeof deleteFn === "function") {
                    return await ctx.deleteMessage();
                }
                return await bot.api.deleteMessage(callbackMessage.chat.id, callbackMessage.message_id);
            };
            const replyToCallbackChat = async (text, params)=>{
                const replyFn = ctx.reply;
                if (typeof replyFn === "function") {
                    return await ctx.reply(text, params);
                }
                return await bot.api.sendMessage(callbackMessage.chat.id, text, params);
            };
            const chatId = callbackMessage.chat.id;
            const isGroup = callbackMessage.chat.type === "group" || callbackMessage.chat.type === "supergroup";
            const nativeCallbackCommand = (0, _botnativecommands.parseTelegramNativeCommandCallbackData)(data);
            const opaqueCallbackData = (0, _nativecommandcallbackdata.parseTelegramOpaqueCallbackData)(data);
            const callbackCommandText = nativeCallbackCommand ?? (opaqueCallbackData ? "" : data);
            const pluginCallbackData = opaqueCallbackData ?? data;
            const approvalCallback = (0, _approvalreplyruntime.parseExecApprovalCommandText)(nativeCallbackCommand ?? (opaqueCallbackData ? "" : data));
            const isApprovalCallback = approvalCallback !== null;
            const inlineButtonsScope = (0, _inlinebuttons.resolveTelegramInlineButtonsScope)({
                cfg,
                accountId
            });
            const execApprovalButtonsEnabled = isApprovalCallback && (0, _execapprovals.shouldEnableTelegramExecApprovalButtons)({
                cfg,
                accountId,
                to: String(chatId)
            });
            if (!execApprovalButtonsEnabled) {
                if (inlineButtonsScope === "off") {
                    return;
                }
                if (inlineButtonsScope === "dm" && isGroup) {
                    return;
                }
                if (inlineButtonsScope === "group" && !isGroup) {
                    return;
                }
            }
            const messageThreadId = callbackMessage.message_thread_id;
            const isForum = await (0, _helpers.resolveTelegramForumFlag)({
                chatId,
                chatType: callbackMessage.chat.type,
                isGroup,
                isForum: callbackMessage.chat.is_forum,
                isTopicMessage: callbackMessage.is_topic_message,
                getChat
            });
            const senderId = callback.from?.id ? String(callback.from.id) : "";
            const senderUsername = callback.from?.username ?? "";
            const eventAuthContext = await resolveTelegramEventAuthorizationContext({
                chatId,
                isGroup,
                isForum,
                senderId,
                messageThreadId
            });
            const { resolvedThreadId, dmThreadId, storeAllowFrom, groupConfig } = eventAuthContext;
            const requireTopic = groupConfig?.requireTopic;
            if (!isGroup && requireTopic === true && dmThreadId == null) {
                (0, _runtimeenv.logVerbose)(`Blocked telegram callback in DM ${chatId}: requireTopic=true but no topic present`);
                return;
            }
            const authorizationMode = !isGroup || !execApprovalButtonsEnabled && inlineButtonsScope === "allowlist" ? "callback-allowlist" : "callback-scope";
            const senderAuthorization = await authorizeTelegramEventSender({
                chatId,
                chatTitle: callbackMessage.chat.title,
                isGroup,
                senderId,
                senderUsername,
                mode: authorizationMode,
                context: eventAuthContext
            });
            if (!senderAuthorization) {
                return;
            }
            const callbackThreadId = resolvedThreadId ?? dmThreadId;
            const callbackConversationId = callbackThreadId != null ? `${chatId}:topic:${callbackThreadId}` : String(chatId);
            const pluginBindingApproval = (0, _conversationruntime.parsePluginBindingApprovalCustomId)(data);
            if (pluginBindingApproval) {
                let resolved;
                try {
                    resolved = await (0, _conversationruntime.resolvePluginConversationBindingApproval)({
                        approvalId: pluginBindingApproval.approvalId,
                        decision: pluginBindingApproval.decision,
                        senderId: senderId || undefined
                    });
                } catch (err) {
                    throw new TelegramRetryableCallbackError(err);
                }
                await clearCallbackButtons();
                await replyToCallbackChat((0, _conversationruntime.buildPluginBindingResolvedText)(resolved));
                return;
            }
            const runtimeCfg = telegramDeps.getRuntimeConfig();
            const pluginCallback = await (0, _interactivedispatch.dispatchTelegramPluginInteractiveHandler)({
                data: pluginCallbackData,
                callbackId: callback.id,
                ctx: {
                    accountId,
                    callbackId: callback.id,
                    conversationId: callbackConversationId,
                    parentConversationId: callbackThreadId != null ? String(chatId) : undefined,
                    senderId: senderId || undefined,
                    senderUsername: senderUsername || undefined,
                    threadId: callbackThreadId,
                    isGroup,
                    isForum,
                    auth: {
                        isAuthorizedSender: await isTelegramModelCallbackAuthorized({
                            chatId,
                            isGroup,
                            senderId,
                            senderUsername,
                            context: eventAuthContext,
                            cfg: runtimeCfg
                        })
                    },
                    callbackMessage: {
                        messageId: callbackMessage.message_id,
                        chatId: String(chatId),
                        messageText: callbackMessage.text ?? callbackMessage.caption
                    }
                },
                respond: {
                    reply: async ({ text, buttons })=>{
                        await replyToCallbackChat(text, buttons ? {
                            reply_markup: (0, _send.buildInlineKeyboard)(buttons)
                        } : undefined);
                    },
                    editMessage: async ({ text, buttons })=>{
                        await editCallbackMessage(text, buttons ? {
                            reply_markup: (0, _send.buildInlineKeyboard)(buttons)
                        } : undefined);
                    },
                    editButtons: async ({ buttons })=>{
                        await editCallbackButtons(buttons);
                    },
                    clearButtons: async ()=>{
                        await clearCallbackButtons();
                    },
                    deleteMessage: async ()=>{
                        await deleteCallbackMessage();
                    }
                }
            });
            if (pluginCallback.handled) {
                return;
            }
            const managedSelectCallback = parseTelegramManagedSelectCallback(data);
            if (managedSelectCallback) {
                if (managedSelectCallback.type === "multi-toggle" || managedSelectCallback.type === "multi-clear") {
                    const buttons = updateMultiSelectKeyboard(callbackMessage, managedSelectCallback.type === "multi-clear" ? "clear" : "toggle", managedSelectCallback.type === "multi-toggle" ? managedSelectCallback.value : "");
                    if (buttons.length > 0) {
                        try {
                            await editCallbackButtons(buttons);
                        } catch (editErr) {
                            if (!String(editErr).includes("message is not modified")) {
                                throw new TelegramRetryableCallbackError(editErr);
                            }
                        }
                    }
                    return;
                }
                if (managedSelectCallback.type === "multi-submit") {
                    const selected = resolveMultiSelectedValues(cloneInlineKeyboardButtons(callbackMessage));
                    const synthetic = buildCallbackSyntheticTextContext({
                        ctx,
                        callbackMessage,
                        callback,
                        text: `Multi-select submitted: ${selected.length > 0 ? selected.join(", ") : "none"}`,
                        isForum
                    });
                    await processMessageWithReplyChain({
                        ctx: synthetic.ctx,
                        msg: synthetic.message,
                        allMedia: [],
                        storeAllowFrom,
                        options: {
                            forceWasMentioned: true,
                            messageIdOverride: callback.id
                        }
                    });
                    return;
                }
                try {
                    await clearCallbackButtons();
                } catch (editErr) {
                    const errStr = String(editErr);
                    if (!errStr.includes("message is not modified") && !errStr.includes("there is no text in the message to edit")) {
                        throw new TelegramRetryableCallbackError(editErr);
                    }
                }
                const synthetic = buildCallbackSyntheticTextContext({
                    ctx,
                    callbackMessage,
                    callback,
                    text: `Single-select submitted: ${managedSelectCallback.value}`,
                    isForum
                });
                await processMessageWithReplyChain({
                    ctx: synthetic.ctx,
                    msg: synthetic.message,
                    allMedia: [],
                    storeAllowFrom,
                    options: {
                        forceWasMentioned: true,
                        messageIdOverride: callback.id
                    }
                });
                return;
            }
            if (approvalCallback) {
                const isPluginApproval = approvalCallback.approvalId.startsWith("plugin:");
                const pluginApprovalAuthorizedSender = (0, _execapprovals.isTelegramExecApprovalApprover)({
                    cfg: runtimeCfg,
                    accountId,
                    senderId
                });
                const execApprovalAuthorizedSender = (0, _execapprovals.isTelegramExecApprovalAuthorizedSender)({
                    cfg: runtimeCfg,
                    accountId,
                    senderId
                });
                const authorizedApprovalSender = isPluginApproval ? pluginApprovalAuthorizedSender : execApprovalAuthorizedSender || pluginApprovalAuthorizedSender;
                if (!authorizedApprovalSender) {
                    (0, _runtimeenv.logVerbose)(`Blocked telegram approval callback from ${senderId || "unknown"} (not authorized)`);
                    return;
                }
                try {
                    // Resolve approval callbacks directly so Telegram approvers are not forced through
                    // the generic chat-command authorization path.
                    await (telegramDeps.resolveExecApproval ?? _execapprovalresolver.resolveTelegramExecApproval)({
                        cfg: runtimeCfg,
                        approvalId: approvalCallback.approvalId,
                        decision: approvalCallback.decision,
                        senderId,
                        allowPluginFallback: pluginApprovalAuthorizedSender
                    });
                } catch (resolveErr) {
                    const errStr = String(resolveErr);
                    (0, _runtimeenv.logVerbose)(`telegram: failed to resolve approval callback ${approvalCallback.approvalId}: ${errStr}`);
                    if ((0, _errorruntime.isApprovalNotFoundError)(resolveErr)) {
                        if (isPluginApproval || pluginApprovalAuthorizedSender) {
                            try {
                                await clearCallbackButtons();
                            } catch (editErr) {
                                (0, _runtimeenv.logVerbose)(`telegram: failed to clear expired approval callback buttons: ${String(editErr)}`);
                            }
                        }
                        return;
                    }
                    throw new TelegramRetryableCallbackError(resolveErr);
                }
                try {
                    await clearCallbackButtons();
                } catch (editErr) {
                    const errStr = String(editErr);
                    if (errStr.includes("message is not modified") || errStr.includes("there is no text in the message to edit")) {
                        return;
                    }
                    (0, _runtimeenv.logVerbose)(`telegram: failed to clear approval callback buttons: ${errStr}`);
                }
                return;
            }
            if (opaqueCallbackData) {
                return;
            }
            const paginationMatch = data.match(/^commands_page_(\d+|noop)(?::(.+))?$/);
            if (paginationMatch) {
                const pageValue = paginationMatch[1];
                if (pageValue === "noop") {
                    return;
                }
                const page = (0, _numberruntime.parseStrictPositiveInteger)(pageValue);
                if (page === undefined) {
                    return;
                }
                const agentId = paginationMatch[2]?.trim() || (0, _bothandlersagentruntime.resolveDefaultAgentId)(runtimeCfg);
                let result;
                try {
                    const skillCommands = telegramDeps.listSkillCommandsForAgents({
                        cfg: runtimeCfg,
                        agentIds: [
                            agentId
                        ]
                    });
                    result = (0, _commandstatus.buildCommandsMessagePaginated)(runtimeCfg, skillCommands, {
                        page,
                        forcePaginatedList: true,
                        surface: "telegram"
                    });
                } catch (err) {
                    throw new TelegramRetryableCallbackError(err);
                }
                const keyboard = result.totalPages > 1 ? (0, _send.buildInlineKeyboard)((0, _commandui.buildCommandsPaginationKeyboard)(result.currentPage, result.totalPages, agentId)) : undefined;
                try {
                    await editCallbackMessage(result.text, keyboard ? {
                        reply_markup: keyboard
                    } : undefined);
                } catch (editErr) {
                    const errStr = String(editErr);
                    if (!errStr.includes("message is not modified")) {
                        throw new TelegramRetryableCallbackError(editErr);
                    }
                }
                return;
            }
            // Model selection callback handler (mdl_prov, mdl_list_*, mdl_sel_*, mdl_back)
            const modelCallback = (0, _modelbuttons.parseModelCallbackData)(data);
            if (modelCallback) {
                if (!await isTelegramModelCallbackAuthorized({
                    chatId,
                    isGroup,
                    senderId,
                    senderUsername,
                    context: eventAuthContext,
                    cfg: runtimeCfg
                })) {
                    (0, _runtimeenv.logVerbose)(`Blocked telegram model callback from ${senderId || "unknown"} (not authorized for /models)`);
                    return;
                }
                let sessionState;
                let modelData;
                try {
                    // Retry only the callback preflight that happens before any visible chat mutation.
                    sessionState = resolveTelegramSessionState({
                        chatId,
                        isGroup,
                        isForum,
                        messageThreadId,
                        resolvedThreadId,
                        botHasTopicsEnabled: (0, _helpers.resolveTelegramBotHasTopicsEnabled)(ctx.me),
                        senderId
                    });
                    modelData = await telegramDeps.buildModelsProviderData(runtimeCfg, sessionState.agentId);
                } catch (err) {
                    throw new TelegramRetryableCallbackError(err);
                }
                const { byProvider, providers, modelNames } = modelData;
                const editMessageWithButtons = async (text, buttons, extra)=>{
                    const keyboard = (0, _send.buildInlineKeyboard)(buttons);
                    const editParams = keyboard ? {
                        reply_markup: keyboard,
                        ...extra
                    } : extra;
                    try {
                        await editCallbackMessage(text, editParams);
                    } catch (editErr) {
                        const errStr = String(editErr);
                        if (errStr.includes("no text in the message")) {
                            try {
                                await deleteCallbackMessage();
                            } catch  {}
                            await replyToCallbackChat(text, keyboard ? {
                                reply_markup: keyboard,
                                ...extra
                            } : extra);
                        } else if (!errStr.includes("message is not modified")) {
                            throw editErr;
                        }
                    }
                };
                if (modelCallback.type === "providers" || modelCallback.type === "back") {
                    if (providers.length === 0) {
                        try {
                            await editMessageWithButtons("No providers available.", []);
                        } catch (err) {
                            throw new TelegramRetryableCallbackError(err);
                        }
                        return;
                    }
                    const providerInfos = providers.map((p)=>({
                            id: p,
                            count: byProvider.get(p)?.size ?? 0
                        }));
                    const buttons = (0, _commandui.buildTelegramModelsMenuButtons)({
                        providers: providerInfos
                    });
                    try {
                        await editMessageWithButtons("Select a provider:", buttons);
                    } catch (err) {
                        throw new TelegramRetryableCallbackError(err);
                    }
                    return;
                }
                if (modelCallback.type === "list") {
                    const { provider, page } = modelCallback;
                    const modelSet = byProvider.get(provider);
                    if (!modelSet || modelSet.size === 0) {
                        // Provider not found or no models - show providers list
                        const providerInfos = providers.map((p)=>({
                                id: p,
                                count: byProvider.get(p)?.size ?? 0
                            }));
                        const buttons = (0, _commandui.buildTelegramModelsMenuButtons)({
                            providers: providerInfos
                        });
                        try {
                            await editMessageWithButtons(`Unknown provider: ${provider}\n\nSelect a provider:`, buttons);
                        } catch (err) {
                            throw new TelegramRetryableCallbackError(err);
                        }
                        return;
                    }
                    const models = [
                        ...modelSet
                    ].toSorted((left, right)=>left.localeCompare(right));
                    const pageSize = (0, _modelbuttons.getModelsPageSize)();
                    const totalPages = (0, _modelbuttons.calculateTotalPages)(models.length, pageSize);
                    const safePage = Math.max(1, Math.min(page, totalPages));
                    // Resolve current model from session (prefer overrides)
                    const currentModel = sessionState.model;
                    const buttons = (0, _modelbuttons.buildModelsKeyboard)({
                        provider,
                        models,
                        currentModel,
                        currentPage: safePage,
                        totalPages,
                        pageSize,
                        modelNames
                    });
                    const text = (0, _modelsproviderruntime.formatModelsAvailableHeader)({
                        provider,
                        total: models.length,
                        cfg,
                        agentDir: (0, _bothandlersagentruntime.resolveAgentDir)(cfg, sessionState.agentId),
                        sessionEntry: sessionState.sessionEntry
                    });
                    try {
                        await editMessageWithButtons(text, buttons);
                    } catch (err) {
                        throw new TelegramRetryableCallbackError(err);
                    }
                    return;
                }
                if (modelCallback.type === "select") {
                    const selection = (0, _modelbuttons.resolveModelSelection)({
                        callback: modelCallback,
                        providers,
                        byProvider
                    });
                    if (selection.kind !== "resolved") {
                        const providerInfos = providers.map((p)=>({
                                id: p,
                                count: byProvider.get(p)?.size ?? 0
                            }));
                        const buttons = (0, _commandui.buildTelegramModelsMenuButtons)({
                            providers: providerInfos
                        });
                        try {
                            await editMessageWithButtons(`Could not resolve model "${selection.model}".\n\nSelect a provider:`, buttons);
                        } catch (err) {
                            throw new TelegramRetryableCallbackError(err);
                        }
                        return;
                    }
                    const modelSet = byProvider.get(selection.provider);
                    if (!modelSet?.has(selection.model)) {
                        try {
                            await editMessageWithButtons(`❌ Model "${selection.provider}/${selection.model}" is not allowed.`, []);
                        } catch (err) {
                            throw new TelegramRetryableCallbackError(err);
                        }
                        return;
                    }
                    // Directly set model override in session
                    try {
                        // Use the fresh runtimeCfg (loaded at callback entry) so store path
                        // and default-model resolution stay consistent with the next
                        // inbound message.  The outer `cfg` is a snapshot captured at
                        // handler-registration time and becomes stale after config reloads,
                        // which can cause the override to be written to the wrong store or
                        // incorrectly treated as the default model (clearing the override).
                        const storePath = telegramDeps.resolveStorePath(runtimeCfg.session?.store, {
                            agentId: sessionState.agentId
                        });
                        const resolvedDefault = (0, _bothandlersagentruntime.resolveDefaultModelForAgent)({
                            cfg: runtimeCfg,
                            agentId: sessionState.agentId
                        });
                        const isDefaultSelection = selection.provider === resolvedDefault.provider && selection.model === resolvedDefault.model;
                        try {
                            await (0, _sessionstoreruntime.updateSessionStore)(storePath, (store)=>{
                                const sessionKey = sessionState.sessionKey;
                                const entry = store[sessionKey] ?? {};
                                store[sessionKey] = entry;
                                (0, _modelsessionruntime.applyModelOverrideToSessionEntry)({
                                    entry,
                                    selection: {
                                        provider: selection.provider,
                                        model: selection.model,
                                        isDefault: isDefaultSelection
                                    }
                                });
                            });
                        } catch (err) {
                            throw new TelegramRetryableCallbackError(err);
                        }
                        // Update message to show success with visual feedback
                        const escapeHtml = (text)=>text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        const actionText = isDefaultSelection ? "reset to default" : `changed to <b>${escapeHtml(selection.provider)}/${escapeHtml(selection.model)}</b>`;
                        const scopeText = isDefaultSelection ? "Session selection cleared. Runtime unchanged. New replies use the agent's configured default." : `Session-only model selection. Runtime unchanged. Use /model ${escapeHtml(selection.provider)}/${escapeHtml(selection.model)} --runtime &lt;runtime&gt; to switch harnesses. The agent default in openclaw.json is unchanged; /reset or a new session may return to that default.`;
                        await editMessageWithButtons(`✅ Model ${actionText}\n\n${scopeText}`, [], {
                            parse_mode: "HTML"
                        });
                    } catch (err) {
                        if (err instanceof TelegramRetryableCallbackError) {
                            throw err;
                        }
                        await editMessageWithButtons(`❌ Failed to change model: ${String(err)}`, []);
                    }
                    return;
                }
                return;
            }
            const syntheticMessage = buildSyntheticTextMessage({
                base: (0, _helpers.withResolvedTelegramForumFlag)(callbackMessage, isForum),
                from: callback.from,
                text: callbackCommandText
            });
            const syntheticCtx = buildSyntheticContext(ctx, syntheticMessage);
            await processMessageWithReplyChain({
                ctx: syntheticCtx,
                msg: syntheticMessage,
                allMedia: [],
                storeAllowFrom,
                options: {
                    ...nativeCallbackCommand ? {
                        commandSource: "native"
                    } : {},
                    forceWasMentioned: true,
                    messageIdOverride: callback.id
                }
            });
        } catch (err) {
            if (err instanceof TelegramRetryableCallbackError) {
                if (isPermanentTelegramCallbackEditError(err.cause)) {
                    (0, _runtimeenv.logVerbose)(`telegram: swallowing permanent callback edit error: ${String(err.cause)}`);
                    return;
                }
                runtime.error?.((0, _runtimeenv.danger)(`callback handler failed: ${String(err)}`));
                throw err.cause;
            }
            runtime.error?.((0, _runtimeenv.danger)(`callback handler failed: ${String(err)}`));
        }
    });
    // Handle group migration to supergroup (chat ID changes)
    bot.on("message:migrate_to_chat_id", async (ctx)=>{
        try {
            const msg = ctx.message;
            if (!msg?.migrate_to_chat_id) {
                return;
            }
            if (shouldSkipUpdate(ctx)) {
                return;
            }
            const oldChatId = String(msg.chat.id);
            const newChatId = String(msg.migrate_to_chat_id);
            const chatTitle = msg.chat.title ?? "Unknown";
            runtime.log?.((0, _runtimeenv.warn)(`[telegram] Group migrated: "${chatTitle}" ${oldChatId} → ${newChatId}`));
            if (!(0, _channelconfighelpers.resolveChannelConfigWrites)({
                cfg,
                channelId: "telegram",
                accountId
            })) {
                runtime.log?.((0, _runtimeenv.warn)("[telegram] Config writes disabled; skipping group config migration."));
                return;
            }
            // Check if old chat ID has config and migrate it
            const currentConfig = telegramDeps.getRuntimeConfig();
            const migration = (0, _groupmigration.migrateTelegramGroupConfig)({
                cfg: currentConfig,
                accountId,
                oldChatId,
                newChatId
            });
            if (migration.migrated) {
                runtime.log?.((0, _runtimeenv.warn)(`[telegram] Migrating group config from ${oldChatId} to ${newChatId}`));
                (0, _groupmigration.migrateTelegramGroupConfig)({
                    cfg,
                    accountId,
                    oldChatId,
                    newChatId
                });
                await (0, _configmutation.mutateConfigFile)({
                    afterWrite: {
                        mode: "auto"
                    },
                    mutate: (draft)=>{
                        (0, _groupmigration.migrateTelegramGroupConfig)({
                            cfg: draft,
                            accountId,
                            oldChatId,
                            newChatId
                        });
                    }
                });
                runtime.log?.((0, _runtimeenv.warn)(`[telegram] Group config migrated and saved successfully`));
            } else if (migration.skippedExisting) {
                runtime.log?.((0, _runtimeenv.warn)(`[telegram] Group config already exists for ${newChatId}; leaving ${oldChatId} unchanged`));
            } else {
                runtime.log?.((0, _runtimeenv.warn)(`[telegram] No config found for old group ID ${oldChatId}, migration logged only`));
            }
        } catch (err) {
            runtime.error?.((0, _runtimeenv.danger)(`[telegram] Group migration handler failed: ${String(err)}`));
            throw err;
        }
    });
    const normalizeChannelPostMessage = (post)=>{
        const chatId = post.chat.id;
        const syntheticFrom = post.sender_chat ? {
            id: post.sender_chat.id,
            is_bot: true,
            first_name: post.sender_chat.title || "Channel",
            username: post.sender_chat.username
        } : {
            id: chatId,
            is_bot: true,
            first_name: post.chat.title || "Channel",
            username: post.chat.username
        };
        return {
            ...post,
            from: post.from ?? syntheticFrom,
            chat: {
                ...post.chat,
                type: "supergroup"
            }
        };
    };
    const recordEditedMessageForReplyChain = async (ctxForDedupe, msg)=>{
        if (shouldSkipUpdate(ctxForDedupe)) {
            return;
        }
        const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
        const isForum = await (0, _helpers.resolveTelegramForumFlag)({
            chatId: msg.chat.id,
            chatType: msg.chat.type,
            isGroup,
            isForum: msg.chat.is_forum,
            isTopicMessage: msg.is_topic_message,
            getChat
        });
        const normalizedMsg = (0, _helpers.withResolvedTelegramForumFlag)(msg, isForum);
        const resolvedThreadId = (0, _helpers.resolveTelegramForumThreadId)({
            isForum,
            messageThreadId: normalizedMsg.message_thread_id
        });
        const dmThreadId = !isGroup ? normalizedMsg.message_thread_id : undefined;
        await recordMessageForReplyChain(normalizedMsg, resolvedThreadId ?? dmThreadId);
    };
    const handleInboundMessageLike = async (event)=>{
        let dispatchDedupeKeys = [];
        try {
            if (shouldSkipUpdate(event.ctxForDedupe)) {
                return;
            }
            const eventAuthContext = await resolveTelegramEventAuthorizationContext({
                chatId: event.chatId,
                isGroup: event.isGroup,
                isForum: event.isForum,
                senderId: event.senderId,
                messageThreadId: event.messageThreadId
            });
            const { dmPolicy, resolvedThreadId, dmThreadId, storeAllowFrom, groupConfig, topicConfig, groupAllowOverride, effectiveGroupAllow, hasGroupAllowOverride } = eventAuthContext;
            // For DMs, prefer per-DM/topic allowFrom (groupAllowOverride) over account-level allowFrom
            const dmAllowFrom = groupAllowOverride ?? allowFrom;
            const expandedDmAllowFrom = await (0, _accessgroups.expandTelegramAllowFromWithAccessGroups)({
                cfg,
                allowFrom: dmAllowFrom,
                accountId,
                senderId: event.senderId
            });
            const effectiveDmAllow = (0, _botaccess.normalizeDmAllowFromWithStore)({
                allowFrom: expandedDmAllowFrom,
                storeAllowFrom,
                dmPolicy
            });
            if (event.requireConfiguredGroup && (!groupConfig || groupConfig.enabled === false)) {
                (0, _runtimeenv.logVerbose)(`Blocked telegram channel ${event.chatId} (channel disabled)`);
                return;
            }
            if (shouldSkipGroupMessage({
                isGroup: event.isGroup,
                chatId: event.chatId,
                chatTitle: event.msg.chat.title,
                resolvedThreadId,
                senderId: event.senderId,
                senderUsername: event.senderUsername,
                effectiveGroupAllow,
                hasGroupAllowOverride,
                groupConfig,
                topicConfig
            })) {
                return;
            }
            if (!event.isGroup && ((0, _bothandlersmedia.hasInboundMedia)(event.msg) || (0, _bothandlersmedia.hasReplyTargetMedia)(event.msg))) {
                const dmAuthorized = await (0, _dmaccess.enforceTelegramDmAccess)({
                    isGroup: event.isGroup,
                    dmPolicy,
                    msg: event.msg,
                    chatId: event.chatId,
                    effectiveDmAllow,
                    accountId,
                    bot,
                    logger,
                    upsertPairingRequest: telegramDeps.upsertChannelPairingRequest
                });
                if (!dmAuthorized) {
                    return;
                }
            }
            const promptContextMinTimestampMs = normalizePromptContextMinTimestampMs(resolveTelegramSessionState({
                chatId: event.chatId,
                isGroup: event.isGroup,
                isForum: event.isForum,
                messageThreadId: event.messageThreadId,
                resolvedThreadId,
                botHasTopicsEnabled: (0, _helpers.resolveTelegramBotHasTopicsEnabled)(event.ctx.me),
                senderId: event.senderId,
                runtimeCfg: cfg
            }).sessionEntry?.sessionStartedAt);
            const dispatchDedupe = await claimMessageDispatchDedupe(event.msg);
            if (!dispatchDedupe.process) {
                return;
            }
            dispatchDedupeKeys = dispatchDedupe.keys;
            await recordMessageForReplyChain(event.msg, resolvedThreadId ?? dmThreadId);
            await processInboundMessage({
                ctx: event.ctx,
                msg: event.msg,
                chatId: event.chatId,
                isGroup: event.isGroup,
                isForum: event.isForum,
                resolvedThreadId,
                dmThreadId,
                dmPolicy,
                storeAllowFrom,
                senderId: event.senderId,
                effectiveGroupAllow,
                effectiveDmAllow,
                groupConfig: event.isGroup ? groupConfig : undefined,
                topicConfig,
                sendOversizeWarning: event.sendOversizeWarning,
                oversizeLogMessage: event.oversizeLogMessage,
                dispatchDedupeKeys,
                ...promptContextBoundaryOptions(promptContextMinTimestampMs)
            });
        } catch (err) {
            releaseDispatchDedupeKeys(dispatchDedupeKeys, err);
            runtime.error?.((0, _runtimeenv.danger)(`${event.errorMessage}: ${String(err)}`));
            if (err instanceof _helpers.TelegramPairingStoreReadError) {
                await (0, _apilogging.withTelegramApiErrorLogging)({
                    operation: "sendMessage",
                    runtime,
                    fn: ()=>bot.api.sendMessage(event.chatId, "⚠️ Couldn't process this message, please try again in a moment.", {
                            reply_parameters: {
                                message_id: event.msg.message_id,
                                allow_sending_without_reply: true
                            }
                        })
                }).catch(()=>{});
            }
        }
    };
    bot.on("message", async (ctx)=>{
        const msg = ctx.message;
        if (!msg) {
            return;
        }
        const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
        const isForum = await (0, _helpers.resolveTelegramForumFlag)({
            chatId: msg.chat.id,
            chatType: msg.chat.type,
            isGroup,
            isForum: msg.chat.is_forum,
            isTopicMessage: msg.is_topic_message,
            getChat
        });
        const normalizedMsg = (0, _helpers.withResolvedTelegramForumFlag)(msg, isForum);
        // Bot-authored message updates can be echoed back by Telegram. Skip them here
        // and rely on the dedicated channel_post handler for channel-originated posts.
        if (normalizedMsg.from?.id != null && normalizedMsg.from.id === ctx.me?.id) {
            return;
        }
        await handleInboundMessageLike({
            ctxForDedupe: ctx,
            ctx: buildSyntheticContext(ctx, normalizedMsg),
            msg: normalizedMsg,
            chatId: normalizedMsg.chat.id,
            isGroup,
            isForum,
            messageThreadId: normalizedMsg.message_thread_id,
            senderId: normalizedMsg.from?.id != null ? String(normalizedMsg.from.id) : "",
            senderUsername: normalizedMsg.from?.username ?? "",
            requireConfiguredGroup: false,
            sendOversizeWarning: true,
            oversizeLogMessage: "media exceeds size limit",
            errorMessage: "handler failed"
        });
    });
    bot.on("edited_message", async (ctx)=>{
        const msg = ctx.editedMessage;
        if (!msg) {
            return;
        }
        await recordEditedMessageForReplyChain(ctx, msg);
    });
    // Handle channel posts — enables bot-to-bot communication via Telegram channels.
    // Telegram bots cannot see other bot messages in groups, but CAN in channels.
    // This handler normalizes channel_post updates into the standard message pipeline.
    bot.on("channel_post", async (ctx)=>{
        const post = ctx.channelPost;
        if (!post) {
            return;
        }
        const chatId = post.chat.id;
        const syntheticMsg = normalizeChannelPostMessage(post);
        await handleInboundMessageLike({
            ctxForDedupe: ctx,
            ctx: buildSyntheticContext(ctx, syntheticMsg),
            msg: syntheticMsg,
            chatId,
            isGroup: true,
            isForum: false,
            senderId: post.sender_chat?.id != null ? String(post.sender_chat.id) : post.from?.id != null ? String(post.from.id) : "",
            senderUsername: post.sender_chat?.username ?? post.from?.username ?? "",
            requireConfiguredGroup: true,
            sendOversizeWarning: false,
            oversizeLogMessage: "channel post media exceeds size limit",
            errorMessage: "channel_post handler failed"
        });
    });
    bot.on("edited_channel_post", async (ctx)=>{
        const post = ctx.editedChannelPost;
        if (!post) {
            return;
        }
        await recordEditedMessageForReplyChain(ctx, normalizeChannelPostMessage(post));
    });
};

//# sourceMappingURL=bot-handlers.runtime.js.map