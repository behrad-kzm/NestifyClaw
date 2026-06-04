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
    get createTelegramIngressResolver () {
        return createTelegramIngressResolver;
    },
    get createTelegramIngressSubject () {
        return createTelegramIngressSubject;
    },
    get resolveTelegramCommandIngressAuthorization () {
        return resolveTelegramCommandIngressAuthorization;
    },
    get resolveTelegramEventIngressAuthorization () {
        return resolveTelegramEventIngressAuthorization;
    },
    get telegramAllowEntries () {
        return telegramAllowEntries;
    }
});
const _channelingressruntime = require("../../../../common/openclaw/plugin-sdk/channel-ingress-runtime");
const _botaccess = require("./bot-access.js");
const TELEGRAM_CHANNEL_ID = "telegram";
const telegramIngressIdentity = (0, _channelingressruntime.defineStableChannelIngressIdentity)({
    key: "telegram-user-id",
    normalize: (value)=>{
        const normalized = (0, _botaccess.normalizeAllowFrom)([
            value
        ]);
        return normalized.entries[0] ?? (normalized.hasWildcard ? "*" : null);
    },
    sensitivity: "pii"
});
function createTelegramIngressSubject(senderId) {
    return {
        stableId: senderId
    };
}
function createTelegramIngressResolver(params) {
    return (0, _channelingressruntime.createChannelIngressResolver)({
        channelId: TELEGRAM_CHANNEL_ID,
        accountId: params.accountId ?? "default",
        identity: telegramIngressIdentity,
        cfg: params.cfg
    });
}
function telegramAllowEntries(allow) {
    return [
        ...allow.hasWildcard ? [
            "*"
        ] : [],
        ...allow.entries
    ];
}
function telegramConversation(params) {
    return {
        kind: params.isGroup ? "group" : "direct",
        id: String(params.chatId),
        ...params.resolvedThreadId != null ? {
            threadId: String(params.resolvedThreadId)
        } : {}
    };
}
async function resolveTelegramCommandIngressAuthorization(params) {
    const commandOwner = [
        ...params.isGroup && params.includeDmAllowForGroupCommands === false ? [] : telegramAllowEntries(params.effectiveDmAllow),
        ...params.ownerAccess.senderIsOwner ? [
            params.senderId || "*"
        ] : params.ownerAccess.ownerList
    ];
    const result = await createTelegramIngressResolver({
        accountId: params.accountId,
        cfg: params.cfg
    }).command({
        subject: createTelegramIngressSubject(params.senderId),
        conversation: telegramConversation(params),
        event: {
            kind: params.eventKind ?? "native-command"
        },
        dmPolicy: params.dmPolicy,
        groupPolicy: "allowlist",
        allowFrom: commandOwner,
        groupAllowFrom: params.isGroup ? telegramAllowEntries(params.effectiveGroupAllow) : [],
        command: {
            allowTextCommands: params.allowTextCommands ?? false,
            hasControlCommand: params.hasControlCommand ?? false,
            modeWhenAccessGroupsOff: params.modeWhenAccessGroupsOff ?? "configured"
        }
    });
    return result.commandAccess;
}
async function resolveTelegramEventIngressAuthorization(params) {
    const result = await createTelegramIngressResolver({
        accountId: params.accountId
    }).event({
        subject: createTelegramIngressSubject(params.senderId),
        conversation: telegramConversation(params),
        event: {
            kind: params.eventKind,
            authMode: "inbound"
        },
        dmPolicy: params.dmPolicy,
        groupPolicy: params.enforceGroupAuthorization ? "allowlist" : "open",
        allowFrom: telegramAllowEntries(params.effectiveDmAllow),
        groupAllowFrom: params.enforceGroupAuthorization ? telegramAllowEntries(params.effectiveGroupAllow) : []
    });
    return result.ingress;
}

//# sourceMappingURL=ingress.js.map