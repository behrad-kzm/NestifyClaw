"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createTelegramSendChatActionHandler", {
    enumerable: true,
    get: function() {
        return createTelegramSendChatActionHandler;
    }
});
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const BACKOFF_POLICY = {
    initialMs: 1000,
    maxMs: 300_000,
    factor: 2,
    jitter: 0.1
};
function is401Error(error) {
    if (!error) {
        return false;
    }
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    return message.includes("401") || (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(message).includes("unauthorized");
}
function createTelegramSendChatActionHandler({ sendChatActionFn, logger, maxConsecutive401 = 10, minIntervalMs = 0, now = ()=>Date.now() }) {
    let consecutive401Failures = 0;
    let suspended = false;
    const blockedUntilByKey = new Map();
    const reset = ()=>{
        consecutive401Failures = 0;
        suspended = false;
        blockedUntilByKey.clear();
    };
    const sendChatAction = async (chatId, action, threadParams)=>{
        if (suspended) {
            return;
        }
        const key = minIntervalMs > 0 ? `${String(chatId)}:${action}` : undefined;
        const attemptedAt = key ? now() : 0;
        if (key) {
            const blockedUntil = blockedUntilByKey.get(key);
            if (blockedUntil !== undefined && attemptedAt < blockedUntil) {
                return;
            }
            blockedUntilByKey.set(key, Number.POSITIVE_INFINITY);
        }
        if (consecutive401Failures > 0) {
            const backoffMs = (0, _runtimeenv.computeBackoff)(BACKOFF_POLICY, consecutive401Failures);
            logger(`sendChatAction backoff: waiting ${backoffMs}ms before retry ` + `(failure ${consecutive401Failures}/${maxConsecutive401})`);
            await (0, _runtimeenv.sleepWithAbort)(backoffMs);
        }
        try {
            await sendChatActionFn(chatId, action, threadParams);
            // Success: reset failure counter
            if (consecutive401Failures > 0) {
                logger(`sendChatAction recovered after ${consecutive401Failures} consecutive 401 failures`);
                consecutive401Failures = 0;
            }
        } catch (error) {
            if (is401Error(error)) {
                consecutive401Failures++;
                if (consecutive401Failures >= maxConsecutive401) {
                    suspended = true;
                    logger(`CRITICAL: sendChatAction suspended after ${consecutive401Failures} consecutive 401 errors. ` + `Bot token is likely invalid. Telegram may DELETE the bot if requests continue. ` + `Replace the token and restart: openclaw channels restart telegram`);
                } else {
                    logger(`sendChatAction 401 error (${consecutive401Failures}/${maxConsecutive401}). ` + `Retrying with exponential backoff.`);
                }
            }
            throw error;
        } finally{
            if (key) {
                blockedUntilByKey.set(key, attemptedAt + minIntervalMs);
            }
        }
    };
    return {
        sendChatAction,
        isSuspended: ()=>suspended,
        reset
    };
}

//# sourceMappingURL=sendchataction-401-backoff.js.map