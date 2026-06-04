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
    get buildWhatsAppInboundContext () {
        return buildWhatsAppInboundContext;
    },
    get dispatchWhatsAppBufferedReply () {
        return dispatchWhatsAppBufferedReply;
    },
    get resolveWhatsAppDmRouteTarget () {
        return resolveWhatsAppDmRouteTarget;
    },
    get resolveWhatsAppResponsePrefix () {
        return resolveWhatsAppResponsePrefix;
    },
    get updateWhatsAppMainLastRoute () {
        return updateWhatsAppMainLastRoute;
    }
});
const _channelfeedback = require("../../../../../../common/openclaw/plugin-sdk/channel-feedback");
const _channelinbound = require("../../../../../../common/openclaw/plugin-sdk/channel-inbound");
const _channeloutbound = require("../../../../../../common/openclaw/plugin-sdk/channel-outbound");
const _replyhistory = require("../../../../../../common/openclaw/plugin-sdk/reply-history");
const _stringcoerceruntime = require("../../../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _outboundmediacontract = require("../../outbound-media-contract.js");
const _groupmembers = require("./group-members.js");
const _inbounddispatchruntime = require("./inbound-dispatch.runtime.js");
function normalizeErrForLog(err) {
    if (err instanceof Error) {
        const ownEnumerableProps = Object.fromEntries(Object.entries(err));
        return {
            ...ownEnumerableProps,
            type: err.name,
            message: err.message,
            stack: err.stack
        };
    }
    return err;
}
function whatsAppReplyDeliveryVisibility(visibleReplySent) {
    return {
        visibleReplySent
    };
}
function whatsAppReplyDeliveryVisibilityFromDurableResult(result) {
    return whatsAppReplyDeliveryVisibility(result.visibleReplySent === true);
}
function markWhatsAppReplyDeliveryErrorVisible(error) {
    if (typeof error === "object" && error !== null && !Array.isArray(error)) {
        try {
            Object.assign(error, {
                sentBeforeError: true,
                visibleReplySent: true
            });
            return error;
        } catch  {
        // Fall back to a wrapper when a platform error object is non-extensible.
        }
    }
    const visibleError = new Error("visible WhatsApp reply delivery failed", {
        cause: error
    });
    Object.assign(visibleError, {
        sentBeforeError: true,
        visibleReplySent: true
    });
    return visibleError;
}
function markWhatsAppReplyDeliveryErrorVisibleAfterFlush(error, flushResult) {
    return flushResult.delivered > 0 ? markWhatsAppReplyDeliveryErrorVisible(error) : error;
}
function logWhatsAppReplyDeliveryError(params) {
    params.replyLogger.error({
        err: normalizeErrForLog(params.err),
        replyKind: params.info.kind,
        correlationId: params.msg.id ?? null,
        connectionId: params.connectionId,
        conversationId: params.conversationId,
        chatId: params.msg.chatId ?? null,
        to: params.msg.from ?? null,
        from: params.msg.to ?? null
    }, "auto-reply delivery failed");
}
function resolveWhatsAppDisableBlockStreaming(cfg) {
    if (typeof cfg.channels?.whatsapp?.blockStreaming !== "boolean") {
        return undefined;
    }
    return !cfg.channels.whatsapp.blockStreaming;
}
function resolveWhatsAppDeliverablePayload(payload, info) {
    if (payload.isReasoning === true || payload.isCompactionNotice === true) {
        return null;
    }
    if (payload.isError === true) {
        return null;
    }
    if (info.kind === "tool") {
        if (!(0, _inbounddispatchruntime.resolveSendableOutboundReplyParts)(payload).hasMedia) {
            return null;
        }
        return {
            ...payload,
            text: undefined
        };
    }
    return payload;
}
function getWhatsAppPayloadMediaUrls(payload) {
    return new Set((0, _stringcoerceruntime.normalizeStringEntries)([
        ...Array.isArray(payload.mediaUrls) ? payload.mediaUrls : [],
        ...typeof payload.mediaUrl === "string" ? [
            payload.mediaUrl
        ] : []
    ]));
}
function hasWhatsAppMediaUrlOverlap(left, right) {
    for (const url of left){
        if (right.has(url)) {
            return true;
        }
    }
    return false;
}
function shouldDeferWhatsAppMediaOnlyPayload(params) {
    return params.info.kind !== "final" && params.reply.hasMedia && !params.reply.text.trim() && params.mediaUrls.size > 0;
}
function createWhatsAppMediaOnlyReplyCoalescer(params) {
    const pendingMediaOnlyPayloads = [];
    const flushExceptDuplicateMedia = async (mediaUrls)=>{
        const flushResult = {
            delivered: 0,
            droppedDuplicateMedia: 0
        };
        const pending = pendingMediaOnlyPayloads.splice(0);
        for (const candidate of pending){
            if (mediaUrls && hasWhatsAppMediaUrlOverlap(candidate.mediaUrls, mediaUrls)) {
                flushResult.droppedDuplicateMedia += 1;
                continue;
            }
            try {
                const delivery = await params.deliver(candidate);
                if (delivery.visibleReplySent) {
                    flushResult.delivered += 1;
                }
            } catch (error) {
                throw markWhatsAppReplyDeliveryErrorVisibleAfterFlush(error, flushResult);
            }
        }
        return flushResult;
    };
    return {
        defer (pending) {
            pendingMediaOnlyPayloads.push(pending);
        },
        flushExceptDuplicateMedia,
        flushAll: ()=>flushExceptDuplicateMedia()
    };
}
function logWhatsAppMediaOnlyFlushResult(result) {
    if (!(0, _inbounddispatchruntime.shouldLogVerbose)()) {
        return;
    }
    if (result.droppedDuplicateMedia > 0) {
        (0, _inbounddispatchruntime.logVerbose)(`Dropped ${result.droppedDuplicateMedia} deferred media-only WhatsApp reply payload(s) superseded by captioned media`);
    }
    if (result.delivered > 0) {
        (0, _inbounddispatchruntime.logVerbose)(`Flushed ${result.delivered} deferred media-only WhatsApp reply payload(s)`);
    }
}
function resolveWhatsAppResponsePrefix(params) {
    const configuredResponsePrefix = params.cfg.messages?.responsePrefix;
    return params.pipelineResponsePrefix ?? (configuredResponsePrefix === undefined && params.isSelfChat ? (0, _inbounddispatchruntime.resolveIdentityNamePrefix)(params.cfg, params.agentId) : undefined);
}
async function buildWhatsAppInboundContext(params) {
    const inboundHistory = params.msg.chatType === "group" ? (0, _replyhistory.buildInboundHistoryFromEntries)({
        entries: (params.groupHistory ?? []).map((entry)=>({
                sender: entry.sender,
                body: entry.body,
                timestamp: entry.timestamp,
                messageId: entry.id
            })),
        limit: params.groupHistory?.length ?? 1
    }) : undefined;
    const media = (0, _channelinbound.toInboundMediaFacts)(params.msg.mediaPath || params.msg.mediaUrl ? [
        {
            path: params.msg.mediaPath,
            url: params.msg.mediaUrl ?? params.msg.mediaPath,
            contentType: params.msg.mediaType
        }
    ] : undefined, {
        transcribed: (_entry, index)=>params.mediaTranscribedIndexes?.includes(index) === true
    });
    return (0, _channelinbound.buildChannelInboundEventContext)({
        channel: "whatsapp",
        finalize: _inbounddispatchruntime.finalizeInboundContext,
        supplemental: {
            quote: params.visibleReplyTo ? {
                id: params.visibleReplyTo.id,
                body: params.visibleReplyTo.body,
                sender: params.visibleReplyTo.sender?.label ?? undefined
            } : undefined,
            groupSystemPrompt: params.groupSystemPrompt,
            untrustedContext: params.msg.untrustedStructuredContext
        },
        media,
        messageId: params.msg.id,
        timestamp: params.msg.timestamp,
        from: params.msg.from,
        sender: {
            id: params.sender.id ?? params.sender.e164,
            name: params.sender.name
        },
        conversation: {
            kind: params.msg.chatType,
            id: params.conversationId,
            label: params.msg.chatType === "group" ? params.conversationId : params.msg.from
        },
        route: {
            agentId: params.route.agentId,
            accountId: params.route.accountId,
            routeSessionKey: params.route.sessionKey
        },
        reply: {
            to: params.msg.to,
            originatingTo: params.msg.from
        },
        message: {
            body: params.combinedBody,
            bodyForAgent: params.bodyForAgent ?? params.msg.body,
            inboundHistory,
            rawBody: params.rawBody ?? params.msg.body,
            commandBody: params.commandBody ?? params.msg.body
        },
        access: {
            ...params.msg.wasMentioned !== undefined ? {
                mentions: {
                    canDetectMention: params.msg.chatType === "group",
                    wasMentioned: params.msg.wasMentioned
                }
            } : {},
            commands: {
                authorized: params.commandAuthorized
            }
        },
        commandTurn: params.commandTurn,
        extra: {
            Transcript: params.transcript,
            GroupSubject: params.msg.groupSubject,
            GroupMembers: (0, _groupmembers.formatGroupMembers)({
                participants: params.msg.groupParticipants,
                roster: params.groupMemberRoster,
                fallbackE164: params.sender.e164
            }),
            SenderE164: params.sender.e164,
            CommandSource: params.commandSource ?? (params.commandTurn?.source === "native" || params.commandTurn?.source === "text" ? params.commandTurn.source : undefined),
            ReplyThreading: params.replyThreading,
            ...params.msg.location ? (0, _inbounddispatchruntime.toLocationContext)(params.msg.location) : {}
        }
    });
}
function normalizeCommandTurnFromContext(value) {
    if (!value || typeof value !== "object") {
        return undefined;
    }
    const record = value;
    const kind = record.kind;
    const source = record.source;
    if (kind === "native" && source === "native" && typeof record.authorized === "boolean") {
        return {
            kind: "native",
            source: "native",
            authorized: record.authorized,
            commandName: typeof record.commandName === "string" ? record.commandName : undefined,
            body: typeof record.body === "string" ? record.body : undefined
        };
    }
    if (kind === "text-slash" && source === "text" && typeof record.authorized === "boolean") {
        return {
            kind: "text-slash",
            source: "text",
            authorized: record.authorized,
            commandName: typeof record.commandName === "string" ? record.commandName : undefined,
            body: typeof record.body === "string" ? record.body : undefined
        };
    }
    if (kind === "normal" && source === "message") {
        return {
            kind: "normal",
            source: "message",
            authorized: false,
            commandName: typeof record.commandName === "string" ? record.commandName : undefined,
            body: typeof record.body === "string" ? record.body : undefined
        };
    }
    return undefined;
}
function resolveWhatsAppDmRouteTarget(params) {
    if (params.msg.chatType === "group") {
        return undefined;
    }
    if (params.senderE164) {
        return params.normalizeE164(params.senderE164) ?? undefined;
    }
    if (params.msg.from.includes("@")) {
        return (0, _inbounddispatchruntime.jidToE164)(params.msg.from) ?? undefined;
    }
    return params.normalizeE164(params.msg.from) ?? undefined;
}
function updateWhatsAppMainLastRoute(params) {
    const shouldUpdateMainLastRoute = !params.pinnedMainDmRecipient || params.pinnedMainDmRecipient === params.dmRouteTarget;
    const inboundLastRouteSessionKey = (0, _inbounddispatchruntime.resolveInboundLastRouteSessionKey)({
        route: params.route,
        sessionKey: params.route.sessionKey
    });
    if (params.dmRouteTarget && inboundLastRouteSessionKey === params.route.mainSessionKey && shouldUpdateMainLastRoute) {
        params.updateLastRoute({
            cfg: params.cfg,
            backgroundTasks: params.backgroundTasks,
            storeAgentId: params.route.agentId,
            sessionKey: params.route.mainSessionKey,
            channel: "whatsapp",
            to: params.dmRouteTarget,
            accountId: params.route.accountId,
            ctx: params.ctx,
            warn: params.warn
        });
        return;
    }
    if (params.dmRouteTarget && inboundLastRouteSessionKey === params.route.mainSessionKey && params.pinnedMainDmRecipient) {
        (0, _inbounddispatchruntime.logVerbose)(`Skipping main-session last route update for ${params.dmRouteTarget} (pinned owner ${params.pinnedMainDmRecipient})`);
    }
}
async function dispatchWhatsAppBufferedReply(params) {
    const statusReactionController = params.statusReactionController ?? null;
    const statusReactionTiming = {
        ..._channelfeedback.DEFAULT_TIMING,
        ...params.cfg.messages?.statusReactions?.timing
    };
    const removeAckAfterReply = params.cfg.messages?.removeAckAfterReply ?? false;
    const textLimit = params.maxMediaTextChunkLimit ?? (0, _inbounddispatchruntime.resolveTextChunkLimit)(params.cfg, "whatsapp");
    const chunkMode = (0, _inbounddispatchruntime.resolveChunkMode)(params.cfg, "whatsapp", params.route.accountId);
    const tableMode = (0, _inbounddispatchruntime.resolveMarkdownTableMode)({
        cfg: params.cfg,
        channel: "whatsapp",
        accountId: params.route.accountId
    });
    const mediaLocalRoots = (0, _inbounddispatchruntime.getAgentScopedMediaLocalRoots)(params.cfg, params.route.agentId);
    const sourceReplyChatType = typeof params.context.ChatType === "string" ? params.context.ChatType : params.msg.chatType;
    const sourceReplyCommandSource = params.context.CommandSource === "native" || params.context.CommandSource === "text" ? params.context.CommandSource : undefined;
    const sourceReplyCommandTurn = normalizeCommandTurnFromContext(params.context.CommandTurn);
    const sourceReplyCommandAuthorized = typeof params.context.CommandAuthorized === "boolean" ? params.context.CommandAuthorized : undefined;
    const sourceReplyDeliveryMode = sourceReplyChatType === "group" || sourceReplyChatType === "channel" ? (0, _inbounddispatchruntime.resolveChannelMessageSourceReplyDeliveryMode)({
        cfg: params.cfg,
        ctx: {
            ChatType: sourceReplyChatType,
            CommandTurn: sourceReplyCommandTurn,
            CommandSource: sourceReplyCommandSource,
            CommandAuthorized: sourceReplyCommandAuthorized
        }
    }) : undefined;
    const sourceRepliesAreToolOnly = sourceReplyDeliveryMode === "message_tool_only";
    const disableBlockStreaming = sourceRepliesAreToolOnly ? true : resolveWhatsAppDisableBlockStreaming(params.cfg);
    let didSendReply = false;
    let didLogHeartbeatStrip = false;
    const deliverNormalizedPayload = async (normalizedDeliveryPayload, info)=>{
        const reply = (0, _inbounddispatchruntime.resolveSendableOutboundReplyParts)(normalizedDeliveryPayload);
        if (!reply.hasMedia && !reply.text.trim()) {
            return whatsAppReplyDeliveryVisibility(false);
        }
        const delivery = await params.deliverReply({
            replyResult: normalizedDeliveryPayload,
            normalizedReplyResult: normalizedDeliveryPayload,
            msg: params.msg,
            mediaLocalRoots,
            maxMediaBytes: params.maxMediaBytes,
            textLimit,
            chunkMode,
            replyLogger: params.replyLogger,
            connectionId: params.connectionId,
            skipLog: false,
            tableMode
        });
        if (!delivery.providerAccepted) {
            params.replyLogger.warn({
                correlationId: params.msg.id ?? null,
                connectionId: params.connectionId,
                conversationId: params.conversationId,
                chatId: params.msg.chatId,
                to: params.msg.from,
                from: params.msg.to,
                replyKind: info.kind
            }, "auto-reply was not accepted by WhatsApp provider");
            return whatsAppReplyDeliveryVisibility(false);
        }
        didSendReply = true;
        const shouldLog = normalizedDeliveryPayload.text ? true : undefined;
        params.rememberSentText(normalizedDeliveryPayload.text, {
            combinedBody: params.context.Body,
            combinedBodySessionKey: params.route.sessionKey,
            logVerboseMessage: shouldLog
        });
        const fromDisplay = params.msg.chatType === "group" ? params.conversationId : params.msg.from ?? "unknown";
        if ((0, _inbounddispatchruntime.shouldLogVerbose)()) {
            const preview = normalizedDeliveryPayload.text != null ? reply.text : "<media>";
            (0, _inbounddispatchruntime.logVerbose)(`Reply body: ${preview}${reply.hasMedia ? " (media)" : ""} -> ${fromDisplay}`);
        }
        return whatsAppReplyDeliveryVisibility(true);
    };
    const mediaOnlyCoalescer = createWhatsAppMediaOnlyReplyCoalescer({
        deliver: async (pending)=>{
            return await deliverNormalizedPayload(pending.payload, pending.info);
        }
    });
    if (statusReactionController) {
        void statusReactionController.setThinking();
    }
    const { queuedFinal, counts } = await (0, _inbounddispatchruntime.dispatchReplyWithBufferedBlockDispatcher)({
        ctx: params.context,
        cfg: params.cfg,
        replyResolver: params.replyResolver,
        dispatcherOptions: {
            ...params.replyPipeline,
            onHeartbeatStrip: ()=>{
                if (!didLogHeartbeatStrip) {
                    didLogHeartbeatStrip = true;
                    (0, _inbounddispatchruntime.logVerbose)("Stripped stray HEARTBEAT_OK token from web reply");
                }
            },
            deliver: async (payload, info)=>{
                const deliveryPayload = resolveWhatsAppDeliverablePayload(payload, info);
                if (!deliveryPayload) {
                    return whatsAppReplyDeliveryVisibility(false);
                }
                const normalizedOutboundPayload = (0, _outboundmediacontract.normalizeWhatsAppOutboundPayload)(deliveryPayload, {
                    normalizeText: _outboundmediacontract.normalizeWhatsAppPayloadTextPreservingIndentation
                });
                const normalizedDeliveryPayload = deliveryPayload.text === undefined ? {
                    ...normalizedOutboundPayload,
                    text: undefined
                } : normalizedOutboundPayload;
                const reply = (0, _inbounddispatchruntime.resolveSendableOutboundReplyParts)(normalizedDeliveryPayload);
                if (!reply.hasMedia && !reply.text.trim()) {
                    return whatsAppReplyDeliveryVisibility(false);
                }
                if (!reply.hasMedia) {
                    const flushResult = await mediaOnlyCoalescer.flushAll();
                    logWhatsAppMediaOnlyFlushResult(flushResult);
                    try {
                        const durable = await (0, _channeloutbound.deliverInboundReplyWithMessageSendContext)({
                            cfg: params.cfg,
                            channel: "whatsapp",
                            accountId: params.route.accountId,
                            agentId: params.route.agentId,
                            ctxPayload: params.context,
                            payload: normalizedDeliveryPayload,
                            info,
                            to: params.msg.from,
                            formatting: {
                                textLimit,
                                tableMode,
                                chunkMode
                            }
                        });
                        if (durable.status === "failed") {
                            if (durable.sentBeforeError === true) {
                                throw markWhatsAppReplyDeliveryErrorVisible(durable.error);
                            }
                            throw durable.error;
                        }
                        if (durable.status === "handled_visible") {
                            didSendReply = true;
                            const shouldLog = normalizedDeliveryPayload.text ? true : undefined;
                            params.rememberSentText(normalizedDeliveryPayload.text, {
                                combinedBody: params.context.Body,
                                combinedBodySessionKey: params.route.sessionKey,
                                logVerboseMessage: shouldLog
                            });
                            return whatsAppReplyDeliveryVisibilityFromDurableResult(durable.delivery);
                        }
                        if (durable.status === "handled_no_send") {
                            return flushResult.delivered > 0 ? whatsAppReplyDeliveryVisibility(true) : whatsAppReplyDeliveryVisibilityFromDurableResult(durable.delivery);
                        }
                        const delivery = await deliverNormalizedPayload(normalizedDeliveryPayload, info);
                        return flushResult.delivered > 0 && !delivery.visibleReplySent ? whatsAppReplyDeliveryVisibility(true) : delivery;
                    } catch (error) {
                        throw markWhatsAppReplyDeliveryErrorVisibleAfterFlush(error, flushResult);
                    }
                }
                const mediaUrls = getWhatsAppPayloadMediaUrls(normalizedDeliveryPayload);
                if (shouldDeferWhatsAppMediaOnlyPayload({
                    info,
                    mediaUrls,
                    reply
                })) {
                    mediaOnlyCoalescer.defer({
                        info,
                        mediaUrls,
                        payload: normalizedDeliveryPayload
                    });
                    return whatsAppReplyDeliveryVisibility(false);
                }
                const flushResult = await mediaOnlyCoalescer.flushExceptDuplicateMedia(mediaUrls);
                logWhatsAppMediaOnlyFlushResult(flushResult);
                try {
                    const delivery = await deliverNormalizedPayload(normalizedDeliveryPayload, info);
                    return flushResult.delivered > 0 && !delivery.visibleReplySent ? whatsAppReplyDeliveryVisibility(true) : delivery;
                } catch (error) {
                    throw markWhatsAppReplyDeliveryErrorVisibleAfterFlush(error, flushResult);
                }
            },
            onSettled: async ()=>{
                const flushResult = await mediaOnlyCoalescer.flushAll();
                logWhatsAppMediaOnlyFlushResult(flushResult);
                return whatsAppReplyDeliveryVisibility(flushResult.delivered > 0);
            },
            onReplyStart: params.msg.sendComposing,
            ...statusReactionController ? {
                onCompactionStart: async ()=>{
                    await statusReactionController.setCompacting();
                },
                onCompactionEnd: async ()=>{
                    statusReactionController.cancelPending();
                    await statusReactionController.setThinking();
                }
            } : {},
            onError: (err, info)=>{
                logWhatsAppReplyDeliveryError({
                    err,
                    info,
                    connectionId: params.connectionId,
                    conversationId: params.conversationId,
                    msg: params.msg,
                    replyLogger: params.replyLogger
                });
            }
        },
        replyOptions: {
            // Message-tool-only unmentioned group turns have no automatic visible reply.
            // Suppress composing there so silent background runs do not leak presence.
            suppressTyping: sourceRepliesAreToolOnly && params.msg.chatType === "group" && !params.msg.wasMentioned,
            disableBlockStreaming,
            ...sourceReplyDeliveryMode ? {
                sourceReplyDeliveryMode
            } : {},
            onModelSelected: params.onModelSelected,
            ...statusReactionController ? {
                onToolStart: async (payload)=>{
                    const toolName = payload.name?.trim();
                    if (toolName) {
                        await statusReactionController.setTool(toolName);
                    }
                }
            } : {}
        }
    });
    const didQueueVisibleReply = (0, _channelinbound.hasVisibleInboundReplyDispatch)({
        queuedFinal,
        counts
    });
    if (!didQueueVisibleReply) {
        if (statusReactionController) {
            void finalizeWhatsAppStatusReaction({
                controller: statusReactionController,
                outcome: "error",
                hasFinalResponse: false,
                removeAckAfterReply,
                timing: statusReactionTiming
            });
        }
        if (params.shouldClearGroupHistory) {
            params.groupHistories.set(params.groupHistoryKey, []);
        }
        (0, _inbounddispatchruntime.logVerbose)("Skipping auto-reply: silent token or no text/media returned from resolver");
        return false;
    }
    if (statusReactionController) {
        void finalizeWhatsAppStatusReaction({
            controller: statusReactionController,
            outcome: didSendReply ? "done" : "error",
            hasFinalResponse: didSendReply,
            removeAckAfterReply,
            timing: statusReactionTiming
        });
    }
    if (params.shouldClearGroupHistory) {
        params.groupHistories.set(params.groupHistoryKey, []);
    }
    return didSendReply;
}
async function finalizeWhatsAppStatusReaction(params) {
    if (params.outcome === "done") {
        await params.controller.setDone();
        if (params.removeAckAfterReply) {
            await new Promise((resolve)=>{
                setTimeout(resolve, params.timing.doneHoldMs);
            });
            await params.controller.clear();
        } else {
            await params.controller.restoreInitial();
        }
        return;
    }
    await params.controller.setError();
    if (params.hasFinalResponse) {
        if (params.removeAckAfterReply) {
            await new Promise((resolve)=>{
                setTimeout(resolve, params.timing.errorHoldMs);
            });
            await params.controller.clear();
        } else {
            await params.controller.restoreInitial();
        }
        return;
    }
    if (params.removeAckAfterReply) {
        await new Promise((resolve)=>{
            setTimeout(resolve, params.timing.errorHoldMs);
        });
    }
    await params.controller.restoreInitial();
}

//# sourceMappingURL=inbound-dispatch.js.map