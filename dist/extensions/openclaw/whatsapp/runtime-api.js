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
        return _autoreply.DEFAULT_WEB_MEDIA_BYTES;
    },
    get HEARTBEAT_PROMPT () {
        return _autoreply.HEARTBEAT_PROMPT;
    },
    get HEARTBEAT_TOKEN () {
        return _autoreply.HEARTBEAT_TOKEN;
    },
    get LocalMediaAccessError () {
        return _media.LocalMediaAccessError;
    },
    get SILENT_REPLY_TOKEN () {
        return _autoreply.SILENT_REPLY_TOKEN;
    },
    get WA_WEB_AUTH_DIR () {
        return _authstore.WA_WEB_AUTH_DIR;
    },
    get WHATSAPP_AUTH_UNSTABLE_CODE () {
        return _authstore.WHATSAPP_AUTH_UNSTABLE_CODE;
    },
    get WhatsAppAuthUnstableError () {
        return _authstore.WhatsAppAuthUnstableError;
    },
    get createWaSocket () {
        return _session.createWaSocket;
    },
    get createWhatsAppLoginTool () {
        return _agenttoolslogin.createWhatsAppLoginTool;
    },
    get extractContactContext () {
        return _inbound.extractContactContext;
    },
    get extractLocationData () {
        return _inbound.extractLocationData;
    },
    get extractMediaPlaceholder () {
        return _inbound.extractMediaPlaceholder;
    },
    get extractText () {
        return _inbound.extractText;
    },
    get formatError () {
        return _session.formatError;
    },
    get formatWhatsAppWebAuthStatusState () {
        return _authstore.formatWhatsAppWebAuthStatusState;
    },
    get getActiveWebListener () {
        return _activelistener.getActiveWebListener;
    },
    get getDefaultLocalRoots () {
        return _media.getDefaultLocalRoots;
    },
    get getStatusCode () {
        return _session.getStatusCode;
    },
    get getWebAuthAgeMs () {
        return _authstore.getWebAuthAgeMs;
    },
    get handleWhatsAppAction () {
        return _actionruntime.handleWhatsAppAction;
    },
    get hasWebCredsSync () {
        return _authstore.hasWebCredsSync;
    },
    get loadWebMedia () {
        return _media.loadWebMedia;
    },
    get loadWebMediaRaw () {
        return _media.loadWebMediaRaw;
    },
    get logWebSelfId () {
        return _authstore.logWebSelfId;
    },
    get loginWeb () {
        return _login.loginWeb;
    },
    get logoutWeb () {
        return _authstore.logoutWeb;
    },
    get monitorWebChannel () {
        return _autoreply.monitorWebChannel;
    },
    get monitorWebInbox () {
        return _inbound.monitorWebInbox;
    },
    get newConnectionId () {
        return _session.newConnectionId;
    },
    get optimizeImageToJpeg () {
        return _media.optimizeImageToJpeg;
    },
    get optimizeImageToPng () {
        return _media.optimizeImageToPng;
    },
    get pickWebChannel () {
        return _authstore.pickWebChannel;
    },
    get readCredsJsonRaw () {
        return _authstore.readCredsJsonRaw;
    },
    get readWebAuthExistsBestEffort () {
        return _authstore.readWebAuthExistsBestEffort;
    },
    get readWebAuthExistsForDecision () {
        return _authstore.readWebAuthExistsForDecision;
    },
    get readWebAuthSnapshot () {
        return _authstore.readWebAuthSnapshot;
    },
    get readWebAuthSnapshotBestEffort () {
        return _authstore.readWebAuthSnapshotBestEffort;
    },
    get readWebAuthState () {
        return _authstore.readWebAuthState;
    },
    get readWebSelfId () {
        return _authstore.readWebSelfId;
    },
    get readWebSelfIdentity () {
        return _authstore.readWebSelfIdentity;
    },
    get readWebSelfIdentityForDecision () {
        return _authstore.readWebSelfIdentityForDecision;
    },
    get resetWebInboundDedupe () {
        return _inbound.resetWebInboundDedupe;
    },
    get resolveDefaultWebAuthDir () {
        return _authstore.resolveDefaultWebAuthDir;
    },
    get resolveWebAccountId () {
        return _activelistener.resolveWebAccountId;
    },
    get resolveWebCredsBackupPath () {
        return _authstore.resolveWebCredsBackupPath;
    },
    get resolveWebCredsPath () {
        return _authstore.resolveWebCredsPath;
    },
    get restoreCredsFromBackupIfNeeded () {
        return _authstore.restoreCredsFromBackupIfNeeded;
    },
    get sendMessageWhatsApp () {
        return _send.sendMessageWhatsApp;
    },
    get sendPollWhatsApp () {
        return _send.sendPollWhatsApp;
    },
    get sendReactionWhatsApp () {
        return _send.sendReactionWhatsApp;
    },
    get sendTypingWhatsApp () {
        return _send.sendTypingWhatsApp;
    },
    get setWhatsAppRuntime () {
        return _runtime.setWhatsAppRuntime;
    },
    get startWebLoginWithQr () {
        return _loginqrruntime.startWebLoginWithQr;
    },
    get stripHeartbeatToken () {
        return _autoreply.stripHeartbeatToken;
    },
    get waitForCredsSaveQueue () {
        return _session.waitForCredsSaveQueue;
    },
    get waitForCredsSaveQueueWithTimeout () {
        return _session.waitForCredsSaveQueueWithTimeout;
    },
    get waitForWaConnection () {
        return _session.waitForWaConnection;
    },
    get waitForWebLogin () {
        return _loginqrruntime.waitForWebLogin;
    },
    get webAuthExists () {
        return _authstore.webAuthExists;
    },
    get whatsAppActionRuntime () {
        return _actionruntime.whatsAppActionRuntime;
    },
    get writeCredsJsonAtomically () {
        return _session.writeCredsJsonAtomically;
    }
});
const _activelistener = require("./src/active-listener.js");
const _actionruntime = require("./src/action-runtime.js");
const _agenttoolslogin = require("./src/agent-tools-login.js");
const _authstore = require("./src/auth-store.js");
const _autoreply = require("./src/auto-reply.js");
const _inbound = require("./src/inbound.js");
const _login = require("./src/login.js");
const _media = require("./src/media.js");
const _send = require("./src/send.js");
const _session = require("./src/session.js");
const _runtime = require("./src/runtime.js");
const _loginqrruntime = require("./login-qr-runtime.js");

//# sourceMappingURL=runtime-api.js.map