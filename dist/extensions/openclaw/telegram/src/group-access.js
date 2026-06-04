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
    get evaluateTelegramGroupBaseAccess () {
        return evaluateTelegramGroupBaseAccess;
    },
    get evaluateTelegramGroupPolicyAccess () {
        return evaluateTelegramGroupPolicyAccess;
    },
    get resolveTelegramRuntimeGroupPolicy () {
        return resolveTelegramRuntimeGroupPolicy;
    }
});
const _runtimegrouppolicy = require("../../../../common/openclaw/plugin-sdk/runtime-group-policy");
const _botaccess = require("./bot-access.js");
function isGroupAllowOverrideAuthorized(params) {
    if (!params.effectiveGroupAllow.hasEntries) {
        return false;
    }
    const senderId = params.senderId ?? "";
    if (params.requireSenderForAllowOverride && !senderId) {
        return false;
    }
    return (0, _botaccess.isSenderAllowed)({
        allow: params.effectiveGroupAllow,
        senderId,
        senderUsername: params.senderUsername ?? ""
    });
}
const evaluateTelegramGroupBaseAccess = (params)=>{
    // Check enabled flags for both groups and DMs
    if (params.groupConfig?.enabled === false) {
        return {
            allowed: false,
            reason: "group-disabled"
        };
    }
    if (params.topicConfig?.enabled === false) {
        return {
            allowed: false,
            reason: "topic-disabled"
        };
    }
    if (!params.isGroup) {
        // For DMs, check allowFrom override if present
        if (params.enforceAllowOverride && params.hasGroupAllowOverride) {
            if (!isGroupAllowOverrideAuthorized({
                effectiveGroupAllow: params.effectiveGroupAllow,
                senderId: params.senderId,
                senderUsername: params.senderUsername,
                requireSenderForAllowOverride: params.requireSenderForAllowOverride
            })) {
                return {
                    allowed: false,
                    reason: "group-override-unauthorized"
                };
            }
        }
        return {
            allowed: true
        };
    }
    if (!params.enforceAllowOverride || !params.hasGroupAllowOverride) {
        return {
            allowed: true
        };
    }
    if (!isGroupAllowOverrideAuthorized({
        effectiveGroupAllow: params.effectiveGroupAllow,
        senderId: params.senderId,
        senderUsername: params.senderUsername,
        requireSenderForAllowOverride: params.requireSenderForAllowOverride
    })) {
        return {
            allowed: false,
            reason: "group-override-unauthorized"
        };
    }
    return {
        allowed: true
    };
};
const resolveTelegramRuntimeGroupPolicy = (params)=>(0, _runtimegrouppolicy.resolveOpenProviderRuntimeGroupPolicy)({
        providerConfigPresent: params.providerConfigPresent,
        groupPolicy: params.groupPolicy,
        defaultGroupPolicy: params.defaultGroupPolicy
    });
const evaluateTelegramGroupPolicyAccess = (params)=>{
    const { groupPolicy: runtimeFallbackPolicy } = resolveTelegramRuntimeGroupPolicy({
        providerConfigPresent: params.cfg.channels?.telegram !== undefined,
        groupPolicy: params.telegramCfg.groupPolicy,
        defaultGroupPolicy: params.cfg.channels?.defaults?.groupPolicy
    });
    const fallbackPolicy = (0, _botaccess.firstDefined)(params.telegramCfg.groupPolicy, params.cfg.channels?.defaults?.groupPolicy) ?? runtimeFallbackPolicy;
    const groupPolicy = params.useTopicAndGroupOverrides ? (0, _botaccess.firstDefined)(params.topicConfig?.groupPolicy, params.groupConfig?.groupPolicy, params.telegramCfg.groupPolicy, params.cfg.channels?.defaults?.groupPolicy) ?? runtimeFallbackPolicy : fallbackPolicy;
    if (!params.isGroup || !params.enforcePolicy) {
        return {
            allowed: true,
            groupPolicy
        };
    }
    if (groupPolicy === "disabled") {
        return {
            allowed: false,
            reason: "group-policy-disabled",
            groupPolicy
        };
    }
    // Check chat-level allowlist first so that groups explicitly listed in the
    // `groups` config are not blocked by the sender-level "empty allowlist" guard.
    let chatExplicitlyAllowed = false;
    if (params.checkChatAllowlist) {
        const groupAllowlist = params.resolveGroupPolicy(params.chatId);
        if (groupAllowlist.allowlistEnabled && !groupAllowlist.allowed) {
            return {
                allowed: false,
                reason: "group-chat-not-allowed",
                groupPolicy
            };
        }
        // The chat is explicitly allowed when it has a dedicated entry in the groups
        // config (groupConfig is set).  A wildcard ("*") match alone does not count
        // because it only enables the group — sender-level filtering still applies.
        if (groupAllowlist.allowlistEnabled && groupAllowlist.allowed && groupAllowlist.groupConfig) {
            chatExplicitlyAllowed = true;
        }
    }
    if (groupPolicy === "allowlist" && params.enforceAllowlistAuthorization) {
        const senderId = params.senderId ?? "";
        const allowlistConfigured = chatExplicitlyAllowed || params.allowEmptyAllowlistEntries || params.effectiveGroupAllow.hasEntries;
        const allowlistMatched = chatExplicitlyAllowed && !params.effectiveGroupAllow.hasEntries || (0, _botaccess.isSenderAllowed)({
            allow: params.effectiveGroupAllow,
            senderId,
            senderUsername: params.senderUsername ?? ""
        });
        if (params.requireSenderForAllowlistAuthorization && !senderId) {
            return {
                allowed: false,
                reason: "group-policy-allowlist-no-sender",
                groupPolicy
            };
        }
        if (!allowlistConfigured) {
            return {
                allowed: false,
                reason: "group-policy-allowlist-empty",
                groupPolicy
            };
        }
        if (!allowlistMatched) {
            return {
                allowed: false,
                reason: "group-policy-allowlist-unauthorized",
                groupPolicy
            };
        }
    }
    return {
        allowed: true,
        groupPolicy
    };
};

//# sourceMappingURL=group-access.js.map