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
    get getTelegramNetworkErrorOrigin () {
        return getTelegramNetworkErrorOrigin;
    },
    get isRecoverableTelegramNetworkError () {
        return isRecoverableTelegramNetworkError;
    },
    get isSafeToRetrySendError () {
        return isSafeToRetrySendError;
    },
    get isTelegramClientRejection () {
        return isTelegramClientRejection;
    },
    get isTelegramMisdirectedRequestError () {
        return isTelegramMisdirectedRequestError;
    },
    get isTelegramPollingNetworkError () {
        return isTelegramPollingNetworkError;
    },
    get isTelegramRateLimitError () {
        return isTelegramRateLimitError;
    },
    get isTelegramServerError () {
        return isTelegramServerError;
    },
    get tagTelegramNetworkError () {
        return tagTelegramNetworkError;
    }
});
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const TELEGRAM_NETWORK_ORIGIN = Symbol("openclaw.telegram.network-origin");
const RECOVERABLE_ERROR_CODES = new Set([
    "ECONNRESET",
    "ECONNREFUSED",
    "EPIPE",
    "ENETDOWN",
    "ETIMEDOUT",
    "ESOCKETTIMEDOUT",
    "ENETUNREACH",
    "EHOSTUNREACH",
    "ENOTFOUND",
    "EAI_AGAIN",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_HEADERS_TIMEOUT",
    "UND_ERR_BODY_TIMEOUT",
    "UND_ERR_SOCKET",
    "UND_ERR_ABORTED",
    "ECONNABORTED",
    "ERR_NETWORK"
]);
/**
 * Error codes that are safe to retry for non-idempotent send operations (e.g. sendMessage).
 *
 * These represent failures that occur *before* the request reaches Telegram's servers,
 * meaning the message was definitely not delivered and it is safe to retry.
 *
 * Contrast with RECOVERABLE_ERROR_CODES which includes codes like ECONNRESET and ETIMEDOUT
 * that can fire *after* Telegram has already received and delivered a message — retrying
 * those would cause duplicate messages.
 */ const PRE_CONNECT_ERROR_CODES = new Set([
    "ECONNREFUSED",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ENETDOWN",
    "ENETUNREACH",
    "EHOSTUNREACH"
]);
const RECOVERABLE_ERROR_NAMES = new Set([
    "AbortError",
    "TimeoutError",
    "ConnectTimeoutError",
    "HeadersTimeoutError",
    "BodyTimeoutError"
]);
const ALWAYS_RECOVERABLE_MESSAGES = new Set([
    "fetch failed",
    "typeerror: fetch failed"
]);
const GRAMMY_NETWORK_REQUEST_FAILED_AFTER_RE = /^network request(?:\s+for\s+["']?[^"']+["']?)?\s+failed\s+after\b.*[!.]?$/i;
const RECOVERABLE_MESSAGE_SNIPPETS = [
    "undici",
    "network error",
    "network request",
    "client network socket disconnected",
    "socket hang up",
    "getaddrinfo",
    "timeout",
    "timed out"
];
function collectTelegramErrorCandidates(err) {
    return (0, _errorruntime.collectErrorGraphCandidates)(err, (current)=>{
        const nested = [
            current.cause,
            current.reason
        ];
        if (Array.isArray(current.errors)) {
            nested.push(...current.errors);
        }
        if ((0, _errorruntime.readErrorName)(current) === "HttpError") {
            nested.push(current.error);
        }
        return nested;
    });
}
function normalizeCode(code) {
    return code?.trim().toUpperCase() ?? "";
}
function getErrorCode(err) {
    const direct = (0, _errorruntime.extractErrorCode)(err);
    if (direct) {
        return direct;
    }
    if (!err || typeof err !== "object") {
        return undefined;
    }
    const errno = err.errno;
    if (typeof errno === "string") {
        return errno;
    }
    if (typeof errno === "number") {
        return String(errno);
    }
    return undefined;
}
function getNumericHttpStatus(err) {
    if (!err || typeof err !== "object") {
        return undefined;
    }
    const candidate = err;
    for (const value of [
        candidate.error_code,
        candidate.status,
        candidate.statusCode
    ]){
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (/^\d+$/.test(trimmed)) {
                return (0, _numberruntime.parseStrictNonNegativeInteger)(trimmed);
            }
        }
    }
    return undefined;
}
function isTelegramMisdirectedRequestError(err) {
    for (const candidate of collectTelegramErrorCandidates(err)){
        const code = normalizeCode(getErrorCode(candidate));
        if (code === "421" || getNumericHttpStatus(candidate) === 421) {
            return true;
        }
        const message = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)((0, _errorruntime.formatErrorMessage)(candidate));
        if (/\b421\b/.test(message) && message.includes("misdirected request")) {
            return true;
        }
    }
    return false;
}
function normalizeTelegramNetworkMethod(method) {
    const trimmed = method?.trim();
    if (!trimmed) {
        return null;
    }
    return (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(trimmed);
}
function tagTelegramNetworkError(err, origin) {
    if (!err || typeof err !== "object") {
        return;
    }
    Object.defineProperty(err, TELEGRAM_NETWORK_ORIGIN, {
        value: {
            method: normalizeTelegramNetworkMethod(origin.method),
            url: typeof origin.url === "string" && origin.url.trim() ? origin.url : null
        },
        configurable: true
    });
}
function getTelegramNetworkErrorOrigin(err) {
    for (const candidate of collectTelegramErrorCandidates(err)){
        if (!candidate || typeof candidate !== "object") {
            continue;
        }
        const origin = candidate[TELEGRAM_NETWORK_ORIGIN];
        if (!origin || typeof origin !== "object") {
            continue;
        }
        const method = "method" in origin && typeof origin.method === "string" ? origin.method : null;
        const url = "url" in origin && typeof origin.url === "string" ? origin.url : null;
        return {
            method,
            url
        };
    }
    return null;
}
function isTelegramPollingNetworkError(err) {
    return getTelegramNetworkErrorOrigin(err)?.method === "getupdates";
}
function isSafeToRetrySendError(err) {
    if (!err) {
        return false;
    }
    if (isTelegramMisdirectedRequestError(err)) {
        return true;
    }
    for (const candidate of collectTelegramErrorCandidates(err)){
        const code = normalizeCode(getErrorCode(candidate));
        if (code && PRE_CONNECT_ERROR_CODES.has(code)) {
            return true;
        }
    }
    return false;
}
function hasTelegramErrorCode(err, matches) {
    for (const candidate of collectTelegramErrorCandidates(err)){
        if (!candidate || typeof candidate !== "object" || !("error_code" in candidate)) {
            continue;
        }
        const code = candidate.error_code;
        if (typeof code === "number" && matches(code)) {
            return true;
        }
    }
    return false;
}
function hasTelegramRetryAfter(err) {
    for (const candidate of collectTelegramErrorCandidates(err)){
        if (!candidate || typeof candidate !== "object") {
            continue;
        }
        const retryAfter = "parameters" in candidate && candidate.parameters && typeof candidate.parameters === "object" ? candidate.parameters.retry_after : "response" in candidate && candidate.response && typeof candidate.response === "object" && "parameters" in candidate.response ? candidate.response.parameters?.retry_after : "error" in candidate && candidate.error && typeof candidate.error === "object" && "parameters" in candidate.error ? candidate.error.parameters?.retry_after : undefined;
        if (typeof retryAfter === "number" && Number.isFinite(retryAfter)) {
            return true;
        }
    }
    return false;
}
function isTelegramServerError(err) {
    return hasTelegramErrorCode(err, (code)=>code >= 500);
}
function isTelegramRateLimitError(err) {
    return hasTelegramErrorCode(err, (code)=>code === 429) || hasTelegramRetryAfter(err) && /(?:^|\b)429\b|too many requests/i.test((0, _errorruntime.formatErrorMessage)(err));
}
function isTelegramClientRejection(err) {
    return hasTelegramErrorCode(err, (code)=>code >= 400 && code < 500);
}
function isRecoverableTelegramNetworkError(err, options = {}) {
    if (!err) {
        return false;
    }
    const allowMessageMatch = typeof options.allowMessageMatch === "boolean" ? options.allowMessageMatch : options.context !== "send";
    for (const candidate of collectTelegramErrorCandidates(err)){
        const code = normalizeCode(getErrorCode(candidate));
        if (code && RECOVERABLE_ERROR_CODES.has(code)) {
            return true;
        }
        const name = (0, _errorruntime.readErrorName)(candidate);
        if (name && RECOVERABLE_ERROR_NAMES.has(name)) {
            return true;
        }
        const message = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)((0, _errorruntime.formatErrorMessage)(candidate));
        if (message && ALWAYS_RECOVERABLE_MESSAGES.has(message)) {
            return true;
        }
        if (message && GRAMMY_NETWORK_REQUEST_FAILED_AFTER_RE.test(message)) {
            return true;
        }
        if (allowMessageMatch && message) {
            if (RECOVERABLE_MESSAGE_SNIPPETS.some((snippet)=>message.includes(snippet))) {
                return true;
            }
        }
    }
    return false;
}

//# sourceMappingURL=network-errors.js.map