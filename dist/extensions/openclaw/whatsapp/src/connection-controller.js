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
    get WHATSAPP_LOGGED_OUT_QR_MESSAGE () {
        return WHATSAPP_LOGGED_OUT_QR_MESSAGE;
    },
    get WHATSAPP_WATCHDOG_TIMEOUT_ERROR () {
        return WHATSAPP_WATCHDOG_TIMEOUT_ERROR;
    },
    get WhatsAppConnectionController () {
        return WhatsAppConnectionController;
    },
    get closeWaSocket () {
        return closeWaSocket;
    },
    get closeWaSocketSoon () {
        return closeWaSocketSoon;
    },
    get waitForWhatsAppLoginResult () {
        return waitForWhatsAppLoginResult;
    }
});
const _baileys = require("baileys");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _connectioncontrollerregistry = require("./connection-controller-registry.js");
const _reconnect = require("./reconnect.js");
const _session = require("./session.js");
const LOGGED_OUT_STATUS = _baileys.DisconnectReason?.loggedOut ?? 401;
const POST_PAIRING_RESTART_STATUS = 515;
const TIMED_OUT_STATUS = _baileys.DisconnectReason?.timedOut ?? 408;
const WHATSAPP_LOGIN_RESTART_MESSAGE = "WhatsApp asked for a restart after pairing (code 515); waiting for creds to save…";
const WHATSAPP_LOGIN_TIMEOUT_RESTART_MESSAGE = "WhatsApp connection timed out before login; retrying with a fresh socket…";
const WHATSAPP_LOGGED_OUT_RELINK_MESSAGE = "WhatsApp reported the session is logged out. Cleared cached web session; please rerun openclaw channels login and scan the QR again.";
const WHATSAPP_LOGGED_OUT_QR_MESSAGE = "WhatsApp reported the session is logged out. Cleared cached web session; please scan a new QR.";
const WHATSAPP_WATCHDOG_TIMEOUT_ERROR = "watchdog-timeout";
function createNeverResolvePromise() {
    return new Promise(()=>{});
}
function getLoginSocketRestartKind(statusCode) {
    if (statusCode === POST_PAIRING_RESTART_STATUS) {
        return "post-pairing";
    }
    if (statusCode === TIMED_OUT_STATUS) {
        return "timeout";
    }
    return null;
}
function getLoginSocketRestartMessage(kind) {
    return kind === "timeout" ? WHATSAPP_LOGIN_TIMEOUT_RESTART_MESSAGE : WHATSAPP_LOGIN_RESTART_MESSAGE;
}
function createLiveConnection(params) {
    let closeResolved = false;
    let resolveClosePromise = (_reason)=>{};
    const closePromise = new Promise((resolve)=>{
        resolveClosePromise = (reason)=>{
            if (closeResolved) {
                return;
            }
            closeResolved = true;
            resolve(reason);
        };
    });
    return {
        connectionId: params.connectionId,
        startedAt: Date.now(),
        sock: params.sock,
        listener: params.listener,
        heartbeat: null,
        watchdogTimer: null,
        lastInboundAt: null,
        lastTransportActivityAt: Date.now(),
        handledMessages: 0,
        unregisterUnhandled: null,
        unregisterTransportActivity: null,
        openedAfterRecentInbound: params.openedAfterRecentInbound,
        backgroundTasks: new Set(),
        closePromise,
        resolveClose: resolveClosePromise
    };
}
function closeWaSocket(sock) {
    try {
        if (typeof sock?.end === "function") {
            sock.end(new Error("OpenClaw WhatsApp socket close"));
            return;
        }
        sock?.ws?.close?.();
    } catch  {
    // ignore best-effort shutdown failures
    }
}
function closeWaSocketSoon(sock, delayMs = 500) {
    setTimeout(()=>{
        closeWaSocket(sock);
    }, delayMs);
}
async function waitForWhatsAppLoginResult(params) {
    const wait = params.waitForConnection ?? _session.waitForWaConnection;
    const createSocket = params.createSocket ?? _session.createWaSocket;
    let currentSock = params.sock;
    let postPairingRestarted = false;
    let timeoutRestarted = false;
    while(true){
        try {
            await wait(currentSock);
            return {
                outcome: "connected",
                restarted: postPairingRestarted || timeoutRestarted,
                sock: currentSock
            };
        } catch (err) {
            const statusCode = (0, _session.getStatusCode)(err);
            const restartKind = getLoginSocketRestartKind(statusCode);
            const canRestart = restartKind === "post-pairing" && !postPairingRestarted || restartKind === "timeout" && !timeoutRestarted;
            if (restartKind && canRestart) {
                if (restartKind === "post-pairing") {
                    postPairingRestarted = true;
                } else {
                    timeoutRestarted = true;
                }
                params.runtime.log((0, _runtimeenv.info)(getLoginSocketRestartMessage(restartKind)));
                closeWaSocket(currentSock);
                try {
                    currentSock = await createSocket(false, params.verbose, {
                        authDir: params.authDir,
                        ...params.socketTiming,
                        onQr: params.onQr
                    });
                    params.onSocketReplaced?.(currentSock);
                    continue;
                } catch (createErr) {
                    return {
                        outcome: "failed",
                        message: (0, _session.formatError)(createErr),
                        statusCode: (0, _session.getStatusCode)(createErr),
                        error: createErr
                    };
                }
            }
            if (statusCode === LOGGED_OUT_STATUS) {
                await (0, _session.logoutWeb)({
                    authDir: params.authDir,
                    isLegacyAuthDir: params.isLegacyAuthDir,
                    runtime: params.runtime
                });
                return {
                    outcome: "logged-out",
                    message: WHATSAPP_LOGGED_OUT_RELINK_MESSAGE,
                    statusCode: LOGGED_OUT_STATUS,
                    error: err
                };
            }
            return {
                outcome: "failed",
                message: (0, _session.formatError)(err),
                statusCode,
                error: err
            };
        }
    }
}
let WhatsAppConnectionController = class WhatsAppConnectionController {
    constructor(params){
        this.disconnectRetryController = new AbortController();
        this.current = null;
        this.reconnectAttempts = 0;
        this.lastHandledInboundAt = null;
        this.accountId = params.accountId;
        this.authDir = params.authDir;
        this.verbose = params.verbose;
        this.keepAlive = params.keepAlive;
        this.heartbeatSeconds = params.heartbeatSeconds;
        this.transportTimeoutMs = params.transportTimeoutMs;
        this.messageTimeoutMs = params.messageTimeoutMs;
        this.appSilenceTimeoutMs = Math.max(params.messageTimeoutMs, params.messageTimeoutMs * 4);
        this.watchdogCheckMs = params.watchdogCheckMs;
        this.reconnectPolicy = params.reconnectPolicy;
        this.abortSignal = params.abortSignal;
        this.sleep = params.sleep ?? ((ms, signal)=>(0, _reconnect.sleepWithAbort)(ms, signal));
        this.isNonRetryableStatus = params.isNonRetryableStatus ?? (()=>false);
        this.socketTiming = params.socketTiming ?? {};
        this.socketRef = {
            current: null
        };
        this.abortPromise = params.abortSignal && new Promise((resolve)=>{
            params.abortSignal?.addEventListener("abort", ()=>resolve("aborted"), {
                once: true
            });
        });
        if (params.abortSignal?.aborted) {
            this.stopDisconnectRetries();
        } else {
            params.abortSignal?.addEventListener("abort", ()=>this.stopDisconnectRetries(), {
                once: true
            });
        }
    }
    getActiveListener() {
        return this.current?.listener ?? null;
    }
    getReconnectAttempts() {
        return this.reconnectAttempts;
    }
    isStopRequested() {
        return this.abortSignal?.aborted === true;
    }
    shouldRetryDisconnect() {
        return this.keepAlive && !this.isStopRequested() && !this.disconnectRetryController.signal.aborted;
    }
    getDisconnectRetryAbortSignal() {
        return this.disconnectRetryController.signal;
    }
    noteInbound(timestamp = Date.now()) {
        if (!this.current) {
            return;
        }
        this.current.handledMessages += 1;
        this.current.lastInboundAt = timestamp;
        this.current.lastTransportActivityAt = timestamp;
        this.current.openedAfterRecentInbound = false;
        this.lastHandledInboundAt = timestamp;
    }
    noteTransportActivity(timestamp = Date.now()) {
        if (!this.current) {
            return;
        }
        this.current.lastTransportActivityAt = timestamp;
    }
    getCurrentSnapshot(connection = this.current) {
        if (!connection) {
            return null;
        }
        return {
            connectionId: connection.connectionId,
            startedAt: connection.startedAt,
            lastInboundAt: connection.lastInboundAt,
            lastTransportActivityAt: connection.lastTransportActivityAt,
            handledMessages: connection.handledMessages,
            reconnectAttempts: this.reconnectAttempts,
            uptimeMs: Date.now() - connection.startedAt
        };
    }
    setUnhandledRejectionCleanup(unregister) {
        if (!this.current) {
            unregister?.();
            return;
        }
        this.current.unregisterUnhandled?.();
        this.current.unregisterUnhandled = unregister;
    }
    async openConnection(params) {
        if (this.current) {
            await this.closeCurrentConnection();
        }
        let sock = null;
        let connection = null;
        try {
            sock = await (0, _session.createWaSocket)(false, this.verbose, {
                authDir: this.authDir,
                ...this.socketTiming
            });
            await (0, _session.waitForWaConnection)(sock);
            this.socketRef.current = sock;
            const placeholderListener = {};
            connection = createLiveConnection({
                connectionId: params.connectionId,
                sock,
                listener: placeholderListener,
                openedAfterRecentInbound: this.isOpeningAfterRecentInbound()
            });
            const listener = await params.createListener({
                sock,
                connection
            });
            connection.listener = listener;
            this.current = connection;
            connection.unregisterTransportActivity = this.attachTransportActivityListener(sock);
            (0, _connectioncontrollerregistry.registerWhatsAppConnectionController)(this.accountId, this);
            this.startTimers(connection, {
                onHeartbeat: params.onHeartbeat,
                onWatchdogTimeout: params.onWatchdogTimeout
            });
            return connection;
        } catch (err) {
            if (this.socketRef.current === sock) {
                this.socketRef.current = null;
            }
            closeWaSocket(sock);
            if (connection?.unregisterUnhandled) {
                connection.unregisterUnhandled();
            }
            connection?.unregisterTransportActivity?.();
            throw err;
        }
    }
    async waitForClose() {
        const connection = this.current;
        if (!connection) {
            return "aborted";
        }
        const listenerClose = connection.listener.onClose?.catch((err)=>({
                status: 500,
                isLoggedOut: false,
                error: err
            })) ?? createNeverResolvePromise();
        return await Promise.race([
            connection.closePromise,
            listenerClose,
            this.abortPromise ?? createNeverResolvePromise()
        ]);
    }
    normalizeCloseReason(reason) {
        const statusCode = (typeof reason === "object" && reason && "status" in reason ? reason.status : undefined) ?? undefined;
        return {
            statusCode,
            statusLabel: typeof statusCode === "number" ? statusCode : "unknown",
            isLoggedOut: typeof reason === "object" && reason !== null && "isLoggedOut" in reason && reason.isLoggedOut === true,
            error: reason?.error,
            errorText: (0, _session.formatError)(reason)
        };
    }
    resolveCloseDecision(reason) {
        if (reason === "aborted" || this.isStopRequested()) {
            return "aborted";
        }
        const current = this.current;
        if (current && Date.now() - current.startedAt > this.heartbeatSeconds * 1000) {
            this.reconnectAttempts = 0;
        }
        const normalized = this.normalizeCloseReason(reason);
        if (normalized.isLoggedOut) {
            return {
                action: "stop",
                reconnectAttempts: this.reconnectAttempts,
                healthState: "logged-out",
                normalized
            };
        }
        if (this.isNonRetryableStatus(normalized.statusCode)) {
            return {
                action: "stop",
                reconnectAttempts: this.reconnectAttempts,
                healthState: "conflict",
                normalized
            };
        }
        const retryDecision = this.consumeReconnectAttempt();
        if (retryDecision.action === "stop") {
            return {
                action: "stop",
                reconnectAttempts: retryDecision.reconnectAttempts,
                healthState: retryDecision.healthState,
                normalized
            };
        }
        return {
            action: "retry",
            delayMs: retryDecision.delayMs,
            reconnectAttempts: retryDecision.reconnectAttempts,
            healthState: retryDecision.healthState,
            normalized
        };
    }
    consumeReconnectAttempt() {
        this.reconnectAttempts += 1;
        if (this.reconnectPolicy.maxAttempts > 0 && this.reconnectAttempts >= this.reconnectPolicy.maxAttempts) {
            return {
                action: "stop",
                reconnectAttempts: this.reconnectAttempts,
                healthState: "stopped"
            };
        }
        return {
            action: "retry",
            delayMs: (0, _reconnect.computeBackoff)(this.reconnectPolicy, this.reconnectAttempts),
            reconnectAttempts: this.reconnectAttempts,
            healthState: "reconnecting"
        };
    }
    forceClose(reason) {
        const connection = this.current;
        if (!connection) {
            return;
        }
        connection.resolveClose(reason);
        connection.listener.signalClose?.(reason);
    }
    async closeCurrentConnection() {
        const connection = this.current;
        if (!connection) {
            return;
        }
        this.current = null;
        if (this.socketRef.current === connection.sock) {
            this.socketRef.current = null;
        }
        connection.unregisterUnhandled?.();
        connection.unregisterTransportActivity?.();
        if (connection.heartbeat) {
            clearInterval(connection.heartbeat);
        }
        if (connection.watchdogTimer) {
            clearInterval(connection.watchdogTimer);
        }
        if (connection.backgroundTasks.size > 0) {
            await Promise.allSettled(connection.backgroundTasks);
            connection.backgroundTasks.clear();
        }
        try {
            await connection.listener.close?.();
        } catch  {
        // best-effort close
        }
        closeWaSocket(connection.sock);
    }
    async waitBeforeRetry(delayMs) {
        await this.sleep(delayMs, this.abortSignal);
    }
    async shutdown() {
        this.stopDisconnectRetries();
        await this.closeCurrentConnection();
        (0, _connectioncontrollerregistry.unregisterWhatsAppConnectionController)(this.accountId, this);
    }
    startTimers(connection, hooks) {
        if (!this.keepAlive) {
            return;
        }
        connection.heartbeat = setInterval(()=>{
            const snapshot = this.getCurrentSnapshot(connection);
            if (!snapshot) {
                return;
            }
            hooks.onHeartbeat?.(snapshot);
        }, this.heartbeatSeconds * 1000);
        connection.watchdogTimer = setInterval(()=>{
            const now = Date.now();
            const transportStaleForMs = now - connection.lastTransportActivityAt;
            const appBaselineAt = connection.lastInboundAt ?? connection.startedAt;
            const appSilentForMs = now - appBaselineAt;
            const appSilenceTimeoutMs = connection.openedAfterRecentInbound ? this.messageTimeoutMs : this.appSilenceTimeoutMs;
            if (transportStaleForMs <= this.transportTimeoutMs && appSilentForMs <= appSilenceTimeoutMs) {
                return;
            }
            const snapshot = this.getCurrentSnapshot(connection);
            if (!snapshot) {
                return;
            }
            hooks.onWatchdogTimeout?.(snapshot);
            this.forceClose({
                status: 499,
                isLoggedOut: false,
                error: WHATSAPP_WATCHDOG_TIMEOUT_ERROR
            });
        }, this.watchdogCheckMs);
    }
    attachTransportActivityListener(sock) {
        const ws = sock.ws;
        if (!ws || typeof ws.on !== "function") {
            return null;
        }
        const noteActivity = ()=>this.noteTransportActivity();
        ws.on("frame", noteActivity);
        return ()=>{
            if (typeof ws.off === "function") {
                ws.off("frame", noteActivity);
                return;
            }
            ws.removeListener?.("frame", noteActivity);
        };
    }
    isOpeningAfterRecentInbound() {
        if (this.reconnectAttempts <= 0 || this.lastHandledInboundAt === null) {
            return false;
        }
        return Date.now() - this.lastHandledInboundAt <= this.appSilenceTimeoutMs;
    }
    stopDisconnectRetries() {
        if (!this.disconnectRetryController.signal.aborted) {
            this.disconnectRetryController.abort();
        }
    }
};

//# sourceMappingURL=connection-controller.js.map