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
    get DEFAULT_HEARTBEAT_SECONDS () {
        return DEFAULT_HEARTBEAT_SECONDS;
    },
    get DEFAULT_RECONNECT_POLICY () {
        return DEFAULT_RECONNECT_POLICY;
    },
    get computeBackoff () {
        return _runtimeenv.computeBackoff;
    },
    get newConnectionId () {
        return newConnectionId;
    },
    get resolveHeartbeatSeconds () {
        return resolveHeartbeatSeconds;
    },
    get resolveReconnectPolicy () {
        return resolveReconnectPolicy;
    },
    get sleepWithAbort () {
        return _runtimeenv.sleepWithAbort;
    }
});
const _nodecrypto = require("node:crypto");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _textutilityruntime = require("../../../../common/openclaw/plugin-sdk/text-utility-runtime");
const DEFAULT_HEARTBEAT_SECONDS = 60;
const DEFAULT_RECONNECT_POLICY = {
    initialMs: 2_000,
    maxMs: 30_000,
    factor: 1.8,
    jitter: 0.25,
    maxAttempts: 12
};
function resolveHeartbeatSeconds(cfg, overrideSeconds) {
    const candidate = overrideSeconds ?? cfg.web?.heartbeatSeconds;
    if (typeof candidate === "number" && candidate > 0) {
        return candidate;
    }
    return DEFAULT_HEARTBEAT_SECONDS;
}
function resolveReconnectPolicy(cfg, overrides) {
    const reconnectOverrides = cfg.web?.reconnect ?? {};
    const overrideConfig = overrides ?? {};
    const merged = {
        ...DEFAULT_RECONNECT_POLICY,
        ...reconnectOverrides,
        ...overrideConfig
    };
    merged.initialMs = Math.max(250, merged.initialMs);
    merged.maxMs = Math.max(merged.initialMs, merged.maxMs);
    merged.factor = (0, _textutilityruntime.clamp)(merged.factor, 1.1, 10);
    merged.jitter = (0, _textutilityruntime.clamp)(merged.jitter, 0, 1);
    merged.maxAttempts = Math.max(0, Math.floor(merged.maxAttempts));
    return merged;
}
function newConnectionId() {
    return (0, _nodecrypto.randomUUID)();
}

//# sourceMappingURL=reconnect.js.map