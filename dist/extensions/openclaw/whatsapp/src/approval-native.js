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
    get whatsappApprovalCapability () {
        return whatsappApprovalCapability;
    },
    get whatsappNativeApprovalAdapter () {
        return whatsappNativeApprovalAdapter;
    }
});
const _approvaldeliveryruntime = require("../../../../common/openclaw/plugin-sdk/approval-delivery-runtime");
const _approvalhandleradapterruntime = require("../../../../common/openclaw/plugin-sdk/approval-handler-adapter-runtime");
const _approvalnativeruntime = require("../../../../common/openclaw/plugin-sdk/approval-native-runtime");
const _approvalreactionruntime = require("../../../../common/openclaw/plugin-sdk/approval-reaction-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accounts = require("./accounts.js");
const _approvalauth = require("./approval-auth.js");
const _normalize = require("./normalize.js");
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
const DEFAULT_APPROVAL_FORWARDING_MODE = "session";
function isWhatsAppApprovalTransportEnabled(params) {
    return (0, _accounts.resolveWhatsAppAccount)({
        cfg: params.cfg,
        accountId: params.accountId
    }).enabled;
}
function normalizeWhatsAppForwardTarget(target) {
    if ((0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(target.channel) !== "whatsapp") {
        return null;
    }
    const to = (0, _normalize.normalizeWhatsAppMessagingTarget)(target.to);
    if (!to) {
        return null;
    }
    return {
        to,
        accountId: (0, _stringcoerceruntime.normalizeOptionalString)(target.accountId),
        threadId: target.threadId ?? null
    };
}
function resolveTurnSourceWhatsAppOriginTarget(request) {
    const turnSourceChannel = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(request.request.turnSourceChannel);
    if (turnSourceChannel !== "whatsapp") {
        return null;
    }
    const to = (0, _normalize.normalizeWhatsAppMessagingTarget)(request.request.turnSourceTo ?? "");
    if (!to) {
        return null;
    }
    return {
        to,
        accountId: (0, _stringcoerceruntime.normalizeOptionalString)(request.request.turnSourceAccountId)
    };
}
function resolveSessionWhatsAppOriginTarget(sessionTarget) {
    const to = (0, _normalize.normalizeWhatsAppMessagingTarget)(sessionTarget.to);
    return to ? {
        to,
        accountId: (0, _stringcoerceruntime.normalizeOptionalString)(sessionTarget.accountId)
    } : null;
}
const whatsappApprovalRouteGates = (0, _approvalnativeruntime.createNativeApprovalChannelRouteGates)({
    channel: "whatsapp",
    defaultForwardingMode: DEFAULT_APPROVAL_FORWARDING_MODE,
    isTransportEnabled: isWhatsAppApprovalTransportEnabled,
    listAccountIds: _accounts.listWhatsAppAccountIds,
    resolveDefaultAccountId: _accounts.resolveDefaultWhatsAppAccountId,
    normalizeForwardTarget: normalizeWhatsAppForwardTarget,
    resolveTurnSourceTarget: resolveTurnSourceWhatsAppOriginTarget
});
const { canApprovalPotentiallyRouteToChannel: canApprovalPotentiallyRouteToWhatsApp, canAnyApprovalPotentiallyRouteToChannel: canAnyApprovalPotentiallyRouteToWhatsApp, isSessionApprovalEligible: isWhatsAppSessionApprovalEligible, isExplicitTargetEligible: isWhatsAppExplicitTargetEligible, shouldHandleApprovalRequest: shouldHandleWhatsAppApprovalRequest } = whatsappApprovalRouteGates;
const resolveWhatsAppOriginTargetBase = (0, _approvalnativeruntime.createChannelNativeOriginTargetResolver)({
    channel: "whatsapp",
    shouldHandleRequest: shouldHandleWhatsAppApprovalRequest,
    resolveTurnSourceTarget: resolveTurnSourceWhatsAppOriginTarget,
    resolveSessionTarget: resolveSessionWhatsAppOriginTarget,
    normalizeTarget: (target)=>{
        const to = (0, _normalize.normalizeWhatsAppMessagingTarget)(target.to);
        return to ? {
            ...target,
            to
        } : null;
    }
});
function resolveWhatsAppOriginTarget(params) {
    const target = resolveWhatsAppOriginTargetBase(params);
    if (!target) {
        return null;
    }
    if ((0, _normalize.isWhatsAppGroupJid)(target.to) && (0, _approvalauth.getWhatsAppApprovalApprovers)({
        cfg: params.cfg,
        accountId: params.accountId
    }).length === 0) {
        return null;
    }
    return target;
}
const resolveWhatsAppApproverDmTargets = (0, _approvalnativeruntime.createChannelApproverDmTargetResolver)({
    shouldHandleRequest: shouldHandleWhatsAppApprovalRequest,
    resolveApprovers: _approvalauth.getWhatsAppApprovalApprovers,
    mapApprover: (approver, params)=>{
        const to = (0, _normalize.normalizeWhatsAppMessagingTarget)(approver);
        if (!to) {
            return null;
        }
        return {
            to,
            accountId: (0, _stringcoerceruntime.normalizeOptionalString)(params.accountId)
        };
    }
});
const shouldSuppressWhatsAppForwardingFallback = (0, _approvalnativeruntime.createNativeApprovalForwardingFallbackSuppressor)({
    channel: "whatsapp",
    normalizeForwardTarget: normalizeWhatsAppForwardTarget,
    resolveAccountId: ({ forwardingTarget, request })=>forwardingTarget.accountId ?? (0, _stringcoerceruntime.normalizeOptionalString)(request.request.turnSourceAccountId),
    resolveForwardingTargetForMatch: ({ forwardingTarget, accountId })=>({
            ...forwardingTarget,
            accountId
        }),
    isSessionRouteEligible: isWhatsAppSessionApprovalEligible,
    isExplicitTargetEligible: isWhatsAppExplicitTargetEligible,
    resolveOriginTarget: resolveWhatsAppOriginTarget,
    resolveApproverDmTargets: resolveWhatsAppApproverDmTargets
});
function buildWhatsAppExecPendingPayload(params) {
    return (0, _approvalreactionruntime.buildApprovalReactionPromptPayloadForRequest)(params);
}
function buildWhatsAppPluginPendingPayload(params) {
    return (0, _approvalreactionruntime.buildApprovalReactionPromptPayloadForRequest)(params);
}
const whatsappApprovalCapability = (0, _approvaldeliveryruntime.createChannelApprovalCapability)({
    ..._approvalauth.whatsappApprovalAuth,
    getActionAvailabilityState: ({ cfg, accountId, approvalKind })=>(approvalKind ? canApprovalPotentiallyRouteToWhatsApp({
            cfg,
            accountId,
            approvalKind
        }) : canAnyApprovalPotentiallyRouteToWhatsApp({
            cfg,
            accountId
        })) ? {
            kind: "enabled"
        } : {
            kind: "disabled"
        },
    getExecInitiatingSurfaceState: ({ cfg, accountId })=>canApprovalPotentiallyRouteToWhatsApp({
            cfg,
            accountId,
            approvalKind: "exec"
        }) ? {
            kind: "enabled"
        } : {
            kind: "disabled"
        },
    describeExecApprovalSetup: ({ accountId })=>{
        const prefix = accountId && accountId !== "default" ? `channels.whatsapp.accounts.${accountId}` : "channels.whatsapp";
        return `WhatsApp supports native exec approvals for this account when \`approvals.exec.enabled\` is true and the route allows WhatsApp. Link WhatsApp and keep the gateway running; configure \`${prefix}.allowFrom\` to restrict approvers.`;
    },
    delivery: {
        hasConfiguredDmRoute: ({ cfg })=>(0, _accounts.listWhatsAppAccountIds)(cfg).some((accountId)=>{
                if (!canAnyApprovalPotentiallyRouteToWhatsApp({
                    cfg,
                    accountId,
                    nativeSessionOnly: true
                })) {
                    return false;
                }
                return (0, _approvalauth.getWhatsAppApprovalApprovers)({
                    cfg,
                    accountId
                }).length > 0;
            }),
        shouldSuppressForwardingFallback: shouldSuppressWhatsAppForwardingFallback
    },
    render: {
        exec: {
            buildPendingPayload: ({ request, nowMs })=>buildWhatsAppExecPendingPayload({
                    request,
                    nowMs
                })
        },
        plugin: {
            buildPendingPayload: ({ request, nowMs })=>buildWhatsAppPluginPendingPayload({
                    request,
                    nowMs
                })
        }
    },
    native: {
        describeDeliveryCapabilities: ({ cfg, accountId, approvalKind, request })=>{
            const originTarget = resolveWhatsAppOriginTarget({
                cfg,
                accountId,
                approvalKind,
                request
            });
            const approverTargets = resolveWhatsAppApproverDmTargets({
                cfg,
                accountId,
                approvalKind,
                request
            });
            const enabled = Boolean(originTarget) || approverTargets.length > 0;
            return {
                enabled,
                preferredSurface: originTarget ? "origin" : "approver-dm",
                supportsOriginSurface: Boolean(originTarget),
                supportsApproverDmSurface: approverTargets.length > 0,
                notifyOriginWhenDmOnly: true
            };
        },
        resolveOriginTarget: resolveWhatsAppOriginTarget,
        resolveApproverDmTargets: resolveWhatsAppApproverDmTargets
    },
    nativeRuntime: (0, _approvalhandleradapterruntime.createLazyChannelApprovalNativeRuntimeAdapter)({
        eventKinds: [
            "exec",
            "plugin"
        ],
        isConfigured: ({ cfg, accountId, context })=>Boolean(context) && canAnyApprovalPotentiallyRouteToWhatsApp({
                cfg,
                accountId,
                nativeSessionOnly: true
            }),
        shouldHandle: ({ cfg, accountId, context, request })=>Boolean(context) && shouldHandleWhatsAppApprovalRequest({
                cfg,
                accountId,
                request
            }),
        load: async ()=>(await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./approval-handler.runtime.js")))).whatsappApprovalNativeRuntime
    })
});
const whatsappNativeApprovalAdapter = (0, _approvaldeliveryruntime.splitChannelApprovalCapability)(whatsappApprovalCapability);

//# sourceMappingURL=approval-native.js.map