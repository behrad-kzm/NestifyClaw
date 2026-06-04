"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "checkWhatsAppHeartbeatReady", {
    enumerable: true,
    get: function() {
        return checkWhatsAppHeartbeatReady;
    }
});
const _accounts = require("./accounts.js");
const _authstore = require("./auth-store.js");
const _shared = require("./shared.js");
async function checkWhatsAppHeartbeatReady(params) {
    if (params.cfg.web?.enabled === false) {
        return {
            ok: false,
            reason: "whatsapp-disabled"
        };
    }
    const account = (0, _accounts.resolveWhatsAppAccount)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    const authState = await (params.deps?.readWebAuthExistsForDecision ?? _authstore.readWebAuthExistsForDecision)(account.authDir);
    if (authState.outcome === "unstable") {
        return {
            ok: false,
            reason: _authstore.WHATSAPP_AUTH_UNSTABLE_CODE
        };
    }
    if (!authState.exists) {
        return {
            ok: false,
            reason: "whatsapp-not-linked"
        };
    }
    const listenerActive = params.deps?.hasActiveWebListener ? params.deps.hasActiveWebListener(account.accountId) : Boolean((await (0, _shared.loadWhatsAppChannelRuntime)()).getActiveWebListener(account.accountId));
    if (!listenerActive) {
        return {
            ok: false,
            reason: "whatsapp-not-running"
        };
    }
    return {
        ok: true,
        reason: "ok"
    };
}

//# sourceMappingURL=heartbeat.js.map