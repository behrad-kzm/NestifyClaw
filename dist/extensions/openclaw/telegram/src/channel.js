"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "telegramPlugin", {
    enumerable: true,
    get: function() {
        return telegramPlugin;
    }
});
const _accountid = require("../../../../common/openclaw/plugin-sdk/account-id");
const _allowlistconfigedit = require("../../../../common/openclaw/plugin-sdk/allowlist-config-edit");
const _channelcore = require("../../../../common/openclaw/plugin-sdk/channel-core");
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _channelpairing = require("../../../../common/openclaw/plugin-sdk/channel-pairing");
const _channelstatus = require("../../../../common/openclaw/plugin-sdk/channel-status");
const _directoryruntime = require("../../../../common/openclaw/plugin-sdk/directory-runtime");
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _statushelpers = require("../../../../common/openclaw/plugin-sdk/status-helpers");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accounts = require("./accounts.js");
const _actionthreading = require("./action-threading.js");
const _apifetch = require("./api-fetch.js");
const _approvalnative = require("./approval-native.js");
const _audit = /*#__PURE__*/ _interop_require_wildcard(require("./audit.js"));
const _botinfocache = require("./bot-info-cache.js");
const _helpers = require("./bot/helpers.js");
const _channelactions = require("./channel-actions.js");
const _directoryconfig = require("./directory-config.js");
const _execapprovalforwarding = require("./exec-approval-forwarding.js");
const _execapprovals = require("./exec-approvals.js");
const _grouppolicy = require("./group-policy.js");
const _inlinebuttons = require("./inline-buttons.js");
const _monitor = /*#__PURE__*/ _interop_require_wildcard(require("./monitor.js"));
const _normalize = require("./normalize.js");
const _outboundadapter = require("./outbound-adapter.js");
const _outboundparams = require("./outbound-params.js");
const _pollinglease = require("./polling-lease.js");
const _probe = /*#__PURE__*/ _interop_require_wildcard(require("./probe.js"));
const _reactionlevel = require("./reaction-level.js");
const _requesttimeouts = require("./request-timeouts.js");
const _runtime = require("./runtime.js");
const _security = require("./security.js");
const _sessionconversation = require("./session-conversation.js");
const _setupcore = require("./setup-core.js");
const _setupsurface = require("./setup-surface.js");
const _shared = require("./shared.js");
const _startupprobelimiter = require("./startup-probe-limiter.js");
const _statemigrations = require("./state-migrations.js");
const _statusissues = require("./status-issues.js");
const _targets = require("./targets.js");
const _threadbindings = require("./thread-bindings.js");
const _threadingtoolcontext = require("./threading-tool-context.js");
const _token = require("./token.js");
const _topicconversation = require("./topic-conversation.js");
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
let telegramSendModulePromise;
let telegramUpdateOffsetRuntimePromise;
async function loadTelegramSendModule() {
    telegramSendModulePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./send.js")));
    return await telegramSendModulePromise;
}
async function loadTelegramUpdateOffsetRuntime() {
    telegramUpdateOffsetRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("../update-offset-runtime-api.js")));
    return await telegramUpdateOffsetRuntimePromise;
}
function resolveTelegramProbe() {
    return getOptionalTelegramRuntime()?.channel?.telegram?.probeTelegram ?? _probe.probeTelegram;
}
async function readStartupBotInfoCache(params) {
    try {
        const cached = await (0, _botinfocache.readCachedTelegramBotInfo)({
            accountId: params.accountId,
            botToken: params.token
        });
        return cached?.botInfo;
    } catch (err) {
        if ((0, _runtime.getTelegramRuntime)().logging.shouldLogVerbose()) {
            params.log?.debug?.(`[${params.accountId}] bot info cache read failed: ${String(err)}`);
        }
        return undefined;
    }
}
async function writeStartupBotInfoCache(params) {
    try {
        await (0, _botinfocache.writeCachedTelegramBotInfo)({
            accountId: params.accountId,
            botToken: params.token,
            botInfo: params.botInfo
        });
    } catch (err) {
        if ((0, _runtime.getTelegramRuntime)().logging.shouldLogVerbose()) {
            params.log?.debug?.(`[${params.accountId}] bot info cache write failed: ${String(err)}`);
        }
    }
}
async function deleteStartupBotInfoCache(accountId) {
    await (0, _botinfocache.deleteCachedTelegramBotInfo)({
        accountId
    }).catch(()=>undefined);
}
function resolveTelegramAuditCollector() {
    return getOptionalTelegramRuntime()?.channel?.telegram?.collectTelegramUnmentionedGroupIds ?? _audit.collectTelegramUnmentionedGroupIds;
}
function resolveTelegramAuditMembership() {
    return getOptionalTelegramRuntime()?.channel?.telegram?.auditTelegramGroupMembership ?? _audit.auditTelegramGroupMembership;
}
function resolveTelegramMonitor() {
    return getOptionalTelegramRuntime()?.channel?.telegram?.monitorTelegramProvider ?? _monitor.monitorTelegramProvider;
}
function formatTelegramUnauthorizedTokenError(account) {
    const source = account.tokenSource === "none" ? "no configured token" : `${account.tokenSource} token`;
    const credentialPath = account.accountId === _accountid.DEFAULT_ACCOUNT_ID ? "channels.telegram.botToken, channels.telegram.tokenFile, or TELEGRAM_BOT_TOKEN" : `channels.telegram.accounts.${account.accountId}.botToken/tokenFile`;
    return `Telegram bot token unauthorized for account "${account.accountId}" (getMe returned 401 from Telegram; source: ${source}). Update ${credentialPath} with the current BotFather token.`;
}
function getOptionalTelegramRuntime() {
    try {
        return (0, _runtime.getTelegramRuntime)();
    } catch  {
        return null;
    }
}
async function resolveTelegramSend(deps) {
    return (0, _channeloutbound.resolveOutboundSendDep)(deps, "telegram") ?? getOptionalTelegramRuntime()?.channel?.telegram?.sendMessageTelegram ?? (await loadTelegramSendModule()).sendMessageTelegram;
}
function resolveTelegramTokenHelper() {
    return getOptionalTelegramRuntime()?.channel?.telegram?.resolveTelegramToken ?? _token.resolveTelegramToken;
}
const telegramChannelOutbound = (0, _outboundadapter.createTelegramOutboundAdapter)({
    resolveSend: resolveTelegramSend,
    loadSendModule: loadTelegramSendModule,
    shouldSuppressLocalPayloadPrompt: ({ cfg, accountId, payload })=>(0, _execapprovals.shouldSuppressLocalTelegramExecApprovalPrompt)({
            cfg,
            accountId,
            payload
        }),
    beforeDeliverPayload: async ({ cfg, target, hint })=>{
        if (hint?.kind !== "approval-pending" || hint.approvalKind !== "exec") {
            return;
        }
        const threadId = typeof target.threadId === "number" ? target.threadId : typeof target.threadId === "string" ? (0, _outboundparams.parseTelegramThreadId)(target.threadId) : undefined;
        const { sendTypingTelegram } = await loadTelegramSendModule();
        await sendTypingTelegram(target.to, {
            cfg,
            accountId: target.accountId ?? undefined,
            ...threadId !== undefined ? {
                messageThreadId: threadId
            } : {}
        }).catch(()=>{});
    },
    shouldTreatDeliveredTextAsVisible: shouldTreatTelegramDeliveredTextAsVisible,
    targetsMatchForReplySuppression: targetsMatchTelegramReplySuppression,
    preferFinalAssistantVisibleText: true
});
const telegramMessageAdapter = (0, _channeloutbound.createChannelMessageAdapterFromOutbound)({
    id: "telegram",
    live: {
        capabilities: {
            draftPreview: true,
            previewFinalization: true,
            progressUpdates: true
        },
        finalizer: {
            capabilities: {
                finalEdit: true,
                normalFallback: true,
                previewReceipt: true,
                retainOnAmbiguousFailure: true
            }
        }
    },
    receive: {
        defaultAckPolicy: "after_agent_dispatch",
        supportedAckPolicies: [
            "after_receive_record",
            "after_agent_dispatch"
        ]
    },
    outbound: telegramChannelOutbound
});
const telegramMessageActions = {
    resolveExecutionMode: (ctx)=>getOptionalTelegramRuntime()?.channel?.telegram?.messageActions?.resolveExecutionMode?.(ctx) ?? _channelactions.telegramMessageActions.resolveExecutionMode?.(ctx) ?? "gateway",
    describeMessageTool: (ctx)=>getOptionalTelegramRuntime()?.channel?.telegram?.messageActions?.describeMessageTool?.(ctx) ?? _channelactions.telegramMessageActions.describeMessageTool?.(ctx) ?? null,
    extractToolSend: (ctx)=>getOptionalTelegramRuntime()?.channel?.telegram?.messageActions?.extractToolSend?.(ctx) ?? _channelactions.telegramMessageActions.extractToolSend?.(ctx) ?? null,
    handleAction: async (ctx)=>{
        const runtimeHandleAction = getOptionalTelegramRuntime()?.channel?.telegram?.messageActions?.handleAction;
        if (runtimeHandleAction) {
            return await runtimeHandleAction(ctx);
        }
        if (!_channelactions.telegramMessageActions.handleAction) {
            throw new Error("Telegram message actions not available");
        }
        return await _channelactions.telegramMessageActions.handleAction(ctx);
    }
};
function normalizeTelegramAcpConversationId(conversationId) {
    const parsed = (0, _topicconversation.parseTelegramTopicConversation)({
        conversationId
    });
    if (!parsed || !parsed.chatId.startsWith("-")) {
        return null;
    }
    return {
        conversationId: parsed.canonicalConversationId,
        parentConversationId: parsed.chatId
    };
}
function matchTelegramAcpConversation(params) {
    const binding = normalizeTelegramAcpConversationId(params.bindingConversationId);
    if (!binding) {
        return null;
    }
    const incoming = (0, _topicconversation.parseTelegramTopicConversation)({
        conversationId: params.conversationId,
        parentConversationId: params.parentConversationId
    });
    if (!incoming || !incoming.chatId.startsWith("-")) {
        return null;
    }
    if (binding.conversationId !== incoming.canonicalConversationId) {
        return null;
    }
    return {
        conversationId: incoming.canonicalConversationId,
        parentConversationId: incoming.chatId,
        matchPriority: 2
    };
}
function shouldTreatTelegramDeliveredTextAsVisible(params) {
    void params.text;
    return params.kind !== "final";
}
function targetsMatchTelegramReplySuppression(params) {
    const origin = (0, _targets.parseTelegramTarget)(params.originTarget);
    const target = (0, _targets.parseTelegramTarget)(params.targetKey);
    const originThreadId = origin.messageThreadId != null && (0, _stringcoerceruntime.normalizeOptionalString)(String(origin.messageThreadId)) ? (0, _stringcoerceruntime.normalizeOptionalString)(String(origin.messageThreadId)) : undefined;
    const targetThreadId = (0, _stringcoerceruntime.normalizeOptionalString)(params.targetThreadId) || (target.messageThreadId != null && (0, _stringcoerceruntime.normalizeOptionalString)(String(target.messageThreadId)) ? (0, _stringcoerceruntime.normalizeOptionalString)(String(target.messageThreadId)) : undefined);
    if ((0, _stringcoerceruntime.normalizeOptionalLowercaseString)(origin.chatId) !== (0, _stringcoerceruntime.normalizeOptionalLowercaseString)(target.chatId)) {
        return false;
    }
    if (originThreadId && targetThreadId) {
        return originThreadId === targetThreadId;
    }
    return originThreadId == null && targetThreadId == null;
}
function resolveTelegramCommandConversation(params) {
    const chatId = [
        params.originatingTo,
        params.commandTo,
        params.fallbackTo
    ].map((candidate)=>{
        const trimmed = (0, _stringcoerceruntime.normalizeOptionalString)(candidate) ?? "";
        return trimmed ? (0, _stringcoerceruntime.normalizeOptionalString)((0, _targets.parseTelegramTarget)(trimmed).chatId) ?? "" : "";
    }).find((candidate)=>candidate.length > 0);
    if (!chatId) {
        return null;
    }
    if (params.threadId) {
        return {
            conversationId: `${chatId}:topic:${params.threadId}`,
            parentConversationId: chatId
        };
    }
    if (chatId.startsWith("-")) {
        return null;
    }
    return {
        conversationId: chatId,
        parentConversationId: chatId
    };
}
function resolveTelegramInboundConversation(params) {
    const rawTarget = (0, _stringcoerceruntime.normalizeOptionalString)(params.to) ?? (0, _stringcoerceruntime.normalizeOptionalString)(params.conversationId) ?? "";
    if (!rawTarget) {
        return null;
    }
    const parsedTarget = (0, _targets.parseTelegramTarget)(rawTarget);
    const chatId = (0, _stringcoerceruntime.normalizeOptionalString)(parsedTarget.chatId) ?? "";
    if (!chatId) {
        return null;
    }
    const threadId = parsedTarget.messageThreadId != null ? String(parsedTarget.messageThreadId) : params.threadId != null ? (0, _stringcoerceruntime.normalizeOptionalString)(String(params.threadId)) : undefined;
    if (threadId) {
        const parsedTopic = (0, _topicconversation.parseTelegramTopicConversation)({
            conversationId: threadId,
            parentConversationId: chatId
        });
        if (!parsedTopic) {
            return null;
        }
        return {
            conversationId: parsedTopic.canonicalConversationId,
            parentConversationId: parsedTopic.chatId
        };
    }
    return {
        conversationId: chatId,
        parentConversationId: chatId
    };
}
function resolveTelegramDeliveryTarget(params) {
    const parsedTopic = (0, _topicconversation.parseTelegramTopicConversation)({
        conversationId: params.conversationId,
        parentConversationId: params.parentConversationId
    });
    if (parsedTopic) {
        return {
            to: parsedTopic.chatId,
            threadId: parsedTopic.topicId
        };
    }
    const parsedTarget = (0, _targets.parseTelegramTarget)(params.parentConversationId?.trim() || params.conversationId);
    if (!parsedTarget.chatId.trim()) {
        return null;
    }
    return {
        to: parsedTarget.chatId,
        ...parsedTarget.messageThreadId != null ? {
            threadId: String(parsedTarget.messageThreadId)
        } : {}
    };
}
function resolveTelegramRouteTarget(raw) {
    const target = (0, _targets.parseTelegramTarget)(raw);
    return {
        to: target.chatId,
        threadId: target.messageThreadId,
        chatType: target.chatType === "unknown" ? undefined : target.chatType
    };
}
function shouldStripTelegramThreadFromAnnounceOrigin(params) {
    const requesterChannel = (0, _stringcoerceruntime.normalizeOptionalLowercaseString)(params.requester.channel);
    if (requesterChannel && requesterChannel !== "telegram") {
        return true;
    }
    const requesterTo = params.requester.to?.trim();
    if (!requesterTo) {
        return false;
    }
    if (!requesterChannel && !requesterTo.startsWith("telegram:")) {
        return true;
    }
    const requesterTarget = resolveTelegramRouteTarget(requesterTo);
    if (requesterTarget.chatType !== "group") {
        return true;
    }
    const entryTo = params.entry.to?.trim();
    if (!entryTo) {
        return false;
    }
    const entryTarget = resolveTelegramRouteTarget(entryTo);
    return entryTarget.to !== requesterTarget.to;
}
function resolveTelegramOutboundSessionRoute(params) {
    const parsed = (0, _targets.parseTelegramTarget)(params.target);
    const chatId = parsed.chatId.trim();
    if (!chatId) {
        return null;
    }
    const resolvedThreadId = parsed.messageThreadId ?? (0, _outboundparams.parseTelegramThreadId)(params.threadId);
    const isGroup = parsed.chatType === "group" || parsed.chatType === "unknown" && params.resolvedTarget?.kind && params.resolvedTarget.kind !== "user";
    const peerId = isGroup && resolvedThreadId ? (0, _helpers.buildTelegramGroupPeerId)(chatId, resolvedThreadId) : chatId;
    const peer = {
        kind: isGroup ? "group" : "direct",
        id: peerId
    };
    const baseRoute = (0, _channelcore.buildChannelOutboundSessionRoute)({
        cfg: params.cfg,
        agentId: params.agentId,
        channel: "telegram",
        accountId: params.accountId,
        peer,
        chatType: isGroup ? "group" : "direct",
        from: isGroup ? `telegram:group:${peerId}` : resolvedThreadId ? `telegram:${chatId}:topic:${resolvedThreadId}` : `telegram:${chatId}`,
        to: `telegram:${chatId}`,
        ...isGroup && resolvedThreadId !== undefined ? {
            threadId: resolvedThreadId
        } : {}
    });
    if (isGroup) {
        return baseRoute;
    }
    const canonicalThreadId = resolvedThreadId !== undefined ? buildTelegramCanonicalTopicThreadId({
        chatId,
        topicId: resolvedThreadId
    }) : undefined;
    const route = (0, _channelcore.buildThreadAwareOutboundSessionRoute)({
        route: baseRoute,
        threadId: canonicalThreadId,
        currentSessionKey: params.currentSessionKey,
        precedence: [
            "threadId",
            "currentSession"
        ],
        canRecoverCurrentThread: ({ route: routeLocal })=>routeLocal.chatType !== "direct" || (params.cfg.session?.dmScope ?? "main") !== "main"
    });
    const routeThreadId = resolveTelegramNativeTopicThreadId(route.threadId, resolvedThreadId);
    return {
        ...route,
        ...routeThreadId !== undefined ? {
            threadId: routeThreadId
        } : {},
        from: routeThreadId !== undefined ? `telegram:${chatId}:topic:${routeThreadId}` : `telegram:${chatId}`
    };
}
function buildTelegramCanonicalTopicThreadId(params) {
    // Core session routing sees one canonical thread id. Telegram topic ids are
    // chat-scoped, so direct-topic sessions include the chat id to avoid collisions.
    return `${params.chatId}:${params.topicId}`;
}
function resolveTelegramNativeTopicThreadId(threadId, nativeTopicId) {
    if (nativeTopicId !== undefined) {
        return nativeTopicId;
    }
    // Keep the chat-scoped canonical id inside OpenClaw state; translate it back
    // only when returning Telegram route metadata used by send/typing paths.
    if (threadId === undefined) {
        return undefined;
    }
    const parsedThreadId = (0, _outboundparams.parseTelegramThreadId)(threadId);
    if (parsedThreadId !== undefined) {
        return parsedThreadId;
    }
    if (typeof threadId === "string") {
        const canonicalMatch = /:(\d+)$/.exec(threadId.trim());
        if (canonicalMatch?.[1]) {
            return Number(canonicalMatch[1]);
        }
    }
    return threadId;
}
async function resolveTelegramTargets(params) {
    if (params.kind !== "user") {
        return params.inputs.map((input)=>({
                input,
                resolved: false,
                note: "Telegram runtime target resolution only supports usernames for direct-message lookups."
            }));
    }
    const account = (0, _accounts.resolveTelegramAccount)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    const token = account.token.trim();
    if (!token) {
        return params.inputs.map((input)=>({
                input,
                resolved: false,
                note: "Telegram bot token is required to resolve @username targets."
            }));
    }
    return await Promise.all(params.inputs.map(async (input)=>{
        const trimmed = input.trim();
        if (!trimmed) {
            return {
                input,
                resolved: false,
                note: "Telegram target is required."
            };
        }
        const normalized = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
        try {
            const id = await (0, _apifetch.lookupTelegramChatId)({
                token,
                chatId: normalized,
                network: account.config.network
            });
            if (!id) {
                return {
                    input,
                    resolved: false,
                    note: "Telegram username could not be resolved by the configured bot."
                };
            }
            return {
                input,
                resolved: true,
                id,
                name: normalized
            };
        } catch (error) {
            return {
                input,
                resolved: false,
                note: (0, _errorruntime.formatErrorMessage)(error)
            };
        }
    }));
}
const resolveTelegramAllowlistGroupOverrides = (0, _allowlistconfigedit.createNestedAllowlistOverrideResolver)({
    resolveRecord: (account)=>account.config.groups,
    outerLabel: (groupId)=>groupId,
    resolveOuterEntries: (groupCfg)=>groupCfg?.allowFrom,
    resolveChildren: (groupCfg)=>groupCfg?.topics,
    innerLabel: (groupId, topicId)=>`${groupId} topic ${topicId}`,
    resolveInnerEntries: (topicCfg)=>topicCfg?.allowFrom
});
const telegramPlugin = (0, _channelcore.createChatChannelPlugin)({
    base: {
        ...(0, _shared.createTelegramPluginBase)({
            setupWizard: _setupsurface.telegramSetupWizard,
            setup: _setupcore.telegramSetupAdapter
        }),
        allowlist: (0, _allowlistconfigedit.buildDmGroupAccountAllowlistAdapter)({
            channelId: "telegram",
            resolveAccount: _accounts.resolveTelegramAccount,
            normalize: ({ cfg, accountId, values })=>_shared.telegramConfigAdapter.formatAllowFrom({
                    cfg,
                    accountId,
                    allowFrom: values
                }),
            resolveDmAllowFrom: (account)=>account.config.allowFrom,
            resolveGroupAllowFrom: (account)=>account.config.groupAllowFrom,
            resolveDmPolicy: (account)=>account.config.dmPolicy,
            resolveGroupPolicy: (account)=>account.config.groupPolicy,
            resolveGroupOverrides: resolveTelegramAllowlistGroupOverrides
        }),
        bindings: {
            selfParentConversationByDefault: true,
            compileConfiguredBinding: ({ conversationId })=>normalizeTelegramAcpConversationId(conversationId),
            matchInboundConversation: ({ compiledBinding, conversationId, parentConversationId })=>matchTelegramAcpConversation({
                    bindingConversationId: compiledBinding.conversationId,
                    conversationId,
                    parentConversationId
                }),
            resolveCommandConversation: ({ threadId, originatingTo, commandTo, fallbackTo })=>resolveTelegramCommandConversation({
                    threadId,
                    originatingTo,
                    commandTo,
                    fallbackTo
                })
        },
        conversationBindings: {
            supportsCurrentConversationBinding: true,
            defaultTopLevelPlacement: "current",
            resolveConversationRef: ({ accountId: _accountId, conversationId, parentConversationId, threadId })=>resolveTelegramInboundConversation({
                    to: parentConversationId ?? conversationId,
                    conversationId,
                    threadId: threadId ?? undefined
                }),
            buildBoundReplyPayload: ({ operation, conversation })=>{
                if (operation !== "acp-spawn") {
                    return null;
                }
                return conversation.conversationId.includes(":topic:") ? {
                    delivery: {
                        pin: {
                            enabled: true,
                            notify: false
                        }
                    }
                } : null;
            },
            shouldStripThreadFromAnnounceOrigin: shouldStripTelegramThreadFromAnnounceOrigin,
            createManager: ({ cfg, accountId })=>(0, _threadbindings.createTelegramThreadBindingManager)({
                    cfg,
                    accountId: accountId ?? undefined,
                    persist: false,
                    enableSweeper: false
                }),
            setIdleTimeoutBySessionKey: ({ targetSessionKey, accountId, idleTimeoutMs })=>(0, _threadbindings.setTelegramThreadBindingIdleTimeoutBySessionKey)({
                    targetSessionKey,
                    accountId: accountId ?? undefined,
                    idleTimeoutMs
                }),
            setMaxAgeBySessionKey: ({ targetSessionKey, accountId, maxAgeMs })=>(0, _threadbindings.setTelegramThreadBindingMaxAgeBySessionKey)({
                    targetSessionKey,
                    accountId: accountId ?? undefined,
                    maxAgeMs
                })
        },
        groups: {
            resolveRequireMention: _grouppolicy.resolveTelegramGroupRequireMention,
            resolveToolPolicy: _grouppolicy.resolveTelegramGroupToolPolicy
        },
        agentPrompt: {
            messageToolCapabilities: ({ cfg, accountId })=>{
                const inlineButtonsScope = (0, _inlinebuttons.resolveTelegramInlineButtonsScope)({
                    cfg,
                    accountId: accountId ?? undefined
                });
                return inlineButtonsScope === "off" ? [] : [
                    "inlineButtons"
                ];
            },
            reactionGuidance: ({ cfg, accountId })=>{
                const level = (0, _reactionlevel.resolveTelegramReactionLevel)({
                    cfg,
                    accountId: accountId ?? undefined
                }).agentReactionGuidance;
                return level ? {
                    level,
                    channelLabel: "Telegram"
                } : undefined;
            }
        },
        messaging: {
            targetPrefixes: [
                "telegram",
                "tg"
            ],
            normalizeTarget: _normalize.normalizeTelegramMessagingTarget,
            resolveInboundConversation: ({ to, conversationId, threadId })=>resolveTelegramInboundConversation({
                    to,
                    conversationId,
                    threadId
                }),
            resolveDeliveryTarget: ({ conversationId, parentConversationId })=>resolveTelegramDeliveryTarget({
                    conversationId,
                    parentConversationId
                }),
            resolveSessionConversation: ({ kind, rawId })=>(0, _sessionconversation.resolveTelegramSessionConversation)({
                    kind,
                    rawId
                }),
            resolveSessionTarget: ({ kind, id })=>(0, _sessionconversation.resolveTelegramSessionTarget)({
                    kind,
                    id
                }),
            inferTargetChatType: ({ to })=>resolveTelegramRouteTarget(to).chatType,
            preserveHeartbeatThreadIdForGroupRoute: true,
            formatTargetDisplay: ({ target, display, kind })=>{
                const formatted = display?.trim();
                if (formatted) {
                    return formatted;
                }
                const trimmedTarget = target.trim();
                if (!trimmedTarget) {
                    return trimmedTarget;
                }
                const withoutProvider = trimmedTarget.replace(/^(telegram|tg):/i, "");
                if (kind === "user" || /^user:/i.test(withoutProvider)) {
                    return `@${withoutProvider.replace(/^user:/i, "")}`;
                }
                if (/^channel:/i.test(withoutProvider)) {
                    return `#${withoutProvider.replace(/^channel:/i, "")}`;
                }
                return withoutProvider;
            },
            resolveOutboundSessionRoute: (params)=>resolveTelegramOutboundSessionRoute(params),
            targetResolver: {
                looksLikeId: _normalize.looksLikeTelegramTargetId,
                hint: "<chatId>"
            }
        },
        resolver: {
            resolveTargets: async ({ cfg, accountId, inputs, kind })=>await resolveTelegramTargets({
                    cfg,
                    accountId,
                    inputs,
                    kind
                })
        },
        lifecycle: {
            detectLegacyStateMigrations: (params)=>(0, _statemigrations.detectTelegramLegacyStateMigrations)(params),
            onAccountConfigChanged: async ({ prevCfg, nextCfg, accountId })=>{
                const previousToken = (0, _accounts.resolveTelegramAccount)({
                    cfg: prevCfg,
                    accountId
                }).token.trim();
                const nextToken = (0, _accounts.resolveTelegramAccount)({
                    cfg: nextCfg,
                    accountId
                }).token.trim();
                if (previousToken !== nextToken) {
                    const { deleteTelegramUpdateOffset } = await loadTelegramUpdateOffsetRuntime();
                    await Promise.all([
                        deleteTelegramUpdateOffset({
                            accountId
                        }),
                        deleteStartupBotInfoCache(accountId)
                    ]);
                }
            },
            onAccountRemoved: async ({ accountId })=>{
                const { deleteTelegramUpdateOffset } = await loadTelegramUpdateOffsetRuntime();
                await Promise.all([
                    deleteTelegramUpdateOffset({
                        accountId
                    }),
                    deleteStartupBotInfoCache(accountId)
                ]);
            }
        },
        heartbeat: {
            sendTyping: async ({ cfg, to, accountId, threadId })=>{
                const { sendTypingTelegram } = await loadTelegramSendModule();
                await sendTypingTelegram(to, {
                    cfg,
                    ...accountId ? {
                        accountId
                    } : {},
                    messageThreadId: (0, _outboundparams.parseTelegramThreadId)(threadId)
                });
            }
        },
        approvalCapability: {
            ..._approvalnative.telegramApprovalCapability,
            render: {
                exec: {
                    buildPendingPayload: ({ request, nowMs })=>(0, _execapprovalforwarding.buildTelegramExecApprovalPendingPayload)({
                            request,
                            nowMs
                        })
                }
            }
        },
        directory: (0, _directoryruntime.createChannelDirectoryAdapter)({
            listPeers: async (params)=>(0, _directoryconfig.listTelegramDirectoryPeersFromConfig)(params),
            listGroups: async (params)=>(0, _directoryconfig.listTelegramDirectoryGroupsFromConfig)(params)
        }),
        actions: telegramMessageActions,
        message: telegramMessageAdapter,
        status: (0, _statushelpers.createComputedAccountStatusAdapter)({
            defaultRuntime: (0, _statushelpers.createDefaultChannelRuntimeState)(_accountid.DEFAULT_ACCOUNT_ID),
            collectStatusIssues: _statusissues.collectTelegramStatusIssues,
            buildChannelSummary: ({ snapshot })=>(0, _channelstatus.buildTokenChannelStatusSummary)(snapshot),
            probeAccount: async ({ account, timeoutMs })=>resolveTelegramProbe()(account.token, timeoutMs, {
                    accountId: account.accountId,
                    proxyUrl: account.config.proxy,
                    network: account.config.network,
                    apiRoot: account.config.apiRoot,
                    includeWebhookInfo: Boolean(account.config.webhookUrl)
                }),
            formatCapabilitiesProbe: ({ probe })=>{
                const lines = [];
                if (probe?.bot?.username) {
                    const botId = probe.bot.id ? ` (${probe.bot.id})` : "";
                    lines.push({
                        text: `Bot: @${probe.bot.username}${botId}`
                    });
                }
                const flags = [];
                if (typeof probe?.bot?.canJoinGroups === "boolean") {
                    flags.push(`joinGroups=${probe.bot.canJoinGroups}`);
                }
                if (typeof probe?.bot?.canReadAllGroupMessages === "boolean") {
                    flags.push(`readAllGroupMessages=${probe.bot.canReadAllGroupMessages}`);
                }
                if (typeof probe?.bot?.supportsInlineQueries === "boolean") {
                    flags.push(`inlineQueries=${probe.bot.supportsInlineQueries}`);
                }
                if (flags.length > 0) {
                    lines.push({
                        text: `Flags: ${flags.join(" ")}`
                    });
                }
                if (probe?.webhook?.url !== undefined) {
                    lines.push({
                        text: `Webhook: ${probe.webhook.url || "none"}`
                    });
                }
                return lines;
            },
            auditAccount: async ({ account, timeoutMs, probe, cfg })=>{
                const groups = cfg.channels?.telegram?.accounts?.[account.accountId]?.groups ?? cfg.channels?.telegram?.groups;
                const { groupIds, unresolvedGroups, hasWildcardUnmentionedGroups } = resolveTelegramAuditCollector()(groups);
                if (!groupIds.length && unresolvedGroups === 0 && !hasWildcardUnmentionedGroups) {
                    return undefined;
                }
                const botId = probe?.ok && probe.bot?.id != null ? probe.bot.id : null;
                if (!botId) {
                    return {
                        ok: unresolvedGroups === 0 && !hasWildcardUnmentionedGroups,
                        checkedGroups: 0,
                        unresolvedGroups,
                        hasWildcardUnmentionedGroups,
                        groups: [],
                        elapsedMs: 0
                    };
                }
                const audit = await resolveTelegramAuditMembership()({
                    token: account.token,
                    botId,
                    groupIds,
                    proxyUrl: account.config.proxy,
                    network: account.config.network,
                    apiRoot: account.config.apiRoot,
                    timeoutMs
                });
                return {
                    ...audit,
                    unresolvedGroups,
                    hasWildcardUnmentionedGroups
                };
            },
            resolveAccountSnapshot: ({ account, cfg, runtime, audit })=>{
                const configuredFromStatus = (0, _channelstatus.resolveConfiguredFromCredentialStatuses)(account);
                const ownerAccountId = (0, _shared.findTelegramTokenOwnerAccountId)({
                    cfg,
                    accountId: account.accountId
                });
                const duplicateTokenReason = ownerAccountId ? (0, _shared.formatDuplicateTelegramTokenReason)({
                    accountId: account.accountId,
                    ownerAccountId
                }) : null;
                const configured = (configuredFromStatus ?? Boolean(account.token?.trim())) && !ownerAccountId;
                const groups = cfg.channels?.telegram?.accounts?.[account.accountId]?.groups ?? cfg.channels?.telegram?.groups;
                const allowUnmentionedGroups = groups?.["*"]?.requireMention === false || Object.entries(groups ?? {}).some(([key, value])=>key !== "*" && value?.requireMention === false);
                return {
                    accountId: account.accountId,
                    name: account.name,
                    enabled: account.enabled,
                    configured,
                    extra: {
                        ...(0, _channelstatus.projectCredentialSnapshotFields)(account),
                        lastError: runtime?.lastError ?? duplicateTokenReason,
                        mode: runtime?.mode ?? (account.config.webhookUrl ? "webhook" : "polling"),
                        audit,
                        allowUnmentionedGroups
                    }
                };
            }
        }),
        gateway: {
            startAccount: async (ctx)=>{
                const account = ctx.account;
                const ownerAccountId = (0, _shared.findTelegramTokenOwnerAccountId)({
                    cfg: ctx.cfg,
                    accountId: account.accountId
                });
                if (ownerAccountId) {
                    const reason = (0, _shared.formatDuplicateTelegramTokenReason)({
                        accountId: account.accountId,
                        ownerAccountId
                    });
                    ctx.log?.error?.(`[${account.accountId}] ${reason}`);
                    throw new Error(reason);
                }
                const token = (account.token ?? "").trim();
                let telegramBotLabel = "";
                let unauthorizedTokenReason = null;
                let botInfo;
                try {
                    const probe = await (0, _startupprobelimiter.withTelegramStartupProbeSlot)(ctx.abortSignal, ()=>resolveTelegramProbe()(token, (0, _requesttimeouts.resolveTelegramStartupProbeTimeoutMs)(account.config.timeoutSeconds), {
                            accountId: account.accountId,
                            proxyUrl: account.config.proxy,
                            network: account.config.network,
                            apiRoot: account.config.apiRoot,
                            includeWebhookInfo: false
                        }));
                    const username = probe.ok ? probe.bot?.username?.trim() : null;
                    if (username) {
                        telegramBotLabel = ` (@${username})`;
                    }
                    botInfo = probe.ok ? probe.botInfo : undefined;
                    if (probe.ok && probe.botInfo) {
                        await writeStartupBotInfoCache({
                            accountId: account.accountId,
                            token,
                            botInfo: probe.botInfo,
                            log: ctx.log
                        });
                    }
                    if (!probe.ok && probe.status === 401) {
                        await deleteStartupBotInfoCache(account.accountId);
                        unauthorizedTokenReason = formatTelegramUnauthorizedTokenError(account);
                    } else if (!probe.ok) {
                        botInfo = await readStartupBotInfoCache({
                            accountId: account.accountId,
                            token,
                            log: ctx.log
                        });
                        if (botInfo) {
                            telegramBotLabel = ` (@${botInfo.username})`;
                        }
                    }
                } catch (err) {
                    if (ctx.abortSignal.aborted) {
                        return;
                    }
                    if ((0, _runtime.getTelegramRuntime)().logging.shouldLogVerbose()) {
                        ctx.log?.debug?.(`[${account.accountId}] bot probe failed: ${String(err)}`);
                    }
                    botInfo = await readStartupBotInfoCache({
                        accountId: account.accountId,
                        token,
                        log: ctx.log
                    });
                    if (botInfo) {
                        telegramBotLabel = ` (@${botInfo.username})`;
                    }
                }
                if (unauthorizedTokenReason) {
                    ctx.log?.error?.(`[${account.accountId}] ${unauthorizedTokenReason}`);
                    throw new Error(unauthorizedTokenReason);
                }
                ctx.log?.info(`[${account.accountId}] starting provider${telegramBotLabel}`);
                const setStatus = (0, _channeloutbound.createAccountStatusSink)({
                    accountId: account.accountId,
                    setStatus: ctx.setStatus
                });
                return resolveTelegramMonitor()({
                    token,
                    accountId: account.accountId,
                    config: ctx.cfg,
                    runtime: ctx.runtime,
                    channelRuntime: ctx.channelRuntime,
                    abortSignal: ctx.abortSignal,
                    useWebhook: Boolean(account.config.webhookUrl),
                    webhookUrl: account.config.webhookUrl,
                    webhookSecret: account.config.webhookSecret,
                    webhookPath: account.config.webhookPath,
                    webhookHost: account.config.webhookHost,
                    webhookPort: account.config.webhookPort,
                    webhookCertPath: account.config.webhookCertPath,
                    botInfo,
                    setStatus
                });
            },
            stopAccount: async ({ account, accountId, log })=>{
                const token = (account.token ?? "").trim();
                if (!token) {
                    return;
                }
                const released = await (0, _pollinglease.releaseStoppedTelegramPollingLease)({
                    token,
                    accountId
                });
                if (released) {
                    log?.info?.(`[${accountId}] released stopped Telegram polling lease`);
                }
            },
            logoutAccount: async ({ accountId, cfg })=>{
                const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
                const nextCfg = {
                    ...cfg
                };
                const nextTelegram = cfg.channels?.telegram ? {
                    ...cfg.channels.telegram
                } : undefined;
                let cleared = false;
                let changed = false;
                if (nextTelegram) {
                    if (accountId === _accountid.DEFAULT_ACCOUNT_ID && nextTelegram.botToken) {
                        delete nextTelegram.botToken;
                        cleared = true;
                        changed = true;
                    }
                    const accountCleanup = (0, _channelcore.clearAccountEntryFields)({
                        accounts: nextTelegram.accounts,
                        accountId,
                        fields: [
                            "botToken"
                        ]
                    });
                    if (accountCleanup.changed) {
                        changed = true;
                        if (accountCleanup.cleared) {
                            cleared = true;
                        }
                        if (accountCleanup.nextAccounts) {
                            nextTelegram.accounts = accountCleanup.nextAccounts;
                        } else {
                            delete nextTelegram.accounts;
                        }
                    }
                }
                if (changed) {
                    if (nextTelegram && Object.keys(nextTelegram).length > 0) {
                        nextCfg.channels = {
                            ...nextCfg.channels,
                            telegram: nextTelegram
                        };
                    } else {
                        const nextChannels = {
                            ...nextCfg.channels
                        };
                        delete nextChannels.telegram;
                        if (Object.keys(nextChannels).length > 0) {
                            nextCfg.channels = nextChannels;
                        } else {
                            delete nextCfg.channels;
                        }
                    }
                }
                const resolved = (0, _accounts.resolveTelegramAccount)({
                    cfg: changed ? nextCfg : cfg,
                    accountId
                });
                const loggedOut = resolved.tokenSource === "none";
                if (changed) {
                    await (0, _runtime.getTelegramRuntime)().config.replaceConfigFile({
                        nextConfig: nextCfg,
                        afterWrite: {
                            mode: "auto"
                        }
                    });
                }
                if (cleared || loggedOut) {
                    await deleteStartupBotInfoCache(accountId);
                }
                return {
                    cleared,
                    envToken: Boolean(envToken),
                    loggedOut
                };
            }
        }
    },
    pairing: {
        text: {
            idLabel: "telegramUserId",
            message: _channelstatus.PAIRING_APPROVED_MESSAGE,
            normalizeAllowEntry: (0, _channelpairing.createPairingPrefixStripper)(/^(telegram|tg):/i),
            notify: async ({ cfg, id, message, accountId })=>{
                const { token } = resolveTelegramTokenHelper()(cfg, {
                    accountId
                });
                if (!token) {
                    throw new Error("telegram token not configured");
                }
                const send = await resolveTelegramSend();
                await send(id, message, {
                    cfg,
                    token,
                    accountId
                });
            }
        }
    },
    security: _security.telegramSecurityAdapter,
    threading: {
        topLevelReplyToMode: "telegram",
        buildToolContext: (params)=>(0, _threadingtoolcontext.buildTelegramThreadingToolContext)(params),
        resolveAutoThreadId: ({ to, toolContext })=>(0, _actionthreading.resolveTelegramAutoThreadId)({
                to,
                toolContext
            }),
        resolveCurrentChannelId: ({ to, threadId })=>{
            if (threadId == null) {
                return to;
            }
            return to.includes(":topic:") ? to : `${to}:topic:${threadId}`;
        }
    },
    outbound: telegramChannelOutbound
});

//# sourceMappingURL=channel.js.map