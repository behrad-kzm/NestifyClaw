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
    get TelegramPollingSession () {
        return _pollingsession.TelegramPollingSession;
    },
    get deleteTelegramUpdateOffset () {
        return _updateoffsetstore.deleteTelegramUpdateOffset;
    },
    get readTelegramUpdateOffset () {
        return _updateoffsetstore.readTelegramUpdateOffset;
    },
    get writeTelegramUpdateOffset () {
        return _updateoffsetstore.writeTelegramUpdateOffset;
    }
});
const _pollingsession = require("./polling-session.js");
const _updateoffsetstore = require("./update-offset-store.js");

//# sourceMappingURL=monitor-polling.runtime.js.map