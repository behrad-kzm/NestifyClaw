"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "whatsappPlugin", {
    enumerable: true,
    get: function() {
        return whatsappPlugin;
    }
});
const _accountid = require("../../../../common/openclaw/plugin-sdk/account-id");
const _allowlistconfigedit = require("../../../../common/openclaw/plugin-sdk/allowlist-config-edit");
const _channelcore = require("../../../../common/openclaw/plugin-sdk/channel-core");
const _lazyruntime = require("../../../../common/openclaw/plugin-sdk/lazy-runtime");
const _statushelpers = require("../../../../common/openclaw/plugin-sdk/status-helpers");
const _accounts = require("./accounts.js");
const _agenttoolslogin = require("./agent-tools-login.js");
const _approvalnative = require("./approval-native.js");
const _channelactions = require("./channel-actions.js");
const _channeloutbound = require("./channel-outbound.js");
const _commandpolicy = require("./command-policy.js");
const _configaccessors = require("./config-accessors.js");
const _groupintro = require("./group-intro.js");
const _grouppolicy = require("./group-policy.js");
const _heartbeat = require("./heartbeat.js");
const _normalize = require("./normalize.js");
const _runtime = require("./runtime.js");
const _send = require("./send.js");
const _sessionroute = require("./session-route.js");
const _setupcore = require("./setup-core.js");
const _shared = require("./shared.js");
const _statemigrations = require("./state-migrations.js");
const _statusissues = require("./status-issues.js");
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
const loadWhatsAppDirectoryConfig = (0, _lazyruntime.createLazyRuntimeModule)(()=>Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./directory-config.js"))));
const loadWhatsAppChannelReactAction = (0, _lazyruntime.createLazyRuntimeModule)(()=>Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./channel-react-action.js"))));
function resolveWhatsAppTargetInfo(raw) {
    const normalized = (0, _normalize.normalizeWhatsAppTarget)(raw);
    if (!normalized) {
        return null;
    }
    return {
        to: normalized,
        chatType: (0, _normalize.isWhatsAppGroupJid)(normalized) ? "group" : (0, _normalize.isWhatsAppNewsletterJid)(normalized) ? "channel" : "direct"
    };
}
const whatsappPlugin = (0, _channelcore.createChatChannelPlugin)({
    pairing: {
        idLabel: "whatsappSenderId",
        normalizeAllowEntry: (entry)=>(0, _normalize.normalizeWhatsAppAllowFromEntry)(entry) ?? ""
    },
    outbound: _channeloutbound.whatsappChannelOutbound,
    threading: {
        scopedAccountReplyToMode: {
            resolveAccount: (cfg, accountId)=>(0, _accounts.resolveWhatsAppAccount)({
                    cfg,
                    accountId
                }),
            resolveReplyToMode: (account)=>account.replyToMode
        }
    },
    base: {
        ...(0, _shared.createWhatsAppPluginBase)({
            groups: {
                resolveRequireMention: _grouppolicy.resolveWhatsAppGroupRequireMention,
                resolveToolPolicy: _grouppolicy.resolveWhatsAppGroupToolPolicy,
                resolveGroupIntroHint: _groupintro.resolveWhatsAppGroupIntroHint
            },
            setupWizard: _shared.whatsappSetupWizardProxy,
            setup: _setupcore.whatsappSetupAdapter,
            isConfigured: async (account)=>{
                const channelRuntime = await (0, _shared.loadWhatsAppChannelRuntime)();
                return await channelRuntime.readWebAuthState(account.authDir) === "linked";
            }
        }),
        agentTools: ()=>[
                (0, _agenttoolslogin.createWhatsAppLoginTool)()
            ],
        allowlist: (0, _allowlistconfigedit.buildDmGroupAccountAllowlistAdapter)({
            channelId: "whatsapp",
            resolveAccount: _accounts.resolveWhatsAppAccount,
            normalize: ({ values })=>(0, _configaccessors.formatWhatsAppConfigAllowFromEntries)(values),
            resolveDmAllowFrom: (account)=>account.allowFrom,
            resolveGroupAllowFrom: (account)=>account.groupAllowFrom,
            resolveDmPolicy: (account)=>account.dmPolicy,
            resolveGroupPolicy: (account)=>account.groupPolicy
        }),
        mentions: {
            stripRegexes: ({ ctx })=>(0, _groupintro.resolveWhatsAppMentionStripRegexes)(ctx)
        },
        commands: _commandpolicy.whatsappCommandPolicy,
        agentPrompt: {
            reactionGuidance: ({ cfg, accountId })=>{
                const level = (0, _channelactions.resolveWhatsAppAgentReactionGuidance)({
                    cfg,
                    accountId: accountId ?? undefined
                });
                return level ? {
                    level,
                    channelLabel: "WhatsApp"
                } : undefined;
            }
        },
        messaging: {
            targetPrefixes: [
                "whatsapp"
            ],
            normalizeTarget: _normalize.normalizeWhatsAppMessagingTarget,
            resolveOutboundSessionRoute: (params)=>(0, _sessionroute.resolveWhatsAppOutboundSessionRoute)(params),
            inferTargetChatType: ({ to })=>resolveWhatsAppTargetInfo(to)?.chatType,
            targetResolver: {
                looksLikeId: _normalize.looksLikeWhatsAppTargetId,
                hint: "<E.164|group JID|newsletter JID>"
            }
        },
        message: _channeloutbound.whatsappMessageAdapter,
        directory: {
            self: async ({ cfg, accountId })=>{
                const account = (0, _accounts.resolveWhatsAppAccount)({
                    cfg,
                    accountId
                });
                const { e164, jid } = (await (0, _shared.loadWhatsAppChannelRuntime)()).readWebSelfId(account.authDir);
                const id = e164 ?? jid;
                if (!id) {
                    return null;
                }
                return {
                    kind: "user",
                    id,
                    name: account.name,
                    raw: {
                        e164,
                        jid
                    }
                };
            },
            listPeers: async (params)=>(await loadWhatsAppDirectoryConfig()).listWhatsAppDirectoryPeersFromConfig(params),
            listGroups: async (params)=>(await loadWhatsAppDirectoryConfig()).listWhatsAppDirectoryGroupsFromConfig(params)
        },
        actions: {
            describeMessageTool: ({ cfg, accountId })=>(0, _channelactions.describeWhatsAppMessageActions)({
                    cfg,
                    accountId
                }),
            supportsAction: ({ action })=>action === "react" || action === "upload-file",
            resolveExecutionMode: ({ action })=>action === "react" || action === "upload-file" ? "gateway" : "local",
            handleAction: async ({ action, params, cfg, accountId, requesterSenderId, mediaAccess, mediaLocalRoots, mediaReadFile, toolContext })=>await (await loadWhatsAppChannelReactAction()).handleWhatsAppMessageAction({
                    action,
                    params,
                    cfg,
                    accountId,
                    requesterSenderId,
                    mediaAccess,
                    mediaLocalRoots,
                    mediaReadFile,
                    toolContext
                })
        },
        approvalCapability: _approvalnative.whatsappApprovalCapability,
        auth: {
            login: async ({ cfg, accountId, runtime, verbose })=>{
                const resolvedAccountId = accountId?.trim() || whatsappPlugin.config.defaultAccountId?.(cfg) || _accountid.DEFAULT_ACCOUNT_ID;
                await (await (0, _shared.loadWhatsAppChannelRuntime)()).loginWeb(Boolean(verbose), undefined, runtime, resolvedAccountId);
            }
        },
        lifecycle: {
            detectLegacyStateMigrations: ({ oauthDir })=>(0, _statemigrations.detectWhatsAppLegacyStateMigrations)({
                    oauthDir
                })
        },
        heartbeat: {
            checkReady: async ({ cfg, accountId, deps })=>await (0, _heartbeat.checkWhatsAppHeartbeatReady)({
                    cfg,
                    accountId: accountId ?? undefined,
                    deps
                }),
            sendTyping: async ({ cfg, to, accountId })=>{
                await (0, _send.sendTypingWhatsApp)(to, {
                    cfg,
                    ...accountId ? {
                        accountId
                    } : {}
                });
            }
        },
        status: (0, _statushelpers.createAsyncComputedAccountStatusAdapter)({
            defaultRuntime: (0, _statushelpers.createDefaultChannelRuntimeState)(_accountid.DEFAULT_ACCOUNT_ID, {
                connected: false,
                reconnectAttempts: 0,
                lastConnectedAt: null,
                lastDisconnect: null,
                lastInboundAt: null,
                lastMessageAt: null,
                lastEventAt: null,
                healthState: "stopped"
            }),
            collectStatusIssues: _statusissues.collectWhatsAppStatusIssues,
            buildChannelSummary: async ({ account, snapshot })=>{
                const channelRuntime = await (0, _shared.loadWhatsAppChannelRuntime)();
                const authDir = account.authDir;
                const auth = authDir ? await channelRuntime.readWebAuthSnapshot(authDir) : {
                    state: "not-linked",
                    authAgeMs: null,
                    selfId: {
                        e164: null,
                        jid: null,
                        lid: null
                    }
                };
                const linked = typeof snapshot.linked === "boolean" ? snapshot.linked : auth.state === "unstable" ? undefined : auth.state === "linked";
                const summaryAuthState = auth.state === "unstable" ? auth.state : linked === true ? "linked" : linked === false ? "not-linked" : undefined;
                const statusState = summaryAuthState === undefined ? undefined : summaryAuthState;
                const configured = auth.state === "unstable" ? typeof snapshot.configured === "boolean" ? snapshot.configured : true : typeof linked === "boolean" ? linked : auth.state === "linked";
                const authAgeMs = typeof linked === "boolean" && linked ? auth.authAgeMs : null;
                const self = typeof linked === "boolean" && linked ? auth.selfId : {
                    e164: null,
                    jid: null,
                    lid: null
                };
                return {
                    configured,
                    ...statusState ? {
                        statusState
                    } : {},
                    ...typeof linked === "boolean" ? {
                        linked
                    } : {},
                    authAgeMs,
                    self,
                    running: snapshot.running ?? false,
                    connected: snapshot.connected ?? false,
                    lastConnectedAt: snapshot.lastConnectedAt ?? null,
                    lastDisconnect: snapshot.lastDisconnect ?? null,
                    reconnectAttempts: snapshot.reconnectAttempts,
                    lastInboundAt: snapshot.lastInboundAt ?? snapshot.lastMessageAt ?? null,
                    lastMessageAt: snapshot.lastMessageAt ?? null,
                    lastEventAt: snapshot.lastEventAt ?? null,
                    lastError: snapshot.lastError ?? null,
                    healthState: snapshot.healthState ?? undefined
                };
            },
            resolveAccountSnapshot: async ({ account, runtime })=>{
                const channelRuntime = await (0, _shared.loadWhatsAppChannelRuntime)();
                const authState = await channelRuntime.readWebAuthState(account.authDir);
                return {
                    accountId: account.accountId,
                    name: account.name,
                    enabled: account.enabled,
                    configured: true,
                    extra: {
                        statusState: authState,
                        ...authState === "linked" ? {
                            linked: true
                        } : authState === "not-linked" ? {
                            linked: false
                        } : {},
                        connected: runtime?.connected ?? false,
                        reconnectAttempts: runtime?.reconnectAttempts,
                        lastConnectedAt: runtime?.lastConnectedAt ?? null,
                        lastDisconnect: runtime?.lastDisconnect ?? null,
                        lastInboundAt: runtime?.lastInboundAt ?? runtime?.lastMessageAt ?? null,
                        lastMessageAt: runtime?.lastMessageAt ?? null,
                        lastEventAt: runtime?.lastEventAt ?? null,
                        healthState: runtime?.healthState ?? undefined,
                        dmPolicy: account.dmPolicy,
                        allowFrom: account.allowFrom
                    }
                };
            },
            resolveAccountState: ({ configured })=>configured ? "linked" : "not linked",
            logSelfId: ({ account, runtime, includeChannelPrefix })=>{
                void (0, _shared.loadWhatsAppChannelRuntime)().then((runtimeExports)=>runtimeExports.logWebSelfId(account.authDir, runtime, includeChannelPrefix));
            }
        }),
        gateway: {
            startAccount: async (ctx)=>{
                const account = ctx.account;
                const { e164, jid } = (await (0, _shared.loadWhatsAppChannelRuntime)()).readWebSelfId(account.authDir);
                const identity = e164 ? e164 : jid ? `jid ${jid}` : "unknown";
                ctx.log?.info(`[${account.accountId}] starting provider (${identity})`);
                return (await (0, _shared.loadWhatsAppChannelRuntime)()).monitorWebChannel((0, _runtime.getWhatsAppRuntime)().logging.shouldLogVerbose(), undefined, true, undefined, ctx.runtime, ctx.abortSignal, {
                    statusSink: (next)=>ctx.setStatus({
                            accountId: ctx.accountId,
                            ...next
                        }),
                    accountId: account.accountId,
                    channelRuntime: ctx.channelRuntime
                });
            },
            loginWithQrStart: async ({ accountId, force, timeoutMs, verbose })=>await (await (0, _shared.loadWhatsAppChannelRuntime)()).startWebLoginWithQr({
                    accountId,
                    force,
                    timeoutMs,
                    verbose
                }),
            loginWithQrWait: async ({ accountId, timeoutMs, currentQrDataUrl })=>await (await (0, _shared.loadWhatsAppChannelRuntime)()).waitForWebLogin({
                    accountId,
                    timeoutMs,
                    currentQrDataUrl
                }),
            logoutAccount: async ({ account, runtime })=>{
                const cleared = await (await (0, _shared.loadWhatsAppChannelRuntime)()).logoutWeb({
                    authDir: account.authDir,
                    isLegacyAuthDir: account.isLegacyAuthDir,
                    runtime
                });
                return {
                    cleared,
                    loggedOut: cleared
                };
            }
        }
    }
});

//# sourceMappingURL=channel.js.map