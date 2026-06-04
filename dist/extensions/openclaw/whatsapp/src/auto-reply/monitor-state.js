"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createWebChannelStatusController", {
    enumerable: true,
    get: function() {
        return createWebChannelStatusController;
    }
});
const _gatewayruntime = require("../../../../../common/openclaw/plugin-sdk/gateway-runtime");
function cloneStatus(status) {
    return {
        ...status,
        lastDisconnect: status.lastDisconnect ? {
            ...status.lastDisconnect
        } : null
    };
}
function isTerminalHealthState(healthState) {
    return healthState === "conflict" || healthState === "logged-out" || healthState === "stopped";
}
function createWebChannelStatusController(statusSink) {
    let lastDisconnectWasWatchdogRecovery = false;
    const status = {
        running: true,
        connected: false,
        reconnectAttempts: 0,
        lastConnectedAt: null,
        lastDisconnect: null,
        lastInboundAt: null,
        lastMessageAt: null,
        lastEventAt: null,
        lastError: null,
        healthState: "starting"
    };
    const emit = ()=>{
        statusSink?.(cloneStatus(status));
    };
    return {
        emit,
        snapshot: ()=>status,
        noteConnected (at = Date.now()) {
            Object.assign(status, (0, _gatewayruntime.createConnectedChannelStatusPatch)(at));
            Object.assign(status, (0, _gatewayruntime.createTransportActivityStatusPatch)(at));
            if (lastDisconnectWasWatchdogRecovery) {
                status.lastDisconnect = null;
                status.reconnectAttempts = 0;
                lastDisconnectWasWatchdogRecovery = false;
            }
            status.lastError = null;
            status.healthState = "healthy";
            emit();
        },
        noteInbound (at = Date.now()) {
            status.lastInboundAt = at;
            status.lastMessageAt = at;
            status.lastEventAt = at;
            Object.assign(status, (0, _gatewayruntime.createTransportActivityStatusPatch)(at));
            if (status.connected) {
                status.healthState = "healthy";
            }
            emit();
        },
        noteTransportActivity (at = Date.now()) {
            if (status.lastTransportActivityAt === at) {
                return;
            }
            Object.assign(status, (0, _gatewayruntime.createTransportActivityStatusPatch)(at));
            emit();
        },
        noteWatchdogStale (at = Date.now()) {
            status.lastEventAt = at;
            if (status.connected) {
                status.healthState = "stale";
            }
            emit();
        },
        noteReconnectAttempts (reconnectAttempts) {
            status.reconnectAttempts = reconnectAttempts;
            emit();
        },
        noteClose (params) {
            const at = params.at ?? Date.now();
            lastDisconnectWasWatchdogRecovery = params.watchdogRecovery === true;
            status.connected = false;
            status.lastEventAt = at;
            status.lastDisconnect = {
                at,
                status: params.statusCode,
                error: params.error,
                loggedOut: Boolean(params.loggedOut)
            };
            status.lastError = params.error ?? null;
            status.reconnectAttempts = params.reconnectAttempts;
            status.healthState = params.healthState;
            emit();
        },
        markStopped (at = Date.now()) {
            status.running = false;
            status.connected = false;
            status.lastEventAt = at;
            if (!isTerminalHealthState(status.healthState)) {
                status.healthState = "stopped";
            }
            emit();
        }
    };
}

//# sourceMappingURL=monitor-state.js.map