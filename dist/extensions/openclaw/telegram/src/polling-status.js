"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createTelegramPollingStatusPublisher", {
    enumerable: true,
    get: function() {
        return createTelegramPollingStatusPublisher;
    }
});
const _gatewayruntime = require("../../../../common/openclaw/plugin-sdk/gateway-runtime");
function createTelegramPollingStatusPublisher(setStatus) {
    return {
        notePollingStart () {
            setStatus?.({
                mode: "polling",
                connected: false,
                lastConnectedAt: null,
                lastEventAt: null,
                lastTransportActivityAt: null
            });
        },
        notePollSuccess (at = Date.now()) {
            setStatus?.({
                ...(0, _gatewayruntime.createConnectedChannelStatusPatch)(at),
                // A successful getUpdates call proves the Telegram HTTP long-poll is alive
                // even when the response has no user-visible updates.
                ...(0, _gatewayruntime.createTransportActivityStatusPatch)(at),
                mode: "polling",
                lastError: null
            });
        },
        notePollingError (error) {
            setStatus?.({
                mode: "polling",
                connected: false,
                lastError: error
            });
        },
        notePollingStop () {
            setStatus?.({
                mode: "polling",
                connected: false
            });
        }
    };
}

//# sourceMappingURL=polling-status.js.map