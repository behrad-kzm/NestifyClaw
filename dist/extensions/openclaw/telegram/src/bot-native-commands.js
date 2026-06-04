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
    get buildTelegramNativeCommandCallbackData () {
        return _nativecommandcallbackdata.buildTelegramNativeCommandCallbackData;
    },
    get parseTelegramNativeCommandCallbackData () {
        return _nativecommandcallbackdata.parseTelegramNativeCommandCallbackData;
    },
    get registerTelegramNativeCommands () {
        return registerTelegramNativeCommands;
    },
    get resolveTelegramNativeCommandDisableBlockStreaming () {
        return resolveTelegramNativeCommandDisableBlockStreaming;
    }
});
const _nodecrypto = require("node:crypto");
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _agentruntime = require("../../../../common/openclaw/plugin-sdk/agent-runtime");
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _commandauthnative = require("../../../../common/openclaw/plugin-sdk/command-auth-native");
const _markdowntableruntime = require("../../../../common/openclaw/plugin-sdk/markdown-table-runtime");
const _replypayload = require("../../../../common/openclaw/plugin-sdk/reply-payload");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _runtimeconfigsnapshot = require("../../../../common/openclaw/plugin-sdk/runtime-config-snapshot");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _sessionstoreruntime = require("../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accessgroups = require("./access-groups.js");
const _accounts = require("./accounts.js");
const _apilogging = require("./api-logging.js");
const _botaccess = require("./bot-access.js");
const _botnativecommanddepsruntime = require("./bot-native-command-deps.runtime.js");
const _botnativecommandmenu = require("./bot-native-command-menu.js");
const _helpers = require("./bot/helpers.js");
const _commandconfig = require("./command-config.js");
const _conversationroute = require("./conversation-route.js");
const _execapprovals = require("./exec-approvals.js");
const _groupaccess = require("./group-access.js");
const _groupconfighelpers = require("./group-config-helpers.js");
const _ingress = require("./ingress.js");
const _inlinekeyboard = require("./inline-keyboard.js");
const _nativecommandcallbackdata = require("./native-command-callback-data.js");
const _sentmessagecache = require("./sent-message-cache.js");
const _topicnamecache = require("./topic-name-cache.js");
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
let telegramNativeCommandDeliveryRuntimePromise;
async function loadTelegramNativeCommandDeliveryRuntime() {
    telegramNativeCommandDeliveryRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./bot-native-commands.delivery.runtime.js")));
    return await telegramNativeCommandDeliveryRuntimePromise;
}
let telegramNativeCommandRuntimePromise;
async function loadTelegramNativeCommandRuntime() {
    telegramNativeCommandRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./bot-native-commands.runtime.js")));
    return await telegramNativeCommandRuntimePromise;
}
function resolveTelegramProgressPlaceholder(command) {
    const text = command.nativeProgressMessages?.telegram?.trim() ?? command.nativeProgressMessages?.default?.trim();
    return text ? text : null;
}
async function resolveTelegramCommandSessionFile(params) {
    const sessionKey = params.sessionKey.trim();
    if (!sessionKey) {
        return {};
    }
    try {
        const storePath = (0, _sessionstoreruntime.resolveStorePath)(params.cfg.session?.store, {
            agentId: params.agentId
        });
        const store = (0, _sessionstoreruntime.loadSessionStore)(storePath);
        const resolved = (0, _sessionstoreruntime.resolveSessionStoreEntry)({
            store,
            sessionKey
        });
        const sessionId = resolved.existing?.sessionId?.trim() || (0, _nodecrypto.randomUUID)();
        const authProfileId = (0, _stringcoerceruntime.normalizeOptionalString)(resolved.existing?.authProfileOverride);
        const sessionsDir = _nodepath.default.dirname(storePath);
        const fallbackSessionFile = (0, _sessionstoreruntime.resolveSessionTranscriptPathInDir)(sessionId, sessionsDir, params.threadId);
        const persisted = await (0, _sessionstoreruntime.resolveAndPersistSessionFile)({
            sessionId,
            sessionKey: resolved.normalizedKey,
            sessionStore: store,
            storePath,
            sessionEntry: resolved.existing,
            agentId: params.agentId,
            sessionsDir,
            fallbackSessionFile
        });
        return {
            sessionId,
            sessionFile: persisted.sessionFile,
            ...authProfileId ? {
                authProfileId
            } : {}
        };
    } catch  {
        return {};
    }
}
function resolveTelegramCommandMenuModelContext(params) {
    if (!params.sessionKey.trim()) {
        return {};
    }
    try {
        const storePath = (0, _sessionstoreruntime.resolveStorePath)(params.cfg.session?.store, {
            agentId: params.agentId
        });
        const defaultModel = (0, _agentruntime.resolveDefaultModelForAgent)({
            cfg: params.cfg,
            agentId: params.agentId
        });
        const store = (0, _sessionstoreruntime.loadSessionStore)(storePath);
        const entry = (0, _sessionstoreruntime.resolveSessionStoreEntry)({
            store,
            sessionKey: params.sessionKey
        }).existing;
        const thinkingLevel = (0, _stringcoerceruntime.normalizeOptionalString)(entry?.thinkingLevel);
        if (entry?.modelOverrideSource === "auto" && (0, _stringcoerceruntime.normalizeOptionalString)(entry.modelOverride)) {
            return {
                provider: defaultModel.provider,
                model: defaultModel.model,
                ...thinkingLevel ? {
                    thinkingLevel
                } : {}
            };
        }
        const override = (0, _commandauthnative.resolveStoredModelOverride)({
            sessionEntry: entry,
            sessionStore: store,
            sessionKey: params.sessionKey,
            defaultProvider: defaultModel.provider
        });
        if (override?.model) {
            return {
                provider: override.provider || defaultModel.provider,
                model: override.model,
                ...thinkingLevel ? {
                    thinkingLevel
                } : {}
            };
        }
        const provider = (0, _stringcoerceruntime.normalizeOptionalString)(entry?.providerOverride) ?? (0, _stringcoerceruntime.normalizeOptionalString)(entry?.modelProvider);
        const model = (0, _stringcoerceruntime.normalizeOptionalString)(entry?.modelOverride) ?? (0, _stringcoerceruntime.normalizeOptionalString)(entry?.model);
        return {
            ...provider ? {
                provider
            } : {},
            ...model ? {
                model
            } : {},
            ...thinkingLevel ? {
                thinkingLevel
            } : {}
        };
    } catch  {
        return {};
    }
}
async function resolveTelegramDefaultThinkingLevel(params) {
    return (0, _agentruntime.resolveThinkingDefaultWithRuntimeCatalog)({
        cfg: params.cfg,
        provider: params.provider,
        model: params.model,
        loadModelCatalog: ()=>(0, _agentruntime.loadModelCatalog)({
                config: params.cfg
            })
    });
}
async function resolveTelegramThinkMenuCurrentLevel(params) {
    const explicit = (0, _stringcoerceruntime.normalizeOptionalString)(params.thinkingLevel);
    if (explicit) {
        return explicit;
    }
    const agentThinkingDefault = (0, _stringcoerceruntime.normalizeOptionalString)((0, _agentruntime.resolveAgentConfig)(params.cfg, params.agentId)?.thinkingDefault);
    if (agentThinkingDefault) {
        return agentThinkingDefault;
    }
    const defaultModel = (0, _agentruntime.resolveDefaultModelForAgent)({
        cfg: params.cfg,
        agentId: params.agentId
    });
    return await resolveTelegramDefaultThinkingLevel({
        cfg: params.cfg,
        provider: params.provider ?? defaultModel.provider,
        model: params.model ?? defaultModel.model
    });
}
function formatTelegramCommandArgMenuTitle(params) {
    const title = (0, _commandauthnative.formatCommandArgMenuTitle)({
        command: params.command,
        menu: params.menu
    });
    if (params.command.key !== "think" || !params.currentThinkingLevel) {
        return title;
    }
    return `Current thinking level: ${params.currentThinkingLevel}.\n${title}`;
}
function resolveTelegramNativeReplyChannelData(result) {
    return result.channelData?.telegram;
}
function normalizeTelegramNativeReplyPayload(result) {
    return result && typeof result === "object" ? result : {};
}
function hasRenderableTelegramNativeReplyPayload(result) {
    return (0, _replypayload.resolveSendableOutboundReplyParts)(result).hasContent;
}
function isEditableTelegramProgressResult(result) {
    const telegramData = resolveTelegramNativeReplyChannelData(result);
    return Boolean(typeof result.text === "string" && result.text.trim() && !result.mediaUrl && (!result.mediaUrls || result.mediaUrls.length === 0) && !result.presentation && !result.interactive && !result.btw && telegramData?.pin !== true);
}
async function cleanupTelegramProgressPlaceholder(params) {
    const progressMessageId = params.progressMessageId;
    if (progressMessageId == null) {
        return;
    }
    try {
        await (0, _apilogging.withTelegramApiErrorLogging)({
            operation: "deleteMessage",
            runtime: params.runtime,
            fn: ()=>params.bot.api.deleteMessage(params.chatId, progressMessageId)
        });
    } catch  {
    // Best-effort cleanup before fallback or suppression exits.
    }
}
async function resolveTelegramNativeCommandThreadContext(params) {
    const { msg, bot } = params;
    const chatId = msg.chat.id;
    const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    const messageThreadId = msg.message_thread_id;
    const getChat = typeof bot.api.getChat === "function" ? bot.api.getChat.bind(bot.api) : undefined;
    const isForum = await (0, _helpers.resolveTelegramForumFlag)({
        chatId,
        chatType: msg.chat.type,
        isGroup,
        isForum: (0, _helpers.extractTelegramForumFlag)(msg.chat),
        isTopicMessage: msg.is_topic_message,
        getChat
    });
    const threadSpec = (0, _helpers.resolveTelegramThreadSpec)({
        isGroup,
        isForum,
        messageThreadId
    });
    return {
        chatId,
        isGroup,
        isForum,
        messageThreadId,
        threadSpec,
        threadParams: (0, _helpers.buildTelegramThreadParams)(threadSpec)
    };
}
function resolveTelegramNativeCommandDisableBlockStreaming(telegramCfg) {
    const blockStreamingEnabled = (0, _channeloutbound.resolveChannelStreamingBlockEnabled)(telegramCfg);
    return typeof blockStreamingEnabled === "boolean" ? !blockStreamingEnabled : undefined;
}
async function resolveTelegramCommandAuth(params) {
    const { msg, bot, cfg, accountId, telegramCfg, readChannelAllowFromStore, allowFrom, groupAllowFrom, useAccessGroups, resolveGroupPolicy, resolveTelegramGroupConfig, requireAuth } = params;
    const { chatId, isGroup, isForum, messageThreadId, threadParams } = await resolveTelegramNativeCommandThreadContext({
        msg,
        bot
    });
    const senderId = msg.from?.id ? String(msg.from.id) : "";
    const senderUsername = msg.from?.username ?? "";
    // Best-effort pre-context check: if commands.allowFrom already authorizes the
    // sender at chat level, skip the pairing-store read so a transient store I/O
    // failure cannot block a command this sender is explicitly allowed to run.
    // resolvedThreadId is not known yet; the post-context check below is still
    // the authoritative decision for topic-scoped command auth.
    const commandsAllowFromConfigured = (0, _helpers.isTelegramCommandsAllowFromConfigured)(cfg);
    const preContextCommandsAllowFromAccess = commandsAllowFromConfigured ? (0, _helpers.resolveTelegramCommandAuthorization)({
        cfg,
        accountId,
        chatId,
        isGroup,
        senderId,
        senderUsername
    }) : null;
    const groupAllowContext = await (0, _helpers.resolveTelegramGroupAllowFromContext)({
        cfg,
        chatId,
        accountId,
        dmPolicy: telegramCfg.dmPolicy,
        allowFrom,
        senderId,
        isGroup,
        isForum,
        messageThreadId,
        groupAllowFrom,
        skipPairingStoreRead: Boolean(preContextCommandsAllowFromAccess?.isAuthorizedSender),
        readChannelAllowFromStore,
        resolveTelegramGroupConfig
    });
    const { resolvedThreadId, dmThreadId, storeAllowFrom, groupConfig, topicConfig, groupAllowOverride, effectiveGroupAllow, hasGroupAllowOverride } = groupAllowContext;
    const effectiveDmPolicy = (0, _botaccess.resolveTelegramEffectiveDmPolicy)({
        isGroup,
        groupConfig,
        dmPolicy: telegramCfg.dmPolicy
    });
    const requireTopic = !isGroup && groupConfig && "requireTopic" in groupConfig ? groupConfig.requireTopic : undefined;
    if (!isGroup && requireTopic === true && dmThreadId == null) {
        (0, _runtimeenv.logVerbose)(`Blocked telegram command in DM ${chatId}: requireTopic=true but no topic present`);
        return null;
    }
    const dmAllowFrom = groupAllowOverride ?? allowFrom;
    const commandsAllowFromAccess = commandsAllowFromConfigured ? (0, _helpers.resolveTelegramCommandAuthorization)({
        cfg,
        accountId,
        chatId,
        isGroup,
        resolvedThreadId,
        senderId,
        senderUsername
    }) : null;
    const ownerAccess = (0, _helpers.resolveTelegramCommandAuthorization)({
        cfg,
        accountId,
        chatId,
        isGroup,
        resolvedThreadId,
        senderId,
        senderUsername
    });
    const sendAuthMessage = async (text)=>{
        await (0, _apilogging.withTelegramApiErrorLogging)({
            operation: "sendMessage",
            fn: ()=>bot.api.sendMessage(chatId, text, threadParams ?? {})
        });
        return null;
    };
    const rejectNotAuthorized = async ()=>{
        return await sendAuthMessage("You are not authorized to use this command.");
    };
    const baseAccess = (0, _groupaccess.evaluateTelegramGroupBaseAccess)({
        isGroup,
        groupConfig,
        topicConfig,
        hasGroupAllowOverride,
        effectiveGroupAllow,
        senderId,
        senderUsername,
        enforceAllowOverride: requireAuth,
        requireSenderForAllowOverride: true
    });
    if (!baseAccess.allowed) {
        if (baseAccess.reason === "group-disabled") {
            return await sendAuthMessage("This group is disabled.");
        }
        if (baseAccess.reason === "topic-disabled") {
            return await sendAuthMessage("This topic is disabled.");
        }
        return await rejectNotAuthorized();
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
        enforcePolicy: useAccessGroups,
        useTopicAndGroupOverrides: false,
        enforceAllowlistAuthorization: requireAuth && !commandsAllowFromConfigured,
        allowEmptyAllowlistEntries: true,
        requireSenderForAllowlistAuthorization: true,
        checkChatAllowlist: useAccessGroups
    });
    if (!policyAccess.allowed) {
        if (policyAccess.reason === "group-policy-disabled") {
            return await sendAuthMessage("Telegram group commands are disabled.");
        }
        if (policyAccess.reason === "group-policy-allowlist-no-sender" || policyAccess.reason === "group-policy-allowlist-unauthorized") {
            return await rejectNotAuthorized();
        }
        if (policyAccess.reason === "group-chat-not-allowed") {
            return await sendAuthMessage("This group is not allowed.");
        }
    }
    const expandedDmAllowFrom = await (0, _accessgroups.expandTelegramAllowFromWithAccessGroups)({
        cfg,
        allowFrom: dmAllowFrom,
        accountId,
        senderId
    });
    const dmAllow = (0, _botaccess.normalizeDmAllowFromWithStore)({
        allowFrom: expandedDmAllowFrom,
        storeAllowFrom: isGroup ? [] : storeAllowFrom,
        dmPolicy: effectiveDmPolicy
    });
    const commandAuthorized = commandsAllowFromConfigured ? Boolean(commandsAllowFromAccess?.isAuthorizedSender) : (await (0, _ingress.resolveTelegramCommandIngressAuthorization)({
        accountId,
        cfg,
        dmPolicy: effectiveDmPolicy,
        isGroup,
        chatId,
        resolvedThreadId,
        senderId,
        effectiveDmAllow: dmAllow,
        effectiveGroupAllow,
        ownerAccess,
        eventKind: "native-command"
    })).authorized;
    if (requireAuth && !commandAuthorized) {
        return await rejectNotAuthorized();
    }
    return {
        chatId,
        isGroup,
        isForum,
        resolvedThreadId,
        senderId,
        senderUsername,
        groupConfig,
        topicConfig,
        commandAuthorized,
        senderIsOwner: ownerAccess.senderIsOwner
    };
}
const registerTelegramNativeCommands = ({ bot, cfg, runtime, accountId, telegramCfg, allowFrom, groupAllowFrom, replyToMode, textLimit, mediaMaxBytes, useAccessGroups, nativeEnabled, nativeSkillsEnabled, nativeDisabledExplicit, resolveGroupPolicy, resolveTelegramGroupConfig, shouldSkipUpdate, telegramDeps = _botnativecommanddepsruntime.defaultTelegramNativeCommandDeps, opts })=>{
    const boundRoute = nativeEnabled && nativeSkillsEnabled ? (0, _routing.resolveAgentRoute)({
        cfg,
        channel: "telegram",
        accountId
    }) : null;
    if (nativeEnabled && nativeSkillsEnabled && !boundRoute) {
        runtime.log?.("nativeSkillsEnabled is true but no agent route is bound for this Telegram account; skill commands will not appear in the native menu.");
    }
    const skillCommands = nativeEnabled && nativeSkillsEnabled && boundRoute ? telegramDeps.listSkillCommandsForAgents({
        cfg,
        agentIds: [
            boundRoute.agentId
        ]
    }) : [];
    const pluginCommandSpecs = (telegramDeps.getPluginCommandSpecs ?? _botnativecommanddepsruntime.defaultTelegramNativeCommandDeps.getPluginCommandSpecs)?.("telegram", {
        config: cfg
    }) ?? [];
    const resolveTelegramMenuCommandCatalog = (activeSkillCommands, reservedSkillCommands = activeSkillCommands)=>{
        const nativeCommands = nativeEnabled ? (0, _commandauthnative.listNativeCommandSpecsForConfig)(cfg, {
            skillCommands: activeSkillCommands,
            provider: "telegram"
        }) : [];
        const reservedCommands = new Set((0, _commandauthnative.listNativeCommandSpecs)().map((command)=>(0, _commandconfig.normalizeTelegramCommandName)(command.name)));
        for (const command of reservedSkillCommands){
            reservedCommands.add((0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(command.name));
        }
        const customResolution = (0, _commandconfig.resolveTelegramCustomCommands)({
            commands: telegramCfg.customCommands,
            reservedCommands
        });
        for (const issue of customResolution.issues){
            runtime.error?.((0, _runtimeenv.danger)(issue.message));
        }
        const customCommands = customResolution.commands;
        const existingCommands = new Set([
            ...nativeCommands.map((command)=>(0, _commandconfig.normalizeTelegramCommandName)(command.name)),
            ...customCommands.map((command)=>command.command)
        ].map((command)=>(0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(command)));
        for (const command of reservedSkillCommands){
            existingCommands.add((0, _commandconfig.normalizeTelegramCommandName)(command.name));
        }
        const pluginCatalog = (0, _botnativecommandmenu.buildPluginTelegramMenuCommands)({
            specs: pluginCommandSpecs,
            existingCommands
        });
        for (const issue of pluginCatalog.issues){
            runtime.error?.((0, _runtimeenv.danger)(issue));
        }
        const allCommandsFull = [
            ...nativeCommands.map((command)=>{
                const normalized = (0, _commandconfig.normalizeTelegramCommandName)(command.name);
                if (!_commandconfig.TELEGRAM_COMMAND_NAME_PATTERN.test(normalized)) {
                    runtime.error?.((0, _runtimeenv.danger)(`Native command "${command.name}" is invalid for Telegram (resolved to "${normalized}"). Skipping.`));
                    return null;
                }
                const menuCommand = {
                    command: normalized,
                    description: command.description
                };
                if (command.isAlias) {
                    menuCommand.isAlias = true;
                }
                if (command.descriptionLocalizations) {
                    menuCommand.descriptionLocalizations = command.descriptionLocalizations;
                }
                return menuCommand;
            }).filter((cmd)=>cmd !== null),
            ...nativeEnabled ? pluginCatalog.commands : [],
            ...customCommands
        ];
        return {
            nativeCommands,
            customCommands,
            pluginCatalog,
            ...(0, _botnativecommandmenu.buildCappedTelegramMenuCommands)({
                allCommands: allCommandsFull
            })
        };
    };
    const fullCommandCatalog = resolveTelegramMenuCommandCatalog(skillCommands);
    let menuCommandCatalog = fullCommandCatalog;
    if (nativeEnabled && nativeSkillsEnabled && skillCommands.length > 0 && fullCommandCatalog.overflowCount > 0) {
        const initialCommandCount = fullCommandCatalog.totalCommands;
        menuCommandCatalog = resolveTelegramMenuCommandCatalog([], skillCommands);
        runtime.log?.(`Telegram: ${initialCommandCount} commands exceeds limit; removing per-skill commands and keeping /skill.`);
    }
    const { nativeCommands, pluginCatalog } = fullCommandCatalog;
    const loadFreshRuntimeConfig = ()=>telegramDeps.getRuntimeConfig();
    const resolveFreshTelegramConfig = (runtimeCfg)=>{
        try {
            return (0, _accounts.resolveTelegramAccount)({
                cfg: runtimeCfg,
                accountId
            }).config;
        } catch (error) {
            (0, _runtimeenv.logVerbose)(`telegram native command: failed to load fresh account config for ${accountId}; using startup snapshot: ${String(error)}`);
            return telegramCfg;
        }
    };
    const { commandsToRegister, totalCommands, maxCommands, overflowCount, maxTotalChars, descriptionTrimmed, textBudgetDropCount } = menuCommandCatalog;
    if (overflowCount > 0) {
        runtime.log?.(`Telegram limits bots to ${maxCommands} commands. ` + `${totalCommands} configured; registering first ${maxCommands}. ` + `Use channels.telegram.commands.native: false to disable, or reduce plugin/skill/custom commands.`);
    }
    if (descriptionTrimmed) {
        runtime.log?.(`Telegram menu text exceeded the conservative ${maxTotalChars}-character payload budget; shortening descriptions to keep ${commandsToRegister.length} commands visible.`);
    }
    if (textBudgetDropCount > 0) {
        runtime.log?.(`Telegram menu text still exceeded the conservative ${maxTotalChars}-character payload budget after shortening descriptions; registering first ${commandsToRegister.length} commands.`);
    }
    const syncTelegramMenuCommands = telegramDeps.syncTelegramMenuCommands ?? _botnativecommandmenu.syncTelegramMenuCommands;
    // Telegram only limits the setMyCommands payload (menu entries).
    // Keep hidden commands callable by registering handlers for the full catalog.
    syncTelegramMenuCommands({
        bot,
        runtime,
        commandsToRegister,
        accountId,
        botIdentity: opts.token
    });
    const resolveCommandRuntimeContext = async (params)=>{
        const { msg, runtimeCfg, isGroup, isForum, resolvedThreadId, senderId, topicAgentId } = params;
        const chatId = msg.chat.id;
        const messageThreadId = msg.message_thread_id;
        const threadSpec = (0, _helpers.resolveTelegramThreadSpec)({
            isGroup,
            isForum,
            messageThreadId: resolvedThreadId ?? messageThreadId
        });
        const { route, bindingMode } = (0, _conversationroute.resolveTelegramConversationRoute)({
            cfg: runtimeCfg,
            accountId,
            chatId,
            isGroup,
            resolvedThreadId,
            replyThreadId: threadSpec.id,
            senderId,
            topicAgentId
        });
        const nativeCommandRuntime = await loadTelegramNativeCommandRuntime();
        if (bindingMode.kind === "configured") {
            const ensured = await nativeCommandRuntime.ensureConfiguredBindingRouteReady({
                cfg: runtimeCfg,
                bindingResolution: bindingMode.binding
            });
            if (!ensured.ok) {
                (0, _runtimeenv.logVerbose)(`telegram native command: configured ACP binding unavailable for topic ${bindingMode.binding.record.conversation.conversationId}: ${ensured.error}`);
                await (0, _apilogging.withTelegramApiErrorLogging)({
                    operation: "sendMessage",
                    runtime,
                    fn: ()=>bot.api.sendMessage(chatId, "Configured ACP binding is unavailable right now. Please try again.", (0, _helpers.buildTelegramThreadParams)(threadSpec) ?? {})
                });
                return null;
            }
        }
        const mediaLocalRoots = nativeCommandRuntime.getAgentScopedMediaLocalRoots(runtimeCfg, route.agentId);
        const tableMode = (0, _markdowntableruntime.resolveMarkdownTableMode)({
            cfg: runtimeCfg,
            channel: "telegram",
            accountId: route.accountId
        });
        const chunkMode = nativeCommandRuntime.resolveChunkMode(runtimeCfg, "telegram", route.accountId);
        return {
            chatId,
            threadSpec,
            route,
            mediaLocalRoots,
            tableMode,
            chunkMode
        };
    };
    const buildCommandDeliveryBaseOptions = (params)=>({
            cfg: params.cfg,
            chatId: String(params.chatId),
            accountId: params.accountId,
            sessionKeyForInternalHooks: params.sessionKeyForInternalHooks,
            policySessionKey: params.policySessionKey,
            mirrorIsGroup: params.mirrorIsGroup,
            mirrorGroupId: params.mirrorGroupId,
            token: opts.token,
            runtime,
            bot,
            mediaLocalRoots: params.mediaLocalRoots,
            mediaMaxBytes,
            replyToMode,
            textLimit,
            thread: params.threadSpec,
            tableMode: params.tableMode,
            chunkMode: params.chunkMode,
            linkPreview: params.linkPreview
        });
    const resolveCommandTargetSessionKey = (params)=>{
        const baseSessionKey = (0, _conversationroute.resolveTelegramConversationBaseSessionKey)({
            cfg: params.runtimeCfg,
            route: params.route,
            chatId: params.chatId,
            isGroup: params.isGroup,
            senderId: params.senderId
        });
        const dmThreadId = params.threadSpec.scope === "dm" ? params.threadSpec.id : undefined;
        const threadKeys = (0, _helpers.shouldUseTelegramDmThreadSession)({
            dmThreadId,
            botHasTopicsEnabled: params.botHasTopicsEnabled
        }) && dmThreadId != null ? params.resolveThreadSessionKeys({
            baseSessionKey,
            threadId: `${params.chatId}:${dmThreadId}`
        }) : null;
        return threadKeys?.sessionKey ?? baseSessionKey;
    };
    if (commandsToRegister.length > 0 || pluginCatalog.commands.length > 0) {
        for (const command of nativeCommands){
            const normalizedCommandName = (0, _commandconfig.normalizeTelegramCommandName)(command.name);
            bot.command(normalizedCommandName, async (ctx)=>{
                const msg = ctx.message;
                if (!msg) {
                    return;
                }
                if (shouldSkipUpdate(ctx)) {
                    return;
                }
                const runtimeCfg = loadFreshRuntimeConfig();
                const runtimeTelegramCfg = resolveFreshTelegramConfig(runtimeCfg);
                const auth = await resolveTelegramCommandAuth({
                    msg,
                    bot,
                    cfg: runtimeCfg,
                    accountId,
                    telegramCfg: runtimeTelegramCfg,
                    readChannelAllowFromStore: telegramDeps.readChannelAllowFromStore,
                    allowFrom,
                    groupAllowFrom,
                    useAccessGroups,
                    resolveGroupPolicy,
                    resolveTelegramGroupConfig,
                    requireAuth: true
                });
                if (!auth) {
                    return;
                }
                const { chatId, isGroup, isForum, resolvedThreadId, senderId, senderUsername, groupConfig, topicConfig, commandAuthorized } = auth;
                const runtimeContext = await resolveCommandRuntimeContext({
                    msg,
                    runtimeCfg,
                    isGroup,
                    isForum,
                    resolvedThreadId,
                    senderId,
                    topicAgentId: topicConfig?.agentId
                });
                if (!runtimeContext) {
                    return;
                }
                const { threadSpec, route, mediaLocalRoots, tableMode, chunkMode } = runtimeContext;
                const threadParams = (0, _helpers.buildTelegramThreadParams)(threadSpec) ?? {};
                const originatingTo = (0, _helpers.buildTelegramRoutingTarget)(chatId, threadSpec);
                const executionCfg = (0, _runtimeconfigsnapshot.getRuntimeConfigSnapshot)() ?? cfg;
                const commandDefinition = (0, _commandauthnative.findCommandByNativeName)(command.name, "telegram");
                const rawText = ctx.match?.trim() ?? "";
                const commandArgs = commandDefinition ? (0, _commandauthnative.parseCommandArgs)(commandDefinition, rawText) : rawText ? {
                    raw: rawText
                } : undefined;
                const prompt = commandDefinition ? (0, _commandauthnative.buildCommandTextFromArgs)(commandDefinition, commandArgs) : rawText ? `/${command.name} ${rawText}` : `/${command.name}`;
                let cachedTargetSessionKey;
                let cachedNativeCommandRuntime;
                const resolveNativeCommandRuntime = async ()=>{
                    cachedNativeCommandRuntime ??= await loadTelegramNativeCommandRuntime();
                    return cachedNativeCommandRuntime;
                };
                const resolveTargetSessionKey = async ()=>{
                    if (cachedTargetSessionKey) {
                        return cachedTargetSessionKey;
                    }
                    cachedTargetSessionKey = resolveCommandTargetSessionKey({
                        runtimeCfg,
                        route,
                        chatId,
                        isGroup,
                        senderId,
                        threadSpec,
                        botHasTopicsEnabled: (0, _helpers.resolveTelegramBotHasTopicsEnabled)(ctx.me),
                        resolveThreadSessionKeys: (await resolveNativeCommandRuntime()).resolveThreadSessionKeys
                    });
                    return cachedTargetSessionKey;
                };
                const menuNeedsModelContext = commandDefinition?.argsMenu && !(commandArgs?.raw && !commandArgs.values) && commandDefinition.args?.some((arg)=>typeof arg.choices === "function" && commandArgs?.values?.[arg.name] == null);
                const menuModelContext = commandDefinition && menuNeedsModelContext ? resolveTelegramCommandMenuModelContext({
                    cfg: runtimeCfg,
                    agentId: route.agentId,
                    sessionKey: await resolveTargetSessionKey()
                }) : {};
                const menu = commandDefinition ? (0, _commandauthnative.resolveCommandArgMenu)({
                    command: commandDefinition,
                    args: commandArgs,
                    cfg: runtimeCfg,
                    ...menuModelContext
                }) : null;
                if (menu && commandDefinition) {
                    const title = formatTelegramCommandArgMenuTitle({
                        command: commandDefinition,
                        menu,
                        currentThinkingLevel: commandDefinition.key === "think" ? await resolveTelegramThinkMenuCurrentLevel({
                            cfg: runtimeCfg,
                            agentId: route.agentId,
                            ...menuModelContext
                        }) : undefined
                    });
                    const rows = [];
                    for(let i = 0; i < menu.choices.length; i += 2){
                        const slice = menu.choices.slice(i, i + 2);
                        rows.push(slice.map((choice)=>{
                            const args = {
                                values: {
                                    [menu.arg.name]: choice.value
                                }
                            };
                            return {
                                text: choice.label,
                                callback_data: (0, _nativecommandcallbackdata.buildTelegramNativeCommandCallbackData)((0, _commandauthnative.buildCommandTextFromArgs)(commandDefinition, args))
                            };
                        }));
                    }
                    const replyMarkup = (0, _inlinekeyboard.buildInlineKeyboard)(rows);
                    await (0, _apilogging.withTelegramApiErrorLogging)({
                        operation: "sendMessage",
                        runtime,
                        fn: ()=>bot.api.sendMessage(chatId, title, {
                                ...replyMarkup ? {
                                    reply_markup: replyMarkup
                                } : {},
                                ...threadParams
                            })
                    });
                    return;
                }
                const nativeCommandRuntime = await resolveNativeCommandRuntime();
                const sessionKey = await resolveTargetSessionKey();
                const { skillFilter, groupSystemPrompt } = (0, _groupconfighelpers.resolveTelegramGroupPromptSettings)({
                    groupConfig,
                    topicConfig
                });
                const { sessionKey: commandSessionKey, commandTargetSessionKey } = (0, _commandauthnative.resolveNativeCommandSessionTargets)({
                    agentId: route.agentId,
                    sessionPrefix: "telegram:slash",
                    userId: String(senderId || chatId),
                    targetSessionKey: sessionKey
                });
                const deliveryBaseOptions = buildCommandDeliveryBaseOptions({
                    cfg: executionCfg,
                    chatId,
                    accountId: route.accountId,
                    sessionKeyForInternalHooks: commandSessionKey,
                    policySessionKey: commandTargetSessionKey,
                    mirrorIsGroup: isGroup,
                    mirrorGroupId: isGroup ? String(chatId) : undefined,
                    mediaLocalRoots,
                    threadSpec,
                    tableMode,
                    chunkMode,
                    linkPreview: runtimeTelegramCfg.linkPreview
                });
                let topicName;
                if (isForum && resolvedThreadId != null) {
                    try {
                        const storePath = (0, _sessionstoreruntime.resolveStorePath)(executionCfg.session?.store, {
                            agentId: route.accountId
                        });
                        const scope = (0, _topicnamecache.resolveTopicNameCacheScope)(storePath);
                        topicName = await (0, _topicnamecache.getTopicName)(chatId, resolvedThreadId, scope);
                    } catch  {
                    // best-effort: topic name is supplementary metadata
                    }
                }
                const conversationLabel = isGroup ? msg.chat.title ? `${msg.chat.title} id:${chatId}` : `group:${chatId}` : (0, _helpers.buildSenderName)(msg) ?? String(senderId || chatId);
                const ctxPayload = nativeCommandRuntime.finalizeInboundContext({
                    Body: prompt,
                    BodyForAgent: prompt,
                    RawBody: prompt,
                    CommandBody: prompt,
                    CommandArgs: commandArgs,
                    From: isGroup ? (0, _helpers.buildTelegramGroupFrom)(chatId, resolvedThreadId) : `telegram:${chatId}`,
                    To: `slash:${senderId || chatId}`,
                    ChatType: isGroup ? "group" : "direct",
                    ConversationLabel: conversationLabel,
                    GroupSubject: isGroup ? msg.chat.title ?? undefined : undefined,
                    GroupSystemPrompt: isGroup || !isGroup && groupConfig ? groupSystemPrompt : undefined,
                    SenderName: (0, _helpers.buildSenderName)(msg),
                    SenderId: senderId || undefined,
                    SenderUsername: senderUsername || undefined,
                    Surface: "telegram",
                    Provider: "telegram",
                    MessageSid: String(msg.message_id),
                    Timestamp: msg.date ? msg.date * 1000 : undefined,
                    WasMentioned: true,
                    CommandAuthorized: commandAuthorized,
                    CommandTurn: {
                        kind: "native",
                        source: "native",
                        authorized: commandAuthorized,
                        body: prompt
                    },
                    CommandSource: "native",
                    SessionKey: commandSessionKey,
                    AccountId: route.accountId,
                    CommandTargetSessionKey: commandTargetSessionKey,
                    MessageThreadId: threadSpec.id,
                    IsForum: isForum,
                    TopicName: isForum && topicName ? topicName : undefined,
                    // Originating context for sub-agent announce routing
                    OriginatingChannel: "telegram",
                    OriginatingTo: originatingTo
                });
                await nativeCommandRuntime.recordInboundSessionMetaSafe({
                    cfg: executionCfg,
                    agentId: route.agentId,
                    sessionKey: commandTargetSessionKey,
                    ctx: ctxPayload,
                    onError: (err)=>runtime.error?.((0, _runtimeenv.danger)(`telegram slash: failed updating session meta: ${String(err)}`))
                });
                const disableBlockStreaming = resolveTelegramNativeCommandDisableBlockStreaming(runtimeTelegramCfg);
                const deliveryState = {
                    delivered: false,
                    skippedNonSilent: 0
                };
                const { createChannelMessageReplyPipeline, deliverReplies } = await loadTelegramNativeCommandDeliveryRuntime();
                const { onModelSelected, ...replyPipeline } = createChannelMessageReplyPipeline({
                    cfg: executionCfg,
                    agentId: route.agentId,
                    channel: "telegram",
                    accountId: route.accountId
                });
                await telegramDeps.dispatchReplyWithBufferedBlockDispatcher({
                    ctx: ctxPayload,
                    cfg: executionCfg,
                    dispatcherOptions: {
                        ...replyPipeline,
                        beforeDeliver: async (payload)=>payload,
                        deliver: async (payload, _info)=>{
                            if ((0, _execapprovals.shouldSuppressLocalTelegramExecApprovalPrompt)({
                                cfg: executionCfg,
                                accountId: route.accountId,
                                payload
                            })) {
                                deliveryState.delivered = true;
                                return;
                            }
                            const result = await deliverReplies({
                                replies: [
                                    payload.replyToId ? payload : {
                                        ...payload,
                                        replyToId: String(msg.message_id)
                                    }
                                ],
                                ...deliveryBaseOptions,
                                silent: runtimeTelegramCfg.silentErrorReplies === true && payload.isError === true
                            });
                            if (result.delivered) {
                                deliveryState.delivered = true;
                            }
                        },
                        onSkip: (_payload, info)=>{
                            if (info.reason !== "silent") {
                                deliveryState.skippedNonSilent += 1;
                            }
                        },
                        onError: (err, info)=>{
                            runtime.error?.((0, _runtimeenv.danger)(`telegram slash ${info.kind} reply failed: ${String(err)}`));
                        }
                    },
                    replyOptions: {
                        skillFilter,
                        disableBlockStreaming,
                        onModelSelected
                    }
                });
                if (!deliveryState.delivered && deliveryState.skippedNonSilent > 0) {
                    await deliverReplies({
                        replies: [
                            {
                                text: EMPTY_RESPONSE_FALLBACK
                            }
                        ],
                        ...deliveryBaseOptions
                    });
                }
            });
        }
        for (const pluginCommand of pluginCatalog.commands){
            bot.command(pluginCommand.command, async (ctx)=>{
                const msg = ctx.message;
                if (!msg) {
                    return;
                }
                if (shouldSkipUpdate(ctx)) {
                    return;
                }
                const chatId = msg.chat.id;
                const runtimeCfg = loadFreshRuntimeConfig();
                const runtimeTelegramCfg = resolveFreshTelegramConfig(runtimeCfg);
                const { threadParams } = await resolveTelegramNativeCommandThreadContext({
                    msg,
                    bot
                });
                const rawText = ctx.match?.trim() ?? "";
                const commandBody = `/${pluginCommand.command}${rawText ? ` ${rawText}` : ""}`;
                const nativeCommandRuntime = await loadTelegramNativeCommandRuntime();
                const match = nativeCommandRuntime.matchPluginCommand(commandBody);
                if (!match) {
                    await (0, _apilogging.withTelegramApiErrorLogging)({
                        operation: "sendMessage",
                        runtime,
                        fn: ()=>bot.api.sendMessage(chatId, "Command not found.", threadParams ?? {})
                    });
                    return;
                }
                const auth = await resolveTelegramCommandAuth({
                    msg,
                    bot,
                    cfg: runtimeCfg,
                    accountId,
                    telegramCfg: runtimeTelegramCfg,
                    readChannelAllowFromStore: telegramDeps.readChannelAllowFromStore,
                    allowFrom,
                    groupAllowFrom,
                    useAccessGroups,
                    resolveGroupPolicy,
                    resolveTelegramGroupConfig,
                    requireAuth: match.command.requireAuth !== false
                });
                if (!auth) {
                    return;
                }
                const { senderId, commandAuthorized, senderIsOwner, isGroup, isForum, resolvedThreadId } = auth;
                const runtimeContext = await resolveCommandRuntimeContext({
                    msg,
                    runtimeCfg,
                    isGroup,
                    isForum,
                    resolvedThreadId,
                    senderId,
                    topicAgentId: auth.topicConfig?.agentId
                });
                if (!runtimeContext) {
                    return;
                }
                const { threadSpec, route, mediaLocalRoots, tableMode, chunkMode } = runtimeContext;
                const targetSessionKey = resolveCommandTargetSessionKey({
                    runtimeCfg,
                    route,
                    chatId,
                    isGroup,
                    senderId,
                    threadSpec,
                    botHasTopicsEnabled: (0, _helpers.resolveTelegramBotHasTopicsEnabled)(ctx.me),
                    resolveThreadSessionKeys: nativeCommandRuntime.resolveThreadSessionKeys
                });
                const targetSessionEntry = nativeCommandRuntime.getSessionEntry({
                    agentId: route.agentId,
                    sessionKey: targetSessionKey
                });
                const deliveryBaseOptions = buildCommandDeliveryBaseOptions({
                    cfg: runtimeCfg,
                    chatId,
                    accountId: route.accountId,
                    sessionKeyForInternalHooks: targetSessionKey,
                    policySessionKey: targetSessionKey,
                    mirrorIsGroup: isGroup,
                    mirrorGroupId: isGroup ? String(chatId) : undefined,
                    mediaLocalRoots,
                    threadSpec,
                    tableMode,
                    chunkMode,
                    linkPreview: runtimeTelegramCfg.linkPreview
                });
                const from = isGroup ? (0, _helpers.buildTelegramGroupFrom)(chatId, threadSpec.id) : `telegram:${chatId}`;
                const to = `telegram:${chatId}`;
                const { deliverReplies, emitTelegramMessageSentHooks } = await loadTelegramNativeCommandDeliveryRuntime();
                let progressMessageId;
                const progressPlaceholder = resolveTelegramProgressPlaceholder(match.command);
                if (progressPlaceholder) {
                    try {
                        const sent = await (0, _apilogging.withTelegramApiErrorLogging)({
                            operation: "sendMessage",
                            runtime,
                            fn: ()=>bot.api.sendMessage(chatId, progressPlaceholder, (0, _helpers.buildTelegramThreadParams)(threadSpec))
                        });
                        const maybeMessageId = sent?.message_id;
                        if (typeof maybeMessageId === "number") {
                            progressMessageId = maybeMessageId;
                        }
                    } catch  {
                    // Fall back to the normal final reply path if the placeholder send fails.
                    }
                }
                const sessionFileContext = await resolveTelegramCommandSessionFile({
                    cfg: runtimeCfg,
                    agentId: route.agentId,
                    sessionKey: targetSessionKey,
                    threadId: threadSpec.id
                });
                const result = normalizeTelegramNativeReplyPayload(await nativeCommandRuntime.executePluginCommand({
                    command: match.command,
                    args: match.args,
                    senderId,
                    channel: "telegram",
                    isAuthorizedSender: commandAuthorized,
                    senderIsOwner,
                    agentId: route.agentId,
                    sessionKey: targetSessionKey,
                    sessionId: sessionFileContext.sessionId,
                    sessionFile: sessionFileContext.sessionFile,
                    authProfileId: sessionFileContext.authProfileId ?? targetSessionEntry?.authProfileOverride,
                    commandBody,
                    config: runtimeCfg,
                    from,
                    to,
                    accountId,
                    messageThreadId: threadSpec.id
                }));
                if ((0, _execapprovals.shouldSuppressLocalTelegramExecApprovalPrompt)({
                    cfg: runtimeCfg,
                    accountId: route.accountId,
                    payload: result
                })) {
                    await cleanupTelegramProgressPlaceholder({
                        bot,
                        chatId,
                        progressMessageId,
                        runtime
                    });
                    return;
                }
                const deliverableResult = hasRenderableTelegramNativeReplyPayload(result) ? result : {
                    text: EMPTY_RESPONSE_FALLBACK
                };
                const progressResultText = typeof deliverableResult.text === "string" && deliverableResult.text.trim().length > 0 ? deliverableResult.text : null;
                const telegramResultData = resolveTelegramNativeReplyChannelData(deliverableResult);
                if (progressMessageId != null && telegramDeps.editMessageTelegram && progressResultText && isEditableTelegramProgressResult(deliverableResult)) {
                    try {
                        await telegramDeps.editMessageTelegram(chatId, progressMessageId, progressResultText, {
                            cfg: runtimeCfg,
                            accountId: route.accountId,
                            textMode: "markdown",
                            linkPreview: runtimeTelegramCfg.linkPreview,
                            buttons: telegramResultData?.buttons
                        });
                        (0, _sentmessagecache.recordSentMessage)(chatId, progressMessageId, runtimeCfg);
                        emitTelegramMessageSentHooks({
                            sessionKeyForInternalHooks: targetSessionKey,
                            chatId: String(chatId),
                            accountId: route.accountId,
                            content: progressResultText,
                            success: true,
                            messageId: progressMessageId,
                            isGroup,
                            groupId: isGroup ? String(chatId) : undefined
                        });
                        return;
                    } catch  {
                    // Fall through to cleanup + normal delivered reply if editing fails.
                    }
                }
                await cleanupTelegramProgressPlaceholder({
                    bot,
                    chatId,
                    progressMessageId,
                    runtime
                });
                await deliverReplies({
                    replies: [
                        deliverableResult
                    ],
                    ...deliveryBaseOptions,
                    silent: runtimeTelegramCfg.silentErrorReplies === true && deliverableResult.isError === true
                });
            });
        }
    } else if (nativeDisabledExplicit) {
        (0, _apilogging.withTelegramApiErrorLogging)({
            operation: "setMyCommands",
            runtime,
            fn: ()=>bot.api.setMyCommands([])
        }).catch(()=>{});
        (0, _apilogging.withTelegramApiErrorLogging)({
            operation: "setMyCommands(all_group_chats)",
            runtime,
            fn: ()=>bot.api.setMyCommands([], {
                    scope: {
                        type: "all_group_chats"
                    }
                })
        }).catch(()=>{});
    }
};

//# sourceMappingURL=bot-native-commands.js.map