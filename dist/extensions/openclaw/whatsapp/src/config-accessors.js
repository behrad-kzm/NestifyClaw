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
    get formatWhatsAppConfigAllowFromEntries () {
        return formatWhatsAppConfigAllowFromEntries;
    },
    get resolveWhatsAppConfigAllowFrom () {
        return resolveWhatsAppConfigAllowFrom;
    },
    get resolveWhatsAppConfigDefaultTo () {
        return resolveWhatsAppConfigDefaultTo;
    }
});
const _accounts = require("./accounts.js");
const _normalizetarget = require("./normalize-target.js");
function resolveWhatsAppConfigAllowFrom(params) {
    return [
        ...(0, _accounts.resolveWhatsAppAccount)(params).allowFrom ?? []
    ];
}
function formatWhatsAppConfigAllowFromEntries(allowFrom) {
    return (0, _normalizetarget.normalizeWhatsAppAllowFromEntries)(allowFrom);
}
function resolveWhatsAppConfigDefaultTo(params) {
    const defaultTo = (0, _accounts.resolveWhatsAppAccount)(params).defaultTo?.trim();
    return defaultTo || undefined;
}

//# sourceMappingURL=config-accessors.js.map