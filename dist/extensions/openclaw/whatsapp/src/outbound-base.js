"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createWhatsAppOutboundBase", {
    enumerable: true,
    get: function() {
        return createWhatsAppOutboundBase;
    }
});
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _channelsendresult = require("../../../../common/openclaw/plugin-sdk/channel-send-result");
const _replypayload = require("../../../../common/openclaw/plugin-sdk/reply-payload");
const _outboundmediacontract = require("./outbound-media-contract.js");
const _outboundsenddeps = require("./outbound-send-deps.js");
const _quotedmessage = require("./quoted-message.js");
const _textruntime = require("./text-runtime.js");
function resolveQuoteLookupAccountId(cfg, accountId) {
    const explicitAccountId = (0, _accountcore.normalizeOptionalAccountId)(accountId);
    if (explicitAccountId) {
        return explicitAccountId;
    }
    const channelCfg = cfg?.channels?.whatsapp;
    const configuredIds = (0, _accountcore.listCombinedAccountIds)({
        configuredAccountIds: channelCfg?.accounts && typeof channelCfg.accounts === "object" ? Object.keys(channelCfg.accounts).filter(Boolean) : [],
        fallbackAccountIdWhenEmpty: _accountcore.DEFAULT_ACCOUNT_ID
    });
    return (0, _accountcore.resolveListedDefaultAccountId)({
        accountIds: configuredIds,
        configuredDefaultAccountId: (0, _accountcore.normalizeOptionalAccountId)(channelCfg?.defaultAccount)
    });
}
function createWhatsAppOutboundBase({ chunker, sendMessageWhatsApp, sendPollWhatsApp, shouldLogVerbose, resolveTarget, normalizeText = _outboundmediacontract.normalizeWhatsAppPayloadText, skipEmptyText = true }) {
    const resolveQuotedMessageKey = (params)=>{
        const replyToId = params.replyToId?.trim();
        if (!replyToId) {
            return undefined;
        }
        const targetJid = (0, _textruntime.toWhatsappJid)(params.to);
        const cachedMeta = (0, _quotedmessage.lookupInboundMessageMetaForTarget)(params.accountId, targetJid, replyToId);
        return {
            id: replyToId,
            remoteJid: cachedMeta?.remoteJid ?? targetJid,
            fromMe: cachedMeta?.fromMe ?? false,
            participant: cachedMeta?.participant,
            messageText: cachedMeta?.body
        };
    };
    const outbound = {
        deliveryMode: "gateway",
        chunker,
        chunkerMode: "text",
        textChunkLimit: 4000,
        sanitizeText: ({ text })=>normalizeText(text),
        deliveryCapabilities: {
            durableFinal: {
                text: true,
                replyTo: true,
                messageSendingHooks: true
            }
        },
        pollMaxOptions: 12,
        resolveTarget,
        ...(0, _channelsendresult.createAttachedChannelResultAdapter)({
            channel: "whatsapp",
            sendText: async ({ cfg, to, text, accountId, deps, gifPlayback, replyToId })=>{
                const normalizedText = normalizeText(text);
                if (skipEmptyText && !normalizedText) {
                    return {
                        messageId: ""
                    };
                }
                const send = (0, _channeloutbound.resolveOutboundSendDep)(deps, "whatsapp", {
                    legacyKeys: _outboundsenddeps.WHATSAPP_LEGACY_OUTBOUND_SEND_DEP_KEYS
                }) ?? sendMessageWhatsApp;
                const lookupAccountId = resolveQuoteLookupAccountId(cfg, accountId);
                const quotedMessageKey = resolveQuotedMessageKey({
                    accountId: lookupAccountId,
                    to,
                    replyToId
                });
                return await send(to, normalizedText, {
                    verbose: false,
                    cfg,
                    accountId: accountId ?? undefined,
                    gifPlayback,
                    quotedMessageKey
                });
            },
            sendMedia: async ({ cfg, to, text, mediaUrl, mediaAccess, mediaLocalRoots, mediaReadFile, audioAsVoice, accountId, deps, gifPlayback, forceDocument, replyToId })=>{
                const send = (0, _channeloutbound.resolveOutboundSendDep)(deps, "whatsapp", {
                    legacyKeys: _outboundsenddeps.WHATSAPP_LEGACY_OUTBOUND_SEND_DEP_KEYS
                }) ?? sendMessageWhatsApp;
                const lookupAccountId = resolveQuoteLookupAccountId(cfg, accountId);
                const quotedMessageKey = resolveQuotedMessageKey({
                    accountId: lookupAccountId,
                    to,
                    replyToId
                });
                return await send(to, normalizeText(text), {
                    verbose: false,
                    cfg,
                    mediaUrl,
                    mediaAccess,
                    mediaLocalRoots,
                    mediaReadFile,
                    ...audioAsVoice === undefined ? {} : {
                        audioAsVoice
                    },
                    accountId: accountId ?? undefined,
                    gifPlayback,
                    forceDocument,
                    quotedMessageKey
                });
            },
            sendPoll: async ({ cfg, to, poll, accountId })=>await sendPollWhatsApp(to, poll, {
                    verbose: shouldLogVerbose(),
                    accountId: accountId ?? undefined,
                    cfg
                })
        })
    };
    return {
        ...outbound,
        sendPayload: async (ctx)=>{
            if (ctx.payload.isError === true) {
                return {
                    channel: "whatsapp",
                    messageId: ""
                };
            }
            const payload = (0, _outboundmediacontract.normalizeWhatsAppOutboundPayload)(ctx.payload, {
                normalizeText
            });
            if (!payload.text && !(payload.mediaUrl || payload.mediaUrls?.length)) {
                if (ctx.payload.interactive || ctx.payload.presentation || ctx.payload.channelData) {
                    throw new Error("WhatsApp sendPayload does not support structured-only payloads without text or media.");
                }
                return {
                    channel: "whatsapp",
                    messageId: ""
                };
            }
            return await (0, _replypayload.sendTextMediaPayload)({
                channel: "whatsapp",
                ctx: {
                    ...ctx,
                    payload
                },
                adapter: outbound
            });
        }
    };
}

//# sourceMappingURL=outbound-base.js.map