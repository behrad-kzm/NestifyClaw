"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "detectTelegramLegacyStateMigrations", {
    enumerable: true,
    get: function() {
        return detectTelegramLegacyStateMigrations;
    }
});
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _channelpairing = require("../../../../common/openclaw/plugin-sdk/channel-pairing");
const _securityruntime = require("../../../../common/openclaw/plugin-sdk/security-runtime");
const _sessionstoreruntime = require("../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accountselection = require("./account-selection.js");
const _botinfocache = require("./bot-info-cache.js");
const _messagecache = require("./message-cache.js");
const _messagedispatchdedupe = require("./message-dispatch-dedupe.js");
const _sentmessagecache = require("./sent-message-cache.js");
const _stickercachestore = require("./sticker-cache-store.js");
const _threadbindings = require("./thread-bindings.js");
const _token = require("./token.js");
const _topicnamecache = require("./topic-name-cache.js");
const _updateoffsetstore = require("./update-offset-store.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function fileExists(pathValue) {
    try {
        return !(0, _securityruntime.statRegularFileSync)(pathValue).missing;
    } catch  {
        return false;
    }
}
function resolveLegacySessionStorePath(params) {
    return _nodepath.default.join(resolveMigrationStateDir(params), "sessions", "sessions.json");
}
function resolveMigrationStateDir(params) {
    return params.stateDir ?? _nodepath.default.dirname(_nodepath.default.dirname(_nodepath.default.dirname(_nodepath.default.dirname((0, _sessionstoreruntime.resolveStorePath)(undefined, {
        env: params.env
    })))));
}
function listTelegramLegacySidecarAccountIds(params) {
    let persistedAccountIds;
    try {
        persistedAccountIds = _nodefs.default.readdirSync(_nodepath.default.join(params.stateDir, "telegram"), {
            withFileTypes: true
        }).filter((entry)=>entry.isFile() && entry.name.startsWith(params.prefix) && entry.name.endsWith(params.suffix)).map((entry)=>entry.name.slice(params.prefix.length, -params.suffix.length)).filter(Boolean);
    } catch  {
        persistedAccountIds = [];
    }
    return (0, _stringcoerceruntime.uniqueStrings)([
        ...(0, _accountselection.listTelegramAccountIds)(params.cfg),
        ...persistedAccountIds
    ]);
}
function detectTelegramMessageCacheLegacyStateMigration(params) {
    const storePath = (0, _sessionstoreruntime.resolveStorePath)(params.cfg.session?.store, {
        env: params.env
    });
    const runtimePersistedPath = (0, _messagecache.resolveTelegramMessageCachePath)(storePath);
    const legacyStorePath = resolveLegacySessionStorePath(params);
    const legacyPersistedPath = (0, _messagecache.resolveTelegramMessageCachePath)(legacyStorePath);
    const scopeKey = (0, _messagecache.resolveTelegramMessageCachePersistentScopeKey)(runtimePersistedPath);
    const sourcePaths = (0, _stringcoerceruntime.uniqueStrings)([
        runtimePersistedPath,
        legacyPersistedPath
    ]);
    return sourcePaths.flatMap((persistedPath)=>{
        if (!fileExists(persistedPath)) {
            return [];
        }
        return {
            kind: "plugin-state-import",
            label: "Telegram prompt-context message cache",
            sourcePath: persistedPath,
            targetPath: `plugin state:${_messagecache.TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE}`,
            pluginId: "telegram",
            namespace: _messagecache.TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE,
            maxEntries: _messagecache.TELEGRAM_MESSAGE_CACHE_PERSISTENT_MAX_MESSAGES,
            scopeKey,
            cleanupSource: "rename",
            preview: `- Telegram prompt-context message cache: ${persistedPath} → plugin state (${_messagecache.TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE})`,
            readEntries: ()=>{
                return (0, _messagecache.listTelegramLegacyMessageCacheEntries)({
                    persistedPath,
                    maxMessages: _messagecache.TELEGRAM_MESSAGE_CACHE_PERSISTENT_MAX_MESSAGES
                });
            }
        };
    });
}
function detectTelegramBotInfoCacheLegacyStateMigration(params) {
    return (0, _accountselection.listTelegramAccountIds)(params.cfg).flatMap((accountId)=>{
        const persistedPath = (0, _botinfocache.resolveTelegramBotInfoCachePath)(accountId, params.env);
        if (!fileExists(persistedPath)) {
            return [];
        }
        return {
            kind: "plugin-state-import",
            label: "Telegram startup bot info cache",
            sourcePath: persistedPath,
            targetPath: `plugin state:${_botinfocache.TELEGRAM_BOT_INFO_CACHE_NAMESPACE}`,
            pluginId: "telegram",
            namespace: _botinfocache.TELEGRAM_BOT_INFO_CACHE_NAMESPACE,
            maxEntries: _botinfocache.TELEGRAM_BOT_INFO_CACHE_MAX_ENTRIES,
            scopeKey: "",
            cleanupSource: "rename",
            preview: `- Telegram startup bot info cache: ${persistedPath} → plugin state (${_botinfocache.TELEGRAM_BOT_INFO_CACHE_NAMESPACE})`,
            readEntries: ()=>{
                return (0, _botinfocache.listTelegramLegacyBotInfoCacheEntries)({
                    accountId,
                    persistedPath
                });
            }
        };
    });
}
function detectTelegramUpdateOffsetLegacyStateMigration(params) {
    const stateDir = resolveMigrationStateDir(params);
    return listTelegramLegacySidecarAccountIds({
        cfg: params.cfg,
        stateDir,
        prefix: "update-offset-",
        suffix: ".json"
    }).flatMap((accountId)=>{
        const normalized = (0, _updateoffsetstore.normalizeTelegramUpdateOffsetAccountId)(accountId);
        const persistedPath = _nodepath.default.join(stateDir, "telegram", `update-offset-${normalized}.json`);
        if (!fileExists(persistedPath)) {
            return [];
        }
        let botToken;
        try {
            botToken = (0, _token.resolveTelegramToken)(params.cfg, {
                accountId,
                envToken: params.env.TELEGRAM_BOT_TOKEN
            }).token || undefined;
        } catch  {
            botToken = undefined;
        }
        return {
            kind: "plugin-state-import",
            label: "Telegram update offset",
            sourcePath: persistedPath,
            targetPath: `plugin state:${_updateoffsetstore.TELEGRAM_UPDATE_OFFSET_NAMESPACE}`,
            pluginId: "telegram",
            namespace: _updateoffsetstore.TELEGRAM_UPDATE_OFFSET_NAMESPACE,
            maxEntries: _updateoffsetstore.TELEGRAM_UPDATE_OFFSET_MAX_ENTRIES,
            scopeKey: "",
            cleanupSource: "rename",
            preview: `- Telegram update offset: ${persistedPath} → plugin state (${_updateoffsetstore.TELEGRAM_UPDATE_OFFSET_NAMESPACE})`,
            readEntries: ()=>(0, _updateoffsetstore.listTelegramLegacyUpdateOffsetEntries)({
                    accountId,
                    persistedPath
                }),
            shouldReplaceExistingEntry: ({ existingValue, incomingValue })=>(0, _updateoffsetstore.shouldReplaceTelegramUpdateOffsetEntry)({
                    existingValue,
                    incomingValue,
                    botToken
                })
        };
    });
}
function detectTelegramStickerCacheLegacyStateMigration(params) {
    const stateDir = resolveMigrationStateDir(params);
    const persistedPath = _nodepath.default.join(stateDir, "telegram", "sticker-cache.json");
    if (!fileExists(persistedPath)) {
        return [];
    }
    return [
        {
            kind: "plugin-state-import",
            label: "Telegram sticker cache",
            sourcePath: persistedPath,
            targetPath: `plugin state:${_stickercachestore.TELEGRAM_STICKER_CACHE_NAMESPACE}`,
            pluginId: "telegram",
            namespace: _stickercachestore.TELEGRAM_STICKER_CACHE_NAMESPACE,
            maxEntries: _stickercachestore.TELEGRAM_STICKER_CACHE_MAX_ENTRIES,
            scopeKey: "",
            cleanupSource: "rename",
            preview: `- Telegram sticker cache: ${persistedPath} → plugin state (${_stickercachestore.TELEGRAM_STICKER_CACHE_NAMESPACE})`,
            readEntries: ()=>(0, _stickercachestore.listTelegramLegacyStickerCacheEntries)({
                    persistedPath
                })
        }
    ];
}
function detectTelegramSentMessageCacheLegacyStateMigration(params) {
    const storePath = (0, _sessionstoreruntime.resolveStorePath)(params.cfg.session?.store, {
        env: params.env
    });
    const legacyStorePath = resolveLegacySessionStorePath(params);
    const sources = (0, _stringcoerceruntime.uniqueStrings)([
        storePath,
        legacyStorePath
    ]).map((sourceStorePath)=>({
            targetStorePath: storePath,
            sourcePath: `${sourceStorePath}.telegram-sent-messages.json`
        }));
    return sources.flatMap((source)=>{
        if (!fileExists(source.sourcePath)) {
            return [];
        }
        return {
            kind: "plugin-state-import",
            label: "Telegram sent-message cache",
            sourcePath: source.sourcePath,
            targetPath: `plugin state:${_sentmessagecache.TELEGRAM_SENT_MESSAGE_CACHE_NAMESPACE}`,
            pluginId: "telegram",
            namespace: _sentmessagecache.TELEGRAM_SENT_MESSAGE_CACHE_NAMESPACE,
            maxEntries: _sentmessagecache.TELEGRAM_SENT_MESSAGE_CACHE_MAX_ENTRIES,
            scopeKey: "",
            cleanupSource: "rename",
            preview: `- Telegram sent-message cache: ${source.sourcePath} → plugin state (${_sentmessagecache.TELEGRAM_SENT_MESSAGE_CACHE_NAMESPACE})`,
            readEntries: ()=>(0, _sentmessagecache.listTelegramLegacySentMessageCacheEntries)({
                    cfg: {
                        session: {
                            store: source.targetStorePath
                        }
                    },
                    persistedPath: source.sourcePath
                })
        };
    });
}
function detectTelegramThreadBindingLegacyStateMigration(params) {
    const stateDir = resolveMigrationStateDir(params);
    return listTelegramLegacySidecarAccountIds({
        cfg: params.cfg,
        stateDir,
        prefix: "thread-bindings-",
        suffix: ".json"
    }).flatMap((accountId)=>{
        const persistedPath = _threadbindings.testing.resolveBindingsPath(accountId, params.env);
        if (!fileExists(persistedPath)) {
            return [];
        }
        return {
            kind: "plugin-state-import",
            label: "Telegram thread bindings",
            sourcePath: persistedPath,
            targetPath: `plugin state:${_threadbindings.TELEGRAM_THREAD_BINDINGS_NAMESPACE}`,
            pluginId: "telegram",
            namespace: _threadbindings.TELEGRAM_THREAD_BINDINGS_NAMESPACE,
            maxEntries: _threadbindings.TELEGRAM_THREAD_BINDINGS_MAX_ENTRIES,
            scopeKey: "",
            cleanupSource: "rename",
            preview: `- Telegram thread bindings: ${persistedPath} → plugin state (${_threadbindings.TELEGRAM_THREAD_BINDINGS_NAMESPACE})`,
            readEntries: ()=>(0, _threadbindings.listTelegramLegacyThreadBindingEntries)({
                    accountId,
                    persistedPath
                })
        };
    });
}
function detectTelegramMessageDispatchLegacyStateMigration(params) {
    const storePath = (0, _sessionstoreruntime.resolveStorePath)(params.cfg.session?.store, {
        env: params.env
    });
    const legacyStorePath = resolveLegacySessionStorePath(params);
    return (0, _accountselection.listTelegramAccountIds)(params.cfg).flatMap((accountId)=>{
        const sources = (0, _stringcoerceruntime.uniqueStrings)([
            storePath,
            legacyStorePath
        ]).map((sourceStorePath)=>({
                targetStorePath: storePath,
                sourcePath: (0, _messagedispatchdedupe.resolveTelegramMessageDispatchLegacyPath)({
                    storePath: sourceStorePath,
                    namespace: accountId
                })
            }));
        return sources.flatMap((source)=>{
            const sourcePath = source.sourcePath;
            if (!fileExists(sourcePath)) {
                return [];
            }
            return {
                kind: "plugin-state-import",
                label: "Telegram message dispatch dedupe",
                sourcePath,
                targetPath: `plugin state:${_messagedispatchdedupe.TELEGRAM_MESSAGE_DISPATCH_DEDUPE_NAMESPACE}`,
                pluginId: "telegram",
                namespace: _messagedispatchdedupe.TELEGRAM_MESSAGE_DISPATCH_DEDUPE_NAMESPACE,
                maxEntries: _messagedispatchdedupe.TELEGRAM_MESSAGE_DISPATCH_DEDUPE_MAX_ENTRIES,
                scopeKey: "",
                cleanupSource: "rename",
                preview: `- Telegram message dispatch dedupe: ${sourcePath} → plugin state (${_messagedispatchdedupe.TELEGRAM_MESSAGE_DISPATCH_DEDUPE_NAMESPACE})`,
                readEntries: ()=>(0, _messagedispatchdedupe.listTelegramLegacyMessageDispatchDedupeEntries)({
                        storePath: source.targetStorePath,
                        namespace: accountId,
                        persistedPath: source.sourcePath
                    })
            };
        });
    });
}
function topicNameCacheImportSource(params) {
    const targetStorePath = params.targetStorePath ?? params.sourceStorePath;
    const scope = (0, _topicnamecache.resolveTopicNameCacheScope)(targetStorePath);
    return {
        sourcePath: (0, _topicnamecache.resolveTopicNameCachePath)(params.sourceStorePath),
        namespace: (0, _topicnamecache.resolveTopicNameCacheNamespace)(scope)
    };
}
function detectTelegramTopicNameCacheLegacyStateMigration(params) {
    const accountSources = (0, _accountselection.listTelegramAccountIds)(params.cfg).map((accountId)=>{
        const storePath = (0, _sessionstoreruntime.resolveStorePath)(params.cfg.session?.store, {
            env: params.env,
            agentId: accountId
        });
        return topicNameCacheImportSource({
            sourceStorePath: storePath
        });
    });
    const defaultStorePath = (0, _sessionstoreruntime.resolveStorePath)(params.cfg.session?.store, {
        env: params.env
    });
    const defaultAccountStorePath = (0, _sessionstoreruntime.resolveStorePath)(params.cfg.session?.store, {
        env: params.env,
        agentId: (0, _accountselection.resolveDefaultTelegramAccountId)(params.cfg)
    });
    const legacyStorePath = resolveLegacySessionStorePath(params);
    const sourcesByKey = new Map([
        ...accountSources,
        topicNameCacheImportSource({
            sourceStorePath: defaultStorePath
        }),
        topicNameCacheImportSource({
            sourceStorePath: legacyStorePath,
            targetStorePath: defaultAccountStorePath
        })
    ].map((source)=>[
            `${source.sourcePath}\0${source.namespace}`,
            source
        ]));
    return [
        ...sourcesByKey.values()
    ].flatMap((source)=>{
        if (!fileExists(source.sourcePath)) {
            return [];
        }
        return {
            kind: "plugin-state-import",
            label: "Telegram forum topic-name cache",
            sourcePath: source.sourcePath,
            targetPath: `plugin state:${source.namespace}`,
            pluginId: "telegram",
            namespace: source.namespace,
            maxEntries: _topicnamecache.TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES,
            scopeKey: "",
            cleanupSource: "rename",
            preview: `- Telegram forum topic-name cache: ${source.sourcePath} → plugin state (${source.namespace})`,
            readEntries: ()=>{
                return (0, _topicnamecache.listTelegramLegacyTopicNameCacheEntries)({
                    persistedPath: source.sourcePath,
                    maxEntries: _topicnamecache.TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES
                });
            }
        };
    });
}
async function detectTelegramLegacyStateMigrations(params) {
    const plans = [];
    const legacyPath = (0, _channelpairing.resolveChannelAllowFromPath)("telegram", params.env);
    if (fileExists(legacyPath)) {
        const accountId = (0, _accountselection.resolveDefaultTelegramAccountId)(params.cfg);
        const targetPath = (0, _channelpairing.resolveChannelAllowFromPath)("telegram", params.env, accountId);
        if (!fileExists(targetPath)) {
            plans.push({
                kind: "copy",
                label: "Telegram pairing allowFrom",
                sourcePath: legacyPath,
                targetPath
            });
        }
    }
    plans.push(...detectTelegramUpdateOffsetLegacyStateMigration(params));
    plans.push(...detectTelegramBotInfoCacheLegacyStateMigration(params));
    plans.push(...detectTelegramStickerCacheLegacyStateMigration(params));
    plans.push(...detectTelegramMessageCacheLegacyStateMigration(params));
    plans.push(...detectTelegramSentMessageCacheLegacyStateMigration(params));
    plans.push(...detectTelegramTopicNameCacheLegacyStateMigration(params));
    plans.push(...detectTelegramThreadBindingLegacyStateMigration(params));
    plans.push(...detectTelegramMessageDispatchLegacyStateMigration(params));
    return plans;
}

//# sourceMappingURL=state-migrations.js.map