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
    get baileys () {
        return baileys;
    },
    get getLastSocket () {
        return getLastSocket;
    },
    get resetBaileysMocks () {
        return resetBaileysMocks;
    },
    get resetLoadConfigMock () {
        return resetLoadConfigMock;
    },
    get setLoadConfigMock () {
        return setLoadConfigMock;
    },
    get setRuntimeConfigSourceSnapshotMock () {
        return setRuntimeConfigSourceSnapshotMock;
    }
});
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _promises = /*#__PURE__*/ _interop_require_default(require("node:fs/promises"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _channeltesthelpers = require("../../../../common/openclaw/plugin-sdk/channel-test-helpers");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _vitest = require("vitest");
const _baileys = require("../../../test/mocks/baileys.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
// Use globalThis to store the mock config so it survives vi.mock hoisting
const CONFIG_KEY = Symbol.for("openclaw:testConfigMock");
const SOURCE_CONFIG_KEY = Symbol.for("openclaw:testSourceConfigMock");
const DEFAULT_CONFIG = {
    channels: {
        whatsapp: {
            // Tests can override; default remains open to avoid surprising fixtures
            allowFrom: [
                "*"
            ]
        }
    },
    messages: {
        messagePrefix: undefined,
        responsePrefix: undefined
    }
};
// Initialize default if not set
if (!globalThis[CONFIG_KEY]) {
    globalThis[CONFIG_KEY] = ()=>DEFAULT_CONFIG;
}
if (!globalThis[SOURCE_CONFIG_KEY]) {
    globalThis[SOURCE_CONFIG_KEY] = ()=>loadConfigMock();
}
function setLoadConfigMock(fn) {
    globalThis[CONFIG_KEY] = typeof fn === "function" ? fn : ()=>fn;
}
function setRuntimeConfigSourceSnapshotMock(fn) {
    globalThis[SOURCE_CONFIG_KEY] = typeof fn === "function" ? fn : ()=>fn;
}
function resetLoadConfigMock() {
    globalThis[CONFIG_KEY] = ()=>DEFAULT_CONFIG;
    globalThis[SOURCE_CONFIG_KEY] = ()=>loadConfigMock();
}
function resolveStorePathFallback(store, opts) {
    if (!store) {
        const agentId = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(opts?.agentId?.trim() || "main");
        return _nodepath.default.join(process.env.HOME ?? "/tmp", ".openclaw", "agents", agentId, "sessions", "sessions.json");
    }
    return _nodepath.default.resolve(store.replaceAll("{agentId}", opts?.agentId?.trim() || "main"));
}
function loadConfigMock() {
    const getter = globalThis[CONFIG_KEY];
    if (typeof getter === "function") {
        return getter();
    }
    return DEFAULT_CONFIG;
}
function loadRuntimeConfigSourceSnapshotMock() {
    const getter = globalThis[SOURCE_CONFIG_KEY];
    if (typeof getter === "function") {
        return getter();
    }
    return loadConfigMock();
}
async function updateLastRouteMock(params) {
    const raw = await _promises.default.readFile(params.storePath, "utf8").catch(()=>"{}");
    const store = JSON.parse(raw);
    const current = store[params.sessionKey] ?? {};
    store[params.sessionKey] = {
        ...current,
        lastChannel: params.deliveryContext.channel,
        lastTo: params.deliveryContext.to,
        lastAccountId: params.deliveryContext.accountId
    };
    await _promises.default.writeFile(params.storePath, JSON.stringify(store));
}
function loadSessionStoreMock(storePath) {
    try {
        return JSON.parse(_nodefs.default.readFileSync(storePath, "utf8"));
    } catch  {
        return {};
    }
}
function sanitizeEnvelopeHeaderPart(value) {
    return value.replace(/\r\n|\r|\n/g, " ").replaceAll("[", "(").replaceAll("]", ")").replace(/\s+/g, " ").trim();
}
function resolveEnvelopeOptionsMock(cfg) {
    const defaults = cfg?.agents?.defaults;
    return {
        timezone: defaults?.envelopeTimezone,
        includeTimestamp: defaults?.envelopeTimestamp !== "off",
        includeElapsed: defaults?.envelopeElapsed !== "off",
        userTimezone: defaults?.userTimezone
    };
}
function resolveEnvelopeTimestampMock(timestamp, envelope) {
    if (!timestamp || envelope?.includeTimestamp === false) {
        return undefined;
    }
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    const zone = envelope?.timezone?.trim();
    if (zone === "user") {
        return (0, _channeltesthelpers.formatEnvelopeTimestamp)(date, envelope?.userTimezone?.trim() || "local");
    }
    return (0, _channeltesthelpers.formatEnvelopeTimestamp)(date, zone || "local");
}
function resolveSenderLabelMock(sender) {
    const display = sender?.name?.trim();
    const idPart = sender?.e164?.trim() || sender?.id?.trim();
    if (display && idPart && display !== idPart) {
        return `${display} (${idPart})`;
    }
    return display || idPart || undefined;
}
function formatInboundEnvelopeMock(params) {
    const chatType = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(params.chatType);
    const isDirect = !chatType || chatType === "direct";
    const sender = params.senderLabel?.trim() || resolveSenderLabelMock(params.sender);
    const body = isDirect && params.fromMe ? `(self): ${params.body}` : !isDirect && sender ? `${sanitizeEnvelopeHeaderPart(sender)}: ${params.body}` : params.body;
    const parts = [
        sanitizeEnvelopeHeaderPart(params.channel?.trim() || "Channel")
    ];
    const from = params.from?.trim();
    if (from) {
        parts.push(sanitizeEnvelopeHeaderPart(from));
    }
    const timestamp = resolveEnvelopeTimestampMock(params.timestamp, params.envelope);
    if (timestamp) {
        parts.push(timestamp);
    }
    return `[${parts.join(" ")}] ${body}`;
}
function createChannelMessageReplyPipelineMock() {
    return {
        onModelSelected: undefined,
        responsePrefix: undefined
    };
}
function normalizePhoneLikeToE164(value) {
    const digits = value.replace(/\D+/g, "");
    return digits ? `+${digits}` : null;
}
function resolveIdentityNamePrefixMock(cfg, _agentId) {
    return cfg.messages?.responsePrefix;
}
function resolveSendableOutboundReplyPartsMock(payload) {
    return {
        text: typeof payload.text === "string" ? payload.text : "",
        hasMedia: typeof payload.mediaUrl === "string" || typeof payload.mediaPath === "string" || typeof payload.fileUrl === "string"
    };
}
function resolveChannelMessageSourceReplyDeliveryModeMock(params) {
    if (params.requested) {
        return params.requested;
    }
    if (params.ctx.CommandSource === "native") {
        return "automatic";
    }
    const chatType = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(params.ctx.ChatType);
    if (chatType === "group" || chatType === "channel") {
        return params.cfg.messages?.groupChat?.visibleReplies === "automatic" ? "automatic" : "message_tool_only";
    }
    return params.cfg.messages?.visibleReplies === "message_tool" ? "message_tool_only" : "automatic";
}
function toLocationContextMock(location) {
    return {
        Location: location
    };
}
function createBufferedDispatchReplyMock() {
    return _vitest.vi.fn(async (params)=>{
        let typingController;
        const replyOptions = {
            ...params.replyOptions,
            onTypingController: (typing)=>{
                typingController = typing;
                params.replyOptions?.onTypingController?.(typing);
            }
        };
        await params.dispatcherOptions.onReplyStart?.();
        try {
            const payload = await params.replyResolver(params.ctx, replyOptions);
            if (!payload || typeof payload !== "object") {
                return {
                    queuedFinal: false,
                    counts: {
                        tool: 0,
                        block: 0,
                        final: 0
                    }
                };
            }
            const text = typeof payload.text === "string" ? payload.text.trim() : "";
            const hasMedia = typeof payload.mediaUrl === "string" || typeof payload.mediaPath === "string" || typeof payload.fileUrl === "string";
            if (!text && !hasMedia) {
                return {
                    queuedFinal: false,
                    counts: {
                        tool: 0,
                        block: 0,
                        final: 0
                    }
                };
            }
            await params.dispatcherOptions.deliver(payload, {
                kind: "final"
            });
            return {
                queuedFinal: true,
                counts: {
                    tool: 0,
                    block: 0,
                    final: 1
                }
            };
        } finally{
            typingController?.markRunComplete?.();
            typingController?.markDispatchIdle?.();
        }
    });
}
function resolveChannelContextVisibilityModeMock(params) {
    if (params.configuredContextVisibility) {
        return params.configuredContextVisibility;
    }
    const channelConfig = params.cfg.channels?.[params.channel];
    const accountMode = (params.accountId ? channelConfig?.accounts?.[params.accountId]?.contextVisibility : undefined) ?? channelConfig?.accounts?.main?.contextVisibility;
    return accountMode ?? channelConfig?.contextVisibility ?? "all";
}
function resolveGroupSessionKeyMock(ctx) {
    const from = ctx.From?.trim() ?? "";
    const chatType = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(ctx.ChatType);
    const normalizedFrom = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(from);
    if (!from) {
        return null;
    }
    const isGroup = chatType === "group" || chatType === "channel" || from.includes(":group:") || from.endsWith("@g.us");
    if (!isGroup) {
        return null;
    }
    return {
        key: `whatsapp:group:${normalizedFrom}`,
        channel: (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(ctx.Provider) || "whatsapp",
        id: normalizedFrom,
        chatType: chatType === "channel" ? "channel" : "group"
    };
}
function resolveChannelGroupPolicyMock(params) {
    const whatsappCfg = params.cfg.channels?.whatsapp;
    const groups = whatsappCfg?.groups;
    const groupConfig = params.groupId ? groups?.[params.groupId] : undefined;
    const defaultConfig = groups?.["*"];
    const hasGroups = Boolean(groups && Object.keys(groups).length > 0);
    const allowAll = Boolean(defaultConfig);
    const groupPolicy = whatsappCfg?.groupPolicy ?? "disabled";
    const senderFilterBypass = groupPolicy === "allowlist" && !hasGroups && Boolean(params.hasGroupAllowFrom);
    const allowed = groupPolicy === "disabled" ? false : groupPolicy !== "allowlist" || allowAll || Boolean(groupConfig) || senderFilterBypass;
    return {
        allowlistEnabled: groupPolicy === "allowlist" || hasGroups,
        allowed,
        groupConfig,
        defaultConfig
    };
}
function resolveChannelGroupRequireMentionMock(params) {
    const groups = params.cfg.channels?.whatsapp?.groups;
    const groupConfig = params.groupId ? groups?.[params.groupId] : undefined;
    const defaultConfig = groups?.["*"];
    if (typeof groupConfig?.requireMention === "boolean") {
        return groupConfig.requireMention;
    }
    if (typeof defaultConfig?.requireMention === "boolean") {
        return defaultConfig.requireMention;
    }
    if (typeof params.requireMentionOverride === "boolean") {
        return params.requireMentionOverride;
    }
    return true;
}
_vitest.vi.mock("./auto-reply/config.runtime.js", ()=>({
        getRuntimeConfig: loadConfigMock,
        getRuntimeConfigSourceSnapshot: loadRuntimeConfigSourceSnapshotMock,
        loadConfig: loadConfigMock,
        updateLastRoute: updateLastRouteMock,
        loadSessionStore: loadSessionStoreMock,
        recordSessionMetaFromInbound: async ()=>undefined,
        resolveStorePath: resolveStorePathFallback,
        evaluateSessionFreshness: ()=>({
                fresh: false
            }),
        resolveChannelContextVisibilityMode: resolveChannelContextVisibilityModeMock,
        resolveChannelGroupPolicy: resolveChannelGroupPolicyMock,
        resolveChannelGroupRequireMention: resolveChannelGroupRequireMentionMock,
        resolveChannelResetConfig: ()=>undefined,
        resolveGroupSessionKey: resolveGroupSessionKeyMock,
        resolveSessionKey: (_scope, msg, mainKey)=>msg.From?.trim() || mainKey || "main",
        resolveSessionResetPolicy: ()=>undefined,
        resolveSessionResetType: ()=>"message",
        resolveThreadFlag: ()=>false
    }));
_vitest.vi.mock("./inbound/runtime-api.js", ()=>({
        DisconnectReason: {
            loggedOut: 401
        },
        isJidGroup: (jid)=>typeof jid === "string" && jid.endsWith("@g.us"),
        normalizeMessageContent: (message)=>message,
        downloadMediaMessage: _vitest.vi.fn().mockResolvedValue(Buffer.from("img")),
        saveMediaBuffer: _vitest.vi.fn().mockImplementation(async (_buf, contentType)=>({
                id: "mid",
                path: "/tmp/mid",
                size: _buf.length,
                contentType
            }))
    }));
_vitest.vi.mock("./auto-reply/monitor/inbound-dispatch.runtime.js", ()=>({
        createChannelMessageReplyPipeline: createChannelMessageReplyPipelineMock,
        dispatchReplyWithBufferedBlockDispatcher: createBufferedDispatchReplyMock(),
        finalizeInboundContext: (ctx)=>ctx,
        getAgentScopedMediaLocalRoots: ()=>[],
        jidToE164: normalizePhoneLikeToE164,
        logVerbose: (_msg)=>undefined,
        resolveChannelMessageSourceReplyDeliveryMode: resolveChannelMessageSourceReplyDeliveryModeMock,
        resolveChunkMode: ()=>undefined,
        resolveIdentityNamePrefix: resolveIdentityNamePrefixMock,
        resolveInboundLastRouteSessionKey: (params)=>params.sessionKey,
        resolveMarkdownTableMode: ()=>undefined,
        resolveSendableOutboundReplyParts: resolveSendableOutboundReplyPartsMock,
        resolveTextChunkLimit: ()=>64_000,
        shouldLogVerbose: ()=>false,
        toLocationContext: toLocationContextMock
    }));
_vitest.vi.mock("./auto-reply/monitor/runtime-api.js", ()=>({
        buildHistoryContextFromEntries: (params)=>{
            const rendered = params.entries.map((entry)=>params.formatEntry?.(entry) ?? `${entry.sender ?? "Unknown"}: ${entry.body}`).join("\n");
            return rendered ? `Chat messages since your last reply:\n${rendered}\n\n${params.currentMessage}` : params.currentMessage;
        },
        createChannelMessageReplyPipeline: createChannelMessageReplyPipelineMock,
        dispatchReplyWithBufferedBlockDispatcher: createBufferedDispatchReplyMock(),
        finalizeInboundContext: (ctx)=>ctx,
        formatInboundEnvelope: formatInboundEnvelopeMock,
        getAgentScopedMediaLocalRoots: ()=>[],
        isControlCommandMessage: ()=>false,
        jidToE164: normalizePhoneLikeToE164,
        logVerbose: (_msg)=>undefined,
        normalizeE164: normalizePhoneLikeToE164,
        readStoreAllowFromForDmPolicy: async ()=>[],
        recordSessionMetaFromInbound: async ()=>undefined,
        resolveChannelMessageSourceReplyDeliveryMode: resolveChannelMessageSourceReplyDeliveryModeMock,
        resolveChannelContextVisibilityMode: resolveChannelContextVisibilityModeMock,
        resolveChunkMode: ()=>undefined,
        resolveIdentityNamePrefix: resolveIdentityNamePrefixMock,
        resolveInboundLastRouteSessionKey: (params)=>params.sessionKey,
        resolveInboundSessionEnvelopeContext: (params)=>({
                storePath: resolveStorePathFallback(params.cfg.session?.store, {
                    agentId: params.agentId
                }),
                envelopeOptions: resolveEnvelopeOptionsMock(params.cfg),
                previousTimestamp: undefined
            }),
        resolveMarkdownTableMode: ()=>undefined,
        resolvePinnedMainDmOwnerFromAllowlist: (params)=>{
            const first = params.allowFrom?.[0];
            return first ? params.normalizeEntry(first) : null;
        },
        resolveDmGroupAccessWithCommandGate: ()=>({
                commandAuthorized: true
            }),
        resolveSendableOutboundReplyParts: resolveSendableOutboundReplyPartsMock,
        resolveTextChunkLimit: ()=>64_000,
        shouldComputeCommandAuthorized: ()=>false,
        shouldLogVerbose: ()=>false,
        toLocationContext: toLocationContextMock
    }));
_vitest.vi.mock("./auto-reply/monitor/group-gating.runtime.js", ()=>({
        createChannelHistoryWindow: (params)=>({
                record: (recordParams)=>{
                    const current = params.historyMap.get(recordParams.historyKey) ?? [];
                    const next = [
                        ...current,
                        recordParams.entry
                    ].slice(-recordParams.limit);
                    params.historyMap.set(recordParams.historyKey, next);
                }
            }),
        hasControlCommand: (body)=>body.trim().startsWith("/"),
        implicitMentionKindWhen: (kind, enabled)=>enabled ? [
                kind
            ] : [],
        normalizeE164: normalizePhoneLikeToE164,
        parseActivationCommand: (body)=>({
                hasCommand: body.trim().startsWith("/")
            }),
        recordPendingHistoryEntryIfEnabled: (params)=>{
            const current = params.historyMap.get(params.historyKey) ?? [];
            const next = [
                ...current,
                params.entry
            ].slice(-params.limit);
            params.historyMap.set(params.historyKey, next);
        },
        resolveInboundMentionDecision: (params)=>{
            const facts = "facts" in params && params.facts ? params.facts : {
                canDetectMention: Boolean(params.canDetectMention),
                wasMentioned: Boolean(params.wasMentioned),
                implicitMentionKinds: params.implicitMentionKinds
            };
            const policy = "policy" in params && params.policy ? params.policy : {
                isGroup: Boolean(params.isGroup),
                requireMention: Boolean(params.requireMention),
                allowTextCommands: Boolean(params.allowTextCommands),
                hasControlCommand: Boolean(params.hasControlCommand),
                commandAuthorized: Boolean(params.commandAuthorized)
            };
            const effectiveWasMentioned = facts.wasMentioned || Boolean(facts.implicitMentionKinds?.length);
            return {
                effectiveWasMentioned,
                shouldSkip: policy.isGroup && policy.requireMention && facts.canDetectMention && !effectiveWasMentioned,
                shouldBypassMention: false,
                implicitMention: Boolean(facts.implicitMentionKinds?.length),
                matchedImplicitMentionKinds: facts.implicitMentionKinds ?? []
            };
        }
    }));
_vitest.vi.mock("./auto-reply/monitor/group-activation.runtime.js", ()=>({
        normalizeGroupActivation: (value)=>value === "always" || value === "mention" ? value : undefined
    }));
_vitest.vi.mock("./auto-reply/monitor/message-line.runtime.js", ()=>({
        formatInboundEnvelope: formatInboundEnvelopeMock,
        resolveMessagePrefix: (cfg, _agentId, params)=>{
            const configured = params?.configured ?? cfg.messages?.messagePrefix;
            if (configured !== undefined) {
                return configured;
            }
            return params?.hasAllowFrom === true ? "" : "[openclaw]";
        }
    }));
_vitest.vi.mock("./auth-store.runtime.js", ()=>({
        resolveOAuthDir: ()=>"/tmp/openclaw-oauth"
    }));
_vitest.vi.mock("./session.runtime.js", ()=>{
    const created = (0, _baileys.createMockBaileys)();
    globalThis[Symbol.for("openclaw:lastSocket")] = created.lastSocket;
    return {
        ...created.mod
    };
});
_vitest.vi.mock("./qr-terminal.js", ()=>({
        renderQrTerminal: _vitest.vi.fn(async ()=>"ASCII-QR")
    }));
const baileys = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./session.runtime.js")));
function resetMockExport(params) {
    if (!("mockReset" in params.current) || typeof params.current.mockReset !== "function") {
        return;
    }
    params.current.mockReset();
    if ("mockImplementation" in params.current && typeof params.current.mockImplementation === "function") {
        params.current.mockImplementation(params.implementation);
    }
}
function resetBaileysMocks() {
    const recreated = (0, _baileys.createMockBaileys)();
    globalThis[Symbol.for("openclaw:lastSocket")] = recreated.lastSocket;
    const makeWASocket = _vitest.vi.mocked(baileys.makeWASocket);
    const makeWASocketImpl = (...args)=>recreated.mod.makeWASocket(...args);
    resetMockExport({
        current: makeWASocket,
        implementation: makeWASocketImpl
    });
    const useMultiFileAuthState = _vitest.vi.mocked(baileys.useMultiFileAuthState);
    const useMultiFileAuthStateImpl = (...args)=>recreated.mod.useMultiFileAuthState(...args);
    resetMockExport({
        current: useMultiFileAuthState,
        implementation: useMultiFileAuthStateImpl
    });
    const fetchLatestBaileysVersion = _vitest.vi.mocked(baileys.fetchLatestBaileysVersion);
    const fetchLatestBaileysVersionImpl = (...args)=>recreated.mod.fetchLatestBaileysVersion(...args);
    resetMockExport({
        current: fetchLatestBaileysVersion,
        implementation: fetchLatestBaileysVersionImpl
    });
    const makeCacheableSignalKeyStore = _vitest.vi.mocked(baileys.makeCacheableSignalKeyStore);
    const makeCacheableSignalKeyStoreImpl = (...args)=>recreated.mod.makeCacheableSignalKeyStore(...args);
    resetMockExport({
        current: makeCacheableSignalKeyStore,
        implementation: makeCacheableSignalKeyStoreImpl
    });
}
function getLastSocket() {
    const getter = globalThis[Symbol.for("openclaw:lastSocket")];
    if (typeof getter === "function") {
        return getter();
    }
    if (!getter) {
        throw new Error("Baileys mock not initialized");
    }
    throw new Error("Invalid Baileys socket getter");
}

//# sourceMappingURL=test-helpers.js.map