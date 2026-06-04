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
    get getTelegramExecApprovalApprovers () {
        return getTelegramExecApprovalApprovers;
    },
    get isTelegramExecApprovalApprover () {
        return isTelegramExecApprovalApprover;
    },
    get isTelegramExecApprovalAuthorizedSender () {
        return isTelegramExecApprovalAuthorizedSender;
    },
    get isTelegramExecApprovalClientEnabled () {
        return isTelegramExecApprovalClientEnabled;
    },
    get isTelegramExecApprovalHandlerConfigured () {
        return isTelegramExecApprovalHandlerConfigured;
    },
    get isTelegramExecApprovalTargetRecipient () {
        return isTelegramExecApprovalTargetRecipient;
    },
    get resolveTelegramExecApprovalConfig () {
        return resolveTelegramExecApprovalConfig;
    },
    get resolveTelegramExecApprovalTarget () {
        return resolveTelegramExecApprovalTarget;
    },
    get shouldEnableTelegramExecApprovalButtons () {
        return shouldEnableTelegramExecApprovalButtons;
    },
    get shouldHandleTelegramExecApprovalRequest () {
        return shouldHandleTelegramExecApprovalRequest;
    },
    get shouldInjectTelegramExecApprovalButtons () {
        return shouldInjectTelegramExecApprovalButtons;
    },
    get shouldSuppressLocalTelegramExecApprovalPrompt () {
        return shouldSuppressLocalTelegramExecApprovalPrompt;
    }
});
const _approvalauthruntime = require("../../../../common/openclaw/plugin-sdk/approval-auth-runtime");
const _approvalclientruntime = require("../../../../common/openclaw/plugin-sdk/approval-client-runtime");
const _approvalnativeruntime = require("../../../../common/openclaw/plugin-sdk/approval-native-runtime");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accounts = require("./accounts.js");
const _inlinebuttons = require("./inline-buttons.js");
const _targets = require("./targets.js");
function normalizeApproverId(value) {
    return (0, _stringcoerceruntime.normalizeOptionalString)(String(value)) ?? "";
}
function normalizeTelegramDirectApproverId(value) {
    const normalized = normalizeApproverId(value);
    const chatId = (0, _targets.normalizeTelegramChatId)(normalized);
    if (!chatId || chatId.startsWith("-")) {
        return undefined;
    }
    return chatId;
}
function resolveTelegramOwnerApprovers(cfg) {
    const ownerAllowFrom = cfg.commands?.ownerAllowFrom;
    return Array.isArray(ownerAllowFrom) ? ownerAllowFrom : [];
}
function resolveTelegramExecApprovalConfig(params) {
    const account = (0, _accounts.resolveTelegramAccount)(params);
    const config = account.config.execApprovals;
    const enabled = account.enabled && account.tokenSource !== "none" ? config?.enabled ?? "auto" : false;
    return {
        ...config,
        enabled
    };
}
function getTelegramExecApprovalApprovers(params) {
    return (0, _approvalauthruntime.resolveApprovalApprovers)({
        explicit: resolveTelegramExecApprovalConfig(params)?.approvers,
        allowFrom: resolveTelegramOwnerApprovers(params.cfg),
        normalizeApprover: normalizeTelegramDirectApproverId
    });
}
function isTelegramExecApprovalTargetRecipient(params) {
    return (0, _approvalclientruntime.isChannelExecApprovalTargetRecipient)({
        ...params,
        channel: "telegram",
        matchTarget: ({ target, normalizedSenderId })=>{
            const to = target.to ? (0, _targets.normalizeTelegramChatId)(target.to) : undefined;
            if (!to || to.startsWith("-")) {
                return false;
            }
            return to === normalizedSenderId;
        }
    });
}
function countTelegramExecApprovalEligibleAccounts(params) {
    return (0, _accounts.listTelegramAccountIds)(params.cfg).filter((accountId)=>{
        const account = (0, _accounts.resolveTelegramAccount)({
            cfg: params.cfg,
            accountId
        });
        if (!account.enabled || account.tokenSource === "none") {
            return false;
        }
        const config = resolveTelegramExecApprovalConfig({
            cfg: params.cfg,
            accountId
        });
        return (0, _approvalclientruntime.isChannelExecApprovalClientEnabledFromConfig)({
            enabled: config?.enabled,
            approverCount: getTelegramExecApprovalApprovers({
                cfg: params.cfg,
                accountId
            }).length
        }) && (0, _approvalclientruntime.matchesApprovalRequestFilters)({
            request: params.request.request,
            agentFilter: config?.agentFilter,
            sessionFilter: config?.sessionFilter,
            fallbackAgentIdFromSessionKey: true
        });
    }).length;
}
function isExecApprovalRequest(request) {
    return "command" in request.request;
}
function isTargetForwardingMode(mode) {
    return mode === "targets" || mode === "both";
}
function matchesExplicitTelegramForwardTargetAccount(params) {
    const forwardingConfig = isExecApprovalRequest(params.request) ? params.cfg.approvals?.exec : params.cfg.approvals?.plugin;
    if (!forwardingConfig?.enabled || !isTargetForwardingMode(forwardingConfig.mode)) {
        return undefined;
    }
    const telegramTargets = (forwardingConfig.targets ?? []).filter((target)=>(0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(target.channel) === "telegram");
    if (telegramTargets.some((target)=>!(0, _stringcoerceruntime.normalizeOptionalString)(target.accountId))) {
        return undefined;
    }
    const scopedTelegramAccountIds = telegramTargets.map((target)=>(0, _stringcoerceruntime.normalizeOptionalString)(target.accountId)).filter((accountId)=>Boolean(accountId));
    if (scopedTelegramAccountIds.length === 0) {
        return undefined;
    }
    const normalizedAccountId = params.accountId ? (0, _routing.normalizeAccountId)(params.accountId) : "";
    return Boolean(normalizedAccountId) && scopedTelegramAccountIds.some((accountId)=>(0, _routing.normalizeAccountId)(accountId) === normalizedAccountId);
}
function matchesTelegramRequestAccount(params) {
    const explicitTargetMatch = matchesExplicitTelegramForwardTargetAccount(params);
    if (explicitTargetMatch !== undefined) {
        return explicitTargetMatch;
    }
    const turnSourceChannel = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(params.request.request.turnSourceChannel);
    const boundAccountId = (0, _approvalnativeruntime.resolveApprovalRequestChannelAccountId)({
        cfg: params.cfg,
        request: params.request,
        channel: "telegram"
    });
    if (turnSourceChannel && turnSourceChannel !== "telegram" && !boundAccountId) {
        return countTelegramExecApprovalEligibleAccounts({
            cfg: params.cfg,
            request: params.request
        }) <= 1;
    }
    return !boundAccountId || !params.accountId || (0, _routing.normalizeAccountId)(boundAccountId) === (0, _routing.normalizeAccountId)(params.accountId);
}
const telegramExecApprovalProfile = (0, _approvalclientruntime.createChannelExecApprovalProfile)({
    resolveConfig: resolveTelegramExecApprovalConfig,
    resolveApprovers: getTelegramExecApprovalApprovers,
    isTargetRecipient: isTelegramExecApprovalTargetRecipient,
    matchesRequestAccount: matchesTelegramRequestAccount,
    // Telegram session keys often carry the only stable agent ID for approval routing.
    fallbackAgentIdFromSessionKey: true,
    requireClientEnabledForLocalPromptSuppression: false
});
const isTelegramExecApprovalClientEnabled = telegramExecApprovalProfile.isClientEnabled;
const isTelegramExecApprovalApprover = telegramExecApprovalProfile.isApprover;
const isTelegramExecApprovalAuthorizedSender = telegramExecApprovalProfile.isAuthorizedSender;
const resolveTelegramExecApprovalTarget = telegramExecApprovalProfile.resolveTarget;
const shouldHandleTelegramExecApprovalRequest = telegramExecApprovalProfile.shouldHandleRequest;
function shouldInjectTelegramExecApprovalButtons(params) {
    if (!isTelegramExecApprovalClientEnabled(params)) {
        return false;
    }
    const target = resolveTelegramExecApprovalTarget(params);
    const chatType = (0, _targets.resolveTelegramTargetChatType)(params.to);
    if (chatType === "direct") {
        return target === "dm" || target === "both";
    }
    if (chatType === "group") {
        return target === "channel" || target === "both";
    }
    return target === "both";
}
function resolveExecApprovalButtonsExplicitlyDisabled(params) {
    const capabilities = (0, _accounts.resolveTelegramAccount)(params).config.capabilities;
    return (0, _inlinebuttons.resolveTelegramInlineButtonsConfigScope)(capabilities) === "off";
}
function shouldEnableTelegramExecApprovalButtons(params) {
    if (!shouldInjectTelegramExecApprovalButtons(params)) {
        return false;
    }
    return !resolveExecApprovalButtonsExplicitlyDisabled(params);
}
function shouldSuppressLocalTelegramExecApprovalPrompt(params) {
    return telegramExecApprovalProfile.shouldSuppressLocalPrompt(params);
}
function isTelegramExecApprovalHandlerConfigured(params) {
    return (0, _approvalclientruntime.isChannelExecApprovalClientEnabledFromConfig)({
        enabled: resolveTelegramExecApprovalConfig(params)?.enabled,
        approverCount: getTelegramExecApprovalApprovers(params).length
    });
}

//# sourceMappingURL=exec-approvals.js.map