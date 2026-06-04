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
    get WHATSAPP_GROUP_METADATA_CACHE_MAX_ENTRIES () {
        return WHATSAPP_GROUP_METADATA_CACHE_MAX_ENTRIES;
    },
    get attachWebInboxToSocket () {
        return attachWebInboxToSocket;
    },
    get monitorWebInbox () {
        return monitorWebInbox;
    }
});
const _channelactivityruntime = require("../../../../../common/openclaw/plugin-sdk/channel-activity-runtime");
const _channelinbound = require("../../../../../common/openclaw/plugin-sdk/channel-inbound");
const _channelinbounddebounce = require("../../../../../common/openclaw/plugin-sdk/channel-inbound-debounce");
const _loggingcore = require("../../../../../common/openclaw/plugin-sdk/logging-core");
const _numberruntime = require("../../../../../common/openclaw/plugin-sdk/number-runtime");
const _runtimeenv = require("../../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _approvalreactions = require("../approval-reactions.js");
const _authstore = require("../auth-store.js");
const _identity = require("../identity.js");
const _imagepreview = require("../image-preview.js");
const _quotedmessage = require("../quoted-message.js");
const _reconnect = require("../reconnect.js");
const _session = require("../session.js");
const _sockettiming = require("../socket-timing.js");
const _textruntime = require("../text-runtime.js");
const _accesscontrol = require("./access-control.js");
const _dedupe = require("./dedupe.js");
const _durablereceive = require("./durable-receive.js");
const _extract = require("./extract.js");
const _lifecycle = require("./lifecycle.js");
const _media = require("./media.js");
const _outboundmentions = require("./outbound-mentions.js");
const _runtimeapi = require("./runtime-api.js");
const _sendapi = require("./send-api.js");
const _sendresult = require("./send-result.js");
const LOGGED_OUT_STATUS = _runtimeapi.DisconnectReason?.loggedOut ?? 401;
const RECONNECT_IN_PROGRESS_ERROR = "no active socket - reconnection in progress";
const GROUP_META_TTL_MS = 5 * 60 * 1000; // 5 minutes
const INBOUND_CLOSE_DRAIN_TIMEOUT_MS = 5_000;
const WHATSAPP_GROUP_METADATA_CACHE_MAX_ENTRIES = 500;
function resolveGroupMetadataExpiresAt(nowRaw = Date.now()) {
    const now = (0, _numberruntime.asDateTimestampMs)(nowRaw);
    return now === undefined ? undefined : (0, _numberruntime.resolveExpiresAtMsFromDurationMs)(GROUP_META_TTL_MS, {
        nowMs: now
    });
}
function parseWhatsAppTimestampSeconds(value) {
    if (value == null) {
        return undefined;
    }
    if (typeof value === "string") {
        return (0, _numberruntime.parseStrictFiniteNumber)(value);
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}
function rememberGroupMetadataCacheEntry(cache, jid, entry) {
    if ((0, _numberruntime.asDateTimestampMs)(entry.expires) === undefined) {
        cache.delete(jid);
        return;
    }
    if (cache.has(jid)) {
        cache.delete(jid);
    }
    cache.set(jid, entry);
    while(cache.size > WHATSAPP_GROUP_METADATA_CACHE_MAX_ENTRIES){
        const oldest = cache.keys().next();
        if (oldest.done) {
            break;
        }
        cache.delete(oldest.value);
    }
}
function readGroupMetadataCacheEntry(cache, jid) {
    const entry = cache.get(jid);
    if (!entry) {
        return null;
    }
    const now = (0, _numberruntime.asDateTimestampMs)(Date.now());
    const expires = (0, _numberruntime.asDateTimestampMs)(entry.expires);
    if (now === undefined || expires === undefined || expires <= now) {
        cache.delete(jid);
        return null;
    }
    cache.delete(jid);
    cache.set(jid, entry);
    return entry;
}
function logWhatsAppVerbose(enabled, message) {
    if (!enabled) {
        return;
    }
    _runtimeenv.defaultRuntime.log(message);
}
function isGroupJid(jid) {
    return (typeof _runtimeapi.isJidGroup === "function" ? (0, _runtimeapi.isJidGroup)(jid) : jid.endsWith("@g.us")) === true;
}
function recordAcceptedInboundActivity(accountId) {
    (0, _channelactivityruntime.recordChannelActivity)({
        channel: "whatsapp",
        accountId,
        direction: "inbound"
    });
}
function isRetryableSendDisconnectError(err) {
    return /closed|reset|timed\s*out|disconnect|no active socket/i.test((0, _session.formatError)(err));
}
function shouldClearSocketRefAfterSendFailure(err) {
    return /closed|reset|disconnect|no active socket/i.test((0, _session.formatError)(err));
}
function isNonEmptyString(value) {
    return Boolean(value);
}
async function attachWebInboxToSocket(options) {
    const inboundLogger = (0, _loggingcore.getChildLogger)({
        module: "web-inbound"
    });
    const inboundConsoleLog = (0, _runtimeenv.createSubsystemLogger)("gateway/channels/whatsapp").child("inbound");
    const sock = options.sock;
    const connectedAtMs = Date.now();
    if (options.socketRef) {
        options.socketRef.current = sock;
    }
    const getCurrentSock = ()=>options.socketRef ? options.socketRef.current : sock;
    const shouldRetryDisconnect = ()=>options.shouldRetryDisconnect?.() === true;
    const disconnectRetryPolicy = options.disconnectRetryPolicy ?? _reconnect.DEFAULT_RECONNECT_POLICY;
    const sendRetryMaxAttempts = disconnectRetryPolicy.maxAttempts > 0 ? disconnectRetryPolicy.maxAttempts : _reconnect.DEFAULT_RECONNECT_POLICY.maxAttempts;
    let onCloseResolve = null;
    const onClose = new Promise((resolve)=>{
        onCloseResolve = resolve;
    });
    const resolveClose = (reason)=>{
        if (!onCloseResolve) {
            return;
        }
        const resolver = onCloseResolve;
        onCloseResolve = null;
        resolver(reason);
    };
    const presence = options.selfChatMode ? "unavailable" : "available";
    try {
        await sock.sendPresenceUpdate(presence);
        logWhatsAppVerbose(options.verbose, `Sent global '${presence}' presence on connect`);
    } catch (err) {
        logWhatsAppVerbose(options.verbose, `Failed to send '${presence}' presence on connect: ${String(err)}`);
    }
    const selfIdentity = await (0, _authstore.readWebSelfIdentityForDecision)(options.authDir, sock.user);
    if (selfIdentity.outcome === "unstable") {
        throw new _authstore.WhatsAppAuthUnstableError("WhatsApp auth state is still stabilizing; retrying inbox attach.");
    }
    const self = selfIdentity.identity;
    const durableInboundJournal = (0, _durablereceive.createWhatsAppDurableInboundReceiveJournal)(options.accountId);
    const inboundDebounceMs = Math.max(0, Math.trunc(options.debounceMs ?? 0));
    const pendingDebounceKeys = new Set();
    const activeInboundFlushes = new Set();
    const buildInboundDebounceKey = (msg)=>{
        const sender = msg.sender;
        const senderKey = msg.chatType === "group" ? (0, _identity.getPrimaryIdentityId)(sender ?? null) ?? msg.senderJid ?? msg.senderE164 ?? msg.senderName ?? msg.from : msg.from;
        if (!senderKey) {
            return null;
        }
        const conversationKey = msg.chatType === "group" ? msg.chatId : msg.from;
        return `${msg.accountId}:${conversationKey}:${senderKey}`;
    };
    const shouldDebounceInboundMessage = (msg)=>options.shouldDebounce?.(msg) ?? true;
    const orderDebouncedInboundEntries = (entries)=>entries.toSorted((a, b)=>{
            const timestampDiff = (a.timestamp ?? 0) - (b.timestamp ?? 0);
            if (timestampDiff !== 0) {
                return timestampDiff;
            }
            return (a.receiveOrder ?? 0) - (b.receiveOrder ?? 0);
        });
    const finalizeInboundDelivery = async (entries, error)=>{
        const dedupeKeys = (0, _stringcoerceruntime.uniqueStrings)(entries.map((entry)=>entry.dedupeKey).filter(isNonEmptyString));
        const durableEntries = entries.filter((entry)=>isNonEmptyString(entry.durableId));
        const readReceiptEntries = entries.filter((entry)=>Boolean(entry.readReceipt));
        if (error instanceof _dedupe.WhatsAppRetryableInboundError) {
            dedupeKeys.forEach((dedupeKey)=>(0, _dedupe.releaseRecentInboundMessage)(dedupeKey, error));
            await Promise.all(durableEntries.map((entry)=>durableInboundJournal.release(entry.durableId, {
                    lastError: (0, _session.formatError)(error)
                })));
            return;
        }
        await Promise.all([
            ...dedupeKeys.map((dedupeKey)=>(0, _dedupe.commitRecentInboundMessage)(dedupeKey)),
            ...durableEntries.map((entry)=>durableInboundJournal.complete(entry.durableId, entry.readReceipt ? {
                    metadata: {
                        readReceipt: entry.readReceipt
                    }
                } : undefined))
        ]);
        await Promise.all(readReceiptEntries.map((entry)=>maybeMarkInboundAsRead(entry.readReceipt)));
    };
    const debouncer = (0, _channelinbounddebounce.createInboundDebouncer)({
        debounceMs: inboundDebounceMs,
        buildKey: (msg)=>msg.debounceKey ?? buildInboundDebounceKey(msg),
        shouldDebounce: shouldDebounceInboundMessage,
        onFlush: async (entries)=>{
            let finishFlush;
            const flushTask = new Promise((resolve)=>{
                finishFlush = resolve;
            });
            activeInboundFlushes.add(flushTask);
            try {
                const orderedEntries = orderDebouncedInboundEntries(entries);
                const last = orderedEntries.at(-1);
                if (!last) {
                    return;
                }
                try {
                    if (orderedEntries.length === 1) {
                        await options.onMessage(last);
                        await finalizeInboundDelivery(orderedEntries);
                        return;
                    }
                    const mentioned = new Set();
                    for (const entry of orderedEntries){
                        for (const jid of entry.mentions ?? entry.mentionedJids ?? []){
                            mentioned.add(jid);
                        }
                    }
                    const combinedBody = orderedEntries.map((entry)=>entry.body).filter(Boolean).join("\n");
                    const combinedMessage = {
                        ...last,
                        body: combinedBody,
                        mentions: mentioned.size > 0 ? Array.from(mentioned) : undefined,
                        mentionedJids: mentioned.size > 0 ? Array.from(mentioned) : undefined,
                        isBatched: true
                    };
                    await options.onMessage(combinedMessage);
                    await finalizeInboundDelivery(orderedEntries);
                } catch (error) {
                    await finalizeInboundDelivery(orderedEntries, error);
                    throw error;
                }
            } finally{
                for (const entry of entries){
                    if (entry.debounceKey) {
                        pendingDebounceKeys.delete(entry.debounceKey);
                    }
                }
                activeInboundFlushes.delete(flushTask);
                finishFlush();
            }
        },
        onError: (err)=>{
            inboundLogger.error({
                error: String(err)
            }, "failed handling inbound web message");
            inboundConsoleLog.error(`Failed handling inbound web message: ${String(err)}`);
        }
    });
    const groupMetadataCache = options.groupMetadataCache ?? new Map();
    const groupMetaCache = new Map();
    const lidLookup = sock.signalRepository?.lidMapping;
    const resolveInboundJid = async (jid)=>(0, _textruntime.resolveJidToE164)(jid, {
            authDir: options.authDir,
            lidLookup
        });
    const rememberOutboundMessage = (remoteJid, result)=>{
        const messageId = typeof result === "object" && result && "key" in result ? result.key?.id ?? "" : "";
        if (!messageId) {
            return;
        }
        (0, _dedupe.rememberRecentOutboundMessage)({
            accountId: options.accountId,
            remoteJid,
            messageId
        });
    };
    const sendTrackedMessage = async (jid, content, sendOptions)=>{
        let lastErr = new Error(RECONNECT_IN_PROGRESS_ERROR);
        for(let attempt = 1;; attempt++){
            const currentSock = getCurrentSock();
            if (currentSock) {
                try {
                    const result = sendOptions ? await currentSock.sendMessage(jid, content, sendOptions) : await currentSock.sendMessage(jid, content);
                    rememberOutboundMessage(jid, result);
                    return result;
                } catch (err) {
                    if (!shouldRetryDisconnect() || !isRetryableSendDisconnectError(err)) {
                        throw err;
                    }
                    lastErr = err;
                    if (shouldClearSocketRefAfterSendFailure(err) && options.socketRef?.current === currentSock) {
                        options.socketRef.current = null;
                    }
                }
            } else if (!shouldRetryDisconnect()) {
                throw lastErr;
            }
            if (attempt >= sendRetryMaxAttempts) {
                throw lastErr;
            }
            const delayMs = (0, _reconnect.computeBackoff)(disconnectRetryPolicy, attempt);
            logWhatsAppVerbose(options.verbose, `Waiting ${delayMs}ms for WhatsApp reconnect before retrying send to ${jid}: ${(0, _session.formatError)(lastErr)}`);
            try {
                await (0, _reconnect.sleepWithAbort)(delayMs, options.disconnectRetryAbortSignal);
            } catch  {
                throw lastErr;
            }
        }
    };
    const summarizeGroupMeta = async (meta)=>{
        const participantEntries = await Promise.all(meta.participants?.map(async (p)=>{
            const mapped = await resolveInboundJid(p.id);
            return {
                display: mapped ?? p.id,
                mention: {
                    id: p.id,
                    lid: p.lid,
                    phoneNumber: p.phoneNumber,
                    e164: mapped
                }
            };
        }) ?? []);
        const participants = participantEntries.map((entry)=>entry.display).filter(Boolean);
        const mentionParticipants = participantEntries.map((entry)=>entry.mention);
        return {
            subject: meta.subject,
            participants,
            mentionParticipants,
            expires: resolveGroupMetadataExpiresAt() ?? 0
        };
    };
    const summarizeGroupMetaForReconnectCache = (meta)=>({
            subject: meta.subject,
            expires: resolveGroupMetadataExpiresAt() ?? Number.NaN
        });
    const getGroupMeta = async (jid)=>{
        const cached = readGroupMetadataCacheEntry(groupMetaCache, jid);
        if (cached) {
            return cached;
        }
        try {
            const meta = await (getCurrentSock() ?? sock).groupMetadata(jid);
            const entry = await summarizeGroupMeta(meta);
            rememberGroupMetadataCacheEntry(groupMetadataCache, jid, {
                subject: entry.subject,
                expires: entry.expires
            });
            rememberGroupMetadataCacheEntry(groupMetaCache, jid, entry);
            return entry;
        } catch (err) {
            const hydrated = readGroupMetadataCacheEntry(groupMetadataCache, jid);
            if (hydrated) {
                rememberGroupMetadataCacheEntry(groupMetaCache, jid, hydrated);
                logWhatsAppVerbose(options.verbose, `Using cached group metadata for ${jid} after fetch failure: ${String(err)}`);
                return hydrated;
            }
            logWhatsAppVerbose(options.verbose, `Failed to fetch group metadata for ${jid}: ${String(err)}`);
            return {
                expires: resolveGroupMetadataExpiresAt() ?? 0
            };
        }
    };
    const resolveOutboundMentionsForGroup = async (jid, text)=>{
        if (!isGroupJid(jid) || !(0, _outboundmentions.mayContainWhatsAppOutboundMention)(text)) {
            return {
                text,
                mentionedJids: []
            };
        }
        const meta = await getGroupMeta(jid);
        return (0, _outboundmentions.resolveWhatsAppOutboundMentions)({
            chatJid: jid,
            text,
            participants: meta.mentionParticipants
        });
    };
    const applyOutboundMentionsToContent = async (jid, content)=>{
        if ("text" in content && typeof content.text === "string") {
            const resolved = await resolveOutboundMentionsForGroup(jid, content.text);
            return (0, _outboundmentions.addWhatsAppOutboundMentionsToContent)({
                ...content,
                text: resolved.text
            }, resolved.mentionedJids);
        }
        const caption = content.caption;
        if (typeof caption === "string") {
            const resolved = await resolveOutboundMentionsForGroup(jid, caption);
            return (0, _outboundmentions.addWhatsAppOutboundMentionsToContent)({
                ...content,
                caption: resolved.text
            }, resolved.mentionedJids);
        }
        return content;
    };
    const normalizeInboundMessage = async (msg)=>{
        const id = msg.key?.id ?? undefined;
        const remoteJid = msg.key?.remoteJid;
        if (!remoteJid) {
            return null;
        }
        if (remoteJid.endsWith("@status") || remoteJid.endsWith("@broadcast")) {
            return null;
        }
        const group = isGroupJid(remoteJid);
        // Drop echoes of messages the gateway itself sent (tracked by sendTrackedMessage).
        // Applies to both groups and DMs/self-chat — without this, self-chat mode
        // re-processes the bot's own replies as new inbound user messages.
        if (Boolean(msg.key?.fromMe) && id && (0, _dedupe.isRecentOutboundMessage)({
            accountId: options.accountId,
            remoteJid,
            messageId: id
        })) {
            logWhatsAppVerbose(options.verbose, `Skipping recent outbound WhatsApp echo ${id} for ${remoteJid}`);
            return null;
        }
        // Gate pairing access-control on extractable inbound user content. Baileys
        // delivers receipts, typing indicators, presence updates, and protocol
        // messages on the same `messages.upsert` stream as real messages; without
        // this gate, `checkInboundAccessControl` can send an unsolicited pairing
        // verification reply to a `dmPolicy: pairing` peer who never typed
        // anything (e.g. when Master sends an outbound message to a new JID and
        // the receipt round-trip arrives before the recipient ever replies).
        // Echoes of our own outbound messages are already handled above.
        if (!(0, _extract.hasInboundUserContent)(msg.message ?? undefined)) {
            return null;
        }
        const participantJid = msg.key?.participant ?? undefined;
        const from = group ? remoteJid : await resolveInboundJid(remoteJid);
        if (!from) {
            return null;
        }
        const senderE164 = group ? participantJid ? await resolveInboundJid(participantJid) : null : from;
        let groupSubject;
        let groupParticipants;
        if (group) {
            const meta = await getGroupMeta(remoteJid);
            groupSubject = meta.subject;
            groupParticipants = meta.participants;
        }
        const messageTimestampSeconds = parseWhatsAppTimestampSeconds(msg.messageTimestamp);
        const messageTimestampMs = messageTimestampSeconds !== undefined ? messageTimestampSeconds * 1000 : undefined;
        const accessCfg = options.loadConfig?.() ?? options.cfg;
        const access = await (0, _accesscontrol.checkInboundAccessControl)({
            cfg: accessCfg,
            accountId: options.accountId,
            from,
            selfE164: self.e164 ?? null,
            senderE164,
            group,
            pushName: msg.pushName ?? undefined,
            isFromMe: Boolean(msg.key?.fromMe),
            messageTimestampMs,
            connectedAtMs,
            verbose: options.verbose,
            sock: {
                sendMessage: (jid, content)=>sendTrackedMessage(jid, content)
            },
            remoteJid
        });
        if (!access.allowed) {
            return null;
        }
        return {
            id,
            remoteJid,
            group,
            participantJid,
            from,
            senderE164,
            groupSubject,
            groupParticipants,
            messageTimestampMs,
            access
        };
    };
    const buildReadReceiptTarget = (inbound)=>inbound.id ? {
            remoteJid: inbound.remoteJid,
            id: inbound.id,
            ...inbound.participantJid ? {
                participant: inbound.participantJid
            } : {}
        } : undefined;
    const maybeMarkInboundAsRead = async (target)=>{
        if (!target || options.sendReadReceipts === false) {
            return;
        }
        const { id, remoteJid, participant } = target;
        try {
            await (getCurrentSock() ?? sock).readMessages([
                {
                    remoteJid,
                    id,
                    participant,
                    fromMe: false
                }
            ]);
            const suffix = participant ? ` (participant ${participant})` : "";
            logWhatsAppVerbose(options.verbose, `Marked message ${id} as read for ${remoteJid}${suffix}`);
        } catch (err) {
            logWhatsAppVerbose(options.verbose, `Failed to mark message ${id} read: ${String(err)}`);
        }
    };
    const maybeLogSkippedSelfChatReadReceipt = (inbound, target)=>{
        if (target?.id && inbound.access.isSelfChat && options.verbose) {
            // Self-chat mode: never auto-send read receipts (blue ticks) on behalf of the owner.
            logWhatsAppVerbose(options.verbose, `Self-chat mode: skipping read receipt for ${target.id}`);
        }
    };
    const maybeMarkReadReceiptAfterCompletedDelivery = async (inbound, target)=>{
        if (inbound.access.isSelfChat) {
            maybeLogSkippedSelfChatReadReceipt(inbound, target);
            return;
        }
        await maybeMarkInboundAsRead(target);
    };
    const maybeMarkReadReceiptForSkippedAppend = async (inbound, target)=>{
        if (inbound.access.isSelfChat) {
            maybeLogSkippedSelfChatReadReceipt(inbound, target);
            return;
        }
        await maybeMarkInboundAsRead(target);
    };
    const completeUndeliverableDurableInbound = async (durableId, metadata)=>{
        if (!durableId) {
            return;
        }
        await durableInboundJournal.complete(durableId, metadata?.readReceipt ? {
            metadata: {
                readReceipt: metadata.readReceipt
            }
        } : undefined);
    };
    const buildDurableInboundPayload = (msg, upsertType)=>({
            message: (0, _durablereceive.serializeWhatsAppDurableInboundMessage)(msg),
            ...upsertType ? {
                upsertType
            } : {},
            receivedAt: Date.now()
        });
    const shouldSkipStaleAppend = (msg, upsertType)=>{
        if (upsertType !== "append") {
            return false;
        }
        const APPEND_RECENT_GRACE_MS = 60_000;
        const msgTsSeconds = parseWhatsAppTimestampSeconds(msg.messageTimestamp);
        const msgTsMs = msgTsSeconds !== undefined ? msgTsSeconds * 1000 : 0;
        return msgTsMs < connectedAtMs - APPEND_RECENT_GRACE_MS;
    };
    const processDurableInboundMessage = async (msg, upsertType, receiveOrder, stored)=>{
        const inbound = await normalizeInboundMessage(msg);
        if (!inbound) {
            if (stored) {
                await completeUndeliverableDurableInbound(stored.id, stored.metadata);
            }
            return;
        }
        const readReceipt = stored?.metadata?.readReceipt ?? buildReadReceiptTarget(inbound);
        const deliveryReadReceipt = inbound.access.isSelfChat ? undefined : readReceipt;
        if (!stored && shouldSkipStaleAppend(msg, upsertType)) {
            await maybeMarkReadReceiptForSkippedAppend(inbound, readReceipt);
            return;
        }
        let durableId = stored?.id ?? (inbound.id ? (0, _durablereceive.createWhatsAppDurableInboundMessageId)({
            remoteJid: inbound.remoteJid,
            id: inbound.id
        }) : undefined);
        const durableMetadata = deliveryReadReceipt ? {
            readReceipt: deliveryReadReceipt
        } : undefined;
        if (durableId && !stored) {
            try {
                const accepted = await durableInboundJournal.accept(durableId, buildDurableInboundPayload(msg, upsertType), {
                    metadata: durableMetadata,
                    receivedAt: inbound.messageTimestampMs
                });
                if (accepted.kind === "completed") {
                    await maybeMarkReadReceiptAfterCompletedDelivery(inbound, accepted.record.metadata?.readReceipt ?? deliveryReadReceipt);
                    return;
                }
                if (accepted.kind === "pending" && accepted.record.attempts === 0) {
                    return;
                }
            } catch (err) {
                durableId = undefined;
                const error = (0, _session.formatError)(err);
                inboundLogger.warn({
                    error
                }, "failed persisting durable WhatsApp inbound; delivering live");
                inboundConsoleLog.warn(`Failed persisting durable WhatsApp inbound; delivering live: ${error}`);
            }
        }
        const enriched = await enrichInboundMessage(msg);
        if (!enriched) {
            await completeUndeliverableDurableInbound(durableId, durableMetadata);
            await maybeMarkReadReceiptAfterCompletedDelivery(inbound, deliveryReadReceipt);
            return;
        }
        const dedupeKey = inbound.id ? `${options.accountId}:${inbound.remoteJid}:${inbound.id}` : "";
        const dedupeClaim = dedupeKey ? await (0, _dedupe.claimRecentInboundMessageDelivery)(dedupeKey) : "claimed";
        if (dedupeClaim !== "claimed") {
            if (dedupeClaim === "duplicate") {
                await completeUndeliverableDurableInbound(durableId, durableMetadata);
                await maybeMarkReadReceiptAfterCompletedDelivery(inbound, deliveryReadReceipt);
            }
            return;
        }
        recordAcceptedInboundActivity(options.accountId);
        await enqueueInboundMessage(msg, inbound, enriched, {
            durableId,
            readReceipt: deliveryReadReceipt,
            receiveOrder
        });
    };
    const replayPendingDurableInboundMessages = async ()=>{
        const pending = await durableInboundJournal.pending();
        for (const record of pending){
            await processDurableInboundMessage((0, _durablereceive.deserializeWhatsAppDurableInboundMessage)(record.payload.message), record.payload.upsertType, record.payload.receivedAt, {
                id: record.id,
                payload: record.payload,
                metadata: record.metadata
            });
        }
    };
    const enrichInboundMessage = async (msg)=>{
        const location = (0, _extract.extractLocationData)(msg.message ?? undefined);
        const locationText = location ? (0, _channelinbound.formatLocationText)(location) : undefined;
        const contactContext = (0, _extract.extractContactContext)(msg.message ?? undefined);
        let body = (0, _extract.extractText)(msg.message ?? undefined);
        if (locationText) {
            body = [
                body,
                locationText
            ].filter(Boolean).join("\n").trim();
        }
        if (!body) {
            body = (0, _extract.extractMediaPlaceholder)(msg.message ?? undefined);
            if (!body) {
                return null;
            }
        }
        const replyContext = (0, _extract.describeReplyContext)(msg.message);
        let mediaPath;
        let mediaType;
        let mediaFileName;
        const maxMb = typeof options.mediaMaxMb === "number" && options.mediaMaxMb > 0 ? options.mediaMaxMb : 50;
        const maxBytes = maxMb * 1024 * 1024;
        const saveInboundMedia = async (inboundMedia)=>{
            if (!inboundMedia) {
                return;
            }
            mediaPath = inboundMedia.saved.path;
            mediaType = inboundMedia.mimetype;
            mediaFileName = inboundMedia.fileName;
        };
        try {
            const inboundMedia = await (0, _media.downloadInboundMedia)(msg, sock, maxBytes);
            await saveInboundMedia(inboundMedia);
            if (!mediaPath && replyContext) {
                await saveInboundMedia(await (0, _media.downloadQuotedInboundMedia)(msg, sock, maxBytes));
            }
        } catch (err) {
            logWhatsAppVerbose(options.verbose, `Inbound media download failed: ${String(err)}`);
        }
        return {
            body,
            location: location ?? undefined,
            contactContext,
            replyContext,
            mediaPath,
            mediaType,
            mediaFileName
        };
    };
    const enqueueInboundMessage = async (msg, inbound, enriched, durable)=>{
        const chatJid = inbound.remoteJid;
        const sendComposing = async ()=>{
            const currentSock = getCurrentSock();
            if (!currentSock) {
                return;
            }
            try {
                await currentSock.sendPresenceUpdate("composing", chatJid);
            } catch (err) {
                logWhatsAppVerbose(options.verbose, `Presence update failed: ${String(err)}`);
            }
        };
        const reply = async (text, optionsResult)=>{
            const resolved = await resolveOutboundMentionsForGroup(chatJid, text);
            const result = await sendTrackedMessage(chatJid, (0, _outboundmentions.addWhatsAppOutboundMentionsToContent)({
                text: resolved.text
            }, resolved.mentionedJids), optionsResult);
            return (0, _sendresult.normalizeWhatsAppSendResult)(result, "text");
        };
        const sendMedia = async (payload, optionsValue)=>{
            const previewPayload = await (0, _imagepreview.addWhatsAppImagePreviewFields)(payload);
            const result = await sendTrackedMessage(chatJid, await applyOutboundMentionsToContent(chatJid, previewPayload), optionsValue);
            return (0, _sendresult.normalizeWhatsAppSendResult)(result, "media");
        };
        const timestamp = inbound.messageTimestampMs;
        const mentionedJids = (0, _extract.extractMentionedJids)(msg.message);
        const senderName = msg.pushName ?? undefined;
        inboundLogger.info({
            from: inbound.from,
            to: self.e164 ?? "me",
            body: enriched.body,
            mediaPath: enriched.mediaPath,
            mediaType: enriched.mediaType,
            mediaFileName: enriched.mediaFileName,
            timestamp
        }, "inbound message");
        const inboundMessage = {
            id: inbound.id,
            from: inbound.from,
            conversationId: inbound.from,
            to: self.e164 ?? "me",
            accountId: inbound.access.resolvedAccountId,
            accessControlPassed: true,
            body: enriched.body,
            pushName: senderName,
            timestamp,
            chatType: inbound.group ? "group" : "direct",
            chatId: inbound.remoteJid,
            sender: (0, _identity.resolveComparableIdentity)({
                jid: inbound.participantJid,
                e164: inbound.senderE164 ?? undefined,
                name: senderName
            }),
            senderJid: inbound.participantJid,
            senderE164: inbound.senderE164 ?? undefined,
            senderName,
            replyTo: enriched.replyContext ?? undefined,
            replyToId: enriched.replyContext?.id,
            replyToBody: enriched.replyContext?.body,
            replyToSender: enriched.replyContext?.sender?.label ?? undefined,
            replyToSenderJid: enriched.replyContext?.sender?.jid ?? undefined,
            replyToSenderE164: enriched.replyContext?.sender?.e164 ?? undefined,
            groupSubject: inbound.groupSubject,
            groupParticipants: inbound.groupParticipants,
            mentions: mentionedJids ?? undefined,
            mentionedJids: mentionedJids ?? undefined,
            self,
            selfJid: self.jid ?? undefined,
            selfLid: self.lid ?? undefined,
            selfE164: self.e164 ?? undefined,
            fromMe: Boolean(msg.key?.fromMe),
            location: enriched.location ?? undefined,
            untrustedStructuredContext: enriched.contactContext ? [
                {
                    label: "WhatsApp contact",
                    source: "whatsapp",
                    type: enriched.contactContext.kind,
                    payload: enriched.contactContext
                }
            ] : undefined,
            sendComposing,
            reply,
            sendMedia,
            mediaPath: enriched.mediaPath,
            mediaType: enriched.mediaType,
            mediaFileName: enriched.mediaFileName,
            dedupeKey: inbound.id ? `${options.accountId}:${inbound.remoteJid}:${inbound.id}` : undefined,
            durableId: durable.durableId,
            readReceipt: durable.readReceipt,
            receiveOrder: durable.receiveOrder
        };
        const debounceKey = buildInboundDebounceKey(inboundMessage);
        if (debounceKey) {
            inboundMessage.debounceKey = debounceKey;
            if (inboundDebounceMs > 0 && shouldDebounceInboundMessage(inboundMessage)) {
                pendingDebounceKeys.add(debounceKey);
            }
        }
        if (inboundMessage.id) {
            (0, _quotedmessage.cacheInboundMessageMeta)(inboundMessage.accountId, inboundMessage.chatId, inboundMessage.id, {
                participant: inboundMessage.senderJid,
                participantE164: inboundMessage.chatType === "direct" ? inboundMessage.senderE164 : undefined,
                body: inboundMessage.body,
                fromMe: inboundMessage.fromMe
            });
        }
        try {
            const task = Promise.resolve(debouncer.enqueue(inboundMessage));
            void task.catch((err)=>{
                inboundLogger.error({
                    error: String(err)
                }, "failed handling inbound web message");
                inboundConsoleLog.error(`Failed handling inbound web message: ${String(err)}`);
            });
        } catch (err) {
            inboundLogger.error({
                error: String(err)
            }, "failed handling inbound web message");
            inboundConsoleLog.error(`Failed handling inbound web message: ${String(err)}`);
        }
    };
    const pendingMessageHandlers = new Set();
    let nextReceiveOrder = 0;
    const handleMessagesUpsert = async (upsert)=>{
        if (upsert.type !== "notify" && upsert.type !== "append") {
            return;
        }
        for (const msg of upsert.messages ?? []){
            const receiveOrder = nextReceiveOrder++;
            if (await (0, _approvalreactions.maybeResolveWhatsAppApprovalReaction)({
                cfg: options.loadConfig?.() ?? options.cfg,
                accountId: options.accountId,
                msg,
                selfJid: self.jid,
                selfLid: self.lid,
                resolveInboundJid,
                logVerboseMessage: (message)=>logWhatsAppVerbose(options.verbose, message)
            })) {
                continue;
            }
            await processDurableInboundMessage(msg, upsert.type, receiveOrder);
        }
    };
    const handleMessagesUpsertEvent = (upsert)=>{
        const task = handleMessagesUpsert(upsert).catch((err)=>{
            inboundLogger.error({
                error: String(err)
            }, "messages.upsert handler error");
            inboundConsoleLog.error(`Messages upsert handler error: ${String(err)}`);
        });
        pendingMessageHandlers.add(task);
        void task.finally(()=>{
            pendingMessageHandlers.delete(task);
        });
    };
    const waitForPendingMessageHandlers = async ()=>{
        while(pendingMessageHandlers.size > 0){
            await Promise.all(Array.from(pendingMessageHandlers));
        }
    };
    const drainDebouncedInboundMessages = async ()=>{
        while(pendingDebounceKeys.size > 0 || activeInboundFlushes.size > 0){
            const debounceKeys = Array.from(pendingDebounceKeys);
            if (debounceKeys.length > 0) {
                await Promise.all(debounceKeys.map((key)=>debouncer.flushKey(key)));
            }
            const flushes = Array.from(activeInboundFlushes);
            if (flushes.length > 0) {
                await Promise.allSettled(flushes);
            }
            await Promise.resolve();
        }
    };
    const drainInboundBeforeSocketClose = async ()=>{
        await waitForPendingMessageHandlers();
        await drainDebouncedInboundMessages();
    };
    const drainInboundBeforeSocketCloseWithTimeout = async ()=>{
        let timeout = null;
        try {
            await Promise.race([
                drainInboundBeforeSocketClose(),
                new Promise((_, reject)=>{
                    timeout = setTimeout(()=>{
                        reject(new Error(`Timed out draining WhatsApp inbound debounce after ${INBOUND_CLOSE_DRAIN_TIMEOUT_MS}ms`));
                    }, INBOUND_CLOSE_DRAIN_TIMEOUT_MS);
                    timeout.unref?.();
                })
            ]);
        } finally{
            if (timeout) {
                clearTimeout(timeout);
            }
        }
    };
    const handleConnectionUpdate = (update)=>{
        try {
            if (update.connection === "close") {
                if (options.socketRef?.current === sock) {
                    options.socketRef.current = null;
                }
                const status = (0, _session.getStatusCode)(update.lastDisconnect?.error);
                resolveClose({
                    status,
                    isLoggedOut: status === LOGGED_OUT_STATUS,
                    error: update.lastDisconnect?.error
                });
            }
        } catch (err) {
            inboundLogger.error({
                error: String(err)
            }, "connection.update handler error");
            resolveClose({
                status: undefined,
                isLoggedOut: false,
                error: err
            });
        }
    };
    const detachMessagesUpsert = (0, _lifecycle.attachEmitterListener)(sock.ev, "messages.upsert", handleMessagesUpsertEvent);
    const detachConnectionUpdate = (0, _lifecycle.attachEmitterListener)(sock.ev, "connection.update", handleConnectionUpdate);
    const replayTask = replayPendingDurableInboundMessages().catch((err)=>{
        inboundLogger.error({
            error: String(err)
        }, "failed replaying durable WhatsApp inbound");
        inboundConsoleLog.error(`Failed replaying durable WhatsApp inbound: ${String(err)}`);
    });
    pendingMessageHandlers.add(replayTask);
    void replayTask.finally(()=>{
        pendingMessageHandlers.delete(replayTask);
    });
    void (async ()=>{
        try {
            const groups = await sock.groupFetchAllParticipating();
            for (const [jid, meta] of Object.entries(groups ?? {})){
                if (meta) {
                    rememberGroupMetadataCacheEntry(groupMetadataCache, jid, summarizeGroupMetaForReconnectCache(meta));
                }
            }
            logWhatsAppVerbose(options.verbose, `Hydrated ${Object.keys(groups ?? {}).length} participating groups on connect`);
        } catch (err) {
            const error = String(err);
            inboundLogger.warn({
                error
            }, "failed hydrating participating groups on connect");
            inboundConsoleLog.warn(`Failed hydrating participating groups on connect: ${error}`);
            logWhatsAppVerbose(options.verbose, `Failed to hydrate participating groups on connect: ${error}`);
        }
    })();
    const sendApi = (0, _sendapi.createWebSendApi)({
        sock: {
            sendMessage: (jid, content, optionsLocal)=>sendTrackedMessage(jid, content, optionsLocal),
            sendPresenceUpdate: async (presenceLocal, jid)=>{
                const currentSock = getCurrentSock();
                if (!currentSock) {
                    throw new Error(RECONNECT_IN_PROGRESS_ERROR);
                }
                return currentSock.sendPresenceUpdate(presenceLocal, jid);
            }
        },
        defaultAccountId: options.accountId,
        resolveOutboundMentions: ({ jid, text })=>resolveOutboundMentionsForGroup(jid, text),
        authDir: options.authDir
    });
    return {
        close: async ()=>{
            try {
                detachMessagesUpsert();
                detachConnectionUpdate();
                await drainInboundBeforeSocketCloseWithTimeout();
            } catch (err) {
                logWhatsAppVerbose(options.verbose, `Inbound close drain failed: ${String(err)}`);
            }
            try {
                (0, _lifecycle.closeInboundMonitorSocket)(sock);
            } catch (err) {
                logWhatsAppVerbose(options.verbose, `Socket close failed: ${String(err)}`);
            }
        },
        onClose,
        signalClose: (reason)=>{
            resolveClose(reason ?? {
                status: undefined,
                isLoggedOut: false,
                error: "closed"
            });
        },
        // IPC surface (sendMessage/sendPoll/sendReaction/sendComposingTo)
        ...sendApi
    };
}
async function monitorWebInbox(options) {
    const sock = await (0, _session.createWaSocket)(false, options.verbose, {
        authDir: options.authDir,
        ...(0, _sockettiming.resolveWhatsAppSocketTiming)(options.cfg)
    });
    await (0, _session.waitForWaConnection)(sock);
    return attachWebInboxToSocket({
        ...options,
        sock
    });
}

//# sourceMappingURL=monitor.js.map