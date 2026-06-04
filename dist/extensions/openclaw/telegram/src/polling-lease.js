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
    get acquireTelegramPollingLease () {
        return acquireTelegramPollingLease;
    },
    get releaseStoppedTelegramPollingLease () {
        return releaseStoppedTelegramPollingLease;
    },
    get resetTelegramPollingLeasesForTests () {
        return resetTelegramPollingLeasesForTests;
    }
});
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _tokenfingerprint = require("./token-fingerprint.js");
const TELEGRAM_POLLING_LEASES_KEY = Symbol.for("openclaw.telegram.pollingLeases");
const DEFAULT_TELEGRAM_POLLING_LEASE_WAIT_MS = 5_000;
function pollingLeaseRegistry() {
    const proc = process;
    proc[TELEGRAM_POLLING_LEASES_KEY] ??= new Map();
    return proc[TELEGRAM_POLLING_LEASES_KEY];
}
function createDuplicatePollingError(params) {
    const ageMs = Math.max(0, Date.now() - params.existing.startedAt);
    const ageSeconds = Math.round(ageMs / 1000);
    return new Error(`Telegram polling already active for bot token ${params.tokenFingerprint} on account "${params.existing.accountId}" (${ageSeconds}s old); refusing duplicate poller for account "${params.accountId}". Stop the existing OpenClaw gateway/poller or use a different bot token.`);
}
async function waitForPreviousRelease(params) {
    if (params.signal?.aborted) {
        return "aborted";
    }
    if (params.waitMs <= 0) {
        return "timeout";
    }
    let timer;
    let abortListener;
    try {
        const waitMs = (0, _numberruntime.resolveTimerTimeoutMs)(params.waitMs, DEFAULT_TELEGRAM_POLLING_LEASE_WAIT_MS, 0);
        const timeout = new Promise((resolve)=>{
            timer = setTimeout(()=>resolve("timeout"), waitMs);
            timer.unref?.();
        });
        const aborted = new Promise((resolve)=>{
            abortListener = ()=>resolve("aborted");
            params.signal?.addEventListener("abort", abortListener, {
                once: true
            });
        });
        const released = params.done.then(()=>"released");
        return await Promise.race([
            released,
            timeout,
            aborted
        ]);
    } finally{
        if (timer) {
            clearTimeout(timer);
        }
        if (abortListener) {
            params.signal?.removeEventListener("abort", abortListener);
        }
    }
}
function createLease(params) {
    let resolveDone;
    const done = new Promise((resolve)=>{
        resolveDone = resolve;
    });
    const owner = Symbol(`telegram-polling:${params.accountId}`);
    const entry = {
        accountId: params.accountId,
        abortSignal: params.abortSignal,
        done,
        owner,
        resolveDone,
        startedAt: Date.now()
    };
    params.registry.set(params.tokenFingerprint, entry);
    let released = false;
    return {
        tokenFingerprint: params.tokenFingerprint,
        waitedForPrevious: params.waitedForPrevious,
        replacedStoppingPrevious: params.replacedStoppingPrevious,
        release: ()=>{
            if (released) {
                return;
            }
            released = true;
            const current = params.registry.get(params.tokenFingerprint);
            if (current?.owner === owner) {
                params.registry.delete(params.tokenFingerprint);
            }
            resolveDone();
        }
    };
}
async function acquireTelegramPollingLease(opts) {
    const registry = pollingLeaseRegistry();
    const fingerprint = (0, _tokenfingerprint.fingerprintTelegramBotToken)(opts.token);
    const waitMs = opts.waitMs ?? DEFAULT_TELEGRAM_POLLING_LEASE_WAIT_MS;
    let waitedForPrevious = false;
    for(;;){
        const existing = registry.get(fingerprint);
        if (!existing) {
            return createLease({
                accountId: opts.accountId,
                abortSignal: opts.abortSignal,
                registry,
                tokenFingerprint: fingerprint,
                waitedForPrevious,
                replacedStoppingPrevious: false
            });
        }
        if (!existing.abortSignal?.aborted) {
            throw createDuplicatePollingError({
                accountId: opts.accountId,
                existing,
                tokenFingerprint: fingerprint
            });
        }
        waitedForPrevious = true;
        const waitResult = await waitForPreviousRelease({
            done: existing.done,
            signal: opts.abortSignal,
            waitMs
        });
        if (waitResult === "aborted") {
            throw new Error(`Telegram polling start aborted while waiting for previous poller for bot token ${fingerprint} to stop.`);
        }
        const current = registry.get(fingerprint);
        if (current !== existing) {
            continue;
        }
        if (waitResult === "released") {
            continue;
        }
        return createLease({
            accountId: opts.accountId,
            abortSignal: opts.abortSignal,
            registry,
            tokenFingerprint: fingerprint,
            waitedForPrevious,
            replacedStoppingPrevious: true
        });
    }
}
async function releaseStoppedTelegramPollingLease(opts) {
    const registry = pollingLeaseRegistry();
    const fingerprint = (0, _tokenfingerprint.fingerprintTelegramBotToken)(opts.token);
    const existing = registry.get(fingerprint);
    if (!existing || existing.accountId !== opts.accountId) {
        return false;
    }
    if (!existing.abortSignal?.aborted) {
        return false;
    }
    const waitResult = await waitForPreviousRelease({
        done: existing.done,
        waitMs: opts.waitMs ?? DEFAULT_TELEGRAM_POLLING_LEASE_WAIT_MS
    });
    if (waitResult === "released" || registry.get(fingerprint) !== existing) {
        return false;
    }
    registry.delete(fingerprint);
    existing.resolveDone();
    return true;
}
function resetTelegramPollingLeasesForTests() {
    pollingLeaseRegistry().clear();
}

//# sourceMappingURL=polling-lease.js.map