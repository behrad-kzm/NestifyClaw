"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveGroupActivationFor", {
    enumerable: true,
    get: function() {
        return resolveGroupActivationFor;
    }
});
const _routing = require("../../../../../../common/openclaw/plugin-sdk/routing");
const _sessionstoreruntime = require("../../../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _groupsessionkey = require("../../group-session-key.js");
const _inboundpolicy = require("../../inbound-policy.js");
const _configruntime = require("../config.runtime.js");
const _groupactivationruntime = require("./group-activation.runtime.js");
function hasNamedWhatsAppAccounts(cfg) {
    const accountIds = Object.keys(cfg.channels?.whatsapp?.accounts ?? {});
    return accountIds.some((accountId)=>(0, _routing.normalizeAccountId)(accountId) !== _routing.DEFAULT_ACCOUNT_ID);
}
function isActivationOnlyEntry(entry) {
    return entry?.groupActivation !== undefined && typeof entry?.sessionId !== "string" && typeof entry?.updatedAt !== "number";
}
async function resolveGroupActivationFor(params) {
    const storePath = (0, _configruntime.resolveStorePath)(params.cfg.session?.store, {
        agentId: params.agentId
    });
    const store = (0, _configruntime.loadSessionStore)(storePath);
    const legacySessionKey = (0, _groupsessionkey.resolveWhatsAppLegacyGroupSessionKey)({
        sessionKey: params.sessionKey,
        accountId: params.accountId
    });
    const legacyEntry = legacySessionKey ? store[legacySessionKey] : undefined;
    const scopedEntry = store[params.sessionKey];
    const normalizedAccountId = (0, _routing.normalizeAccountId)(params.accountId);
    const ignoreScopedActivation = normalizedAccountId === _routing.DEFAULT_ACCOUNT_ID && hasNamedWhatsAppAccounts(params.cfg) && isActivationOnlyEntry(scopedEntry);
    const activation = (ignoreScopedActivation ? undefined : scopedEntry?.groupActivation) ?? legacyEntry?.groupActivation;
    if (activation !== undefined && scopedEntry?.groupActivation === undefined) {
        await (0, _sessionstoreruntime.updateSessionStore)(storePath, (nextStore)=>{
            const nextScopedEntry = nextStore[params.sessionKey];
            if (nextScopedEntry?.groupActivation !== undefined) {
                return;
            }
            nextStore[params.sessionKey] = {
                ...nextScopedEntry,
                groupActivation: activation
            };
        });
    }
    const requireMention = (0, _inboundpolicy.resolveWhatsAppInboundPolicy)({
        cfg: params.cfg,
        accountId: params.accountId
    }).resolveConversationRequireMention(params.conversationId);
    const defaultActivation = !requireMention ? "always" : "mention";
    return (0, _groupactivationruntime.normalizeGroupActivation)(activation) ?? defaultActivation;
}

//# sourceMappingURL=group-activation.js.map