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
    get getActiveWebListener () {
        return getActiveWebListener;
    },
    get getWebAuthAgeMs () {
        return getWebAuthAgeMs;
    },
    get logWebSelfId () {
        return logWebSelfId;
    },
    get loginWeb () {
        return loginWeb;
    },
    get logoutWeb () {
        return logoutWeb;
    },
    get monitorWebChannel () {
        return monitorWebChannel;
    },
    get readWebAuthExistsBestEffort () {
        return readWebAuthExistsBestEffort;
    },
    get readWebAuthExistsForDecision () {
        return readWebAuthExistsForDecision;
    },
    get readWebAuthSnapshot () {
        return readWebAuthSnapshot;
    },
    get readWebAuthSnapshotBestEffort () {
        return readWebAuthSnapshotBestEffort;
    },
    get readWebAuthState () {
        return readWebAuthState;
    },
    get readWebSelfId () {
        return readWebSelfId;
    },
    get startWebLoginWithQr () {
        return startWebLoginWithQr;
    },
    get waitForWebLogin () {
        return waitForWebLogin;
    },
    get webAuthExists () {
        return webAuthExists;
    },
    get whatsappSetupWizard () {
        return whatsappSetupWizard;
    }
});
const _loginqrruntime = require("../login-qr-runtime.js");
const _activelistener = require("./active-listener.js");
const _authstore = require("./auth-store.js");
const _monitor = require("./auto-reply/monitor.js");
const _login = require("./login.js");
const _setupsurface = require("./setup-surface.js");
function getActiveWebListener(...args) {
    return (0, _activelistener.getActiveWebListener)(...args);
}
function getWebAuthAgeMs(...args) {
    return (0, _authstore.getWebAuthAgeMs)(...args);
}
function logWebSelfId(...args) {
    return (0, _authstore.logWebSelfId)(...args);
}
function logoutWeb(...args) {
    return (0, _authstore.logoutWeb)(...args);
}
function readWebAuthSnapshot(...args) {
    return (0, _authstore.readWebAuthSnapshot)(...args);
}
function readWebAuthState(...args) {
    return (0, _authstore.readWebAuthState)(...args);
}
function readWebAuthExistsBestEffort(...args) {
    return (0, _authstore.readWebAuthExistsBestEffort)(...args);
}
function readWebAuthExistsForDecision(...args) {
    return (0, _authstore.readWebAuthExistsForDecision)(...args);
}
function readWebAuthSnapshotBestEffort(...args) {
    return (0, _authstore.readWebAuthSnapshotBestEffort)(...args);
}
function readWebSelfId(...args) {
    return (0, _authstore.readWebSelfId)(...args);
}
function webAuthExists(...args) {
    return (0, _authstore.webAuthExists)(...args);
}
function loginWeb(...args) {
    return (0, _login.loginWeb)(...args);
}
async function startWebLoginWithQr(...args) {
    return await (0, _loginqrruntime.startWebLoginWithQr)(...args);
}
async function waitForWebLogin(...args) {
    return await (0, _loginqrruntime.waitForWebLogin)(...args);
}
const whatsappSetupWizard = {
    ..._setupsurface.whatsappSetupWizard
};
function monitorWebChannel(...args) {
    return (0, _monitor.monitorWebChannel)(...args);
}

//# sourceMappingURL=channel.runtime.js.map