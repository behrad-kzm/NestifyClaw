"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "enforceTelegramDmAccess", {
    enumerable: true,
    get: function() {
        return enforceTelegramDmAccess;
    }
});
const _channelpairing = require("../../../../common/openclaw/plugin-sdk/channel-pairing");
const _conversationruntime = require("../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _apilogging = require("./api-logging.js");
const _format = require("./format.js");
const _ingress = require("./ingress.js");
function resolveTelegramSenderIdentity(msg, chatId) {
    const from = msg.from;
    const userId = from?.id != null ? String(from.id) : null;
    return {
        username: from?.username ?? "",
        userId,
        candidateId: userId ?? String(chatId),
        firstName: from?.first_name,
        lastName: from?.last_name
    };
}
async function decideTelegramDmAccess(params) {
    const result = await (0, _ingress.createTelegramIngressResolver)({
        accountId: params.accountId
    }).message({
        subject: (0, _ingress.createTelegramIngressSubject)(params.sender.candidateId),
        conversation: {
            kind: "direct",
            id: params.sender.candidateId
        },
        dmPolicy: params.dmPolicy,
        groupPolicy: "disabled",
        allowFrom: (0, _ingress.telegramAllowEntries)(params.effectiveDmAllow)
    });
    return result.ingress;
}
async function enforceTelegramDmAccess(params) {
    const { isGroup, dmPolicy, msg, chatId, effectiveDmAllow, accountId, bot, logger, upsertPairingRequest } = params;
    if (isGroup) {
        return true;
    }
    if (dmPolicy === "disabled") {
        return false;
    }
    const sender = resolveTelegramSenderIdentity(msg, chatId);
    const access = await decideTelegramDmAccess({
        accountId,
        dmPolicy,
        sender,
        effectiveDmAllow
    });
    if (access.decision === "allow") {
        return true;
    }
    if (dmPolicy === "open") {
        (0, _runtimeenv.logVerbose)(`Blocked unauthorized telegram sender ${sender.candidateId} (dmPolicy=open)`);
        return false;
    }
    if (access.decision === "pairing") {
        try {
            const telegramUserId = sender.userId ?? sender.candidateId;
            await (0, _channelpairing.createChannelPairingChallengeIssuer)({
                channel: "telegram",
                upsertPairingRequest: async ({ id, meta })=>await (upsertPairingRequest ?? _conversationruntime.upsertChannelPairingRequest)({
                        channel: "telegram",
                        id,
                        accountId,
                        meta
                    })
            })({
                senderId: telegramUserId,
                senderIdLine: `Your Telegram user id: ${telegramUserId}`,
                meta: {
                    username: sender.username || undefined,
                    firstName: sender.firstName,
                    lastName: sender.lastName
                },
                onCreated: ()=>{
                    logger.info({
                        chatId: String(chatId),
                        senderUserId: sender.userId ?? undefined,
                        username: sender.username || undefined,
                        firstName: sender.firstName,
                        lastName: sender.lastName
                    }, "telegram pairing request");
                },
                sendPairingReply: async (text)=>{
                    const html = (0, _format.renderTelegramHtmlText)(text);
                    await (0, _apilogging.withTelegramApiErrorLogging)({
                        operation: "sendMessage",
                        fn: ()=>bot.api.sendMessage(chatId, html, {
                                parse_mode: "HTML"
                            })
                    });
                },
                onReplyError: (err)=>{
                    (0, _runtimeenv.logVerbose)(`telegram pairing reply failed for chat ${chatId}: ${String(err)}`);
                }
            });
        } catch (err) {
            (0, _runtimeenv.logVerbose)(`telegram pairing reply failed for chat ${chatId}: ${String(err)}`);
        }
        return false;
    }
    (0, _runtimeenv.logVerbose)(`Blocked unauthorized telegram sender ${sender.candidateId} (dmPolicy=${dmPolicy})`);
    return false;
}

//# sourceMappingURL=dm-access.js.map