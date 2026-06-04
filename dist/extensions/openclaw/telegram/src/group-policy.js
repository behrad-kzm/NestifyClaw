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
    get resolveTelegramGroupRequireMention () {
        return resolveTelegramGroupRequireMention;
    },
    get resolveTelegramGroupToolPolicy () {
        return resolveTelegramGroupToolPolicy;
    }
});
const _channelpolicy = require("../../../../common/openclaw/plugin-sdk/channel-policy");
function parseTelegramGroupId(value) {
    const raw = value?.trim() ?? "";
    if (!raw) {
        return {
            chatId: undefined,
            topicId: undefined
        };
    }
    const parts = raw.split(":").filter(Boolean);
    if (parts.length >= 3 && parts[1] === "topic" && /^-?\d+$/.test(parts[0]) && /^\d+$/.test(parts[2])) {
        return {
            chatId: parts[0],
            topicId: parts[2]
        };
    }
    if (parts.length >= 2 && /^-?\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
        return {
            chatId: parts[0],
            topicId: parts[1]
        };
    }
    return {
        chatId: raw,
        topicId: undefined
    };
}
function resolveTelegramRequireMention(params) {
    const { cfg, chatId, topicId, accountId } = params;
    if (!chatId) {
        return undefined;
    }
    const scopedGroups = (accountId ? cfg.channels?.telegram?.accounts?.[accountId]?.groups : undefined) ?? cfg.channels?.telegram?.groups;
    const groupConfig = scopedGroups?.[chatId];
    const groupDefault = scopedGroups?.["*"];
    const topicConfig = topicId && groupConfig?.topics ? {
        ...groupConfig.topics["*"],
        ...groupConfig.topics[topicId]
    } : undefined;
    const defaultTopicConfig = topicId && groupDefault?.topics ? {
        ...groupDefault.topics["*"],
        ...groupDefault.topics[topicId]
    } : undefined;
    if (typeof topicConfig?.requireMention === "boolean") {
        return topicConfig.requireMention;
    }
    if (typeof defaultTopicConfig?.requireMention === "boolean") {
        return defaultTopicConfig.requireMention;
    }
    if (typeof groupConfig?.requireMention === "boolean") {
        return groupConfig.requireMention;
    }
    if (typeof groupDefault?.requireMention === "boolean") {
        return groupDefault.requireMention;
    }
    return undefined;
}
function resolveTelegramGroupRequireMention(params) {
    const { chatId, topicId } = parseTelegramGroupId(params.groupId);
    const requireMention = resolveTelegramRequireMention({
        cfg: params.cfg,
        chatId,
        topicId,
        accountId: params.accountId
    });
    if (typeof requireMention === "boolean") {
        return requireMention;
    }
    return (0, _channelpolicy.resolveChannelGroupRequireMention)({
        cfg: params.cfg,
        channel: "telegram",
        groupId: chatId ?? params.groupId,
        accountId: params.accountId
    });
}
function resolveTelegramGroupToolPolicy(params) {
    const { chatId } = parseTelegramGroupId(params.groupId);
    return (0, _channelpolicy.resolveChannelGroupToolsPolicy)({
        cfg: params.cfg,
        channel: "telegram",
        groupId: chatId ?? params.groupId,
        accountId: params.accountId,
        senderId: params.senderId,
        senderName: params.senderName,
        senderUsername: params.senderUsername,
        senderE164: params.senderE164
    });
}

//# sourceMappingURL=group-policy.js.map