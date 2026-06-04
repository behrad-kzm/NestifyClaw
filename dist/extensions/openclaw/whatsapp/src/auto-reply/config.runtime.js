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
    get evaluateSessionFreshness () {
        return _sessionstoreruntime.evaluateSessionFreshness;
    },
    get getRuntimeConfig () {
        return _runtimeconfigsnapshot.getRuntimeConfig;
    },
    get getRuntimeConfigSourceSnapshot () {
        return _runtimeconfigsnapshot.getRuntimeConfigSourceSnapshot;
    },
    get loadSessionStore () {
        return _sessionstoreruntime.loadSessionStore;
    },
    get resolveChannelContextVisibilityMode () {
        return _contextvisibilityruntime.resolveChannelContextVisibilityMode;
    },
    get resolveChannelResetConfig () {
        return _sessionstoreruntime.resolveChannelResetConfig;
    },
    get resolveSessionKey () {
        return _sessionstoreruntime.resolveSessionKey;
    },
    get resolveSessionResetPolicy () {
        return _sessionstoreruntime.resolveSessionResetPolicy;
    },
    get resolveSessionResetType () {
        return _sessionstoreruntime.resolveSessionResetType;
    },
    get resolveStorePath () {
        return _sessionstoreruntime.resolveStorePath;
    },
    get resolveThreadFlag () {
        return _sessionstoreruntime.resolveThreadFlag;
    },
    get updateLastRoute () {
        return _sessionstoreruntime.updateLastRoute;
    }
});
const _sessionstoreruntime = require("../../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _runtimeconfigsnapshot = require("../../../../../common/openclaw/plugin-sdk/runtime-config-snapshot");
const _contextvisibilityruntime = require("../../../../../common/openclaw/plugin-sdk/context-visibility-runtime");

//# sourceMappingURL=config.runtime.js.map