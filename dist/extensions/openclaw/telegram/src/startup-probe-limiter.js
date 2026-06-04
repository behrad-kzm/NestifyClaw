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
    get resetTelegramStartupProbeLimiterForTests () {
        return resetTelegramStartupProbeLimiterForTests;
    },
    get withTelegramStartupProbeSlot () {
        return withTelegramStartupProbeSlot;
    }
});
const TELEGRAM_STARTUP_PROBE_CONCURRENCY = 2;
let activeStartupProbes = 0;
const pendingStartupProbeWaiters = [];
function buildStartupProbeAbortError() {
    return new Error("telegram startup probe wait aborted");
}
function detachAbortHandler(waiter) {
    if (!waiter.abortSignal || !waiter.onAbort) {
        return;
    }
    waiter.abortSignal.removeEventListener("abort", waiter.onAbort);
}
function removePendingWaiter(waiter) {
    const index = pendingStartupProbeWaiters.indexOf(waiter);
    if (index >= 0) {
        pendingStartupProbeWaiters.splice(index, 1);
    }
}
function releaseStartupProbeSlot() {
    activeStartupProbes = Math.max(0, activeStartupProbes - 1);
    drainStartupProbeWaiters();
}
function drainStartupProbeWaiters() {
    while(activeStartupProbes < TELEGRAM_STARTUP_PROBE_CONCURRENCY && pendingStartupProbeWaiters.length > 0){
        const waiter = pendingStartupProbeWaiters.shift();
        if (!waiter) {
            return;
        }
        detachAbortHandler(waiter);
        if (waiter.abortSignal?.aborted) {
            waiter.reject(buildStartupProbeAbortError());
            continue;
        }
        activeStartupProbes += 1;
        waiter.resolve(releaseStartupProbeSlot);
    }
}
async function acquireStartupProbeSlot(abortSignal) {
    if (abortSignal?.aborted) {
        throw buildStartupProbeAbortError();
    }
    if (activeStartupProbes < TELEGRAM_STARTUP_PROBE_CONCURRENCY) {
        activeStartupProbes += 1;
        return releaseStartupProbeSlot;
    }
    return await new Promise((resolve, reject)=>{
        const waiter = {
            resolve,
            reject,
            ...abortSignal ? {
                abortSignal
            } : {}
        };
        waiter.onAbort = ()=>{
            removePendingWaiter(waiter);
            reject(buildStartupProbeAbortError());
        };
        abortSignal?.addEventListener("abort", waiter.onAbort, {
            once: true
        });
        pendingStartupProbeWaiters.push(waiter);
    });
}
async function withTelegramStartupProbeSlot(abortSignal, run) {
    const release = await acquireStartupProbeSlot(abortSignal);
    try {
        if (abortSignal?.aborted) {
            throw buildStartupProbeAbortError();
        }
        return await run();
    } finally{
        release();
    }
}
function resetTelegramStartupProbeLimiterForTests() {
    activeStartupProbes = 0;
    const pending = pendingStartupProbeWaiters.splice(0);
    for (const waiter of pending){
        detachAbortHandler(waiter);
        waiter.reject(buildStartupProbeAbortError());
    }
}

//# sourceMappingURL=startup-probe-limiter.js.map