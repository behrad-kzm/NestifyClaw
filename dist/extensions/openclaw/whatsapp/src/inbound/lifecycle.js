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
    get attachEmitterListener () {
        return attachEmitterListener;
    },
    get closeInboundMonitorSocket () {
        return closeInboundMonitorSocket;
    }
});
function attachEmitterListener(emitter, event, listener) {
    emitter.on(event, listener);
    return ()=>{
        if (typeof emitter.off === "function") {
            emitter.off(event, listener);
            return;
        }
        if (typeof emitter.removeListener === "function") {
            emitter.removeListener(event, listener);
        }
    };
}
function closeInboundMonitorSocket(sock) {
    if (typeof sock.end === "function") {
        sock.end(new Error("OpenClaw WhatsApp listener close"));
        return;
    }
    sock.ws?.close?.();
}

//# sourceMappingURL=lifecycle.js.map