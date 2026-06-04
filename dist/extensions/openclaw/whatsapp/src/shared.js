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
    get createWhatsAppPluginBase () {
        return createWhatsAppPluginBase;
    },
    get loadWhatsAppChannelRuntime () {
        return loadWhatsAppChannelRuntime;
    },
    get whatsappSetupWizardProxy () {
        return whatsappSetupWizardProxy;
    }
});
const _accounthelpers = require("../../../../common/openclaw/plugin-sdk/account-helpers");
const _accountresolution = require("../../../../common/openclaw/plugin-sdk/account-resolution");
const _channelconfighelpers = require("../../../../common/openclaw/plugin-sdk/channel-config-helpers");
const _channelpolicy = require("../../../../common/openclaw/plugin-sdk/channel-policy");
const _core = require("../../../../common/openclaw/plugin-sdk/core");
const _setupruntime = require("../../../../common/openclaw/plugin-sdk/setup-runtime");
const _accounts = require("./accounts.js");
const _configaccessors = require("./config-accessors.js");
const _configschema = require("./config-schema.js");
const _doctor = require("./doctor.js");
const _groupconfigpath = require("./group-config-path.js");
const _groupsessioncontract = require("./group-session-contract.js");
const _securitycontract = require("./security-contract.js");
const _securityfix = require("./security-fix.js");
const _sessioncontract = require("./session-contract.js");
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
const WHATSAPP_CHANNEL = "whatsapp";
async function loadWhatsAppChannelRuntime() {
    return await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./channel.runtime.js")));
}
async function loadWhatsAppSetupSurface() {
    return await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./setup-surface.js")));
}
const whatsappSetupWizardProxy = createWhatsAppSetupWizardProxy(async ()=>(await loadWhatsAppSetupSurface()).whatsappSetupWizard);
const whatsappConfigAdapter = (0, _channelconfighelpers.createScopedChannelConfigAdapter)({
    sectionKey: WHATSAPP_CHANNEL,
    listAccountIds: _accounts.listWhatsAppAccountIds,
    resolveAccount: (0, _channelconfighelpers.adaptScopedAccountAccessor)(_accounts.resolveWhatsAppAccount),
    defaultAccountId: _accounts.resolveDefaultWhatsAppAccountId,
    clearBaseFields: [],
    allowTopLevel: false,
    resolveAllowFrom: (account)=>account.allowFrom,
    formatAllowFrom: (allowFrom)=>(0, _configaccessors.formatWhatsAppConfigAllowFromEntries)(allowFrom),
    resolveDefaultTo: (account)=>account.defaultTo
});
const whatsappResolveDmPolicy = (0, _channelconfighelpers.createScopedDmSecurityResolver)({
    channelKey: WHATSAPP_CHANNEL,
    resolvePolicy: (account)=>account.dmPolicy,
    resolveAllowFrom: (account)=>account.allowFrom,
    policyPathSuffix: "dmPolicy",
    normalizeEntry: (raw)=>(0, _accountresolution.normalizeE164)(raw),
    inheritSharedDefaultsFromDefaultAccount: true
});
function createWhatsAppSetupWizardProxy(loadWizard) {
    return (0, _setupruntime.createDelegatedSetupWizardProxy)({
        channel: WHATSAPP_CHANNEL,
        loadWizard,
        status: {
            configuredLabel: "linked",
            unconfiguredLabel: "not linked",
            configuredHint: "linked",
            unconfiguredHint: "not linked",
            configuredScore: 5,
            unconfiguredScore: 4
        },
        resolveShouldPromptAccountIds: (params)=>params.shouldPromptAccountIds,
        credentials: [],
        delegateFinalize: true,
        disable: (cfg)=>({
                ...cfg,
                channels: {
                    ...cfg.channels,
                    whatsapp: {
                        ...cfg.channels?.whatsapp,
                        enabled: false
                    }
                }
            }),
        onAccountRecorded: (accountId, options)=>{
            options?.onAccountId?.(WHATSAPP_CHANNEL, accountId);
        }
    });
}
function createWhatsAppPluginBase(params) {
    const collectWhatsAppSecurityWarnings = (0, _channelpolicy.createAllowlistProviderGroupPolicyWarningCollector)({
        providerConfigPresent: (cfg)=>cfg.channels?.whatsapp !== undefined,
        resolveGroupPolicy: ({ account })=>account.groupPolicy,
        collect: ({ account, accountId, cfg, groupPolicy })=>(0, _channelpolicy.collectOpenGroupPolicyRouteAllowlistWarnings)({
                groupPolicy,
                routeAllowlistConfigured: Boolean(account.groups) && Object.keys(account.groups ?? {}).length > 0,
                restrictSenders: {
                    surface: "WhatsApp groups",
                    openScope: "any member in allowed groups",
                    groupPolicyPath: (0, _groupconfigpath.resolveWhatsAppConfigPath)({
                        cfg,
                        accountId,
                        field: "groupPolicy"
                    }),
                    groupAllowFromPath: (0, _groupconfigpath.resolveWhatsAppConfigPath)({
                        cfg,
                        accountId,
                        field: "groupAllowFrom"
                    })
                },
                noRouteAllowlist: {
                    surface: "WhatsApp groups",
                    routeAllowlistPath: (0, _groupconfigpath.resolveWhatsAppConfigPath)({
                        cfg,
                        accountId,
                        field: "groups"
                    }),
                    routeScope: "group",
                    groupPolicyPath: (0, _groupconfigpath.resolveWhatsAppConfigPath)({
                        cfg,
                        accountId,
                        field: "groupPolicy"
                    }),
                    groupAllowFromPath: (0, _groupconfigpath.resolveWhatsAppConfigPath)({
                        cfg,
                        accountId,
                        field: "groupAllowFrom"
                    })
                }
            })
    });
    const base = (0, _core.createChannelPluginBase)({
        id: WHATSAPP_CHANNEL,
        meta: {
            ...(0, _core.getChatChannelMeta)(WHATSAPP_CHANNEL),
            showConfigured: false,
            quickstartAllowFrom: true,
            forceAccountBinding: true,
            preferSessionLookupForAnnounceTarget: true
        },
        setupWizard: params.setupWizard,
        capabilities: {
            chatTypes: [
                "direct",
                "group",
                "channel"
            ],
            polls: true,
            reactions: true,
            media: true,
            tts: {
                voice: {
                    synthesisTarget: "voice-note",
                    transcodesAudio: true
                }
            }
        },
        reload: {
            configPrefixes: [
                "web"
            ],
            noopPrefixes: [
                "channels.whatsapp"
            ]
        },
        gatewayMethodDescriptors: [
            {
                name: "web.login.start"
            },
            {
                name: "web.login.wait"
            }
        ],
        configSchema: _configschema.WhatsAppChannelConfigSchema,
        config: {
            ...whatsappConfigAdapter,
            isEnabled: (account, cfg)=>account.enabled && cfg.web?.enabled !== false,
            disabledReason: ()=>"disabled",
            isConfigured: params.isConfigured,
            hasPersistedAuthState: ({ cfg })=>(0, _accounts.hasAnyWhatsAppAuth)(cfg),
            unconfiguredReason: ()=>"not linked",
            describeAccount: (account)=>(0, _accounthelpers.describeAccountSnapshot)({
                    account,
                    configured: Boolean(account.authDir),
                    extra: {
                        linked: Boolean(account.authDir),
                        dmPolicy: account.dmPolicy,
                        allowFrom: account.allowFrom
                    }
                })
        },
        security: {
            applyConfigFixes: _securityfix.applyWhatsAppSecurityConfigFixes,
            resolveDmPolicy: whatsappResolveDmPolicy,
            collectWarnings: collectWhatsAppSecurityWarnings
        },
        doctor: _doctor.whatsappDoctor,
        setup: params.setup,
        groups: params.groups
    });
    return {
        ...base,
        setupWizard: base.setupWizard,
        capabilities: base.capabilities,
        reload: base.reload,
        gatewayMethodDescriptors: base.gatewayMethodDescriptors,
        configSchema: base.configSchema,
        config: base.config,
        messaging: {
            defaultMarkdownTableMode: "bullets",
            deriveLegacySessionChatType: _sessioncontract.deriveLegacySessionChatType,
            resolveLegacyGroupSessionKey: _groupsessioncontract.resolveLegacyGroupSessionKey,
            isLegacyGroupSessionKey: _sessioncontract.isLegacyGroupSessionKey,
            canonicalizeLegacySessionKey: (paramsLocal)=>(0, _sessioncontract.canonicalizeLegacySessionKey)({
                    key: paramsLocal.key,
                    agentId: paramsLocal.agentId
                })
        },
        secrets: {
            unsupportedSecretRefSurfacePatterns: _securitycontract.unsupportedSecretRefSurfacePatterns,
            collectUnsupportedSecretRefConfigCandidates: _securitycontract.collectUnsupportedSecretRefConfigCandidates
        },
        security: base.security,
        groups: base.groups
    };
}

//# sourceMappingURL=shared.js.map