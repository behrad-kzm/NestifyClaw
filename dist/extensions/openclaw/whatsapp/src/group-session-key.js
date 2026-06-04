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
    get __testing () {
        return testing;
    },
    get resolveWhatsAppGroupSessionRoute () {
        return resolveWhatsAppGroupSessionRoute;
    },
    get resolveWhatsAppLegacyGroupSessionKey () {
        return resolveWhatsAppLegacyGroupSessionKey;
    },
    get testing () {
        return testing;
    }
});
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
function resolveWhatsAppGroupAccountThreadId(accountId) {
    return `whatsapp-account-${(0, _routing.normalizeAccountId)(accountId)}`;
}
function resolveWhatsAppLegacyGroupSessionKey(params) {
    const accountId = (0, _routing.normalizeAccountId)(params.accountId);
    if (!accountId || accountId === _routing.DEFAULT_ACCOUNT_ID || !params.sessionKey.includes(":group:")) {
        return null;
    }
    const suffix = `:thread:${resolveWhatsAppGroupAccountThreadId(accountId)}`;
    return params.sessionKey.endsWith(suffix) ? params.sessionKey.slice(0, -suffix.length) : null;
}
function resolveWhatsAppGroupSessionRoute(route) {
    if (route.accountId === _routing.DEFAULT_ACCOUNT_ID || !route.sessionKey.includes(":group:")) {
        return route;
    }
    const scopedSession = (0, _routing.resolveThreadSessionKeys)({
        baseSessionKey: route.sessionKey,
        threadId: resolveWhatsAppGroupAccountThreadId(route.accountId)
    });
    return {
        ...route,
        sessionKey: scopedSession.sessionKey
    };
}
const testing = {
    resolveWhatsAppGroupAccountThreadId,
    resolveWhatsAppLegacyGroupSessionKey
};

//# sourceMappingURL=group-session-key.js.map