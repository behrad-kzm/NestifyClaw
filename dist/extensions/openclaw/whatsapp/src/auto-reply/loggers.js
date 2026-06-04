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
    get whatsappHeartbeatLog () {
        return whatsappHeartbeatLog;
    },
    get whatsappInboundLog () {
        return whatsappInboundLog;
    },
    get whatsappLog () {
        return whatsappLog;
    },
    get whatsappOutboundLog () {
        return whatsappOutboundLog;
    }
});
const _runtimeenv = require("../../../../../common/openclaw/plugin-sdk/runtime-env");
const whatsappLog = (0, _runtimeenv.createSubsystemLogger)("gateway/channels/whatsapp");
const whatsappInboundLog = whatsappLog.child("inbound");
const whatsappOutboundLog = whatsappLog.child("outbound");
const whatsappHeartbeatLog = whatsappLog.child("heartbeat");

//# sourceMappingURL=loggers.js.map