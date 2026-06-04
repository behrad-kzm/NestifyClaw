"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "processMessage", {
    enumerable: true,
    get: function() {
        return processMessage;
    }
});
const _channelfeedback = require("../../../../../../common/openclaw/plugin-sdk/channel-feedback");
const _channelinbound = require("../../../../../../common/openclaw/plugin-sdk/channel-inbound");
const _conversationruntime = require("../../../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _hookruntime = require("../../../../../../common/openclaw/plugin-sdk/hook-runtime");
const _pluginruntime = require("../../../../../../common/openclaw/plugin-sdk/plugin-runtime");
const _replyreference = require("../../../../../../common/openclaw/plugin-sdk/reply-reference");
const _identity = require("../../identity.js");
const _inboundpolicy = require("../../inbound-policy.js");
const _reconnect = require("../../reconnect.js");
const _session = require("../../session.js");
const _systemprompt = require("../../system-prompt.js");
const _deliverreply = require("../deliver-reply.js");
const _loggers = require("../loggers.js");
const _util = require("../util.js");
const _ackreaction = require("./ack-reaction.js");
const _inboundcontext = require("./inbound-context.js");
const _inbounddispatch = require("./inbound-dispatch.js");
const _lastroute = require("./last-route.js");
const _messageline = require("./message-line.js");
const _runtimeapi = require("./runtime-api.js");
const _statusreaction = require("./status-reaction.js");
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
const WHATSAPP_MESSAGE_RECEIVED_HOOK_LIMITS = {
    maxConcurrency: 8,
    maxQueue: 128,
    timeoutMs: 2_000
};
function readWhatsAppMessageReceivedHookOptIn(value) {
    if (!value || typeof value !== "object") {
        return undefined;
    }
    const pluginHooks = value.pluginHooks;
    if (pluginHooks?.messageReceived === undefined) {
        return undefined;
    }
    return pluginHooks.messageReceived;
}
function shouldEmitWhatsAppMessageReceivedHooks(params) {
    const channelConfig = params.cfg.channels?.whatsapp;
    const accountConfig = params.accountId && channelConfig?.accounts ? channelConfig.accounts[params.accountId] : undefined;
    return readWhatsAppMessageReceivedHookOptIn(accountConfig) ?? readWhatsAppMessageReceivedHookOptIn(channelConfig) ?? false;
}
function emitWhatsAppMessageReceivedHooks(params) {
    const canonical = (0, _hookruntime.deriveInboundMessageHookContext)(params.ctx);
    const hookRunner = (0, _pluginruntime.getGlobalHookRunner)();
    if (hookRunner?.hasHooks("message_received")) {
        (0, _hookruntime.fireAndForgetBoundedHook)(()=>hookRunner.runMessageReceived((0, _hookruntime.toPluginMessageReceivedEvent)(canonical), (0, _hookruntime.toPluginMessageContext)(canonical)), "whatsapp: message_received plugin hook failed", undefined, WHATSAPP_MESSAGE_RECEIVED_HOOK_LIMITS);
    }
    (0, _hookruntime.fireAndForgetBoundedHook)(()=>(0, _hookruntime.triggerInternalHook)((0, _hookruntime.createInternalHookEvent)("message", "received", params.sessionKey, (0, _hookruntime.toInternalMessageReceivedContext)(canonical))), "whatsapp: message_received internal hook failed", undefined, WHATSAPP_MESSAGE_RECEIVED_HOOK_LIMITS);
}
function emitWhatsAppMessageReceivedHooksIfEnabled(params) {
    if (!shouldEmitWhatsAppMessageReceivedHooks({
        cfg: params.cfg,
        accountId: params.accountId
    })) {
        return;
    }
    emitWhatsAppMessageReceivedHooks({
        ctx: params.ctx,
        sessionKey: params.sessionKey
    });
}
function resolvePinnedMainDmRecipient(params) {
    return (0, _runtimeapi.resolvePinnedMainDmOwnerFromAllowlist)({
        dmScope: params.cfg.session?.dmScope,
        allowFrom: params.allowFrom,
        normalizeEntry: (entry)=>(0, _runtimeapi.normalizeE164)(entry)
    });
}
async function processMessage(params) {
    const conversationId = params.msg.conversationId ?? params.msg.from;
    const self = (0, _identity.getSelfIdentity)(params.msg);
    const inboundPolicy = (0, _inboundpolicy.resolveWhatsAppInboundPolicy)({
        cfg: params.cfg,
        accountId: params.route.accountId ?? params.msg.accountId,
        selfE164: self.e164 ?? null
    });
    const account = inboundPolicy.account;
    const contextVisibilityMode = (0, _runtimeapi.resolveChannelContextVisibilityMode)({
        cfg: params.cfg,
        channel: "whatsapp",
        accountId: account.accountId
    });
    const { storePath, envelopeOptions, previousTimestamp } = (0, _runtimeapi.resolveInboundSessionEnvelopeContext)({
        cfg: params.cfg,
        agentId: params.route.agentId,
        sessionKey: params.route.sessionKey
    });
    // Preflight audio transcription: transcribe voice notes before building the
    // inbound context so the agent receives the transcript instead of <media:audio>.
    // Mirrors the preflight step added for Telegram in #61008.
    // When the caller already performed transcription (e.g. on-message.ts before
    // broadcast fan-out) the pre-computed result is reused to avoid N STT calls
    // for N broadcast agents on the same voice note.
    // preflightAudioTranscript semantics:
    //   string    → transcript ready, use it
    //   null      → caller attempted but got nothing; skip internal STT to avoid retry
    //   undefined → caller did not attempt; run internal STT
    let audioTranscript = params.preflightAudioTranscript ?? undefined;
    const hasAudioBody = params.msg.mediaType?.startsWith("audio/") === true && params.msg.body === "<media:audio>";
    if (params.preflightAudioTranscript === undefined && hasAudioBody && params.msg.mediaPath) {
        try {
            const { transcribeFirstAudio } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./audio-preflight.runtime.js")));
            audioTranscript = await transcribeFirstAudio({
                ctx: {
                    MediaPaths: [
                        params.msg.mediaPath
                    ],
                    MediaTypes: params.msg.mediaType ? [
                        params.msg.mediaType
                    ] : undefined,
                    From: params.msg.from,
                    To: params.msg.to,
                    Provider: "whatsapp",
                    Surface: "whatsapp",
                    OriginatingChannel: "whatsapp",
                    OriginatingTo: conversationId,
                    AccountId: params.route.accountId
                },
                cfg: params.cfg
            });
        } catch  {
            // Transcription failure is non-fatal: fall back to <media:audio> placeholder.
            if ((0, _runtimeapi.shouldLogVerbose)()) {
                (0, _runtimeapi.logVerbose)("whatsapp: audio preflight transcription failed, using placeholder");
            }
        }
    }
    // If we have a transcript, replace the agent-facing body so the agent sees the spoken text.
    // mediaPath and mediaType are intentionally preserved so that inboundAudio detection
    // (used by features such as messages.tts.auto: "inbound") still sees this as an
    // audio message. The transcript and transcribed media index are also stored on
    // context so downstream media understanding does not transcribe it again.
    const msgForAgent = audioTranscript !== undefined ? {
        ...params.msg,
        body: audioTranscript
    } : params.msg;
    let combinedBody = (0, _messageline.buildInboundLine)({
        cfg: params.cfg,
        msg: msgForAgent,
        agentId: params.route.agentId,
        previousTimestamp,
        envelope: envelopeOptions
    });
    let shouldClearGroupHistory = false;
    const visibleGroupHistory = params.msg.chatType === "group" ? (0, _inboundcontext.resolveVisibleWhatsAppGroupHistory)({
        history: params.groupHistory ?? params.groupHistories.get(params.groupHistoryKey) ?? [],
        mode: contextVisibilityMode,
        groupPolicy: inboundPolicy.groupPolicy,
        groupAllowFrom: inboundPolicy.groupAllowFrom
    }) : undefined;
    if (params.msg.chatType === "group") {
        const history = visibleGroupHistory ?? [];
        if (history.length > 0) {
            const historyEntries = history.map((m)=>({
                    sender: m.sender,
                    body: m.body,
                    timestamp: m.timestamp
                }));
            combinedBody = (0, _runtimeapi.buildHistoryContextFromEntries)({
                entries: historyEntries,
                currentMessage: combinedBody,
                excludeLast: false,
                formatEntry: (entry)=>{
                    return (0, _runtimeapi.formatInboundEnvelope)({
                        channel: "WhatsApp",
                        from: conversationId,
                        timestamp: entry.timestamp,
                        body: entry.body,
                        chatType: "group",
                        senderLabel: entry.sender,
                        envelope: envelopeOptions
                    });
                }
            });
        }
        shouldClearGroupHistory = !(params.suppressGroupHistoryClear ?? false);
    }
    // Echo detection uses combined body so we don't respond twice.
    const combinedEchoKey = params.buildCombinedEchoKey({
        sessionKey: params.route.sessionKey,
        combinedBody
    });
    if (params.echoHas(combinedEchoKey)) {
        (0, _runtimeapi.logVerbose)("Skipping auto-reply: detected echo for combined message");
        params.echoForget(combinedEchoKey);
        return false;
    }
    // When statusReactions.enabled, a StatusReactionController takes over lifecycle
    // signaling (queued → thinking → tool → done/error). The plain ackReaction is
    // skipped so the same message slot isn't used for two competing systems.
    const statusReactionController = params.statusReactionController ?? (params.cfg.messages?.statusReactions?.enabled === true && !params.ackAlreadySent ? await (0, _statusreaction.createWhatsAppStatusReactionController)({
        cfg: params.cfg,
        msg: params.msg,
        agentId: params.route.agentId,
        sessionKey: params.route.sessionKey,
        conversationId,
        verbose: params.verbose,
        accountId: account.accountId
    }) : null);
    if (statusReactionController && !params.statusReactionController) {
        void statusReactionController.setQueued();
    }
    // Send ack reaction immediately upon message receipt (post-gating). Callers
    // that do preflight work before processMessage can send it first and set
    // ackAlreadySent so slow STT does not delay user-visible receipt feedback.
    // Skip if the status reaction controller is handling lifecycle signaling.
    let ackReaction = params.ackReaction ?? null;
    if (!statusReactionController && !ackReaction && params.ackAlreadySent !== true) {
        ackReaction = await (0, _ackreaction.maybeSendAckReaction)({
            cfg: params.cfg,
            msg: params.msg,
            agentId: params.route.agentId,
            sessionKey: params.route.sessionKey,
            conversationId,
            verbose: params.verbose,
            accountId: account.accountId,
            info: params.replyLogger.info.bind(params.replyLogger),
            warn: params.replyLogger.warn.bind(params.replyLogger)
        });
    }
    const correlationId = params.msg.id ?? (0, _reconnect.newConnectionId)();
    params.replyLogger.info({
        connectionId: params.connectionId,
        correlationId,
        from: params.msg.chatType === "group" ? conversationId : params.msg.from,
        to: params.msg.to,
        body: (0, _util.elide)(combinedBody, 240),
        mediaType: params.msg.mediaType ?? null,
        mediaPath: params.msg.mediaPath ?? null
    }, "inbound web message");
    const fromDisplay = params.msg.chatType === "group" ? conversationId : params.msg.from;
    const kindLabel = params.msg.mediaType ? `, ${params.msg.mediaType}` : "";
    _loggers.whatsappInboundLog.info(`Inbound message ${fromDisplay} -> ${params.msg.to} (${params.msg.chatType}${kindLabel}, ${combinedBody.length} chars)`);
    if ((0, _runtimeapi.shouldLogVerbose)()) {
        _loggers.whatsappInboundLog.debug(`Inbound body: ${(0, _util.elide)(combinedBody, 400)}`);
    }
    const sender = (0, _identity.getSenderIdentity)(params.msg);
    const visibleReplyTo = (0, _inboundcontext.resolveVisibleWhatsAppReplyContext)({
        msg: params.msg,
        authDir: account.authDir,
        mode: contextVisibilityMode,
        groupPolicy: inboundPolicy.groupPolicy,
        groupAllowFrom: inboundPolicy.groupAllowFrom
    });
    const dmRouteTarget = (0, _inbounddispatch.resolveWhatsAppDmRouteTarget)({
        msg: params.msg,
        senderE164: sender.e164 ?? undefined,
        normalizeE164: _runtimeapi.normalizeE164
    });
    const shouldCheckCommandAuth = (0, _runtimeapi.shouldComputeCommandAuthorized)(params.msg.body, params.cfg);
    const isTextCommand = (0, _runtimeapi.isControlCommandMessage)(params.msg.body, params.cfg);
    const commandAuthorized = shouldCheckCommandAuth ? await (0, _inboundpolicy.resolveWhatsAppCommandAuthorized)({
        cfg: params.cfg,
        msg: params.msg,
        policy: inboundPolicy
    }) : undefined;
    const commandTurn = isTextCommand ? {
        kind: "text-slash",
        source: "text",
        authorized: Boolean(commandAuthorized),
        body: params.msg.body
    } : {
        kind: "normal",
        source: "message",
        authorized: false,
        body: params.msg.body
    };
    const { onModelSelected, ...replyPipeline } = (0, _runtimeapi.createChannelMessageReplyPipeline)({
        cfg: params.cfg,
        agentId: params.route.agentId,
        channel: "whatsapp",
        accountId: params.route.accountId
    });
    const responsePrefix = (0, _inbounddispatch.resolveWhatsAppResponsePrefix)({
        cfg: params.cfg,
        agentId: params.route.agentId,
        isSelfChat: params.msg.chatType !== "group" && inboundPolicy.isSelfChat,
        pipelineResponsePrefix: replyPipeline.responsePrefix
    });
    const replyThreading = (0, _replyreference.resolveBatchedReplyThreadingPolicy)(account.replyToMode ?? "off", params.msg.isBatched === true);
    // Resolve combined conversation system prompt using the group or direct surface.
    const conversationSystemPrompt = params.msg.chatType === "group" ? (0, _systemprompt.resolveWhatsAppGroupSystemPrompt)({
        accountConfig: account,
        groupId: conversationId
    }) : (0, _systemprompt.resolveWhatsAppDirectSystemPrompt)({
        accountConfig: account,
        peerId: dmRouteTarget ?? params.msg.from
    });
    const ctxPayload = await (0, _inbounddispatch.buildWhatsAppInboundContext)({
        bodyForAgent: msgForAgent.body,
        combinedBody,
        commandBody: params.msg.body,
        commandAuthorized,
        commandTurn,
        conversationId,
        groupHistory: visibleGroupHistory,
        groupMemberRoster: params.groupMemberNames.get(params.groupHistoryKey),
        groupSystemPrompt: conversationSystemPrompt,
        msg: params.msg,
        rawBody: params.msg.body,
        route: params.route,
        sender: {
            id: (0, _identity.getPrimaryIdentityId)(sender) ?? undefined,
            name: sender.name ?? undefined,
            e164: sender.e164 ?? undefined
        },
        ...audioTranscript !== undefined ? {
            transcript: audioTranscript
        } : {},
        ...audioTranscript !== undefined ? {
            mediaTranscribedIndexes: [
                0
            ]
        } : {},
        replyThreading,
        visibleReplyTo: visibleReplyTo ?? undefined
    });
    emitWhatsAppMessageReceivedHooksIfEnabled({
        cfg: params.cfg,
        ctx: ctxPayload,
        accountId: params.route.accountId,
        sessionKey: params.route.sessionKey
    });
    const pinnedMainDmRecipient = resolvePinnedMainDmRecipient({
        cfg: params.cfg,
        allowFrom: inboundPolicy.configuredAllowFrom
    });
    (0, _inbounddispatch.updateWhatsAppMainLastRoute)({
        backgroundTasks: params.backgroundTasks,
        cfg: params.cfg,
        ctx: ctxPayload,
        dmRouteTarget,
        pinnedMainDmRecipient,
        route: params.route,
        updateLastRoute: _lastroute.updateLastRouteInBackground,
        warn: params.replyLogger.warn.bind(params.replyLogger)
    });
    const turnResult = await (0, _channelinbound.runChannelInboundEvent)({
        channel: "whatsapp",
        accountId: params.route.accountId,
        raw: params.msg,
        adapter: {
            ingest: ()=>({
                    id: params.msg.id ?? `${conversationId}:${Date.now()}`,
                    timestamp: params.msg.timestamp,
                    rawText: ctxPayload.RawBody ?? "",
                    textForAgent: ctxPayload.BodyForAgent,
                    textForCommands: ctxPayload.CommandBody,
                    raw: params.msg
                }),
            resolveTurn: ()=>({
                    channel: "whatsapp",
                    accountId: params.route.accountId,
                    routeSessionKey: params.route.sessionKey,
                    storePath,
                    ctxPayload,
                    recordInboundSession: _conversationruntime.recordInboundSession,
                    record: {
                        onRecordError: (err)=>{
                            params.replyLogger.warn({
                                error: (0, _session.formatError)(err),
                                storePath,
                                sessionKey: params.route.sessionKey
                            }, "failed updating session meta");
                        },
                        trackSessionMetaTask: (task)=>{
                            (0, _lastroute.trackBackgroundTask)(params.backgroundTasks, task);
                        }
                    },
                    runDispatch: ()=>(0, _inbounddispatch.dispatchWhatsAppBufferedReply)({
                            cfg: params.cfg,
                            connectionId: params.connectionId,
                            context: ctxPayload,
                            conversationId,
                            deliverReply: _deliverreply.deliverWebReply,
                            groupHistories: params.groupHistories,
                            groupHistoryKey: params.groupHistoryKey,
                            maxMediaBytes: params.maxMediaBytes,
                            maxMediaTextChunkLimit: params.maxMediaTextChunkLimit,
                            msg: params.msg,
                            onModelSelected,
                            rememberSentText: params.rememberSentText,
                            replyLogger: params.replyLogger,
                            replyPipeline: {
                                ...replyPipeline,
                                responsePrefix
                            },
                            replyResolver: params.replyResolver,
                            route: params.route,
                            shouldClearGroupHistory,
                            statusReactionController
                        })
                })
        }
    });
    const didSendReply = turnResult.dispatched ? turnResult.dispatchResult : false;
    (0, _channelfeedback.removeAckReactionHandleAfterReply)({
        removeAfterReply: Boolean(params.cfg.messages?.removeAckAfterReply && didSendReply),
        ackReaction,
        onError: (err)=>{
            (0, _channelfeedback.logAckFailure)({
                log: _runtimeapi.logVerbose,
                channel: "whatsapp",
                target: `${params.msg.chatId ?? conversationId}/${params.msg.id ?? "unknown"}`,
                error: err
            });
        }
    });
    return didSendReply;
}

//# sourceMappingURL=process-message.js.map