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
    get createTelegramRunnerOptions () {
        return createTelegramRunnerOptions;
    },
    get monitorTelegramProvider () {
        return monitorTelegramProvider;
    }
});
const _approvalhandleradapterruntime = require("../../../../common/openclaw/plugin-sdk/approval-handler-adapter-runtime");
const _channelruntimecontext = require("../../../../common/openclaw/plugin-sdk/channel-runtime-context");
const _modelsessionruntime = require("../../../../common/openclaw/plugin-sdk/model-session-runtime");
const _runtimeconfigsnapshot = require("../../../../common/openclaw/plugin-sdk/runtime-config-snapshot");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _ssrfruntime = require("../../../../common/openclaw/plugin-sdk/ssrf-runtime");
const _accounts = require("./accounts.js");
const _allowedupdates = require("./allowed-updates.js");
const _execapprovals = require("./exec-approvals.js");
const _fetch = require("./fetch.js");
const _networkerrors = require("./network-errors.js");
const _pollinglease = require("./polling-lease.js");
const _proxy = require("./proxy.js");
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
function createTelegramRunnerOptions(cfg) {
    return {
        sink: {
            concurrency: (0, _modelsessionruntime.resolveAgentMaxConcurrent)(cfg)
        },
        runner: {
            fetch: {
                // Match grammY defaults
                timeout: 30,
                // Request reactions without dropping default update types.
                allowed_updates: (0, _allowedupdates.resolveTelegramAllowedUpdates)()
            },
            // Suppress grammY getUpdates stack traces; we log concise errors ourselves.
            silent: true,
            // Keep grammY retrying for a long outage window. If polling still
            // stops, the outer monitor loop restarts it with backoff.
            maxRetryTime: 60 * 60 * 1000,
            retryInterval: "exponential"
        }
    };
}
function normalizePersistedUpdateId(value) {
    if (value === null) {
        return null;
    }
    if (!Number.isSafeInteger(value) || value < 0) {
        return null;
    }
    return value;
}
const TELEGRAM_OFFSET_ROTATION_LABELS = {
    "bot-id-changed": "bot identity change",
    "legacy-state": "legacy update offset",
    "token-rotated": "token rotation"
};
function formatTelegramOffsetRotationMessage(accountId, info) {
    const previousLabel = info.previousBotId ?? "(legacy unscoped offset)";
    const reasonLabel = TELEGRAM_OFFSET_ROTATION_LABELS[info.reason];
    return `[telegram] Detected ${reasonLabel} for account "${accountId}" (was ${previousLabel}, now ${info.currentBotId}); discarding stale update offset ${info.staleLastUpdateId} and starting fresh.`;
}
/** Check if error is a Grammy HttpError (used to scope unhandled rejection handling) */ const isGrammyHttpError = (err)=>{
    if (!err || typeof err !== "object") {
        return false;
    }
    return err.name === "HttpError";
};
let telegramMonitorPollingRuntimePromise;
async function loadTelegramMonitorPollingRuntime() {
    telegramMonitorPollingRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./monitor-polling.runtime.js")));
    return await telegramMonitorPollingRuntimePromise;
}
let telegramMonitorWebhookRuntimePromise;
async function loadTelegramMonitorWebhookRuntime() {
    telegramMonitorWebhookRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./monitor-webhook.runtime.js")));
    return await telegramMonitorWebhookRuntimePromise;
}
async function monitorTelegramProvider(opts = {}) {
    const logInfo = (line)=>(opts.runtime?.log ?? console.log)(line);
    const logError = (line)=>(opts.runtime?.error ?? console.error)(line);
    const log = (line)=>{
        if (line.includes("[telegram][diag]")) {
            logInfo(line);
            return;
        }
        logError(line);
    };
    let pollingSession;
    const handlePollingNetworkFailure = (err, label)=>{
        const isNetworkError = (0, _networkerrors.isRecoverableTelegramNetworkError)(err, {
            context: "polling"
        });
        const isTelegramPollingError = (0, _networkerrors.isTelegramPollingNetworkError)(err);
        const activeRunner = pollingSession?.activeRunner;
        if (isNetworkError && isTelegramPollingError && activeRunner && activeRunner.isRunning()) {
            pollingSession?.markForceRestarted();
            pollingSession?.markTransportDirty();
            pollingSession?.abortActiveFetch();
            void activeRunner.stop().catch(()=>{});
            log("[telegram][diag] marking transport dirty after polling network failure");
            log(`[telegram] Restarting polling after ${label}: ${(0, _ssrfruntime.formatErrorMessage)(err)}`);
            return true;
        }
        if (isGrammyHttpError(err) && isNetworkError && isTelegramPollingError) {
            log(`[telegram] Suppressed network error: ${(0, _ssrfruntime.formatErrorMessage)(err)}`);
            return true;
        }
        return false;
    };
    const unregisterUnhandledRejectionHandler = (0, _runtimeenv.registerUnhandledRejectionHandler)((err)=>handlePollingNetworkFailure(err, "unhandled network error"));
    const unregisterUncaughtExceptionHandler = (0, _runtimeenv.registerUncaughtExceptionHandler)((err)=>handlePollingNetworkFailure(err, "uncaught network error"));
    try {
        const cfg = opts.config ?? (0, _runtimeconfigsnapshot.getRuntimeConfig)();
        const account = (0, _accounts.resolveTelegramAccount)({
            cfg,
            accountId: opts.accountId
        });
        const token = opts.token?.trim() || account.token;
        if (!token) {
            throw new Error(`Telegram bot token missing for account "${account.accountId}" (set channels.telegram.accounts.${account.accountId}.botToken/tokenFile or TELEGRAM_BOT_TOKEN for default).`);
        }
        const proxyFetch = opts.proxyFetch ?? (account.config.proxy ? (0, _proxy.makeProxyFetch)(account.config.proxy) : undefined);
        if (opts.useWebhook) {
            const { startTelegramWebhook } = await loadTelegramMonitorWebhookRuntime();
            if ((0, _execapprovals.isTelegramExecApprovalHandlerConfigured)({
                cfg,
                accountId: account.accountId
            })) {
                (0, _channelruntimecontext.registerChannelRuntimeContext)({
                    channelRuntime: opts.channelRuntime,
                    channelId: "telegram",
                    accountId: account.accountId,
                    capability: _approvalhandleradapterruntime.CHANNEL_APPROVAL_NATIVE_RUNTIME_CONTEXT_CAPABILITY,
                    context: {
                        token
                    },
                    abortSignal: opts.abortSignal
                });
            }
            await startTelegramWebhook({
                token,
                accountId: account.accountId,
                config: cfg,
                path: opts.webhookPath,
                port: opts.webhookPort,
                secret: opts.webhookSecret ?? account.config.webhookSecret,
                host: opts.webhookHost ?? account.config.webhookHost,
                runtime: opts.runtime,
                fetch: proxyFetch,
                abortSignal: opts.abortSignal,
                publicUrl: opts.webhookUrl,
                webhookCertPath: opts.webhookCertPath,
                setStatus: opts.setStatus
            });
            await (0, _runtimeenv.waitForAbortSignal)(opts.abortSignal);
            return;
        }
        const { TelegramPollingSession, deleteTelegramUpdateOffset, readTelegramUpdateOffset, writeTelegramUpdateOffset } = await loadTelegramMonitorPollingRuntime();
        const pollingLease = await (0, _pollinglease.acquireTelegramPollingLease)({
            token,
            accountId: account.accountId,
            abortSignal: opts.abortSignal
        });
        if (pollingLease.waitedForPrevious) {
            log(`[telegram][diag] waited for previous polling session for bot token ${pollingLease.tokenFingerprint} before starting account "${account.accountId}".`);
        }
        if (pollingLease.replacedStoppingPrevious) {
            log(`[telegram][diag] previous polling session for bot token ${pollingLease.tokenFingerprint} did not stop within the lease wait; starting a replacement for account "${account.accountId}".`);
        }
        try {
            if ((0, _execapprovals.isTelegramExecApprovalHandlerConfigured)({
                cfg,
                accountId: account.accountId
            })) {
                (0, _channelruntimecontext.registerChannelRuntimeContext)({
                    channelRuntime: opts.channelRuntime,
                    channelId: "telegram",
                    accountId: account.accountId,
                    capability: _approvalhandleradapterruntime.CHANNEL_APPROVAL_NATIVE_RUNTIME_CONTEXT_CAPABILITY,
                    context: {
                        token
                    },
                    abortSignal: opts.abortSignal
                });
            }
            const persistedOffsetRaw = await readTelegramUpdateOffset({
                accountId: account.accountId,
                botToken: token,
                onRotationDetected: async (info)=>{
                    log(formatTelegramOffsetRotationMessage(account.accountId, info));
                    try {
                        await deleteTelegramUpdateOffset({
                            accountId: account.accountId
                        });
                    } catch (err) {
                        logError(`telegram: failed to delete stale update offset after rotation: ${String(err)}`);
                    }
                }
            });
            let lastUpdateId = normalizePersistedUpdateId(persistedOffsetRaw);
            if (persistedOffsetRaw !== null && lastUpdateId === null) {
                log(`[telegram] Ignoring invalid persisted update offset (${String(persistedOffsetRaw)}); starting without offset confirmation.`);
            }
            const persistUpdateId = async (updateId)=>{
                const normalizedUpdateId = normalizePersistedUpdateId(updateId);
                if (normalizedUpdateId === null) {
                    log(`[telegram] Ignoring invalid update_id value: ${String(updateId)}`);
                    return;
                }
                if (lastUpdateId !== null && normalizedUpdateId <= lastUpdateId) {
                    return;
                }
                lastUpdateId = normalizedUpdateId;
                try {
                    await writeTelegramUpdateOffset({
                        accountId: account.accountId,
                        updateId: normalizedUpdateId,
                        botToken: token
                    });
                } catch (err) {
                    logError(`telegram: failed to persist update offset: ${String(err)}`);
                }
            };
            // Preserve sticky IPv4 fallback state across clean/conflict restarts.
            // Dirty polling cycles rebuild transport inside TelegramPollingSession.
            const createTelegramTransportForPolling = ()=>(0, _fetch.resolveTelegramTransport)(proxyFetch, {
                    network: account.config.network
                });
            const telegramTransport = createTelegramTransportForPolling();
            pollingSession = new TelegramPollingSession({
                token,
                config: cfg,
                accountId: account.accountId,
                runtime: opts.runtime,
                proxyFetch,
                botInfo: opts.botInfo,
                abortSignal: opts.abortSignal,
                runnerOptions: createTelegramRunnerOptions(cfg),
                getLastUpdateId: ()=>lastUpdateId,
                persistUpdateId,
                log,
                telegramTransport,
                createTelegramTransport: createTelegramTransportForPolling,
                stallThresholdMs: account.config.pollingStallThresholdMs,
                setStatus: opts.setStatus,
                isolatedIngress: {
                    enabled: opts.isolatedIngress?.enabled ?? true,
                    apiRoot: account.config.apiRoot,
                    timeoutSeconds: account.config.timeoutSeconds,
                    proxy: account.config.proxy,
                    network: account.config.network
                }
            });
            await pollingSession.runUntilAbort();
        } finally{
            pollingLease.release();
        }
    } finally{
        unregisterUnhandledRejectionHandler();
        unregisterUncaughtExceptionHandler();
    }
}

//# sourceMappingURL=monitor.js.map