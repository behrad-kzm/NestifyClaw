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
    get DEFAULT_WHATSAPP_SOCKET_TIMING () {
        return DEFAULT_WHATSAPP_SOCKET_TIMING;
    },
    get resolveWhatsAppSocketTiming () {
        return resolveWhatsAppSocketTiming;
    }
});
const DEFAULT_WHATSAPP_SOCKET_TIMING = {
    keepAliveIntervalMs: 25_000,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000
};
function positiveInteger(value) {
    return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}
function resolveWhatsAppSocketTiming(cfg, overrides) {
    const configured = cfg.web?.whatsapp;
    return {
        keepAliveIntervalMs: positiveInteger(overrides?.keepAliveIntervalMs) ?? positiveInteger(configured?.keepAliveIntervalMs) ?? DEFAULT_WHATSAPP_SOCKET_TIMING.keepAliveIntervalMs,
        connectTimeoutMs: positiveInteger(overrides?.connectTimeoutMs) ?? positiveInteger(configured?.connectTimeoutMs) ?? DEFAULT_WHATSAPP_SOCKET_TIMING.connectTimeoutMs,
        defaultQueryTimeoutMs: positiveInteger(overrides?.defaultQueryTimeoutMs) ?? positiveInteger(configured?.defaultQueryTimeoutMs) ?? DEFAULT_WHATSAPP_SOCKET_TIMING.defaultQueryTimeoutMs
    };
}

//# sourceMappingURL=socket-timing.js.map