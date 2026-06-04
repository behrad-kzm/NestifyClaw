"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _nodeworker_threads = require("node:worker_threads");
const _allowedupdates = require("./allowed-updates.js");
const _apiroot = require("./api-root.js");
const _fetch = require("./fetch.js");
const _networkerrors = require("./network-errors.js");
const _proxy = require("./proxy.js");
const _requesttimeouts = require("./request-timeouts.js");
const options = _nodeworker_threads.workerData;
const pollLimit = 100;
const retryInitialMs = 1000;
const retryMaxMs = 30_000;
let stopped = false;
let activeController;
let nextSpoolRequestId = 0;
const pendingSpoolRequests = new Map();
function post(message) {
    if (_nodeworker_threads.parentPort) {
        Reflect.apply(Reflect.get(_nodeworker_threads.parentPort, "postMessage"), _nodeworker_threads.parentPort, [
            message
        ]);
    }
}
function sleep(ms) {
    return new Promise((resolve)=>{
        setTimeout(resolve, ms);
    });
}
function formatErrorMessage(err) {
    if (err instanceof Error) {
        return err.message || err.name;
    }
    return String(err);
}
function resolveBackoff(attempt) {
    return Math.min(retryMaxMs, retryInitialMs * 2 ** Math.max(0, attempt - 1));
}
function rejectPendingSpoolRequests(err) {
    for (const pending of pendingSpoolRequests.values()){
        pending.reject(err);
    }
    pendingSpoolRequests.clear();
}
_nodeworker_threads.parentPort?.on("message", (message)=>{
    if (message?.type === "stop") {
        stopped = true;
        const err = new Error("telegram ingress worker stopped");
        activeController?.abort(err);
        rejectPendingSpoolRequests(err);
        return;
    }
    if (message?.type !== "spool-ack") {
        return;
    }
    const pending = pendingSpoolRequests.get(message.requestId);
    if (!pending) {
        return;
    }
    pendingSpoolRequests.delete(message.requestId);
    if (message.result.ok) {
        pending.resolve(message.result.updateId);
        return;
    }
    pending.reject(new Error(message.result.message));
});
async function requestSpoolUpdate(params) {
    if (!_nodeworker_threads.parentPort) {
        throw new Error("Telegram ingress worker missing parent port.");
    }
    const requestId = String(++nextSpoolRequestId);
    const updateId = await new Promise((resolve, reject)=>{
        pendingSpoolRequests.set(requestId, {
            resolve,
            reject
        });
        post({
            type: "update",
            requestId,
            update: params.update,
            queued: params.queued
        });
    });
    return updateId;
}
async function fetchJson(params) {
    const controller = new AbortController();
    activeController = controller;
    const timeout = setTimeout(()=>{
        controller.abort(new Error("Telegram getUpdates timed out"));
    }, _requesttimeouts.TELEGRAM_GET_UPDATES_REQUEST_TIMEOUT_MS);
    timeout.unref?.();
    try {
        const response = await params.fetch(params.url, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(params.body),
            signal: controller.signal
        });
        const json = await response.json();
        if (!response.ok || json.ok !== true) {
            throw new Error(typeof json.description === "string" ? json.description : `Telegram getUpdates failed with HTTP ${response.status}`);
        }
        return json.result;
    } finally{
        clearTimeout(timeout);
        if (activeController === controller) {
            activeController = undefined;
        }
    }
}
async function main() {
    const proxyFetch = options.proxy ? (0, _proxy.makeProxyFetch)(options.proxy) : undefined;
    const transport = (0, _fetch.resolveTelegramTransport)(proxyFetch, {
        network: options.network
    });
    const fetchImpl = transport.fetch ?? globalThis.fetch;
    const apiRoot = (0, _apiroot.normalizeTelegramApiRoot)(options.apiRoot ?? "https://api.telegram.org");
    const getUpdatesUrl = `${apiRoot}/bot${options.token}/getUpdates`;
    const pollTimeoutSeconds = (0, _requesttimeouts.resolveTelegramLongPollTimeoutSeconds)(options.timeoutSeconds);
    let lastUpdateId = options.initialUpdateId;
    let failures = 0;
    try {
        for(;;){
            if (stopped) {
                break;
            }
            const offset = lastUpdateId === null ? null : lastUpdateId + 1;
            const startedAt = Date.now();
            post({
                type: "poll-start",
                offset,
                startedAt
            });
            try {
                const result = await fetchJson({
                    fetch: fetchImpl,
                    url: getUpdatesUrl,
                    body: {
                        timeout: pollTimeoutSeconds,
                        limit: pollLimit,
                        allowed_updates: (0, _allowedupdates.resolveTelegramAllowedUpdates)(),
                        ...offset === null ? {} : {
                            offset
                        }
                    }
                });
                if (!Array.isArray(result)) {
                    throw new Error("Telegram getUpdates returned a non-array result.");
                }
                for (const update of result){
                    if (stopped) {
                        break;
                    }
                    const updateId = await requestSpoolUpdate({
                        update,
                        queued: result.length
                    });
                    if (lastUpdateId === null || updateId > lastUpdateId) {
                        lastUpdateId = updateId;
                    }
                    post({
                        type: "spooled",
                        updateId,
                        queued: result.length
                    });
                }
                failures = 0;
                post({
                    type: "poll-success",
                    offset,
                    count: result.length,
                    finishedAt: Date.now()
                });
            } catch (err) {
                if (stopped) {
                    break;
                }
                failures += 1;
                post({
                    type: "poll-error",
                    message: formatErrorMessage(err),
                    finishedAt: Date.now()
                });
                if (!(0, _networkerrors.isRecoverableTelegramNetworkError)(err, {
                    context: "polling"
                })) {
                    throw err;
                }
                await sleep(resolveBackoff(failures));
            }
        }
    } finally{
        await transport.close();
    }
}
main().then(()=>{
    _nodeworker_threads.parentPort?.close();
}).catch((err)=>{
    post({
        type: "poll-error",
        message: formatErrorMessage(err),
        finishedAt: Date.now()
    });
    _nodeworker_threads.parentPort?.close();
    process.exitCode = stopped ? 0 : 1;
});

//# sourceMappingURL=telegram-ingress-worker.runtime.js.map