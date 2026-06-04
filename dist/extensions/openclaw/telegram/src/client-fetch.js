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
    get asTelegramClientFetch () {
        return asTelegramClientFetch;
    },
    get createTelegramClientFetch () {
        return createTelegramClientFetch;
    },
    get resolveTelegramClientTimeoutMinimumSeconds () {
        return resolveTelegramClientTimeoutMinimumSeconds;
    },
    get resolveTelegramClientTimeoutSeconds () {
        return resolveTelegramClientTimeoutSeconds;
    },
    get resolveTelegramOutboundClientTimeoutFloorSeconds () {
        return resolveTelegramOutboundClientTimeoutFloorSeconds;
    }
});
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _networkerrors = require("./network-errors.js");
const _requesttimeouts = require("./request-timeouts.js");
function asTelegramClientFetch(fetchImpl) {
    return fetchImpl;
}
function asTelegramCompatFetch(fetchImpl) {
    return fetchImpl;
}
function isTelegramAbortSignalLike(value) {
    return typeof value === "object" && value !== null && "aborted" in value && typeof value.aborted === "boolean" && typeof value.addEventListener === "function" && typeof value.removeEventListener === "function";
}
function readRequestUrl(input) {
    if (typeof input === "string") {
        return input;
    }
    if (input instanceof URL) {
        return input.toString();
    }
    if (input instanceof Request) {
        return input.url;
    }
    return null;
}
function extractTelegramApiMethod(input) {
    const url = readRequestUrl(input);
    if (!url) {
        return null;
    }
    try {
        const pathname = new URL(url).pathname;
        const segments = pathname.split("/").filter(Boolean);
        const method = segments.length > 0 ? segments.at(-1) ?? null : null;
        return (0, _stringcoerceruntime.normalizeOptionalLowercaseString)(method) ?? null;
    } catch  {
        return null;
    }
}
const TELEGRAM_TIMEOUT_FALLBACK_METHODS = new Set([
    "deletemycommands",
    "deletewebhook",
    "getme",
    "sendchataction",
    "setmycommands",
    "setwebhook"
]);
function shouldRetryTimedOutTelegramControlRequest(method) {
    return method !== null && TELEGRAM_TIMEOUT_FALLBACK_METHODS.has(method);
}
function resolveTelegramClientTimeoutSeconds(params) {
    const { value, minimum } = params;
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return undefined;
    }
    const configured = Math.max(1, Math.floor(value));
    if (typeof minimum !== "number" || !Number.isFinite(minimum)) {
        return configured;
    }
    return Math.max(configured, Math.max(1, Math.floor(minimum)));
}
function resolveTelegramClientTimeoutMinimumSeconds(values) {
    let minimum;
    for (const value of values){
        if (typeof value !== "number" || !Number.isFinite(value)) {
            continue;
        }
        const normalized = Math.max(1, Math.ceil(value));
        minimum = minimum === undefined ? normalized : Math.max(minimum, normalized);
    }
    return minimum;
}
function resolveTelegramOutboundClientTimeoutFloorSeconds(timeoutSeconds) {
    const timeoutMs = (0, _requesttimeouts.resolveTelegramRequestTimeoutMs)("sendmessage", timeoutSeconds);
    return timeoutMs === undefined ? undefined : timeoutMs / 1000;
}
function createTelegramClientFetch(params) {
    if (!params.fetchImpl && !params.shutdownSignal) {
        return undefined;
    }
    const callFetch = asTelegramCompatFetch(params.fetchImpl ?? asTelegramClientFetch(globalThis.fetch));
    const wrappedFetch = async (input, init)=>{
        const method = extractTelegramApiMethod(input);
        const requestTimeoutMs = (0, _requesttimeouts.resolveTelegramRequestTimeoutMs)(method, params.timeoutSeconds);
        const shutdownSignal = isTelegramAbortSignalLike(params.shutdownSignal) ? params.shutdownSignal : undefined;
        const requestSignal = isTelegramAbortSignalLike(init?.signal) ? init.signal : undefined;
        const canForceTransportFallback = (reason)=>!shutdownSignal?.aborted && !requestSignal?.aborted && params.transport?.forceFallback?.(reason) === true;
        const runFetch = async ()=>{
            const controller = new AbortController();
            const abortWith = (signal)=>controller.abort(signal.reason);
            const onShutdown = ()=>{
                if (shutdownSignal) {
                    abortWith(shutdownSignal);
                }
            };
            let requestTimeout;
            let onRequestAbort;
            let requestTimedOut = false;
            const timeoutError = requestTimeoutMs !== undefined ? new Error(`Telegram ${method} timed out after ${requestTimeoutMs}ms`) : undefined;
            if (shutdownSignal?.aborted) {
                abortWith(shutdownSignal);
            } else if (shutdownSignal) {
                shutdownSignal.addEventListener("abort", onShutdown, {
                    once: true
                });
            }
            if (requestSignal) {
                if (requestSignal.aborted) {
                    abortWith(requestSignal);
                } else {
                    onRequestAbort = ()=>abortWith(requestSignal);
                    requestSignal.addEventListener("abort", onRequestAbort);
                }
            }
            if (requestTimeoutMs && timeoutError) {
                requestTimeout = setTimeout(()=>{
                    requestTimedOut = true;
                    controller.abort(timeoutError);
                }, requestTimeoutMs);
                requestTimeout.unref?.();
            }
            try {
                return await callFetch(input, {
                    ...init,
                    signal: controller.signal
                });
            } catch (err) {
                if (requestTimedOut && timeoutError) {
                    throw timeoutError;
                }
                throw err;
            } finally{
                if (requestTimeout) {
                    clearTimeout(requestTimeout);
                }
                shutdownSignal?.removeEventListener("abort", onShutdown);
                if (requestSignal && onRequestAbort) {
                    requestSignal.removeEventListener("abort", onRequestAbort);
                }
            }
        };
        try {
            const response = await runFetch();
            if (response.status === 421 && canForceTransportFallback("misdirected-request")) {
                return await runFetch();
            }
            return response;
        } catch (err) {
            if (requestTimeoutMs && shouldRetryTimedOutTelegramControlRequest(method) && canForceTransportFallback("request-timeout")) {
                return await runFetch();
            }
            if ((0, _networkerrors.isTelegramMisdirectedRequestError)(err) && canForceTransportFallback("misdirected-request")) {
                return await runFetch();
            }
            throw err;
        }
    };
    return (input, init)=>{
        return Promise.resolve(wrappedFetch(input, init)).catch((err)=>{
            try {
                (0, _networkerrors.tagTelegramNetworkError)(err, {
                    method: extractTelegramApiMethod(input),
                    url: readRequestUrl(input)
                });
            } catch  {
            // Tagging is best-effort; preserve the original fetch failure if the
            // error object cannot accept extra metadata.
            }
            throw err;
        });
    };
}

//# sourceMappingURL=client-fetch.js.map