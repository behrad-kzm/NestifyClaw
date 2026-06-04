"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "whatsappSetupWizard", {
    enumerable: true,
    get: function() {
        return whatsappSetupWizard;
    }
});
const _setup = require("../../../../common/openclaw/plugin-sdk/setup");
const _accounts = require("./accounts.js");
const _authstore = require("./auth-store.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const t = (0, _setup.createSetupTranslator)();
const channel = "whatsapp";
async function readWhatsAppSetupLinkState(cfg, accountId) {
    const { authDir } = (0, _accounts.resolveWhatsAppAuthDir)({
        cfg,
        accountId
    });
    return await (0, _authstore.readWebAuthState)(authDir);
}
const whatsappSetupWizard = {
    channel,
    status: {
        configuredLabel: t("wizard.channels.statusLinked"),
        unconfiguredLabel: t("wizard.channels.statusNotLinked"),
        configuredHint: t("wizard.channels.statusLinked"),
        unconfiguredHint: t("wizard.channels.statusNotLinked"),
        configuredScore: 5,
        unconfiguredScore: 4,
        resolveConfigured: async ({ cfg, accountId })=>{
            for (const resolvedAccountId of accountId ? [
                accountId
            ] : (0, _accounts.listWhatsAppAccountIds)(cfg)){
                if (await readWhatsAppSetupLinkState(cfg, resolvedAccountId) === "linked") {
                    return true;
                }
            }
            return false;
        },
        resolveStatusLines: async ({ cfg, accountId, configured })=>{
            const linkedAccountId = (await Promise.all((accountId ? [
                accountId
            ] : (0, _accounts.listWhatsAppAccountIds)(cfg)).map(async (resolvedAccountId)=>({
                    accountId: resolvedAccountId,
                    state: await readWhatsAppSetupLinkState(cfg, resolvedAccountId)
                })))).find((entry)=>entry.state === "linked" || entry.state === "unstable");
            const labelAccountId = accountId ?? linkedAccountId?.accountId;
            const label = labelAccountId ? `WhatsApp (${labelAccountId === _setup.DEFAULT_ACCOUNT_ID ? "default" : labelAccountId})` : "WhatsApp";
            const stateLabel = configured ? (0, _authstore.formatWhatsAppWebAuthStatusState)("linked") : (0, _authstore.formatWhatsAppWebAuthStatusState)(linkedAccountId?.state ?? "not-linked");
            return [
                `${label}: ${stateLabel}`
            ];
        }
    },
    resolveShouldPromptAccountIds: ({ shouldPromptAccountIds })=>shouldPromptAccountIds,
    credentials: [],
    finalize: async (params)=>await (await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./setup-finalize.js")))).finalizeWhatsAppSetup(params),
    disable: (cfg)=>(0, _setup.setSetupChannelEnabled)(cfg, channel, false),
    onAccountRecorded: (accountId, options)=>{
        options?.onAccountId?.(channel, accountId);
    }
};

//# sourceMappingURL=setup-surface.js.map