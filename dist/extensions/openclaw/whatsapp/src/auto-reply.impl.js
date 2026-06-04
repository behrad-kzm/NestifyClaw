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
    get DEFAULT_WEB_MEDIA_BYTES () {
        return _constants.DEFAULT_WEB_MEDIA_BYTES;
    },
    get HEARTBEAT_PROMPT () {
        return _replyruntime.HEARTBEAT_PROMPT;
    },
    get HEARTBEAT_TOKEN () {
        return _replyruntime.HEARTBEAT_TOKEN;
    },
    get SILENT_REPLY_TOKEN () {
        return _replyruntime.SILENT_REPLY_TOKEN;
    },
    get monitorWebChannel () {
        return _monitor.monitorWebChannel;
    },
    get stripHeartbeatToken () {
        return _replyruntime.stripHeartbeatToken;
    }
});
const _replyruntime = require("../../../../common/openclaw/plugin-sdk/reply-runtime");
const _constants = require("./auto-reply/constants.js");
const _monitor = require("./auto-reply/monitor.js");

//# sourceMappingURL=auto-reply.impl.js.map