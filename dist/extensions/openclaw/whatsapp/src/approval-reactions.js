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
    get buildWhatsAppApprovalReactionHint () {
        return buildWhatsAppApprovalReactionHint;
    },
    get clearWhatsAppApprovalReactionTargetsForTest () {
        return clearWhatsAppApprovalReactionTargetsForTest;
    },
    get extractWhatsAppApprovalPromptBinding () {
        return extractWhatsAppApprovalPromptBinding;
    },
    get listWhatsAppApprovalReactionBindings () {
        return listWhatsAppApprovalReactionBindings;
    },
    get maybeResolveWhatsAppApprovalReaction () {
        return maybeResolveWhatsAppApprovalReaction;
    },
    get registerWhatsAppApprovalReactionTarget () {
        return registerWhatsAppApprovalReactionTarget;
    },
    get registerWhatsAppApprovalReactionTargetForOutboundMessage () {
        return registerWhatsAppApprovalReactionTargetForOutboundMessage;
    },
    get resolveWhatsAppApprovalReactionTargetWithPersistence () {
        return resolveWhatsAppApprovalReactionTargetWithPersistence;
    },
    get unregisterWhatsAppApprovalReactionTarget () {
        return unregisterWhatsAppApprovalReactionTarget;
    }
});
const _approvalreactionruntime = require("../../../../common/openclaw/plugin-sdk/approval-reaction-runtime");
const _approvalauth = require("./approval-auth.js");
const _runtime = require("./runtime.js");
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
const PERSISTENT_NAMESPACE = "whatsapp.approval-reactions";
const PERSISTENT_MAX_ENTRIES = 1000;
const DEFAULT_REACTION_TARGET_TTL_MS = 24 * 60 * 60 * 1000;
let resolverRuntimePromise;
const whatsappApprovalReactionTargets = (0, _approvalreactionruntime.createApprovalReactionTargetStore)({
    namespace: PERSISTENT_NAMESPACE,
    maxEntries: PERSISTENT_MAX_ENTRIES,
    defaultTtlMs: DEFAULT_REACTION_TARGET_TTL_MS,
    openStore: (storeParams)=>(0, _runtime.getOptionalWhatsAppRuntime)()?.state.openKeyedStore(storeParams),
    logPersistentError: reportPersistentApprovalReactionError,
    readPersistedTarget
});
function loadApprovalResolver() {
    resolverRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./approval-resolver.js")));
    return resolverRuntimePromise;
}
function buildReactionTargetKey(params) {
    const accountId = params.accountId.trim();
    const remoteJid = params.remoteJid.trim();
    const messageId = params.messageId.trim();
    if (!accountId || !remoteJid || !messageId) {
        return null;
    }
    return `${accountId}:${remoteJid}:${messageId}`;
}
function reportPersistentApprovalReactionError(error) {
    try {
        (0, _runtime.getOptionalWhatsAppRuntime)()?.logging.getChildLogger({
            plugin: "whatsapp",
            feature: "approval-reaction-state"
        }).warn("WhatsApp persistent approval reaction state failed", {
            error: String(error)
        });
    } catch  {
    // Best effort only: persistent state must never break WhatsApp reactions.
    }
}
function readPersistedTarget(target) {
    const value = target;
    if (!value || typeof value.approvalId !== "string" || !Array.isArray(value.allowedDecisions)) {
        return null;
    }
    return {
        approvalId: value.approvalId,
        ...value.approvalKind === "exec" || value.approvalKind === "plugin" ? {
            approvalKind: value.approvalKind
        } : {},
        allowedDecisions: value.allowedDecisions
    };
}
function listWhatsAppApprovalReactionBindings(allowedDecisions) {
    return (0, _approvalreactionruntime.listApprovalReactionBindings)({
        allowedDecisions
    });
}
function buildWhatsAppApprovalReactionHint(allowedDecisions) {
    return (0, _approvalreactionruntime.buildApprovalReactionHint)({
        allowedDecisions
    });
}
function normalizeApprovalDecision(value) {
    const normalized = value.trim().toLowerCase();
    if (normalized === "always") {
        return "allow-always";
    }
    if (normalized === "allow-once" || normalized === "allow-always" || normalized === "deny") {
        return normalized;
    }
    return null;
}
const APPROVAL_ID_LINE_RE = /^\s*ID:\s*([A-Za-z0-9][A-Za-z0-9._:-]*)\s*$/i;
const APPROVE_COMMAND_LINE_RE = /\/approve(?:@[^\s]+)?\s+([A-Za-z0-9][A-Za-z0-9._:-]*)\s+(.+)$/i;
function extractWhatsAppApprovalPromptBinding(text) {
    const lines = text.split(/\r?\n/);
    const idHeaderMatch = lines.map((line)=>line.match(APPROVAL_ID_LINE_RE)).find((match)=>Boolean(match));
    if (!idHeaderMatch) {
        return null;
    }
    const approvalId = idHeaderMatch[1];
    const allowedDecisions = [];
    for (const line of lines){
        const match = line.match(APPROVE_COMMAND_LINE_RE);
        if (!match || match[1] !== approvalId) {
            continue;
        }
        for (const decisionText of match[2].split(/[\s|,]+/)){
            const decision = normalizeApprovalDecision(decisionText);
            if (decision && !allowedDecisions.includes(decision)) {
                allowedDecisions.push(decision);
            }
        }
    }
    return allowedDecisions.length > 0 ? {
        approvalId,
        allowedDecisions
    } : null;
}
function registerWhatsAppApprovalReactionTarget(params) {
    const key = buildReactionTargetKey(params);
    const approvalId = params.approvalId.trim();
    const allowedDecisions = listWhatsAppApprovalReactionBindings(params.allowedDecisions).map((binding)=>binding.decision);
    if (!key || !approvalId || allowedDecisions.length === 0) {
        return null;
    }
    const target = {
        approvalId,
        approvalKind: approvalId.startsWith("plugin:") ? "plugin" : "exec",
        allowedDecisions
    };
    whatsappApprovalReactionTargets.register(key, target, {
        ttlMs: params.ttlMs
    });
    return target;
}
function registerWhatsAppApprovalReactionTargetForOutboundMessage(params) {
    const binding = extractWhatsAppApprovalPromptBinding(params.text);
    if (!binding) {
        return false;
    }
    return Boolean(registerWhatsAppApprovalReactionTarget({
        accountId: params.accountId,
        remoteJid: params.remoteJid,
        messageId: params.messageId,
        approvalId: binding.approvalId,
        allowedDecisions: binding.allowedDecisions,
        ttlMs: params.ttlMs
    }));
}
function unregisterWhatsAppApprovalReactionTarget(params) {
    const key = buildReactionTargetKey(params);
    if (!key) {
        return;
    }
    whatsappApprovalReactionTargets.delete(key);
}
function resolveTarget(params) {
    const resolved = (0, _approvalreactionruntime.resolveApprovalReactionTarget)({
        target: params.target,
        reactionKey: params.reactionKey
    });
    return resolved ? {
        approvalId: resolved.approvalId,
        decision: resolved.decision
    } : null;
}
async function resolveWhatsAppApprovalReactionTargetWithPersistence(params) {
    const key = buildReactionTargetKey(params);
    if (!key) {
        return null;
    }
    return resolveTarget({
        target: await whatsappApprovalReactionTargets.lookup(key),
        reactionKey: params.reactionKey
    });
}
function readWhatsAppApprovalReactionEvent(params) {
    const msg = params.msg;
    const reaction = msg.message?.reactionMessage;
    const reactionKey = reaction?.text?.trim() ?? "";
    const messageId = reaction?.key?.id?.trim() ?? "";
    const remoteJid = (reaction?.key?.remoteJid ?? msg.key?.remoteJid ?? "").trim();
    const actorJid = msg.key?.participant?.trim() || (msg.key?.fromMe ? params.selfLid?.trim() ?? params.selfJid?.trim() ?? "" : msg.key?.remoteJid?.trim() ?? "");
    if (!reactionKey || !messageId || !remoteJid || !actorJid) {
        return null;
    }
    return {
        remoteJid,
        messageId,
        actorJid,
        reactionKey
    };
}
async function maybeResolveWhatsAppApprovalReaction(params) {
    const event = readWhatsAppApprovalReactionEvent({
        msg: params.msg,
        selfJid: params.selfJid,
        selfLid: params.selfLid
    });
    if (!event) {
        return false;
    }
    const target = await resolveWhatsAppApprovalReactionTargetWithPersistence({
        accountId: params.accountId,
        remoteJid: event.remoteJid,
        messageId: event.messageId,
        reactionKey: event.reactionKey
    });
    if (!target) {
        return false;
    }
    const actorId = await params.resolveInboundJid(event.actorJid);
    if (!actorId) {
        params.logVerboseMessage?.(`whatsapp: approval reaction ignored for ${target.approvalId}; missing actor identity`);
        return true;
    }
    const approvalKind = target.approvalId.startsWith("plugin:") ? "plugin" : "exec";
    const approvers = (0, _approvalauth.getWhatsAppApprovalApprovers)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    if (approvers.length === 0) {
        params.logVerboseMessage?.(`whatsapp: approval reaction denied id=${target.approvalId}; reactions require explicit approvers`);
        return true;
    }
    const auth = _approvalauth.whatsappApprovalAuth.authorizeActorAction({
        cfg: params.cfg,
        accountId: params.accountId,
        senderId: actorId,
        action: "approve",
        approvalKind
    });
    if (!auth.authorized) {
        params.logVerboseMessage?.(`whatsapp: approval reaction denied id=${target.approvalId} sender=${actorId}`);
        return true;
    }
    const { isApprovalNotFoundError, resolveWhatsAppApproval } = await loadApprovalResolver();
    try {
        await resolveWhatsAppApproval({
            cfg: params.cfg,
            approvalId: target.approvalId,
            decision: target.decision,
            senderId: actorId,
            gatewayUrl: params.gatewayUrl
        });
        params.logVerboseMessage?.(`whatsapp: approval reaction resolved id=${target.approvalId} sender=${actorId} decision=${target.decision}`);
        return true;
    } catch (error) {
        if (isApprovalNotFoundError(error)) {
            unregisterWhatsAppApprovalReactionTarget({
                accountId: params.accountId,
                remoteJid: event.remoteJid,
                messageId: event.messageId
            });
            params.logVerboseMessage?.(`whatsapp: approval reaction ignored for expired approval id=${target.approvalId} sender=${actorId}`);
            return true;
        }
        params.logVerboseMessage?.(`whatsapp: approval reaction failed id=${target.approvalId} sender=${actorId}: ${String(error)}`);
        return true;
    }
}
function clearWhatsAppApprovalReactionTargetsForTest() {
    whatsappApprovalReactionTargets.clearForTest();
    resolverRuntimePromise = undefined;
}

//# sourceMappingURL=approval-reactions.js.map