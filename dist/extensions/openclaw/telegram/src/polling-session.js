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
    get TelegramPollingSession () {
        return TelegramPollingSession;
    },
    get testing () {
        return testing;
    }
});
const _runner = require("@grammyjs/runner");
const _deliveryqueueruntime = require("../../../../common/openclaw/plugin-sdk/delivery-queue-runtime");
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _apilogging = require("./api-logging.js");
const _bot = require("./bot.js");
const _networkerrors = require("./network-errors.js");
const _pollingliveness = require("./polling-liveness.js");
const _pollingstatus = require("./polling-status.js");
const _pollingtransportstate = require("./polling-transport-state.js");
const _requesttimeouts = require("./request-timeouts.js");
const _sequentialkey = require("./sequential-key.js");
const _telegramingressspool = require("./telegram-ingress-spool.js");
const _telegramingressworker = require("./telegram-ingress-worker.js");
const _telegramreplyfence = require("./telegram-reply-fence.js");
const TELEGRAM_POLL_RESTART_POLICY = {
    initialMs: 2000,
    maxMs: 30_000,
    factor: 1.8,
    jitter: 0.25
};
const DEFAULT_POLL_STALL_THRESHOLD_MS = 120_000;
const MIN_POLL_STALL_THRESHOLD_MS = 30_000;
const MAX_POLL_STALL_THRESHOLD_MS = 600_000;
const POLL_WATCHDOG_INTERVAL_MS = 30_000;
const POLL_STOP_GRACE_MS = 15_000;
const ISOLATED_INGRESS_BACKLOG_STALL_MS = 25 * 60_000;
const TELEGRAM_SPOOLED_HANDLER_ABORT_GRACE_MS = 5_000;
const TELEGRAM_SPOOLED_HANDLER_TIMEOUT_ENV = "OPENCLAW_TELEGRAM_SPOOLED_HANDLER_TIMEOUT_MS";
const TELEGRAM_SPOOLED_DRAIN_START_LIMIT = 100;
const TELEGRAM_SPOOLED_DRAIN_SCAN_LIMIT = TELEGRAM_SPOOLED_DRAIN_START_LIMIT * 10;
const TELEGRAM_POLLING_CLIENT_TIMEOUT_FLOOR_SECONDS = Math.ceil(_requesttimeouts.TELEGRAM_GET_UPDATES_REQUEST_TIMEOUT_MS / 1000);
const MISSING_AGENT_HARNESS_ERROR_NAME = "MissingAgentHarnessError";
const MISSING_AGENT_HARNESS_MESSAGE_RE = /Requested agent harness "[^"]+" is not registered\./u;
function normalizeTelegramAccountId(accountId) {
    return accountId?.trim() || "default";
}
function resolveNonRetryableSpooledUpdateFailure(err) {
    for (const candidate of (0, _errorruntime.collectErrorGraphCandidates)(err, (current)=>[
            current.cause,
            current.error
        ])){
        const message = (0, _errorruntime.formatErrorMessage)(candidate);
        if ((0, _errorruntime.readErrorName)(candidate) === MISSING_AGENT_HARNESS_ERROR_NAME || MISSING_AGENT_HARNESS_MESSAGE_RE.test(message)) {
            return {
                reason: "missing-agent-harness",
                message
            };
        }
    }
    return null;
}
const waitForGracefulStop = async (stop)=>{
    let timer;
    try {
        await Promise.race([
            stop(),
            new Promise((resolve)=>{
                timer = setTimeout(resolve, POLL_STOP_GRACE_MS);
                timer.unref?.();
            })
        ]);
    } finally{
        if (timer) {
            clearTimeout(timer);
        }
    }
};
const waitForSpooledHandlerTaskSettlement = async (params)=>{
    if (params.abortSignal?.aborted) {
        return false;
    }
    let timer;
    let removeAbortListener;
    try {
        return await Promise.race([
            params.task.then(()=>true, ()=>true),
            new Promise((resolve)=>{
                timer = setTimeout(()=>resolve(false), params.timeoutMs);
                timer.unref?.();
                const abort = ()=>resolve(false);
                params.abortSignal?.addEventListener("abort", abort, {
                    once: true
                });
                removeAbortListener = ()=>params.abortSignal?.removeEventListener("abort", abort);
            })
        ]);
    } finally{
        if (timer) {
            clearTimeout(timer);
        }
        removeAbortListener?.();
    }
};
const resolvePollingStallThresholdMs = (value)=>{
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return DEFAULT_POLL_STALL_THRESHOLD_MS;
    }
    return Math.min(MAX_POLL_STALL_THRESHOLD_MS, Math.max(MIN_POLL_STALL_THRESHOLD_MS, Math.floor(value)));
};
// Account health restarts create a new session in the same process while an old
// spooled handler may still be running after shutdown grace.
const activeSpooledUpdateHandlersByLane = new Map();
function resolveSpooledUpdateHandlerTimeoutMs(params) {
    const candidates = [
        params.configured,
        Number(params.env?.[TELEGRAM_SPOOLED_HANDLER_TIMEOUT_ENV])
    ];
    for (const candidate of candidates){
        const timeoutMs = (0, _numberruntime.clampPositiveTimerTimeoutMs)(candidate);
        if (timeoutMs !== undefined) {
            return timeoutMs;
        }
    }
    return ISOLATED_INGRESS_BACKLOG_STALL_MS;
}
function buildSpooledUpdateHandlerKey(params) {
    return `${params.spoolDir}\0${params.laneKey}`;
}
function isSpooledUpdateHandlerKeyForSpool(handlerKey, spoolDir) {
    return handlerKey.startsWith(`${spoolDir}\0`);
}
let TelegramPollingSession = class TelegramPollingSession {
    #restartAttempts;
    #webhookCleared;
    #forceRestarted;
    #activeRunner;
    #activeFetchAbort;
    #spooledUpdateHandlerKeys;
    #transportState;
    #status;
    #stallThresholdMs;
    #spooledUpdateHandlerTimeoutMs;
    #spooledUpdateHandlerAbortGraceMs;
    #deliveryDrainInFlight;
    constructor(opts){
        this.opts = opts;
        this.#restartAttempts = 0;
        this.#webhookCleared = false;
        this.#forceRestarted = false;
        this.#spooledUpdateHandlerKeys = new Set();
        this.#deliveryDrainInFlight = false;
        this.#transportState = new _pollingtransportstate.TelegramPollingTransportState({
            log: opts.log,
            initialTransport: opts.telegramTransport,
            createTelegramTransport: opts.createTelegramTransport
        });
        this.#status = (0, _pollingstatus.createTelegramPollingStatusPublisher)(opts.setStatus);
        this.#stallThresholdMs = resolvePollingStallThresholdMs(opts.stallThresholdMs);
        this.#spooledUpdateHandlerTimeoutMs = resolveSpooledUpdateHandlerTimeoutMs({
            ...opts.isolatedIngress?.spooledUpdateHandlerTimeoutMs !== undefined ? {
                configured: opts.isolatedIngress.spooledUpdateHandlerTimeoutMs
            } : {},
            env: process.env
        });
        this.#spooledUpdateHandlerAbortGraceMs = (0, _numberruntime.resolvePositiveTimerTimeoutMs)(opts.isolatedIngress?.spooledUpdateHandlerAbortGraceMs, TELEGRAM_SPOOLED_HANDLER_ABORT_GRACE_MS);
    }
    get activeRunner() {
        return this.#activeRunner;
    }
    markForceRestarted() {
        this.#forceRestarted = true;
    }
    markTransportDirty() {
        this.#transportState.markDirty();
    }
    abortActiveFetch() {
        this.#activeFetchAbort?.abort();
    }
    async runUntilAbort() {
        this.#status.notePollingStart();
        try {
            while(!this.opts.abortSignal?.aborted){
                const bot = await this.#createPollingBot();
                if (!bot) {
                    continue;
                }
                const cleanupState = await this.#ensureWebhookCleanup(bot);
                if (cleanupState === "retry") {
                    continue;
                }
                if (cleanupState === "exit") {
                    return;
                }
                const state = this.opts.isolatedIngress?.enabled ? await this.#runIsolatedIngressCycle(bot) : await this.#runPollingCycle(bot);
                if (state === "exit") {
                    return;
                }
            }
        } finally{
            // Release the transport's dispatchers on session shutdown. Without
            // this, the undici keep-alive sockets survive beyond the session and
            // leak to api.telegram.org; see openclaw#68128.
            await this.#transportState.dispose();
            this.#status.notePollingStop();
        }
    }
    async #waitBeforeRestart(buildLine) {
        this.#restartAttempts += 1;
        const delayMs = (0, _runtimeenv.computeBackoff)(TELEGRAM_POLL_RESTART_POLICY, this.#restartAttempts);
        const delay = (0, _runtimeenv.formatDurationPrecise)(delayMs);
        this.opts.log(buildLine(delay));
        try {
            await (0, _runtimeenv.sleepWithAbort)(delayMs, this.opts.abortSignal);
        } catch (sleepErr) {
            if (this.opts.abortSignal?.aborted) {
                return false;
            }
            throw sleepErr;
        }
        return true;
    }
    async #waitBeforeRetryOnRecoverableSetupError(err, logPrefix) {
        if (this.opts.abortSignal?.aborted) {
            return false;
        }
        if (!(0, _networkerrors.isRecoverableTelegramNetworkError)(err, {
            context: "unknown"
        })) {
            throw err;
        }
        return this.#waitBeforeRestart((delay)=>`${logPrefix}: ${(0, _errorruntime.formatErrorMessage)(err)}; retrying in ${delay}.`);
    }
    #drainPendingDeliveriesAfterReconnect() {
        if (this.#deliveryDrainInFlight) {
            return;
        }
        if (!this.opts.config) {
            return;
        }
        this.#deliveryDrainInFlight = true;
        const accountId = normalizeTelegramAccountId(this.opts.accountId);
        const cfg = this.opts.config;
        void (0, _deliveryqueueruntime.drainPendingDeliveries)({
            drainKey: `telegram:${accountId}`,
            logLabel: "Telegram reconnect drain",
            cfg,
            log: {
                info: (message)=>this.opts.log(`[telegram][diag] ${message}`),
                warn: (message)=>this.opts.log(`[telegram] ${message}`),
                error: (message)=>this.opts.log(`[telegram] ${message}`)
            },
            selectEntry: (entry)=>({
                    match: entry.channel === "telegram" && normalizeTelegramAccountId(entry.accountId) === accountId,
                    bypassBackoff: false
                })
        }).catch((err)=>{
            this.opts.log(`[telegram] reconnect delivery drain failed: ${(0, _errorruntime.formatErrorMessage)(err)}`);
        }).finally(()=>{
            this.#deliveryDrainInFlight = false;
        });
    }
    async #createPollingBot() {
        const fetchAbortController = new AbortController();
        this.#activeFetchAbort = fetchAbortController;
        const telegramTransport = this.#transportState.acquireForNextCycle();
        const persistedLastUpdateId = this.opts.getLastUpdateId();
        const lastUpdateId = this.opts.isolatedIngress?.enabled ? null : persistedLastUpdateId;
        const updateOffset = {
            lastUpdateId,
            persistenceFloorUpdateId: persistedLastUpdateId,
            onUpdateId: this.opts.persistUpdateId
        };
        try {
            return (0, _bot.createTelegramBot)({
                token: this.opts.token,
                runtime: this.opts.runtime,
                proxyFetch: this.opts.proxyFetch,
                config: this.opts.config,
                accountId: this.opts.accountId,
                botInfo: this.opts.botInfo,
                fetchAbortSignal: fetchAbortController.signal,
                minimumClientTimeoutSeconds: TELEGRAM_POLLING_CLIENT_TIMEOUT_FLOOR_SECONDS,
                ...updateOffset ? {
                    updateOffset
                } : {},
                telegramTransport
            });
        } catch (err) {
            await this.#waitBeforeRetryOnRecoverableSetupError(err, "Telegram setup network error");
            if (this.#activeFetchAbort === fetchAbortController) {
                this.#activeFetchAbort = undefined;
            }
            return undefined;
        }
    }
    async #ensureWebhookCleanup(bot) {
        if (this.#webhookCleared) {
            return "ready";
        }
        try {
            await (0, _apilogging.withTelegramApiErrorLogging)({
                operation: "deleteWebhook",
                runtime: this.opts.runtime,
                fn: ()=>bot.api.deleteWebhook({
                        drop_pending_updates: false
                    })
            });
            this.#webhookCleared = true;
            return "ready";
        } catch (err) {
            if ((0, _networkerrors.isRecoverableTelegramNetworkError)(err, {
                context: "unknown"
            })) {
                this.opts.log(`[telegram] deleteWebhook failed with a recoverable network error; continuing to polling so getUpdates can confirm webhook state: ${(0, _errorruntime.formatErrorMessage)(err)}`);
                return "ready";
            }
            const shouldRetry = await this.#waitBeforeRetryOnRecoverableSetupError(err, "Telegram webhook cleanup failed");
            return shouldRetry ? "retry" : "exit";
        }
    }
    async #claimSpooledUpdate(update) {
        try {
            return await (0, _telegramingressspool.claimTelegramSpooledUpdate)(update);
        } catch (err) {
            this.opts.log(`[telegram][diag] spooled update ${update.updateId} claim failed; keeping for retry: ${(0, _errorruntime.formatErrorMessage)(err)}`);
            return null;
        }
    }
    async #handleClaimedSpooledUpdate(params) {
        try {
            await params.bot.handleUpdate(params.update.update);
        } catch (err) {
            await this.#releaseFailedSpooledUpdate({
                err,
                update: params.update
            });
            return false;
        }
        try {
            await (0, _telegramingressspool.deleteTelegramSpooledUpdate)(params.update);
            return true;
        } catch (err) {
            this.opts.log(`[telegram][diag] spooled update ${params.update.updateId} completed but processing marker cleanup failed: ${(0, _errorruntime.formatErrorMessage)(err)}`);
            return false;
        }
    }
    async #releaseFailedSpooledUpdate(params) {
        const nonRetryable = resolveNonRetryableSpooledUpdateFailure(params.err);
        if (nonRetryable) {
            try {
                const failed = await (0, _telegramingressspool.failTelegramSpooledUpdateClaim)({
                    update: params.update,
                    reason: nonRetryable.reason,
                    message: nonRetryable.message
                });
                if (!failed) {
                    this.opts.log(`[telegram][diag] spooled update ${params.update.updateId} failed with non-retryable ${nonRetryable.reason}, but no processing marker remained to dead-letter.`);
                    return;
                }
                this.opts.log(`[telegram][diag] spooled update ${params.update.updateId} failed with non-retryable ${nonRetryable.reason}; dead-lettered: ${nonRetryable.message}`);
                return;
            } catch (failErr) {
                this.opts.log(`[telegram][diag] spooled update ${params.update.updateId} failed with non-retryable ${nonRetryable.reason}, but could not be dead-lettered: ${(0, _errorruntime.formatErrorMessage)(failErr)}`);
            }
        }
        try {
            await (0, _telegramingressspool.releaseTelegramSpooledUpdateClaim)(params.update);
        } catch (releaseErr) {
            this.opts.log(`[telegram][diag] spooled update ${params.update.updateId} failed and could not be requeued: ${(0, _errorruntime.formatErrorMessage)(releaseErr)}`);
            return;
        }
        this.opts.log(`[telegram][diag] spooled update ${params.update.updateId} failed; keeping for retry: ${(0, _errorruntime.formatErrorMessage)(params.err)}`);
    }
    async #waitForSpooledUpdateHandlers() {
        await Promise.allSettled([
            ...this.#spooledUpdateHandlerKeys
        ].map((handlerKey)=>activeSpooledUpdateHandlersByLane.get(handlerKey)?.task).filter((task)=>Boolean(task)));
    }
    #spooledUpdateLaneKey(update) {
        return (0, _sequentialkey.getTelegramSequentialKey)({
            update: update.update,
            ...this.opts.botInfo ? {
                me: this.opts.botInfo
            } : {}
        });
    }
    #activeSpooledUpdateLaneKeysForSpool(spoolDir) {
        const laneKeys = new Set();
        for (const [handlerKey, handler] of activeSpooledUpdateHandlersByLane){
            if (isSpooledUpdateHandlerKeyForSpool(handlerKey, spoolDir)) {
                laneKeys.add(handler.laneKey);
            }
        }
        return laneKeys;
    }
    async #drainSpooledUpdates(params) {
        const activeLaneKeys = this.#activeSpooledUpdateLaneKeysForSpool(params.spoolDir);
        await (0, _telegramingressspool.recoverStaleTelegramSpooledUpdateClaims)({
            spoolDir: params.spoolDir,
            staleMs: 0,
            shouldRecover: (claim)=>!activeLaneKeys.has(this.#spooledUpdateLaneKey(claim)) && !(0, _telegramingressspool.isTelegramSpooledUpdateClaimOwnedByOtherLiveProcess)(claim)
        });
        const claimedLaneKeys = new Set((await (0, _telegramingressspool.listTelegramSpooledUpdateClaims)({
            spoolDir: params.spoolDir
        })).map((claim)=>this.#spooledUpdateLaneKey(claim)));
        const updates = await (0, _telegramingressspool.listTelegramSpooledUpdates)({
            spoolDir: params.spoolDir,
            limit: TELEGRAM_SPOOLED_DRAIN_SCAN_LIMIT
        });
        const blockedByLane = new Set();
        let started = 0;
        for (const update of updates){
            const laneKey = this.#spooledUpdateLaneKey(update);
            if (this.opts.abortSignal?.aborted) {
                break;
            }
            const handlerKey = buildSpooledUpdateHandlerKey({
                spoolDir: params.spoolDir,
                laneKey
            });
            if (activeSpooledUpdateHandlersByLane.has(handlerKey)) {
                blockedByLane.add(handlerKey);
                continue;
            }
            if (claimedLaneKeys.has(laneKey)) {
                continue;
            }
            const claimedUpdate = await this.#claimSpooledUpdate(update);
            if (!claimedUpdate) {
                claimedLaneKeys.add(laneKey);
                continue;
            }
            const handler = this.#handleClaimedSpooledUpdate({
                bot: params.bot,
                update: claimedUpdate
            });
            const state = {
                handlerKey,
                laneKey,
                task: handler,
                update: claimedUpdate,
                updateId: update.updateId,
                startedAt: Date.now()
            };
            activeSpooledUpdateHandlersByLane.set(handlerKey, state);
            this.#spooledUpdateHandlerKeys.add(handlerKey);
            claimedLaneKeys.add(laneKey);
            void handler.finally(()=>{
                if (activeSpooledUpdateHandlersByLane.get(handlerKey) === state) {
                    activeSpooledUpdateHandlersByLane.delete(handlerKey);
                }
                this.#spooledUpdateHandlerKeys.delete(handlerKey);
            });
            started += 1;
            if (started >= TELEGRAM_SPOOLED_DRAIN_START_LIMIT) {
                break;
            }
        }
        return {
            blockedByLane,
            started
        };
    }
    #detectTimedOutSpooledHandler(blockedHandlerKeys) {
        const now = Date.now();
        let timedOut = null;
        for (const handlerKey of blockedHandlerKeys){
            const handler = activeSpooledUpdateHandlersByLane.get(handlerKey);
            if (!handler || handler.timedOutAt !== undefined) {
                continue;
            }
            const ageMs = now - handler.startedAt;
            if (ageMs < this.#spooledUpdateHandlerTimeoutMs) {
                continue;
            }
            if (!timedOut || ageMs > timedOut.ageMs) {
                timedOut = {
                    handler,
                    ageMs
                };
            }
        }
        return timedOut;
    }
    async #recoverTimedOutSpooledHandler(blockedHandlerKeys) {
        const timedOutHandler = this.#detectTimedOutSpooledHandler(blockedHandlerKeys);
        if (!timedOutHandler) {
            return null;
        }
        const handler = timedOutHandler.handler;
        const activeHandler = activeSpooledUpdateHandlersByLane.get(handler.handlerKey);
        if (!activeHandler || activeHandler !== handler) {
            return null;
        }
        const age = (0, _runtimeenv.formatDurationPrecise)(timedOutHandler.ageMs);
        activeHandler.timedOutAt = Date.now();
        const message = `Telegram isolated polling spool handler timed out behind update ${handler.updateId} on lane ${handler.laneKey} after ${age}; marking the update failed, aborting active reply work, and restarting isolated ingress so later updates can drain.`;
        activeHandler.timeoutMessage = message;
        try {
            const failed = await (0, _telegramingressspool.failTelegramSpooledUpdateClaim)({
                update: handler.update,
                reason: "handler-timeout",
                message
            });
            if (!failed) {
                this.opts.log(`[telegram][diag] timed out spooled update ${handler.updateId} no longer had a processing marker to fail.`);
                this.#status.notePollingError(message);
                return {
                    handlerKey: handler.handlerKey,
                    restart: false
                };
            }
        } catch (err) {
            this.opts.log(`[telegram][diag] timed out spooled update ${handler.updateId} could not be marked failed: ${(0, _errorruntime.formatErrorMessage)(err)}`);
            this.#status.notePollingError(message);
            return {
                handlerKey: handler.handlerKey,
                restart: false
            };
        }
        const scopedReplyFenceLaneKey = (0, _telegramreplyfence.buildTelegramReplyFenceLaneKey)({
            accountId: this.opts.accountId,
            sequentialKey: handler.laneKey
        });
        const abortedReplyWork = (0, _telegramreplyfence.supersedeTelegramReplyFenceLane)(scopedReplyFenceLaneKey);
        if (!abortedReplyWork) {
            this.opts.log(`[telegram][diag] timed out spooled update ${handler.updateId} had no active reply fence on lane ${handler.laneKey}; keeping the lane guarded until the handler stops.`);
        }
        const handlerStopped = await waitForSpooledHandlerTaskSettlement({
            task: handler.task,
            timeoutMs: this.#spooledUpdateHandlerAbortGraceMs,
            abortSignal: this.opts.abortSignal
        });
        if (!handlerStopped && activeSpooledUpdateHandlersByLane.get(handler.handlerKey) === activeHandler) {
            this.opts.log(`[telegram][diag] timed out spooled update ${handler.updateId} did not stop within ${(0, _runtimeenv.formatDurationPrecise)(this.#spooledUpdateHandlerAbortGraceMs)} after reply abort; keeping lane ${handler.laneKey} guarded.`);
            this.#status.notePollingError(message);
            return {
                handlerKey: handler.handlerKey,
                restart: false
            };
        }
        if (activeSpooledUpdateHandlersByLane.get(handler.handlerKey) === activeHandler) {
            activeSpooledUpdateHandlersByLane.delete(handler.handlerKey);
        }
        this.#spooledUpdateHandlerKeys.delete(handler.handlerKey);
        this.opts.log(`[telegram] ${message}`);
        this.#status.notePollingError(message);
        return {
            handlerKey: handler.handlerKey,
            restart: true
        };
    }
    async #runIsolatedIngressCycle(bot) {
        const ingress = this.opts.isolatedIngress;
        if (!ingress?.enabled) {
            return this.#runPollingCycle(bot);
        }
        try {
            await bot.init();
        } catch (err) {
            const shouldRetry = await this.#waitBeforeRetryOnRecoverableSetupError(err, "Telegram bot init failed");
            return shouldRetry ? "continue" : "exit";
        }
        const spoolDir = ingress.spoolDir ?? (0, _telegramingressspool.resolveTelegramIngressSpoolDir)({
            accountId: this.opts.accountId
        });
        const workerFactory = ingress.createWorker ?? _telegramingressworker.createTelegramIngressWorker;
        const worker = workerFactory({
            token: this.opts.token,
            accountId: this.opts.accountId,
            initialUpdateId: this.opts.getLastUpdateId(),
            spoolDir,
            apiRoot: ingress.apiRoot,
            timeoutSeconds: ingress.timeoutSeconds,
            network: ingress.network,
            proxy: ingress.proxy
        });
        let stopWorkerPromise;
        const stopWorker = ()=>{
            stopWorkerPromise ??= Promise.resolve(worker.stop()).then(()=>undefined).catch(()=>{
            // Worker may already be stopped by restart/abort paths.
            });
            return stopWorkerPromise;
        };
        this.opts.log(`[telegram][diag] isolated polling ingress started spool=${spoolDir}`);
        const pollState = {
            startedAt: null,
            offset: null,
            outcome: "not-started"
        };
        const liveness = new _pollingliveness.TelegramPollingLivenessTracker();
        let consecutiveDrainFailures = 0;
        let restartRequested = false;
        let stalledRestart = false;
        let forceCycleTimer;
        let forceCycleResolve;
        const forceCyclePromise = new Promise((resolve)=>{
            forceCycleResolve = resolve;
        });
        const stalledBacklogKeys = new Set();
        const unsubscribe = worker.onMessage((message)=>{
            const ackSpooledUpdate = (requestId, result)=>{
                try {
                    worker.ackSpooledUpdate?.(requestId, result);
                } catch (err) {
                    this.opts.log(`[telegram][diag] isolated polling worker ack failed: ${(0, _errorruntime.formatErrorMessage)(err)}`);
                }
            };
            if (message.type === "poll-start") {
                liveness.noteGetUpdatesStarted({
                    offset: message.offset
                }, message.startedAt);
                pollState.startedAt = message.startedAt;
                pollState.offset = message.offset;
                pollState.outcome = "started";
                delete pollState.error;
                return;
            }
            if (message.type === "poll-success") {
                liveness.noteGetUpdatesSuccessCount(message.count, message.finishedAt);
                liveness.noteGetUpdatesFinished();
                if (!restartRequested && stalledBacklogKeys.size === 0) {
                    this.#status.notePollSuccess(message.finishedAt);
                }
                this.#drainPendingDeliveriesAfterReconnect();
                pollState.outcome = `ok:${message.count}`;
                return;
            }
            if (message.type === "poll-error") {
                liveness.noteGetUpdatesError(new Error(message.message), message.finishedAt);
                liveness.noteGetUpdatesFinished();
                pollState.outcome = "error";
                pollState.error = message.message;
                return;
            }
            if (message.type === "update") {
                void (0, _telegramingressspool.writeTelegramSpooledUpdate)({
                    spoolDir,
                    update: message.update
                }).then((updateId)=>{
                    ackSpooledUpdate(message.requestId, {
                        ok: true,
                        updateId
                    });
                }, (err)=>{
                    ackSpooledUpdate(message.requestId, {
                        ok: false,
                        message: (0, _errorruntime.formatErrorMessage)(err)
                    });
                });
                return;
            }
            if (message.type === "spooled") {
                liveness.noteGetUpdatesActivity();
            }
        });
        const stopOnAbort = ()=>{
            void stopWorker();
        };
        this.opts.abortSignal?.addEventListener("abort", stopOnAbort, {
            once: true
        });
        const drainIntervalMs = Math.max(100, Math.floor(ingress.drainIntervalMs ?? 500));
        let drainActive = false;
        const stopBot = ()=>{
            return Promise.resolve(bot.stop()).then(()=>undefined).catch(()=>{
            // Bot may already be stopped by shutdown paths.
            });
        };
        const drainOnce = async ()=>{
            if (restartRequested || drainActive || this.opts.abortSignal?.aborted) {
                return;
            }
            drainActive = true;
            try {
                const drain = await this.#drainSpooledUpdates({
                    bot,
                    spoolDir
                });
                consecutiveDrainFailures = 0;
                for (const handlerKey of stalledBacklogKeys){
                    if (!activeSpooledUpdateHandlersByLane.has(handlerKey) || !drain.blockedByLane.has(handlerKey)) {
                        stalledBacklogKeys.delete(handlerKey);
                    }
                }
                for (const handlerKey of drain.blockedByLane){
                    const handler = activeSpooledUpdateHandlersByLane.get(handlerKey);
                    if (handler?.timedOutAt === undefined) {
                        continue;
                    }
                    stalledBacklogKeys.add(handlerKey);
                    if (handler.timeoutMessage) {
                        this.#status.notePollingError(handler.timeoutMessage);
                    }
                }
                const timedOutRecovery = await this.#recoverTimedOutSpooledHandler(drain.blockedByLane);
                if (timedOutRecovery?.restart) {
                    restartRequested = true;
                    void stopWorker();
                } else if (timedOutRecovery) {
                    stalledBacklogKeys.add(timedOutRecovery.handlerKey);
                }
            } catch (err) {
                consecutiveDrainFailures += 1;
                this.opts.log(`[telegram][diag] isolated polling spool drain failed (${consecutiveDrainFailures}): ${(0, _errorruntime.formatErrorMessage)(err)}`);
            } finally{
                drainActive = false;
            }
        };
        await drainOnce();
        const drainTimer = setInterval(()=>{
            void drainOnce();
        }, drainIntervalMs);
        drainTimer.unref?.();
        const watchdog = setInterval(()=>{
            if (this.opts.abortSignal?.aborted || restartRequested) {
                return;
            }
            const stall = liveness.detectStall({
                thresholdMs: this.#stallThresholdMs
            });
            if (!stall) {
                return;
            }
            this.#transportState.markDirty();
            stalledRestart = true;
            restartRequested = true;
            this.opts.log(`[telegram] ${stall.message}`);
            this.#status.notePollingError(stall.message);
            void stopWorker();
            if (!forceCycleTimer) {
                forceCycleTimer = setTimeout(()=>{
                    if (this.opts.abortSignal?.aborted) {
                        return;
                    }
                    this.opts.log(`[telegram] Isolated polling ingress stop timed out after ${(0, _runtimeenv.formatDurationPrecise)(POLL_STOP_GRACE_MS)}; forcing restart cycle.`);
                    forceCycleResolve?.();
                }, POLL_STOP_GRACE_MS);
            }
        }, POLL_WATCHDOG_INTERVAL_MS);
        watchdog.unref?.();
        try {
            try {
                await Promise.race([
                    worker.task(),
                    forceCyclePromise
                ]);
            } catch (err) {
                if (this.opts.abortSignal?.aborted) {
                    return "exit";
                }
                if (pollState.error && !(0, _networkerrors.isRecoverableTelegramNetworkError)(new Error(pollState.error), {
                    context: "polling"
                })) {
                    this.#status.notePollingError(pollState.error);
                    throw new Error(pollState.error, {
                        cause: err
                    });
                }
                const message = (0, _errorruntime.formatErrorMessage)(err);
                this.opts.log(`[telegram][diag] isolated polling ingress failed: ${message}`);
                this.#status.notePollingError(message);
                const shouldRestart = await this.#waitBeforeRestart((delay)=>`Telegram isolated polling ingress failed; restarting in ${delay}.`);
                return shouldRestart ? "continue" : "exit";
            }
            if (this.opts.abortSignal?.aborted) {
                return "exit";
            }
            if (restartRequested) {
                if (stalledRestart) {
                    this.opts.log(`[telegram][diag] isolated polling ingress finished reason=polling stall detected ${liveness.formatDiagnosticFields("error")}`);
                }
                return "continue";
            }
            const errorText = pollState.error ? ` error=${pollState.error}` : "";
            this.opts.log(`[telegram][diag] isolated polling ingress stopped outcome=${pollState.outcome} startedAt=${pollState.startedAt ?? "n/a"} offset=${pollState.offset ?? "n/a"}${errorText}`);
            const shouldRestart = await this.#waitBeforeRestart((delay)=>`Telegram isolated polling ingress stopped; restarting in ${delay}.`);
            return shouldRestart ? "continue" : "exit";
        } finally{
            clearInterval(watchdog);
            clearInterval(drainTimer);
            if (forceCycleTimer) {
                clearTimeout(forceCycleTimer);
            }
            unsubscribe();
            this.opts.abortSignal?.removeEventListener("abort", stopOnAbort);
            await stopWorker();
            if (!restartRequested) {
                await drainOnce();
                await waitForGracefulStop(()=>this.#waitForSpooledUpdateHandlers());
            }
            await waitForGracefulStop(stopBot);
        }
    }
    async #runPollingCycle(bot) {
        const liveness = new _pollingliveness.TelegramPollingLivenessTracker({
            onPollSuccess: (finishedAt)=>{
                this.#status.notePollSuccess(finishedAt);
                this.#drainPendingDeliveriesAfterReconnect();
            }
        });
        bot.api.config.use(async (prev, method, payload, signal)=>{
            if (method !== "getUpdates") {
                return await prev(method, payload, signal);
            }
            liveness.noteGetUpdatesStarted(payload);
            try {
                const result = await prev(method, payload, signal);
                liveness.noteGetUpdatesSuccess(result);
                return result;
            } catch (err) {
                liveness.noteGetUpdatesError(err);
                throw err;
            } finally{
                liveness.noteGetUpdatesFinished();
            }
        });
        const runner = (0, _runner.run)(bot, this.opts.runnerOptions);
        this.opts.log(`[telegram][diag] polling cycle started ${liveness.formatDiagnosticFields()}`);
        this.#activeRunner = runner;
        const fetchAbortController = this.#activeFetchAbort;
        const abortFetch = ()=>{
            fetchAbortController?.abort();
        };
        if (this.opts.abortSignal && fetchAbortController) {
            this.opts.abortSignal.addEventListener("abort", abortFetch, {
                once: true
            });
        }
        let stopPromise;
        let stalledRestart = false;
        let forceCycleTimer;
        let forceCycleResolve;
        const forceCyclePromise = new Promise((resolve)=>{
            forceCycleResolve = resolve;
        });
        const stopRunner = ()=>{
            fetchAbortController?.abort();
            stopPromise ??= Promise.resolve(runner.stop()).then(()=>undefined).catch(()=>{
            // Runner may already be stopped by abort/retry paths.
            });
            return stopPromise;
        };
        const stopBot = ()=>{
            return Promise.resolve(bot.stop()).then(()=>undefined).catch(()=>{
            // Bot may already be stopped by runner stop/abort paths.
            });
        };
        const stopOnAbort = ()=>{
            if (this.opts.abortSignal?.aborted) {
                void stopRunner();
            }
        };
        const watchdog = setInterval(()=>{
            if (this.opts.abortSignal?.aborted) {
                return;
            }
            const stall = liveness.detectStall({
                thresholdMs: this.#stallThresholdMs
            });
            if (stall) {
                this.#transportState.markDirty();
                stalledRestart = true;
                this.opts.log(`[telegram] ${stall.message}`);
                void stopRunner();
                void stopBot();
                if (!forceCycleTimer) {
                    forceCycleTimer = setTimeout(()=>{
                        if (this.opts.abortSignal?.aborted) {
                            return;
                        }
                        this.opts.log(`[telegram] Polling runner stop timed out after ${(0, _runtimeenv.formatDurationPrecise)(POLL_STOP_GRACE_MS)}; forcing restart cycle.`);
                        forceCycleResolve?.();
                    }, POLL_STOP_GRACE_MS);
                }
            }
        }, POLL_WATCHDOG_INTERVAL_MS);
        this.opts.abortSignal?.addEventListener("abort", stopOnAbort, {
            once: true
        });
        try {
            await Promise.race([
                runner.task(),
                forceCyclePromise
            ]);
            if (this.opts.abortSignal?.aborted) {
                return "exit";
            }
            const reason = stalledRestart ? "polling stall detected" : this.#forceRestarted ? "unhandled network error" : "runner stopped (maxRetryTime exceeded or graceful stop)";
            this.#forceRestarted = false;
            this.opts.log(`[telegram][diag] polling cycle finished reason=${reason} ${liveness.formatDiagnosticFields("error")}`);
            const shouldRestart = await this.#waitBeforeRestart((delay)=>`Telegram polling runner stopped (${reason}); restarting in ${delay}.`);
            return shouldRestart ? "continue" : "exit";
        } catch (err) {
            this.#forceRestarted = false;
            if (this.opts.abortSignal?.aborted) {
                throw err;
            }
            const isConflict = isGetUpdatesConflict(err);
            if (isConflict) {
                this.#webhookCleared = false;
            }
            const isRecoverable = (0, _networkerrors.isRecoverableTelegramNetworkError)(err, {
                context: "polling"
            });
            // Mark transport dirty on 409 conflict as well as recoverable network
            // errors. Without this, Telegram-side session termination returns 409
            // and the retry reuses the same HTTP keep-alive TCP socket, which
            // Telegram treats as the "old" session and keeps terminating — producing
            // a tight 409 retry loop at low but non-zero rate. (#69787)
            if (isRecoverable || isConflict) {
                this.#transportState.markDirty();
            }
            if (!isConflict && !isRecoverable) {
                throw err;
            }
            const reason = isConflict ? "getUpdates conflict" : "network error";
            const errMsg = (0, _errorruntime.formatErrorMessage)(err);
            const conflictHint = isConflict ? " Another OpenClaw gateway, script, or Telegram poller may be using this bot token; stop the duplicate poller or switch this account to webhook mode." : "";
            this.opts.log(`[telegram][diag] polling cycle error reason=${reason} ${liveness.formatDiagnosticFields("lastGetUpdatesError")} err=${errMsg}${conflictHint}`);
            const shouldRestart = await this.#waitBeforeRestart((delay)=>`Telegram ${reason}: ${errMsg};${conflictHint} retrying in ${delay}.`);
            return shouldRestart ? "continue" : "exit";
        } finally{
            clearInterval(watchdog);
            if (forceCycleTimer) {
                clearTimeout(forceCycleTimer);
            }
            this.opts.abortSignal?.removeEventListener("abort", abortFetch);
            this.opts.abortSignal?.removeEventListener("abort", stopOnAbort);
            await waitForGracefulStop(stopRunner);
            await waitForGracefulStop(stopBot);
            this.#activeRunner = undefined;
            if (this.#activeFetchAbort === fetchAbortController) {
                this.#activeFetchAbort = undefined;
            }
        }
    }
};
const isGetUpdatesConflict = (err)=>{
    if (!err || typeof err !== "object") {
        return false;
    }
    const typed = err;
    const errorCode = typed.error_code ?? typed.errorCode;
    if (errorCode !== 409) {
        return false;
    }
    const haystack = [
        typed.method,
        typed.description,
        typed.message
    ].filter((value)=>typeof value === "string").join(" ");
    const normalizedHaystack = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(haystack);
    return normalizedHaystack.includes("getupdates");
};
const testing = {
    resetActiveSpooledUpdateHandlersForTests: ()=>{
        activeSpooledUpdateHandlersByLane.clear();
    },
    resolveSpooledUpdateHandlerAbortGraceMs: (valueMs)=>(0, _numberruntime.resolvePositiveTimerTimeoutMs)(valueMs, TELEGRAM_SPOOLED_HANDLER_ABORT_GRACE_MS)
};

//# sourceMappingURL=polling-session.js.map