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
    get telegramApprovalCapability () {
        return telegramApprovalCapability;
    },
    get telegramNativeApprovalAdapter () {
        return telegramNativeApprovalAdapter;
    }
});
const _approvaldeliveryruntime = require("../../../../common/openclaw/plugin-sdk/approval-delivery-runtime");
const _approvalhandleradapterruntime = require("../../../../common/openclaw/plugin-sdk/approval-handler-adapter-runtime");
const _approvalnativeruntime = require("../../../../common/openclaw/plugin-sdk/approval-native-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accounts = require("./accounts.js");
const _execapprovals = require("./exec-approvals.js");
const _outboundparams = require("./outbound-params.js");
const _targets = require("./targets.js");
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
function resolveTurnSourceTelegramOriginTarget(request) {
    const turnSourceChannel = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(request.request.turnSourceChannel);
    const rawTurnSourceTo = (0, _stringcoerceruntime.normalizeOptionalString)(request.request.turnSourceTo) ?? "";
    const parsedTurnSourceTarget = rawTurnSourceTo ? (0, _targets.parseTelegramTarget)(rawTurnSourceTo) : null;
    const turnSourceTo = (0, _targets.normalizeTelegramChatId)(parsedTurnSourceTarget?.chatId ?? rawTurnSourceTo);
    if (turnSourceChannel !== "telegram" || !turnSourceTo) {
        return null;
    }
    const rawThreadId = request.request.turnSourceThreadId ?? parsedTurnSourceTarget?.messageThreadId ?? undefined;
    return {
        to: turnSourceTo,
        threadId: (0, _outboundparams.parseTelegramThreadId)(rawThreadId)
    };
}
function resolveSessionTelegramOriginTarget(sessionTarget) {
    return {
        to: (0, _targets.normalizeTelegramChatId)(sessionTarget.to) ?? sessionTarget.to,
        threadId: (0, _outboundparams.parseTelegramThreadId)(sessionTarget.threadId)
    };
}
const resolveTelegramOriginTarget = (0, _approvalnativeruntime.createChannelNativeOriginTargetResolver)({
    channel: "telegram",
    shouldHandleRequest: ({ cfg, accountId, request })=>(0, _execapprovals.shouldHandleTelegramExecApprovalRequest)({
            cfg,
            accountId,
            request
        }),
    resolveTurnSourceTarget: resolveTurnSourceTelegramOriginTarget,
    resolveSessionTarget: resolveSessionTelegramOriginTarget
});
const resolveTelegramApproverDmTargets = (0, _approvalnativeruntime.createChannelApproverDmTargetResolver)({
    shouldHandleRequest: ({ cfg, accountId, request })=>(0, _execapprovals.shouldHandleTelegramExecApprovalRequest)({
            cfg,
            accountId,
            request
        }),
    resolveApprovers: _execapprovals.getTelegramExecApprovalApprovers,
    mapApprover: (approver)=>({
            to: approver
        })
});
const telegramNativeApprovalCapability = (0, _approvaldeliveryruntime.createApproverRestrictedNativeApprovalCapability)({
    channel: "telegram",
    channelLabel: "Telegram",
    describeExecApprovalSetup: ({ accountId })=>{
        const prefix = accountId && accountId !== "default" ? `channels.telegram.accounts.${accountId}` : "channels.telegram";
        return `Approve it from the Web UI or terminal UI for now. Telegram supports native exec approvals for this account. Configure \`${prefix}.execApprovals.approvers\` or \`commands.ownerAllowFrom\`; leave \`${prefix}.execApprovals.enabled\` unset/\`auto\` or set it to \`true\`.`;
    },
    listAccountIds: _accounts.listTelegramAccountIds,
    hasApprovers: ({ cfg, accountId })=>(0, _execapprovals.getTelegramExecApprovalApprovers)({
            cfg,
            accountId
        }).length > 0,
    isExecAuthorizedSender: ({ cfg, accountId, senderId })=>(0, _execapprovals.isTelegramExecApprovalAuthorizedSender)({
            cfg,
            accountId,
            senderId
        }),
    isPluginAuthorizedSender: ({ cfg, accountId, senderId })=>(0, _execapprovals.isTelegramExecApprovalApprover)({
            cfg,
            accountId,
            senderId
        }),
    isNativeDeliveryEnabled: ({ cfg, accountId })=>(0, _execapprovals.isTelegramExecApprovalClientEnabled)({
            cfg,
            accountId
        }),
    resolveNativeDeliveryMode: ({ cfg, accountId })=>(0, _execapprovals.resolveTelegramExecApprovalTarget)({
            cfg,
            accountId
        }),
    requireMatchingTurnSourceChannel: true,
    resolveSuppressionAccountId: ({ target, request })=>(0, _stringcoerceruntime.normalizeOptionalString)(target.accountId) ?? (0, _stringcoerceruntime.normalizeOptionalString)(request.request.turnSourceAccountId),
    resolveOriginTarget: resolveTelegramOriginTarget,
    resolveApproverDmTargets: resolveTelegramApproverDmTargets,
    notifyOriginWhenDmOnly: true,
    nativeRuntime: (0, _approvalhandleradapterruntime.createLazyChannelApprovalNativeRuntimeAdapter)({
        eventKinds: [
            "exec",
            "plugin"
        ],
        isConfigured: ({ cfg, accountId })=>(0, _execapprovals.isTelegramExecApprovalClientEnabled)({
                cfg,
                accountId
            }),
        shouldHandle: ({ cfg, accountId, request })=>(0, _execapprovals.shouldHandleTelegramExecApprovalRequest)({
                cfg,
                accountId,
                request
            }),
        load: async ()=>(await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./approval-handler.runtime.js")))).telegramApprovalNativeRuntime
    })
});
const resolveTelegramApproveCommandBehavior = (params)=>{
    const { cfg, accountId, senderId, approvalKind } = params;
    if (approvalKind !== "exec") {
        return undefined;
    }
    if ((0, _execapprovals.isTelegramExecApprovalClientEnabled)({
        cfg,
        accountId
    })) {
        return undefined;
    }
    if ((0, _execapprovals.isTelegramExecApprovalTargetRecipient)({
        cfg,
        accountId,
        senderId
    })) {
        return undefined;
    }
    if ((0, _execapprovals.isTelegramExecApprovalAuthorizedSender)({
        cfg,
        accountId,
        senderId
    }) && !(0, _execapprovals.isTelegramExecApprovalApprover)({
        cfg,
        accountId,
        senderId
    })) {
        return undefined;
    }
    return {
        kind: "reply",
        text: "❌ Telegram exec approvals are not enabled for this bot account."
    };
};
const telegramApprovalCapability = {
    ...telegramNativeApprovalCapability,
    resolveApproveCommandBehavior: resolveTelegramApproveCommandBehavior
};
const telegramNativeApprovalAdapter = (0, _approvaldeliveryruntime.splitChannelApprovalCapability)(telegramApprovalCapability);

//# sourceMappingURL=approval-native.js.map