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
    get resetTelegramThreadBindingsForTests () {
        return _threadbindings.resetTelegramThreadBindingsForTests;
    },
    get sendMessageTelegram () {
        return _send.sendMessageTelegram;
    },
    get sendPollTelegram () {
        return _send.sendPollTelegram;
    }
});
const _send = require("./src/send.js");
const _threadbindings = require("./src/thread-bindings.js");

//# sourceMappingURL=test-api.js.map