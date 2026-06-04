"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createWebOnMessageHandler", {
    enumerable: true,
    get: function() {
        return createWebOnMessageHandler;
    }
});
const _routing = require("../../../../../../common/openclaw/plugin-sdk/routing");
const _runtimeenv = require("../../../../../../common/openclaw/plugin-sdk/runtime-env");
const _accounts = require("../../accounts.js");
const _groupsessionkey = require("../../group-session-key.js");
const _identity = require("../../identity.js");
const _textruntime = require("../../text-runtime.js");
const _mentions = require("../mentions.js");
const _ackreaction = require("./ack-reaction.js");
const _broadcast = require("./broadcast.js");
const _groupgating = require("./group-gating.js");
const _lastroute = require("./last-route.js");
const _peer = require("./peer.js");
const _processmessage = require("./process-message.js");
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
function createWebOnMessageHandler(params) {
    const processForRoute = async (cfg, msg, route, groupHistoryKey, opts)=>{
        const processParams = {
            cfg,
            msg,
            route,
            groupHistoryKey,
            groupHistories: params.groupHistories,
            groupMemberNames: params.groupMemberNames,
            connectionId: params.connectionId,
            verbose: params.verbose,
            maxMediaBytes: params.maxMediaBytes,
            replyResolver: params.replyResolver,
            replyLogger: params.replyLogger,
            backgroundTasks: params.backgroundTasks,
            rememberSentText: params.echoTracker.rememberText,
            echoHas: params.echoTracker.has,
            echoForget: params.echoTracker.forget,
            buildCombinedEchoKey: params.echoTracker.buildCombinedKey
        };
        if (opts?.groupHistory !== undefined) {
            processParams.groupHistory = opts.groupHistory;
        }
        if (opts?.suppressGroupHistoryClear !== undefined) {
            processParams.suppressGroupHistoryClear = opts.suppressGroupHistoryClear;
        }
        if (opts?.preflightAudioTranscript !== undefined) {
            processParams.preflightAudioTranscript = opts.preflightAudioTranscript;
        }
        if (opts?.ackAlreadySent === true) {
            processParams.ackAlreadySent = true;
        }
        if (opts?.ackReaction !== undefined) {
            processParams.ackReaction = opts.ackReaction;
        }
        if (opts?.statusReactionController !== undefined) {
            processParams.statusReactionController = opts.statusReactionController;
        }
        return (0, _processmessage.processMessage)(processParams);
    };
    return async (msg)=>{
        const cfg = params.loadConfig?.() ?? params.cfg;
        const conversationId = msg.conversationId ?? msg.from;
        const peerId = (0, _peer.resolvePeerId)(msg);
        const baseRoute = (0, _routing.resolveAgentRoute)({
            cfg,
            channel: "whatsapp",
            accountId: msg.accountId,
            peer: {
                kind: msg.chatType === "group" ? "group" : "direct",
                id: peerId
            }
        });
        const route = msg.chatType === "group" ? (0, _groupsessionkey.resolveWhatsAppGroupSessionRoute)(baseRoute) : baseRoute;
        const groupHistoryKey = msg.chatType === "group" ? (0, _routing.buildGroupHistoryKey)({
            channel: "whatsapp",
            accountId: route.accountId,
            peerKind: "group",
            peerId
        }) : route.sessionKey;
        const account = (0, _accounts.resolveWhatsAppAccount)({
            cfg,
            accountId: route.accountId ?? msg.accountId ?? params.account.accountId
        });
        const baseMentionConfig = (0, _mentions.buildMentionConfig)(cfg);
        // Same-phone mode logging retained
        if (msg.from === msg.to) {
            (0, _runtimeenv.logVerbose)(`📱 Same-phone mode detected (from === to: ${msg.from})`);
        }
        // Skip if this is a message we just sent (echo detection)
        if (params.echoTracker.has(msg.body)) {
            (0, _runtimeenv.logVerbose)("Skipping auto-reply: detected echo (message matches recently sent text)");
            params.echoTracker.forget(msg.body);
            return;
        }
        // Preflight audio transcription: run once before broadcast fan-out so all
        // agents share the same transcript instead of each making a separate STT call.
        // For DMs, only do this on the real inbound path after access-control/pairing
        // checks have already passed in inbound/monitor.ts. For groups, the first
        // gating pass must approve the group/sender before STT is attempted.
        // null = preflight was attempted but produced no transcript (failed / disabled / no audio);
        // undefined = preflight was not attempted (non-audio message).
        let preflightAudioTranscript;
        const hasAudioBody = msg.mediaType?.startsWith("audio/") === true && msg.body === "<media:audio>";
        const canRunEarlyAudioPreflight = msg.chatType === "group" || msg.accessControlPassed === true;
        let ackAlreadySent = false;
        let ackReaction = null;
        let statusReactionController = null;
        const runAudioPreflightOnce = async ()=>{
            if (preflightAudioTranscript !== undefined || !canRunEarlyAudioPreflight || !hasAudioBody || !msg.mediaPath) {
                return;
            }
            if (cfg.messages?.statusReactions?.enabled === true) {
                statusReactionController = await (0, _statusreaction.createWhatsAppStatusReactionController)({
                    cfg,
                    msg,
                    agentId: route.agentId,
                    sessionKey: route.sessionKey,
                    conversationId,
                    verbose: params.verbose,
                    accountId: route.accountId
                });
                if (statusReactionController) {
                    await statusReactionController.setQueued();
                }
            } else {
                ackReaction = await (0, _ackreaction.maybeSendAckReaction)({
                    cfg,
                    msg,
                    agentId: route.agentId,
                    sessionKey: route.sessionKey,
                    conversationId,
                    verbose: params.verbose,
                    accountId: route.accountId,
                    info: params.replyLogger.info.bind(params.replyLogger),
                    warn: params.replyLogger.warn.bind(params.replyLogger)
                });
                ackAlreadySent = ackReaction !== null;
            }
            try {
                const { transcribeFirstAudio } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./audio-preflight.runtime.js")));
                // transcribeFirstAudio returns undefined on failure/disabled; store null so
                // processMessage knows the attempt was already made and does not retry.
                preflightAudioTranscript = await transcribeFirstAudio({
                    ctx: {
                        MediaPaths: [
                            msg.mediaPath
                        ],
                        MediaTypes: msg.mediaType ? [
                            msg.mediaType
                        ] : undefined,
                        From: msg.from,
                        To: msg.to,
                        Provider: "whatsapp",
                        Surface: "whatsapp",
                        OriginatingChannel: "whatsapp",
                        OriginatingTo: conversationId,
                        AccountId: route.accountId
                    },
                    cfg
                }) ?? null;
            } catch  {
                // Non-fatal: store null so per-agent retries are suppressed.
                preflightAudioTranscript = null;
            }
        };
        if (msg.chatType === "group") {
            const sender = (0, _identity.getSenderIdentity)(msg);
            const metaCtx = {
                From: msg.from,
                To: msg.to,
                SessionKey: route.sessionKey,
                AccountId: route.accountId,
                ChatType: msg.chatType,
                ConversationLabel: conversationId,
                GroupSubject: msg.groupSubject,
                SenderName: sender.name ?? undefined,
                SenderId: (0, _identity.getPrimaryIdentityId)(sender) ?? undefined,
                SenderE164: sender.e164 ?? undefined,
                Provider: "whatsapp",
                Surface: "whatsapp",
                OriginatingChannel: "whatsapp",
                OriginatingTo: conversationId
            };
            (0, _lastroute.updateLastRouteInBackground)({
                cfg,
                backgroundTasks: params.backgroundTasks,
                storeAgentId: route.agentId,
                sessionKey: route.sessionKey,
                channel: "whatsapp",
                to: conversationId,
                accountId: route.accountId,
                ctx: metaCtx,
                warn: params.replyLogger.warn.bind(params.replyLogger)
            });
            let gating = await (0, _groupgating.applyGroupGating)({
                cfg,
                msg,
                deferMissingMention: hasAudioBody && Boolean(msg.mediaPath),
                conversationId,
                groupHistoryKey,
                agentId: route.agentId,
                sessionKey: route.sessionKey,
                baseMentionConfig,
                providerMentionPatterns: account.mentionPatterns,
                authDir: account.authDir,
                selfChatMode: account.selfChatMode,
                groupHistories: params.groupHistories,
                groupHistoryLimit: params.groupHistoryLimit,
                groupMemberNames: params.groupMemberNames,
                logVerbose: _runtimeenv.logVerbose,
                replyLogger: params.replyLogger
            });
            if (!gating.shouldProcess && "needsMentionText" in gating && gating.needsMentionText === true) {
                await runAudioPreflightOnce();
                gating = await (0, _groupgating.applyGroupGating)({
                    cfg,
                    msg,
                    ...typeof preflightAudioTranscript === "string" ? {
                        mentionText: preflightAudioTranscript
                    } : {},
                    conversationId,
                    groupHistoryKey,
                    agentId: route.agentId,
                    sessionKey: route.sessionKey,
                    baseMentionConfig,
                    providerMentionPatterns: account.mentionPatterns,
                    authDir: account.authDir,
                    selfChatMode: account.selfChatMode,
                    groupHistories: params.groupHistories,
                    groupHistoryLimit: params.groupHistoryLimit,
                    groupMemberNames: params.groupMemberNames,
                    logVerbose: _runtimeenv.logVerbose,
                    replyLogger: params.replyLogger
                });
            }
            if (!gating.shouldProcess) {
                return;
            }
        } else if (!msg.sender?.e164 && !msg.senderE164 && peerId && peerId.startsWith("+")) {
            // Ensure `peerId` for DMs is stable and stored as E.164 when possible.
            const normalized = (0, _textruntime.normalizeE164)(peerId);
            if (normalized) {
                msg.sender = {
                    ...msg.sender,
                    e164: normalized
                };
                msg.senderE164 = normalized;
            }
        }
        await runAudioPreflightOnce();
        // Broadcast groups: when we'd reply anyway, run multiple agents.
        // Does not bypass group mention/activation gating above.
        if (await (0, _broadcast.maybeBroadcastMessage)({
            cfg,
            msg,
            peerId,
            route,
            groupHistoryKey,
            groupHistories: params.groupHistories,
            ...preflightAudioTranscript !== undefined ? {
                preflightAudioTranscript
            } : {},
            // Group ack eligibility depends on the target agent/session, so a
            // preflight ack attempt on the base route must not suppress downstream
            // per-agent checks during broadcast fan-out.
            ...ackAlreadySent && msg.chatType !== "group" ? {
                ackAlreadySent: true
            } : {},
            ...ackReaction && msg.chatType !== "group" ? {
                ackReaction
            } : {},
            ...statusReactionController && msg.chatType !== "group" ? {
                ackAlreadySent: true
            } : {},
            processMessage: (m, r, k, opts)=>processForRoute(cfg, m, r, k, opts)
        })) {
            return;
        }
        await processForRoute(cfg, msg, route, groupHistoryKey, {
            ...preflightAudioTranscript !== undefined ? {
                preflightAudioTranscript
            } : {},
            ...ackAlreadySent ? {
                ackAlreadySent: true
            } : {},
            ...ackReaction ? {
                ackReaction
            } : {},
            ...statusReactionController ? {
                statusReactionController
            } : {}
        });
    };
}

//# sourceMappingURL=on-message.js.map