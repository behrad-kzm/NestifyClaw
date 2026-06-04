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
    get WA_WEB_AUTH_DIR () {
        return _authstore.WA_WEB_AUTH_DIR;
    },
    get createWhatsAppLoginTool () {
        return _agenttoolslogin.createWhatsAppLoginTool;
    },
    get formatError () {
        return _sessionerrors.formatError;
    },
    get getActiveWebListener () {
        return _activelistener.getActiveWebListener;
    },
    get getStatusCode () {
        return _sessionerrors.getStatusCode;
    },
    get getWebAuthAgeMs () {
        return _authstore.getWebAuthAgeMs;
    },
    get logWebSelfId () {
        return _authstore.logWebSelfId;
    },
    get logoutWeb () {
        return _authstore.logoutWeb;
    },
    get pickWebChannel () {
        return _authstore.pickWebChannel;
    },
    get readWebSelfId () {
        return _authstore.readWebSelfId;
    },
    get resolveDefaultWebAuthDir () {
        return _authstore.resolveDefaultWebAuthDir;
    },
    get webAuthExists () {
        return _authstore.webAuthExists;
    }
});
const _activelistener = require("./src/active-listener.js");
const _authstore = require("./src/auth-store.js");
const _agenttoolslogin = require("./src/agent-tools-login.js");
const _sessionerrors = require("./src/session-errors.js");

//# sourceMappingURL=light-runtime-api.js.map