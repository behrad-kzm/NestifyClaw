"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "applyWhatsAppSecurityConfigFixes", {
    enumerable: true,
    get: function() {
        return applyWhatsAppSecurityConfigFixes;
    }
});
const _accountid = require("../../../../common/openclaw/plugin-sdk/account-id");
const _channelpairing = require("../../../../common/openclaw/plugin-sdk/channel-pairing");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
function applyGroupAllowFromFromStore(params) {
    const next = structuredClone(params.cfg ?? {});
    const section = next.channels?.whatsapp;
    if (!section || typeof section !== "object" || params.storeAllowFrom.length === 0) {
        return params.cfg;
    }
    let changed = false;
    const maybeApply = (prefix, holder)=>{
        if (holder.groupPolicy !== "allowlist") {
            return;
        }
        const allowFrom = Array.isArray(holder.allowFrom) ? holder.allowFrom : [];
        const groupAllowFrom = Array.isArray(holder.groupAllowFrom) ? holder.groupAllowFrom : [];
        if (allowFrom.length > 0 || groupAllowFrom.length > 0) {
            return;
        }
        holder.groupAllowFrom = params.storeAllowFrom;
        params.changes.push(`${prefix}groupAllowFrom=pairing-store`);
        changed = true;
    };
    maybeApply("channels.whatsapp.", section);
    const accounts = section.accounts;
    if (accounts && typeof accounts === "object") {
        for (const [accountId, accountValue] of Object.entries(accounts)){
            if (!accountValue || typeof accountValue !== "object") {
                continue;
            }
            maybeApply(`channels.whatsapp.accounts.${accountId}.`, accountValue);
        }
    }
    return changed ? next : params.cfg;
}
async function applyWhatsAppSecurityConfigFixes(params) {
    const fromStore = await (0, _channelpairing.readChannelAllowFromStore)("whatsapp", params.env, _accountid.DEFAULT_ACCOUNT_ID).catch(()=>[]);
    const normalized = (0, _stringcoerceruntime.normalizeUniqueStringEntries)(fromStore);
    if (normalized.length === 0) {
        return {
            config: params.cfg,
            changes: []
        };
    }
    const changes = [];
    const config = applyGroupAllowFromFromStore({
        cfg: params.cfg,
        storeAllowFrom: normalized,
        changes
    });
    return {
        config,
        changes
    };
}

//# sourceMappingURL=security-fix.js.map