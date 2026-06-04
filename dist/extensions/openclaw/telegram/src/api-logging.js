"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "withTelegramApiErrorLogging", {
    enumerable: true,
    get: function() {
        return withTelegramApiErrorLogging;
    }
});
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _ssrfruntime = require("../../../../common/openclaw/plugin-sdk/ssrf-runtime");
const fallbackLogger = (0, _runtimeenv.createSubsystemLogger)("telegram/api");
function resolveTelegramApiLogger(runtime, logger) {
    if (logger) {
        return logger;
    }
    if (runtime?.error) {
        return runtime.error;
    }
    return (message)=>fallbackLogger.error(message);
}
async function withTelegramApiErrorLogging({ operation, fn, runtime, logger, shouldLog }) {
    try {
        return await fn();
    } catch (err) {
        if (!shouldLog || shouldLog(err)) {
            const errText = (0, _ssrfruntime.formatErrorMessage)(err);
            const log = resolveTelegramApiLogger(runtime, logger);
            log(`telegram ${operation} failed: ${errText}`);
        }
        throw err;
    }
}

//# sourceMappingURL=api-logging.js.map