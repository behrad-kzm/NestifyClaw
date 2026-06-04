"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "whatsappSetupPlugin", {
    enumerable: true,
    get: function() {
        return whatsappSetupPlugin;
    }
});
const _groupintro = require("./group-intro.js");
const _grouppolicy = require("./group-policy.js");
const _setupcore = require("./setup-core.js");
const _shared = require("./shared.js");
const _statemigrations = require("./state-migrations.js");
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
async function isWhatsAppAuthConfigured(account) {
    const { readWebAuthState } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./auth-store.js")));
    return await readWebAuthState(account.authDir) === "linked";
}
const whatsappSetupPlugin = {
    ...(0, _shared.createWhatsAppPluginBase)({
        groups: {
            resolveRequireMention: _grouppolicy.resolveWhatsAppGroupRequireMention,
            resolveToolPolicy: _grouppolicy.resolveWhatsAppGroupToolPolicy,
            resolveGroupIntroHint: _groupintro.resolveWhatsAppGroupIntroHint
        },
        setupWizard: _shared.whatsappSetupWizardProxy,
        setup: _setupcore.whatsappSetupAdapter,
        isConfigured: isWhatsAppAuthConfigured
    }),
    lifecycle: {
        detectLegacyStateMigrations: ({ oauthDir })=>(0, _statemigrations.detectWhatsAppLegacyStateMigrations)({
                oauthDir
            })
    }
};

//# sourceMappingURL=channel.setup.js.map