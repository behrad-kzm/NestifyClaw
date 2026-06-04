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
    get createTelegramBotCore () {
        return createTelegramBotCore;
    },
    get getTelegramSequentialKey () {
        return _sequentialkey.getTelegramSequentialKey;
    },
    get resolveTelegramScopedGroupConfig () {
        return resolveTelegramScopedGroupConfig;
    },
    get setTelegramBotRuntimeForTest () {
        return setTelegramBotRuntimeForTest;
    }
});
const _channelpolicy = require("../../../../common/openclaw/plugin-sdk/channel-policy");
const _conversationruntime = require("../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _nativecommandconfigruntime = require("../../../../common/openclaw/plugin-sdk/native-command-config-runtime");
const _replychunking = require("../../../../common/openclaw/plugin-sdk/reply-chunking");
const _replyhistory = require("../../../../common/openclaw/plugin-sdk/reply-history");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accountthrottler = require("./account-throttler.js");
const _accounts = require("./accounts.js");
const _apiroot = require("./api-root.js");
const _bothandlersruntime = require("./bot-handlers.runtime.js");
const _botmessage = require("./bot-message.js");
const _botnativecommands = require("./bot-native-commands.js");
const _botupdatetracker = require("./bot-update-tracker.js");
const _botagentruntime = require("./bot.agent.runtime.js");
const _botruntime = require("./bot.runtime.js");
const _helpers = require("./bot/helpers.js");
const _clientfetch = require("./client-fetch.js");
const _fetch = require("./fetch.js");
const _rawupdatelog = require("./raw-update-log.js");
const _sendchataction401backoff = require("./sendchataction-401-backoff.js");
const _sequentialkey = require("./sequential-key.js");
const _threadbindings = require("./thread-bindings.js");
function resolveTelegramScopedGroupConfig(telegramCfg, chatId, messageThreadId) {
    const resolveTopicConfig = (scopedConfig)=>{
        if (!scopedConfig || messageThreadId == null) {
            return undefined;
        }
        const defaultConfig = scopedConfig.topics?.["*"];
        const exactConfig = scopedConfig.topics?.[String(messageThreadId)];
        if (defaultConfig && exactConfig) {
            return {
                ...defaultConfig,
                ...exactConfig
            };
        }
        return exactConfig ?? defaultConfig;
    };
    const groups = telegramCfg.groups;
    const direct = telegramCfg.direct;
    const chatIdStr = String(chatId);
    const isDm = !chatIdStr.startsWith("-");
    if (isDm) {
        const groupConfig = direct?.[chatIdStr] ?? direct?.["*"];
        const topicConfig = resolveTopicConfig(groupConfig);
        return {
            groupConfig,
            topicConfig
        };
    }
    const groupConfig = groups?.[chatIdStr] ?? groups?.["*"];
    const topicConfig = resolveTopicConfig(groupConfig);
    return {
        groupConfig,
        topicConfig
    };
}
const DEFAULT_TELEGRAM_BOT_RUNTIME = {
    Bot: _botruntime.Bot,
    sequentialize: _botruntime.sequentialize,
    apiThrottler: _botruntime.apiThrottler
};
const TELEGRAM_TYPING_COALESCE_MS = 4_000;
let telegramBotRuntimeForTest;
function setTelegramBotRuntimeForTest(runtime) {
    telegramBotRuntimeForTest = runtime;
}
function createTelegramBotCore(opts) {
    const botRuntime = telegramBotRuntimeForTest ?? DEFAULT_TELEGRAM_BOT_RUNTIME;
    const runtime = opts.runtime ?? (0, _runtimeenv.createNonExitingRuntime)();
    const telegramDeps = opts.telegramDeps;
    const cfg = opts.config ?? telegramDeps.getRuntimeConfig();
    const account = (0, _accounts.resolveTelegramAccount)({
        cfg,
        accountId: opts.accountId
    });
    const threadBindingPolicy = (0, _conversationruntime.resolveThreadBindingSpawnPolicy)({
        cfg,
        channel: "telegram",
        accountId: account.accountId,
        kind: "subagent"
    });
    const threadBindingManager = threadBindingPolicy.enabled ? (0, _threadbindings.createTelegramThreadBindingManager)({
        cfg,
        accountId: account.accountId,
        idleTimeoutMs: (0, _conversationruntime.resolveThreadBindingIdleTimeoutMsForChannel)({
            cfg,
            channel: "telegram",
            accountId: account.accountId
        }),
        maxAgeMs: (0, _conversationruntime.resolveThreadBindingMaxAgeMsForChannel)({
            cfg,
            channel: "telegram",
            accountId: account.accountId
        })
    }) : null;
    const telegramCfg = account.config;
    const telegramTransport = opts.telegramTransport ?? (0, _fetch.resolveTelegramTransport)(opts.proxyFetch, {
        network: telegramCfg.network
    });
    const finalFetch = (0, _clientfetch.createTelegramClientFetch)({
        fetchImpl: (0, _clientfetch.asTelegramClientFetch)(telegramTransport.fetch),
        timeoutSeconds: telegramCfg?.timeoutSeconds,
        shutdownSignal: opts.fetchAbortSignal,
        transport: telegramTransport
    });
    const timeoutSeconds = (0, _clientfetch.resolveTelegramClientTimeoutSeconds)({
        value: telegramCfg?.timeoutSeconds,
        minimum: (0, _clientfetch.resolveTelegramClientTimeoutMinimumSeconds)([
            opts.minimumClientTimeoutSeconds,
            (0, _clientfetch.resolveTelegramOutboundClientTimeoutFloorSeconds)(telegramCfg?.timeoutSeconds)
        ])
    });
    const apiRoot = (0, _stringcoerceruntime.normalizeOptionalString)(telegramCfg.apiRoot);
    const normalizedApiRoot = apiRoot ? (0, _apiroot.normalizeTelegramApiRoot)(apiRoot) : undefined;
    const client = finalFetch || timeoutSeconds || normalizedApiRoot ? {
        ...finalFetch ? {
            fetch: (0, _clientfetch.asTelegramClientFetch)(finalFetch)
        } : {},
        ...timeoutSeconds ? {
            timeoutSeconds
        } : {},
        ...normalizedApiRoot ? {
            apiRoot: normalizedApiRoot
        } : {}
    } : undefined;
    const botConfig = client || opts.botInfo ? {
        ...client ? {
            client
        } : {},
        ...opts.botInfo ? {
            botInfo: opts.botInfo
        } : {}
    } : undefined;
    const bot = new botRuntime.Bot(opts.token, botConfig);
    bot.api.config.use((0, _accountthrottler.getOrCreateAccountThrottler)(opts.token, botRuntime.apiThrottler));
    // Catch all errors from bot middleware to prevent unhandled rejections
    bot.catch((err)=>{
        runtime.error?.((0, _runtimeenv.danger)(`telegram bot error: ${(0, _errorruntime.formatUncaughtError)(err)}`));
    });
    const initialUpdateId = typeof opts.updateOffset?.lastUpdateId === "number" ? opts.updateOffset.lastUpdateId : null;
    const logSkippedUpdate = (key)=>{
        if ((0, _runtimeenv.shouldLogVerbose)()) {
            (0, _runtimeenv.logVerbose)(`telegram dedupe: skipped ${key}`);
        }
    };
    const updateTracker = (0, _botupdatetracker.createTelegramUpdateTracker)({
        initialUpdateId,
        persistenceFloorUpdateId: typeof opts.updateOffset?.persistenceFloorUpdateId === "number" ? opts.updateOffset.persistenceFloorUpdateId : initialUpdateId,
        ackPolicy: "after_agent_dispatch",
        ...typeof opts.updateOffset?.onUpdateId === "function" ? {
            onAcceptedUpdateId: opts.updateOffset.onUpdateId
        } : {},
        onPersistError: (err)=>{
            runtime.error?.(`telegram: failed to persist update watermark: ${(0, _errorruntime.formatErrorMessage)(err)}`);
        },
        onSkip: logSkippedUpdate
    });
    const shouldSkipUpdate = (ctx)=>updateTracker.shouldSkipHandlerDispatch(ctx);
    bot.use(async (ctx, next)=>{
        const begin = updateTracker.beginUpdate(ctx);
        if (!begin.accepted) {
            return;
        }
        try {
            await next();
            updateTracker.finishUpdate(begin.update, {
                completed: true
            });
        } catch (error) {
            updateTracker.finishUpdate(begin.update, {
                completed: false
            });
            throw error;
        }
    });
    bot.use(botRuntime.sequentialize(_sequentialkey.getTelegramSequentialKey));
    const rawUpdateLogger = (0, _runtimeenv.createSubsystemLogger)("gateway/channels/telegram/raw-update");
    const MAX_RAW_UPDATE_CHARS = 8000;
    bot.use(async (ctx, next)=>{
        if ((0, _runtimeenv.shouldLogVerbose)()) {
            try {
                const raw = (0, _rawupdatelog.stringifyTelegramRawUpdateForLog)(ctx.update);
                const preview = raw.length > MAX_RAW_UPDATE_CHARS ? `${raw.slice(0, MAX_RAW_UPDATE_CHARS)}...` : raw;
                rawUpdateLogger.debug(`telegram update: ${preview}`);
            } catch (err) {
                rawUpdateLogger.debug(`telegram update log failed: ${String(err)}`);
            }
        }
        await next();
    });
    const historyLimit = Math.max(0, telegramCfg.historyLimit ?? cfg.messages?.groupChat?.historyLimit ?? _replyhistory.DEFAULT_GROUP_HISTORY_LIMIT);
    const groupHistories = new Map();
    const textLimit = (0, _replychunking.resolveTextChunkLimit)(cfg, "telegram", account.accountId);
    const dmPolicy = telegramCfg.dmPolicy ?? "pairing";
    const allowFrom = opts.allowFrom ?? telegramCfg.allowFrom;
    const groupAllowFrom = opts.groupAllowFrom ?? telegramCfg.groupAllowFrom ?? telegramCfg.allowFrom ?? allowFrom;
    const replyToMode = opts.replyToMode ?? telegramCfg.replyToMode ?? "off";
    const nativeEnabled = (0, _nativecommandconfigruntime.resolveNativeCommandsEnabled)({
        providerId: "telegram",
        providerSetting: telegramCfg.commands?.native,
        globalSetting: cfg.commands?.native
    });
    const nativeSkillsEnabled = (0, _nativecommandconfigruntime.resolveNativeSkillsEnabled)({
        providerId: "telegram",
        providerSetting: telegramCfg.commands?.nativeSkills,
        globalSetting: cfg.commands?.nativeSkills
    });
    const nativeDisabledExplicit = (0, _nativecommandconfigruntime.isNativeCommandsExplicitlyDisabled)({
        providerSetting: telegramCfg.commands?.native,
        globalSetting: cfg.commands?.native
    });
    const useAccessGroups = cfg.commands?.useAccessGroups !== false;
    const ackReactionScope = cfg.messages?.ackReactionScope ?? "group-mentions";
    const mediaMaxBytes = (opts.mediaMaxMb ?? telegramCfg.mediaMaxMb ?? 100) * 1024 * 1024;
    const logger = (0, _runtimeenv.getChildLogger)({
        module: "telegram-auto-reply"
    });
    const streamMode = (0, _helpers.resolveTelegramStreamMode)(telegramCfg);
    const resolveGroupPolicy = (chatId)=>(0, _channelpolicy.resolveChannelGroupPolicy)({
            cfg,
            channel: "telegram",
            accountId: account.accountId,
            groupId: String(chatId)
        });
    const resolveGroupActivation = (params)=>{
        const agentId = params.agentId ?? (0, _botagentruntime.resolveDefaultAgentId)(cfg);
        const sessionKey = params.sessionKey ?? `agent:${agentId}:telegram:group:${(0, _helpers.buildTelegramGroupPeerId)(params.chatId, params.messageThreadId)}`;
        const storePath = telegramDeps.resolveStorePath(cfg.session?.store, {
            agentId
        });
        try {
            const loadSessionStore = telegramDeps.loadSessionStore;
            if (!loadSessionStore) {
                return undefined;
            }
            const store = loadSessionStore(storePath);
            const entry = store[sessionKey];
            if (entry?.groupActivation === "always") {
                return false;
            }
            if (entry?.groupActivation === "mention") {
                return true;
            }
        } catch (err) {
            (0, _runtimeenv.logVerbose)(`Failed to load session for activation check: ${String(err)}`);
        }
        return undefined;
    };
    const resolveGroupRequireMention = (chatId)=>(0, _channelpolicy.resolveChannelGroupRequireMention)({
            cfg,
            channel: "telegram",
            accountId: account.accountId,
            groupId: String(chatId),
            requireMentionOverride: opts.requireMention,
            overrideOrder: "after-config"
        });
    const loadFreshTelegramAccountConfig = ()=>{
        try {
            return (0, _accounts.resolveTelegramAccount)({
                cfg: telegramDeps.getRuntimeConfig(),
                accountId: account.accountId
            }).config;
        } catch (error) {
            (0, _runtimeenv.logVerbose)(`telegram: failed to load fresh config for account ${account.accountId}; using startup snapshot: ${String(error)}`);
            return telegramCfg;
        }
    };
    const resolveTelegramGroupConfig = (chatId, messageThreadId)=>{
        const freshTelegramCfg = loadFreshTelegramAccountConfig();
        return resolveTelegramScopedGroupConfig(freshTelegramCfg, chatId, messageThreadId);
    };
    // Global sendChatAction handler with 401 backoff / circuit breaker (issue #27092).
    // Created BEFORE the message processor so it can be injected into every message context.
    // Shared across all message contexts for this account so that consecutive 401s
    // from ANY chat are tracked together — prevents infinite retry storms.
    const sendChatActionHandler = (0, _sendchataction401backoff.createTelegramSendChatActionHandler)({
        sendChatActionFn: (chatId, action, threadParams)=>bot.api.sendChatAction(chatId, action, threadParams),
        logger: (message)=>(0, _runtimeenv.logVerbose)(`telegram: ${message}`),
        minIntervalMs: TELEGRAM_TYPING_COALESCE_MS
    });
    const processMessage = (0, _botmessage.createTelegramMessageProcessor)({
        bot,
        cfg,
        account,
        telegramCfg,
        historyLimit,
        groupHistories,
        dmPolicy,
        allowFrom,
        groupAllowFrom,
        ackReactionScope,
        logger,
        resolveGroupActivation,
        resolveGroupRequireMention,
        resolveTelegramGroupConfig,
        loadFreshConfig: ()=>telegramDeps.getRuntimeConfig(),
        sendChatActionHandler,
        runtime,
        replyToMode,
        streamMode,
        textLimit,
        opts,
        telegramDeps
    });
    (0, _botnativecommands.registerTelegramNativeCommands)({
        bot,
        cfg,
        runtime,
        accountId: account.accountId,
        telegramCfg,
        allowFrom,
        groupAllowFrom,
        replyToMode,
        textLimit,
        mediaMaxBytes,
        useAccessGroups,
        nativeEnabled,
        nativeSkillsEnabled,
        nativeDisabledExplicit,
        resolveGroupPolicy,
        resolveTelegramGroupConfig,
        shouldSkipUpdate,
        opts,
        telegramDeps
    });
    (0, _bothandlersruntime.registerTelegramHandlers)({
        cfg,
        accountId: account.accountId,
        bot,
        opts,
        telegramTransport,
        runtime,
        mediaMaxBytes,
        telegramCfg,
        allowFrom,
        groupAllowFrom,
        resolveGroupPolicy,
        resolveGroupActivation,
        resolveGroupRequireMention,
        resolveTelegramGroupConfig,
        shouldSkipUpdate,
        processMessage,
        logger,
        telegramDeps
    });
    const originalStop = bot.stop.bind(bot);
    bot.stop = (...args)=>{
        threadBindingManager?.stop();
        return originalStop(...args);
    };
    return bot;
}

//# sourceMappingURL=bot-core.js.map