"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createTelegramWebhookStatusPublisher", {
    enumerable: true,
    get: function() {
        return createTelegramWebhookStatusPublisher;
    }
});
const _gatewayruntime = require("../../../../common/openclaw/plugin-sdk/gateway-runtime");
function createTelegramWebhookStatusPublisher(setStatus) {
    return {
        noteWebhookStart () {
            setStatus?.({
                mode: "webhook",
                connected: false,
                lastConnectedAt: null,
                lastEventAt: null,
                lastTransportActivityAt: null
            });
        },
        noteWebhookAdvertised (at = Date.now()) {
            setStatus?.({
                ...(0, _gatewayruntime.createConnectedChannelStatusPatch)(at),
                mode: "webhook",
                lastError: null
            });
        },
        noteWebhookUpdateReceived (at = Date.now()) {
            setStatus?.({
                ...(0, _gatewayruntime.createConnectedChannelStatusPatch)(at),
                mode: "webhook",
                lastError: null
            });
        },
        noteWebhookRegistrationFailure (error) {
            setStatus?.({
                mode: "webhook",
                connected: false,
                lastError: error
            });
        },
        noteWebhookStop () {
            setStatus?.({
                mode: "webhook",
                connected: false
            });
        }
    };
}

//# sourceMappingURL=webhook-status.js.map