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
    get getTelegramSequentialKey () {
        return getTelegramSequentialKey;
    },
    get isTelegramControlLaneText () {
        return isTelegramControlLaneText;
    },
    get isTelegramReadOnlyControlLaneText () {
        return isTelegramReadOnlyControlLaneText;
    }
});
const _approvalreplyruntime = require("../../../../common/openclaw/plugin-sdk/approval-reply-runtime");
const _commandauthnative = require("../../../../common/openclaw/plugin-sdk/command-auth-native");
const _commandprimitivesruntime = require("../../../../common/openclaw/plugin-sdk/command-primitives-runtime");
const _helpers = require("./bot/helpers.js");
const TELEGRAM_READ_ONLY_STATUS_COMMAND_KEYS = new Set([
    "commands",
    "context",
    "help",
    "status",
    "tasks",
    "tools",
    "whoami"
]);
function isTelegramReadOnlyControlLaneText(params) {
    // Only read-only status commands should bypass the per-topic lane.
    // Diagnostics and export commands materialize state and should not interleave with an active turn.
    const normalizedBody = (0, _commandauthnative.normalizeCommandBody)(params.rawText?.trim() ?? "", params.botUsername ? {
        botUsername: params.botUsername
    } : undefined);
    const alias = (0, _commandauthnative.maybeResolveTextAlias)(normalizedBody);
    if (!alias) {
        return false;
    }
    const command = (0, _commandauthnative.listChatCommands)().find((entry)=>entry.textAliases.some((candidate)=>candidate.trim().toLowerCase() === alias));
    return command?.category === "status" && TELEGRAM_READ_ONLY_STATUS_COMMAND_KEYS.has(command.key);
}
function isTelegramTargetedStopCommand(rawText, botUsername) {
    const trimmed = rawText?.trim();
    if (!trimmed) {
        return false;
    }
    // Isolated ingress may not have getMe() metadata yet. A targeted Telegram
    // /stop@bot command still needs the control lane so it can cancel a busy turn.
    const match = trimmed.match(/^\/stop@([A-Za-z0-9_]+)(?:$|\s|[.!?…,，。;；:：'"’”)\]}])/iu);
    if (!match) {
        return false;
    }
    const normalizedBotUsername = botUsername?.trim().toLowerCase();
    if (!normalizedBotUsername) {
        return true;
    }
    return match[1]?.toLowerCase() === normalizedBotUsername;
}
function isTelegramControlLaneText(params) {
    if ((0, _commandprimitivesruntime.isAbortRequestText)(params.rawText, params.botUsername ? {
        botUsername: params.botUsername
    } : undefined)) {
        return true;
    }
    if (isTelegramTargetedStopCommand(params.rawText, params.botUsername)) {
        return true;
    }
    return isTelegramReadOnlyControlLaneText(params);
}
function getTelegramSequentialKey(ctx) {
    const reaction = ctx.update?.message_reaction;
    if (reaction?.chat?.id) {
        return `telegram:${reaction.chat.id}`;
    }
    const msg = ctx.message ?? ctx.channelPost ?? ctx.editedMessage ?? ctx.editedChannelPost ?? ctx.update?.message ?? ctx.update?.edited_message ?? ctx.update?.channel_post ?? ctx.update?.edited_channel_post ?? ctx.update?.callback_query?.message;
    const chatId = msg?.chat?.id ?? ctx.chat?.id;
    const rawText = msg?.text ?? msg?.caption;
    const botUsername = ctx.me?.username;
    if (isTelegramControlLaneText({
        rawText,
        botUsername
    })) {
        if (typeof chatId === "number") {
            return `telegram:${chatId}:control`;
        }
        return "telegram:control";
    }
    if ((0, _commandprimitivesruntime.isBtwRequestText)(rawText, botUsername ? {
        botUsername
    } : undefined)) {
        const messageId = msg?.message_id;
        if (typeof chatId === "number" && typeof messageId === "number") {
            return `telegram:${chatId}:btw:${messageId}`;
        }
        if (typeof chatId === "number") {
            return `telegram:${chatId}:btw`;
        }
        return "telegram:btw";
    }
    const callbackData = ctx.update?.callback_query?.data;
    if (callbackData && (0, _approvalreplyruntime.parseExecApprovalCommandText)(callbackData) !== null) {
        if (typeof chatId === "number") {
            return `telegram:${chatId}:approval`;
        }
        return "telegram:approval";
    }
    const isGroup = msg?.chat?.type === "group" || msg?.chat?.type === "supergroup";
    const messageThreadId = msg?.message_thread_id;
    const isForum = (0, _helpers.resolveTelegramMessageForumFlagHint)({
        chatType: msg?.chat?.type,
        isForum: msg?.chat?.is_forum,
        isTopicMessage: msg?.is_topic_message
    });
    const threadId = isGroup ? (0, _helpers.resolveTelegramForumThreadId)({
        isForum,
        messageThreadId
    }) : messageThreadId;
    if (typeof chatId === "number") {
        return threadId != null ? `telegram:${chatId}:topic:${threadId}` : `telegram:${chatId}`;
    }
    return "telegram:unknown";
}

//# sourceMappingURL=sequential-key.js.map