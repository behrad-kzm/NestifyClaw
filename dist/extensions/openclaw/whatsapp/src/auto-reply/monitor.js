"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "monitorWebChannel", {
    enumerable: true,
    get: function() {
        return monitorWebChannel;
    }
});
const _accountcore = require("../../../../../common/openclaw/plugin-sdk/account-core");
const _approvalhandlerruntime = require("../../../../../common/openclaw/plugin-sdk/approval-handler-runtime");
const _channelinbounddebounce = require("../../../../../common/openclaw/plugin-sdk/channel-inbound-debounce");
const _channelruntimecontext = require("../../../../../common/openclaw/plugin-sdk/channel-runtime-context");
const _cliruntime = require("../../../../../common/openclaw/plugin-sdk/cli-runtime");
const _commanddetection = require("../../../../../common/openclaw/plugin-sdk/command-detection");
const _deliveryqueueruntime = require("../../../../../common/openclaw/plugin-sdk/delivery-queue-runtime");
const _replyhistory = require("../../../../../common/openclaw/plugin-sdk/reply-history");
const _routing = require("../../../../../common/openclaw/plugin-sdk/routing");
const _runtimeenv = require("../../../../../common/openclaw/plugin-sdk/runtime-env");
const _systemeventruntime = require("../../../../../common/openclaw/plugin-sdk/system-event-runtime");
const _accounts = require("../accounts.js");
const _authstore = require("../auth-store.js");
const _connectioncontroller = require("../connection-controller.js");
const _inboundpolicy = require("../inbound-policy.js");
const _monitor = require("../inbound/monitor.js");
const _reconnect = require("../reconnect.js");
const _session = require("../session.js");
const _sockettiming = require("../socket-timing.js");
const _configruntime = require("./config.runtime.js");
const _loggers = require("./loggers.js");
const _mentions = require("./mentions.js");
const _monitorstate = require("./monitor-state.js");
const _echo = require("./monitor/echo.js");
const _listenerlog = require("./monitor/listener-log.js");
const _onmessage = require("./monitor/on-message.js");
const _util = require("./util.js");
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
function isNonRetryableWebCloseStatus(statusCode) {
    // WhatsApp 440 = session conflict ("Unknown Stream Errored (conflict)").
    // This is persistent until the operator resolves the conflicting session.
    // Baileys 428 = DisconnectReason.connectionClosed, a generic WebSocket close
    // that is often transient and must stay on the reconnect path.
    return statusCode === 440;
}
let replyResolverRuntimePromise = null;
function loadReplyResolverRuntime() {
    replyResolverRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./reply-resolver.runtime.js")));
    return replyResolverRuntimePromise;
}
function resolveWebMonitorConfigSnapshot(params) {
    const account = (0, _accounts.resolveWhatsAppAccount)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    const cfg = {
        ...params.cfg,
        channels: {
            ...params.cfg.channels,
            whatsapp: {
                ...params.cfg.channels?.whatsapp,
                ackReaction: account.ackReaction,
                messagePrefix: account.messagePrefix,
                allowFrom: account.allowFrom,
                groupAllowFrom: account.groupAllowFrom,
                groupPolicy: account.groupPolicy,
                textChunkLimit: account.textChunkLimit,
                chunkMode: account.chunkMode,
                mediaMaxMb: account.mediaMaxMb,
                blockStreaming: account.blockStreaming,
                groups: account.groups
            }
        }
    };
    return {
        cfg,
        account
    };
}
function normalizeReconnectAccountId(accountId) {
    return (accountId ?? "").trim() || "default";
}
function isNoListenerReconnectError(lastError) {
    return typeof lastError === "string" && /No active WhatsApp Web listener/i.test(lastError);
}
function resolveExplicitWhatsAppDebounceOverride(params) {
    const channel = params.sourceCfg?.channels?.whatsapp;
    if (!channel) {
        return undefined;
    }
    const accountId = normalizeReconnectAccountId(params.accountId);
    const accountDebounce = (0, _accountcore.resolveAccountEntry)(channel.accounts, accountId)?.debounceMs;
    if (accountDebounce !== undefined) {
        return accountDebounce;
    }
    if (accountId !== "default") {
        const defaultAccountDebounce = (0, _accountcore.resolveAccountEntry)(channel.accounts, "default")?.debounceMs;
        if (defaultAccountDebounce !== undefined) {
            return defaultAccountDebounce;
        }
    }
    return channel.debounceMs;
}
function isRetryableAuthUnstableError(error) {
    return error instanceof _authstore.WhatsAppAuthUnstableError || typeof error === "object" && error !== null && "code" in error && error.code === _authstore.WHATSAPP_AUTH_UNSTABLE_CODE;
}
async function clearTerminalWebAuthState(params) {
    try {
        const cleared = await (0, _session.logoutWeb)({
            authDir: params.account.authDir,
            isLegacyAuthDir: params.account.isLegacyAuthDir,
            runtime: params.runtime
        });
        params.log.warn({
            accountId: params.account.accountId,
            cleared,
            healthState: params.healthState,
            status: params.statusLabel
        }, "web reconnect: cleared cached auth after terminal close");
    } catch (error) {
        params.log.warn({
            accountId: params.account.accountId,
            error: (0, _session.formatError)(error),
            healthState: params.healthState,
            status: params.statusLabel
        }, "web reconnect: failed clearing cached auth after terminal close");
        params.runtime.error(`WhatsApp Web cleanup failed after terminal close (status ${params.statusLabel}). Run \`${(0, _cliruntime.formatCliCommand)("openclaw channels logout --channel whatsapp")}\`, then relink with \`${(0, _cliruntime.formatCliCommand)("openclaw channels login --channel whatsapp")}\`.`);
    }
}
const DEFAULT_TRANSPORT_TIMEOUT_MS = 5 * 60 * 1000;
async function monitorWebChannel(verbose, listenerFactory = _monitor.attachWebInboxToSocket, keepAlive = true, replyResolver, runtime = _runtimeenv.defaultRuntime, abortSignal, tuning = {}) {
    const activeReplyResolver = replyResolver ?? (await loadReplyResolverRuntime()).getReplyFromConfig;
    const runId = (0, _reconnect.newConnectionId)();
    const replyLogger = (0, _runtimeenv.getChildLogger)({
        module: "web-auto-reply",
        runId
    });
    const heartbeatLogger = (0, _runtimeenv.getChildLogger)({
        module: "web-heartbeat",
        runId
    });
    const reconnectLogger = (0, _runtimeenv.getChildLogger)({
        module: "web-reconnect",
        runId
    });
    const statusController = (0, _monitorstate.createWebChannelStatusController)(tuning.statusSink);
    statusController.emit();
    const baseCfg = (0, _configruntime.getRuntimeConfig)();
    const sourceCfg = (0, _configruntime.getRuntimeConfigSourceSnapshot)();
    const { cfg, account } = resolveWebMonitorConfigSnapshot({
        cfg: baseCfg,
        accountId: tuning.accountId
    });
    const loadCurrentMonitorConfig = ()=>resolveWebMonitorConfigSnapshot({
            cfg: (0, _configruntime.getRuntimeConfig)(),
            accountId: account.accountId
        }).cfg;
    const maxMediaBytes = (0, _accounts.resolveWhatsAppMediaMaxBytes)(account);
    const heartbeatSeconds = (0, _reconnect.resolveHeartbeatSeconds)(cfg, tuning.heartbeatSeconds);
    const reconnectPolicy = (0, _reconnect.resolveReconnectPolicy)(cfg, tuning.reconnect);
    const socketTiming = (0, _sockettiming.resolveWhatsAppSocketTiming)(cfg, tuning.socketTiming);
    const baseMentionConfig = (0, _mentions.buildMentionConfig)(cfg);
    const groupHistoryLimit = account.historyLimit ?? cfg.channels?.whatsapp?.historyLimit ?? cfg.messages?.groupChat?.historyLimit ?? _replyhistory.DEFAULT_GROUP_HISTORY_LIMIT;
    const groupHistories = new Map();
    const groupMemberNames = new Map();
    const groupMetadataCache = new Map();
    const echoTracker = (0, _echo.createEchoTracker)({
        maxItems: 100,
        logVerbose: _runtimeenv.logVerbose
    });
    const sleep = tuning.sleep ?? ((ms, signal)=>(0, _reconnect.sleepWithAbort)(ms, signal ?? abortSignal));
    const stopRequested = ()=>abortSignal?.aborted === true;
    // Avoid noisy MaxListenersExceeded warnings in test environments where
    // multiple gateway instances may be constructed.
    const currentMaxListeners = process.getMaxListeners?.() ?? 10;
    if (process.setMaxListeners && currentMaxListeners < 50) {
        process.setMaxListeners(50);
    }
    let sigintStop = false;
    const handleSigint = ()=>{
        sigintStop = true;
    };
    process.once("SIGINT", handleSigint);
    const transportTimeoutMs = tuning.transportTimeoutMs ?? DEFAULT_TRANSPORT_TIMEOUT_MS;
    const messageTimeoutMs = tuning.messageTimeoutMs ?? 30 * 60 * 1000;
    const watchdogCheckMs = tuning.watchdogCheckMs ?? 60 * 1000;
    const controller = new _connectioncontroller.WhatsAppConnectionController({
        accountId: account.accountId,
        authDir: account.authDir,
        verbose,
        keepAlive,
        heartbeatSeconds,
        transportTimeoutMs,
        messageTimeoutMs,
        watchdogCheckMs,
        reconnectPolicy,
        socketTiming,
        abortSignal,
        sleep,
        isNonRetryableStatus: isNonRetryableWebCloseStatus
    });
    try {
        while(true){
            if (stopRequested()) {
                break;
            }
            const connectionId = (0, _reconnect.newConnectionId)();
            const inboundDebounceMs = (0, _channelinbounddebounce.resolveInboundDebounceMs)({
                cfg,
                channel: "whatsapp",
                overrideMs: resolveExplicitWhatsAppDebounceOverride({
                    cfg,
                    sourceCfg,
                    accountId: account.accountId
                })
            });
            const shouldDebounce = (msg)=>{
                if (msg.mediaPath || msg.mediaType) {
                    return false;
                }
                if (msg.location) {
                    return false;
                }
                if (msg.replyToId || msg.replyToBody) {
                    return false;
                }
                return !(0, _commanddetection.isControlCommandMessage)(msg.body, cfg);
            };
            let connection;
            try {
                connection = await controller.openConnection({
                    connectionId,
                    createListener: async ({ sock, connection: connectionLocal })=>{
                        const onMessage = (0, _onmessage.createWebOnMessageHandler)({
                            cfg,
                            loadConfig: loadCurrentMonitorConfig,
                            verbose,
                            connectionId,
                            maxMediaBytes,
                            groupHistoryLimit,
                            groupHistories,
                            groupMemberNames,
                            echoTracker,
                            backgroundTasks: connectionLocal.backgroundTasks,
                            replyResolver: activeReplyResolver,
                            replyLogger,
                            baseMentionConfig,
                            account
                        });
                        return await (listenerFactory ?? _monitor.attachWebInboxToSocket)({
                            cfg,
                            loadConfig: loadCurrentMonitorConfig,
                            verbose,
                            accountId: account.accountId,
                            authDir: account.authDir,
                            mediaMaxMb: account.mediaMaxMb,
                            selfChatMode: account.selfChatMode,
                            sendReadReceipts: account.sendReadReceipts,
                            debounceMs: inboundDebounceMs,
                            shouldDebounce,
                            socketRef: controller.socketRef,
                            shouldRetryDisconnect: ()=>!sigintStop && controller.shouldRetryDisconnect(),
                            disconnectRetryPolicy: reconnectPolicy,
                            disconnectRetryAbortSignal: controller.getDisconnectRetryAbortSignal(),
                            groupMetadataCache,
                            onMessage: async (msg)=>{
                                const inboundAt = Date.now();
                                controller.noteInbound(inboundAt);
                                statusController.noteInbound(inboundAt);
                                await onMessage(msg);
                            },
                            sock
                        });
                    },
                    onHeartbeat: (snapshot)=>{
                        const authAgeMs = (0, _session.getWebAuthAgeMs)(account.authDir);
                        const minutesSinceLastMessage = snapshot.lastInboundAt ? Math.floor((Date.now() - snapshot.lastInboundAt) / 60000) : null;
                        const logData = {
                            connectionId: snapshot.connectionId,
                            reconnectAttempts: snapshot.reconnectAttempts,
                            messagesHandled: snapshot.handledMessages,
                            lastInboundAt: snapshot.lastInboundAt,
                            lastTransportActivityAt: snapshot.lastTransportActivityAt,
                            authAgeMs,
                            uptimeMs: snapshot.uptimeMs,
                            ...minutesSinceLastMessage !== null && minutesSinceLastMessage > 30 ? {
                                minutesSinceLastMessage
                            } : {}
                        };
                        statusController.noteTransportActivity(snapshot.lastTransportActivityAt);
                        if (minutesSinceLastMessage && minutesSinceLastMessage > 30) {
                            heartbeatLogger.warn(logData, "⚠️ web gateway heartbeat - no messages in 30+ minutes");
                        } else {
                            heartbeatLogger.info(logData, "web gateway heartbeat");
                        }
                    },
                    onWatchdogTimeout: (snapshot)=>{
                        const now = Date.now();
                        const transportSilentMs = now - snapshot.lastTransportActivityAt;
                        const appBaselineAt = snapshot.lastInboundAt ?? snapshot.startedAt;
                        const minutesSinceTransportActivity = Math.floor(transportSilentMs / 60000);
                        const minutesSinceAppActivity = Math.floor((now - appBaselineAt) / 60000);
                        const watchdogReason = transportSilentMs > transportTimeoutMs ? "transport-inactive" : "app-silent";
                        statusController.noteWatchdogStale();
                        heartbeatLogger.warn({
                            connectionId: snapshot.connectionId,
                            watchdogReason,
                            minutesSinceTransportActivity,
                            minutesSinceAppActivity,
                            lastInboundAt: snapshot.lastInboundAt ? new Date(snapshot.lastInboundAt) : null,
                            lastTransportActivityAt: new Date(snapshot.lastTransportActivityAt),
                            messagesHandled: snapshot.handledMessages
                        }, "WhatsApp watchdog timeout detected - forcing reconnect");
                        _loggers.whatsappHeartbeatLog.warn(`WhatsApp watchdog timeout (${watchdogReason}) - restarting connection`);
                    }
                });
            } catch (error) {
                if ((0, _session.getStatusCode)(error) === 428) {
                    const retryDecision = controller.consumeReconnectAttempt();
                    statusController.noteReconnectAttempts(retryDecision.reconnectAttempts);
                    statusController.noteClose({
                        statusCode: 428,
                        error: (0, _session.formatError)(error),
                        reconnectAttempts: retryDecision.reconnectAttempts,
                        healthState: retryDecision.healthState
                    });
                    if (retryDecision.action === "stop") {
                        reconnectLogger.warn({
                            connectionId,
                            status: 428,
                            reconnectAttempts: retryDecision.reconnectAttempts,
                            maxAttempts: reconnectPolicy.maxAttempts
                        }, "web reconnect: 428 during opening; max attempts reached");
                        runtime.error(`WhatsApp Web connection closed during setup (status 428) after ${retryDecision.reconnectAttempts}/${reconnectPolicy.maxAttempts} attempts. Relink with \`${(0, _cliruntime.formatCliCommand)("openclaw channels login --channel whatsapp")}\` if the issue persists.`);
                        await controller.shutdown();
                        break;
                    }
                    reconnectLogger.info({
                        connectionId,
                        status: 428,
                        reconnectAttempts: retryDecision.reconnectAttempts,
                        delayMs: retryDecision.delayMs
                    }, "web reconnect: 428 during opening; retrying");
                    runtime.error(`WhatsApp Web connection closed during setup (status 428). Retry ${retryDecision.reconnectAttempts}/${reconnectPolicy.maxAttempts || "∞"} in ${(0, _runtimeenv.formatDurationPrecise)(retryDecision.delayMs ?? 0)}.`);
                    try {
                        await controller.waitBeforeRetry(retryDecision.delayMs ?? 0);
                    } catch  {
                        break;
                    }
                    continue;
                }
                if (!isRetryableAuthUnstableError(error)) {
                    throw error;
                }
                const retryDecision = controller.consumeReconnectAttempt();
                statusController.noteReconnectAttempts(retryDecision.reconnectAttempts);
                statusController.noteClose({
                    error: error.message,
                    reconnectAttempts: retryDecision.reconnectAttempts,
                    healthState: retryDecision.healthState
                });
                if (retryDecision.action === "stop") {
                    reconnectLogger.warn({
                        connectionId,
                        reconnectAttempts: retryDecision.reconnectAttempts,
                        maxAttempts: reconnectPolicy.maxAttempts
                    }, "web reconnect: auth state stayed unstable; max attempts reached");
                    runtime.error(`WhatsApp auth state is still stabilizing after ${retryDecision.reconnectAttempts}/${reconnectPolicy.maxAttempts} attempts. Stopping web monitoring.`);
                    await controller.shutdown();
                    break;
                }
                reconnectLogger.info({
                    connectionId,
                    reconnectAttempts: retryDecision.reconnectAttempts,
                    delayMs: retryDecision.delayMs
                }, "web reconnect: auth state still stabilizing during inbox attach; retrying");
                runtime.error(`WhatsApp auth state is still stabilizing. Retry ${retryDecision.reconnectAttempts}/${reconnectPolicy.maxAttempts || "∞"} for inbox attach in ${(0, _runtimeenv.formatDurationPrecise)(retryDecision.delayMs ?? 0)}.`);
                try {
                    await controller.waitBeforeRetry(retryDecision.delayMs ?? 0);
                } catch  {
                    break;
                }
                continue;
            }
            statusController.noteConnected();
            const approvalContextLease = (0, _channelruntimecontext.registerChannelRuntimeContext)({
                channelRuntime: tuning.channelRuntime,
                channelId: "whatsapp",
                accountId: account.accountId,
                capability: _approvalhandlerruntime.CHANNEL_APPROVAL_NATIVE_RUNTIME_CONTEXT_CAPABILITY,
                context: {
                    accountId: account.accountId
                },
                abortSignal
            });
            controller.setUnhandledRejectionCleanup((0, _runtimeenv.registerUnhandledRejectionHandler)((reason)=>{
                if (!(0, _util.isLikelyWhatsAppCryptoError)(reason)) {
                    return false;
                }
                const errorStr = (0, _session.formatError)(reason);
                reconnectLogger.warn({
                    connectionId: connection.connectionId,
                    error: errorStr
                }, "web reconnect: unhandled rejection from WhatsApp socket; forcing reconnect");
                controller.forceClose({
                    status: 499,
                    isLoggedOut: false,
                    error: reason
                });
                return true;
            }));
            const { e164: selfE164 } = (0, _session.readWebSelfId)(account.authDir);
            const connectRoute = (0, _routing.resolveAgentRoute)({
                cfg,
                channel: "whatsapp",
                accountId: account.accountId
            });
            (0, _systemeventruntime.enqueueSystemEvent)(`WhatsApp gateway connected${selfE164 ? ` as ${selfE164}` : ""}.`, {
                sessionKey: connectRoute.sessionKey
            });
            const normalizedAccountId = normalizeReconnectAccountId(account.accountId);
            void (0, _deliveryqueueruntime.drainPendingDeliveries)({
                drainKey: `whatsapp:${normalizedAccountId}`,
                logLabel: "WhatsApp reconnect drain",
                cfg,
                log: reconnectLogger,
                selectEntry: (entry)=>({
                        match: entry.channel === "whatsapp" && normalizeReconnectAccountId(entry.accountId) === normalizedAccountId,
                        bypassBackoff: isNoListenerReconnectError(entry.lastError)
                    })
            }).catch((err)=>{
                reconnectLogger.warn({
                    connectionId: connection.connectionId,
                    error: String(err)
                }, "reconnect drain failed");
            });
            const periodicDrainInterval = setInterval(()=>{
                void (0, _deliveryqueueruntime.drainPendingDeliveries)({
                    drainKey: `whatsapp:${normalizedAccountId}`,
                    logLabel: "WhatsApp periodic drain",
                    cfg,
                    log: reconnectLogger,
                    selectEntry: (entry)=>({
                            match: entry.channel === "whatsapp" && normalizeReconnectAccountId(entry.accountId) === normalizedAccountId,
                            bypassBackoff: false
                        })
                }).catch((err)=>{
                    reconnectLogger.warn({
                        connectionId: connection.connectionId,
                        error: String(err)
                    }, "periodic drain failed");
                });
            }, 30_000);
            const inboundPolicy = (0, _inboundpolicy.resolveWhatsAppInboundPolicy)({
                cfg,
                accountId: account.accountId,
                selfE164: selfE164 ?? null
            });
            _loggers.whatsappLog.info((0, _listenerlog.formatWhatsAppInboundListeningLog)({
                groups: inboundPolicy.account.groups,
                groupPolicy: inboundPolicy.groupPolicy,
                hasGroupAllowFrom: inboundPolicy.groupAllowFrom.length > 0
            }));
            if (process.stdout.isTTY || process.stderr.isTTY) {
                _loggers.whatsappLog.raw("Ctrl+C to stop.");
            }
            if (!keepAlive) {
                clearInterval(periodicDrainInterval);
                approvalContextLease?.dispose();
                await controller.shutdown();
                return;
            }
            const reason = await controller.waitForClose().finally(()=>{
                clearInterval(periodicDrainInterval);
                approvalContextLease?.dispose();
            });
            if (stopRequested() || sigintStop || reason === "aborted") {
                await controller.shutdown();
                break;
            }
            const decision = controller.resolveCloseDecision(reason);
            if (decision === "aborted") {
                await controller.shutdown();
                break;
            }
            statusController.noteReconnectAttempts(controller.getReconnectAttempts());
            reconnectLogger.info({
                connectionId: connection.connectionId,
                status: decision.normalized.statusLabel,
                loggedOut: decision.normalized.isLoggedOut,
                reconnectAttempts: decision.reconnectAttempts,
                error: decision.normalized.errorText
            }, "web reconnect: connection closed");
            (0, _systemeventruntime.enqueueSystemEvent)(`WhatsApp gateway disconnected (status ${decision.normalized.statusLabel})`, {
                sessionKey: connectRoute.sessionKey
            });
            if (decision.action === "stop") {
                await controller.closeCurrentConnection();
                statusController.noteClose({
                    statusCode: decision.normalized.statusCode,
                    loggedOut: decision.normalized.isLoggedOut,
                    error: decision.normalized.errorText,
                    reconnectAttempts: decision.reconnectAttempts,
                    healthState: decision.healthState
                });
                if (decision.healthState === "logged-out") {
                    await clearTerminalWebAuthState({
                        account,
                        runtime,
                        statusLabel: decision.normalized.statusLabel,
                        healthState: decision.healthState,
                        log: reconnectLogger
                    });
                    runtime.error(`WhatsApp session logged out. Run \`${(0, _cliruntime.formatCliCommand)("openclaw channels login --channel whatsapp")}\` to relink.`);
                } else if (decision.healthState === "conflict") {
                    await clearTerminalWebAuthState({
                        account,
                        runtime,
                        statusLabel: decision.normalized.statusLabel,
                        healthState: decision.healthState,
                        log: reconnectLogger
                    });
                    reconnectLogger.warn({
                        connectionId: connection.connectionId,
                        status: decision.normalized.statusLabel,
                        error: decision.normalized.errorText
                    }, "web reconnect: non-retryable close status; stopping monitor");
                    runtime.error(`WhatsApp Web connection closed (status ${decision.normalized.statusLabel}: session conflict). Resolve conflicting WhatsApp Web sessions, then relink with \`${(0, _cliruntime.formatCliCommand)("openclaw channels login --channel whatsapp")}\`. Stopping web monitoring.`);
                } else {
                    reconnectLogger.warn({
                        connectionId: connection.connectionId,
                        status: decision.normalized.statusLabel,
                        reconnectAttempts: decision.reconnectAttempts,
                        maxAttempts: reconnectPolicy.maxAttempts
                    }, "web reconnect: max attempts reached; continuing in degraded mode");
                    runtime.error(`WhatsApp Web reconnect: max attempts reached (${decision.reconnectAttempts}/${reconnectPolicy.maxAttempts}). Stopping web monitoring.`);
                }
                await controller.shutdown();
                break;
            }
            const isWatchdogRecoveryReconnect = decision.normalized.error === _connectioncontroller.WHATSAPP_WATCHDOG_TIMEOUT_ERROR;
            statusController.noteClose({
                statusCode: decision.normalized.statusCode,
                error: decision.normalized.errorText,
                reconnectAttempts: decision.reconnectAttempts,
                healthState: decision.healthState,
                watchdogRecovery: isWatchdogRecoveryReconnect
            });
            reconnectLogger.info({
                connectionId: connection.connectionId,
                status: decision.normalized.statusLabel,
                reconnectAttempts: decision.reconnectAttempts,
                maxAttempts: reconnectPolicy.maxAttempts || "unlimited",
                delayMs: decision.delayMs
            }, "web reconnect: scheduling retry");
            const reconnectMessage = isWatchdogRecoveryReconnect ? `WhatsApp Web watchdog is recovering a stale connection (status ${decision.normalized.statusLabel}). Retry ${decision.reconnectAttempts}/${reconnectPolicy.maxAttempts || "∞"} in ${(0, _runtimeenv.formatDurationPrecise)(decision.delayMs ?? 0)}.` : `WhatsApp Web connection closed (status ${decision.normalized.statusLabel}). Retry ${decision.reconnectAttempts}/${reconnectPolicy.maxAttempts || "∞"} in ${(0, _runtimeenv.formatDurationPrecise)(decision.delayMs ?? 0)}… (${decision.normalized.errorText})`;
            if (isWatchdogRecoveryReconnect) {
                runtime.log((0, _runtimeenv.warn)(reconnectMessage));
            } else {
                runtime.error(reconnectMessage);
            }
            await controller.closeCurrentConnection();
            try {
                await controller.waitBeforeRetry(decision.delayMs ?? 0);
            } catch  {
                break;
            }
        }
    } finally{
        statusController.markStopped();
        process.removeListener("SIGINT", handleSigint);
        await controller.shutdown();
    }
}

//# sourceMappingURL=monitor.js.map