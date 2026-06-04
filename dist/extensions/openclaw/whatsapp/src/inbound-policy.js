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
    get resolveWhatsAppCommandAuthorized () {
        return resolveWhatsAppCommandAuthorized;
    },
    get resolveWhatsAppInboundPolicy () {
        return resolveWhatsAppInboundPolicy;
    },
    get resolveWhatsAppIngressAccess () {
        return resolveWhatsAppIngressAccess;
    }
});
const _channelingressruntime = require("../../../../common/openclaw/plugin-sdk/channel-ingress-runtime");
const _channelpolicy = require("../../../../common/openclaw/plugin-sdk/channel-policy");
const _runtimegrouppolicy = require("../../../../common/openclaw/plugin-sdk/runtime-group-policy");
const _sessionstoreruntime = require("../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _accounts = require("./accounts.js");
const _identity = require("./identity.js");
const _runtimegrouppolicy1 = require("./runtime-group-policy.js");
const _textruntime = require("./text-runtime.js");
function normalizeWhatsAppIngressPhone(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    return (0, _textruntime.normalizeE164)(trimmed);
}
function resolveGroupConversationId(conversationId) {
    return (0, _sessionstoreruntime.resolveGroupSessionKey)({
        From: conversationId,
        ChatType: "group",
        Provider: "whatsapp"
    })?.id ?? conversationId;
}
function maybeSamePhoneDmAllowFrom(params) {
    if (params.isGroup || !params.dmSenderId || !params.policy.isSamePhone(params.dmSenderId)) {
        return [];
    }
    return [
        params.dmSenderId
    ];
}
function buildResolvedWhatsAppGroupConfig(params) {
    return {
        channels: {
            whatsapp: {
                groupPolicy: params.groupPolicy,
                groups: params.groups
            }
        }
    };
}
function resolveWhatsAppInboundPolicy(params) {
    const account = (0, _accounts.resolveWhatsAppAccount)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    const configuredAllowFrom = account.allowFrom ?? [];
    const dmPolicy = account.dmPolicy ?? "pairing";
    const dmAllowFrom = configuredAllowFrom.length > 0 ? configuredAllowFrom : params.selfE164 ? [
        params.selfE164
    ] : [];
    const configuredGroupAllowFrom = Array.isArray(account.groupAllowFrom) && account.groupAllowFrom.length > 0 ? account.groupAllowFrom : undefined;
    const groupAllowFrom = configuredGroupAllowFrom ?? (configuredAllowFrom.length > 0 ? configuredAllowFrom : undefined) ?? [];
    const defaultGroupPolicy = (0, _runtimegrouppolicy.resolveDefaultGroupPolicy)(params.cfg);
    const { groupPolicy, providerMissingFallbackApplied } = (0, _runtimegrouppolicy1.resolveWhatsAppRuntimeGroupPolicy)({
        providerConfigPresent: params.cfg.channels?.whatsapp !== undefined,
        groupPolicy: account.groupPolicy,
        defaultGroupPolicy
    });
    const resolvedGroupCfg = buildResolvedWhatsAppGroupConfig({
        groupPolicy,
        groups: account.groups
    });
    const isSamePhone = (value)=>typeof value === "string" && typeof params.selfE164 === "string" && value === params.selfE164;
    return {
        account,
        dmPolicy,
        groupPolicy,
        configuredAllowFrom,
        dmAllowFrom,
        groupAllowFrom,
        isSelfChat: account.selfChatMode ?? (0, _textruntime.isSelfChatMode)(params.selfE164, configuredAllowFrom),
        providerMissingFallbackApplied,
        isSamePhone,
        resolveConversationGroupPolicy: (conversationId)=>(0, _channelpolicy.resolveChannelGroupPolicy)({
                cfg: resolvedGroupCfg,
                channel: "whatsapp",
                groupId: resolveGroupConversationId(conversationId),
                hasGroupAllowFrom: groupAllowFrom.length > 0
            }),
        resolveConversationRequireMention: (conversationId)=>(0, _channelpolicy.resolveChannelGroupRequireMention)({
                cfg: resolvedGroupCfg,
                channel: "whatsapp",
                groupId: resolveGroupConversationId(conversationId)
            })
    };
}
async function resolveWhatsAppIngressAccess(params) {
    const samePhoneDmAllowFrom = maybeSamePhoneDmAllowFrom({
        isGroup: params.isGroup,
        policy: params.policy,
        dmSenderId: params.dmSenderId
    });
    const dmAllowFrom = [
        ...params.policy.dmAllowFrom,
        ...samePhoneDmAllowFrom
    ];
    return await (0, _channelingressruntime.resolveStableChannelMessageIngress)({
        channelId: "whatsapp",
        accountId: params.policy.account.accountId,
        identity: {
            key: "whatsapp-sender-phone",
            kind: "phone",
            normalize: normalizeWhatsAppIngressPhone,
            sensitivity: "pii",
            entryIdPrefix: "whatsapp-entry"
        },
        cfg: params.cfg,
        useDefaultPairingStore: true,
        subject: {
            stableId: params.senderId ?? ""
        },
        conversation: {
            kind: params.isGroup ? "group" : "direct",
            id: params.conversationId
        },
        dmPolicy: params.policy.dmPolicy,
        groupPolicy: params.policy.groupPolicy,
        policy: {
            groupAllowFromFallbackToAllowFrom: false
        },
        allowFrom: dmAllowFrom,
        groupAllowFrom: params.policy.groupAllowFrom,
        command: params.includeCommand === true ? {} : undefined
    });
}
async function resolveWhatsAppCommandAuthorized(params) {
    const useAccessGroups = params.cfg.commands?.useAccessGroups !== false;
    if (!useAccessGroups) {
        return true;
    }
    const self = (0, _identity.getSelfIdentity)(params.msg);
    const policy = params.policy ?? resolveWhatsAppInboundPolicy({
        cfg: params.cfg,
        accountId: params.msg.accountId,
        selfE164: self.e164 ?? null
    });
    const isGroup = params.msg.chatType === "group";
    const sender = (0, _identity.getSenderIdentity)(params.msg);
    const dmSender = sender.e164 ?? params.msg.from ?? "";
    const groupSender = sender.e164 ?? "";
    if (!(0, _textruntime.normalizeE164)(isGroup ? groupSender : dmSender)) {
        return false;
    }
    const access = await resolveWhatsAppIngressAccess({
        cfg: params.cfg,
        policy,
        isGroup,
        conversationId: params.msg.conversationId ?? params.msg.chatId ?? params.msg.from,
        senderId: isGroup ? groupSender : dmSender,
        dmSenderId: dmSender,
        includeCommand: true
    });
    return access.commandAccess.authorized;
}

//# sourceMappingURL=inbound-policy.js.map