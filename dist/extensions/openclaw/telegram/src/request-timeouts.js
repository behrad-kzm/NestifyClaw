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
    get TELEGRAM_GET_UPDATES_REQUEST_TIMEOUT_MS () {
        return TELEGRAM_GET_UPDATES_REQUEST_TIMEOUT_MS;
    },
    get resolveTelegramLongPollTimeoutSeconds () {
        return resolveTelegramLongPollTimeoutSeconds;
    },
    get resolveTelegramRequestTimeoutMs () {
        return resolveTelegramRequestTimeoutMs;
    },
    get resolveTelegramStartupProbeTimeoutMs () {
        return resolveTelegramStartupProbeTimeoutMs;
    }
});
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const TELEGRAM_GET_UPDATES_REQUEST_TIMEOUT_MS = 45_000;
const TELEGRAM_OUTBOUND_TEXT_REQUEST_TIMEOUT_MS = 60_000;
const TELEGRAM_DEFAULT_LONG_POLL_TIMEOUT_SECONDS = 30;
const TELEGRAM_LONG_POLL_ABORT_MARGIN_SECONDS = 5;
const TELEGRAM_REQUEST_TIMEOUTS_MS = {
    // Bound startup/control-plane calls so the gateway cannot report Telegram as
    // healthy while provider startup is still hung on Bot API setup.
    deletemycommands: 15_000,
    deletewebhook: 15_000,
    deletemessage: 15_000,
    editforumtopic: 15_000,
    editmessagetext: 15_000,
    getchat: 15_000,
    getfile: 30_000,
    getme: 15_000,
    getupdates: TELEGRAM_GET_UPDATES_REQUEST_TIMEOUT_MS,
    pinchatmessage: 15_000,
    sendanimation: 30_000,
    sendaudio: 30_000,
    sendchataction: TELEGRAM_OUTBOUND_TEXT_REQUEST_TIMEOUT_MS,
    senddocument: 30_000,
    sendmessage: TELEGRAM_OUTBOUND_TEXT_REQUEST_TIMEOUT_MS,
    sendmessagedraft: TELEGRAM_OUTBOUND_TEXT_REQUEST_TIMEOUT_MS,
    sendphoto: 30_000,
    sendvideo: 30_000,
    sendvoice: 30_000,
    setmessagereaction: 10_000,
    setmycommands: 15_000,
    setwebhook: 15_000
};
function resolveConfiguredTelegramRequestTimeoutMs(timeoutSeconds) {
    if (typeof timeoutSeconds !== "number" || !Number.isFinite(timeoutSeconds)) {
        return undefined;
    }
    return (0, _numberruntime.finiteSecondsToTimerSafeMilliseconds)(Math.max(1, timeoutSeconds), {
        floorSeconds: true
    }) ?? _numberruntime.MAX_TIMER_TIMEOUT_MS;
}
function resolveTelegramRequestTimeoutMs(method, timeoutSeconds) {
    if (!method) {
        return undefined;
    }
    const baseTimeoutMs = TELEGRAM_REQUEST_TIMEOUTS_MS[method];
    if (baseTimeoutMs === undefined || method === "getupdates") {
        return baseTimeoutMs;
    }
    return Math.max(baseTimeoutMs, resolveConfiguredTelegramRequestTimeoutMs(timeoutSeconds) ?? 0);
}
function resolveTelegramLongPollTimeoutSeconds(timeoutSeconds) {
    const maxLongPollTimeoutSeconds = Math.max(1, Math.floor(TELEGRAM_GET_UPDATES_REQUEST_TIMEOUT_MS / 1000) - TELEGRAM_LONG_POLL_ABORT_MARGIN_SECONDS);
    const configuredTimeoutSeconds = typeof timeoutSeconds === "number" && Number.isFinite(timeoutSeconds) ? Math.max(1, Math.floor(timeoutSeconds)) : TELEGRAM_DEFAULT_LONG_POLL_TIMEOUT_SECONDS;
    return Math.min(configuredTimeoutSeconds, maxLongPollTimeoutSeconds);
}
function resolveTelegramStartupProbeTimeoutMs(timeoutSeconds) {
    const getMeTimeoutMs = resolveTelegramRequestTimeoutMs("getme") ?? 15_000;
    if (typeof timeoutSeconds !== "number" || !Number.isFinite(timeoutSeconds)) {
        return getMeTimeoutMs;
    }
    const configuredTimeoutMs = resolveConfiguredTelegramRequestTimeoutMs(timeoutSeconds) ?? 1_000;
    return Math.max(getMeTimeoutMs, configuredTimeoutMs);
}

//# sourceMappingURL=request-timeouts.js.map