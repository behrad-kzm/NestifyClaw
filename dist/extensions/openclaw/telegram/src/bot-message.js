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
    get createTelegramMessageProcessor () {
        return createTelegramMessageProcessor;
    },
    get formatTelegramInboundLogLine () {
        return formatTelegramInboundLogLine;
    }
});
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _botmessagecontext = require("./bot-message-context.js");
const _botmessagedispatch = require("./bot-message-dispatch.js");
const _helpers = require("./bot/helpers.js");
const telegramInboundLog = (0, _runtimeenv.createSubsystemLogger)("gateway/channels/telegram").child("inbound");
function formatTelegramInboundLogLine(params) {
    const kindLabel = params.mediaType ? `, ${params.mediaType}` : "";
    return `Inbound message ${params.from} -> ${params.to} (${params.chatType}${kindLabel}, ${params.body.length} chars)`;
}
const createTelegramMessageProcessor = (deps)=>{
    const { bot, cfg, account, telegramCfg, historyLimit, groupHistories, dmPolicy, allowFrom, groupAllowFrom, ackReactionScope, logger, resolveGroupActivation, resolveGroupRequireMention, resolveTelegramGroupConfig, loadFreshConfig, sendChatActionHandler, runtime, replyToMode, streamMode, textLimit, telegramDeps, opts } = deps;
    const sessionRuntime = {
        ...telegramDeps.buildChannelInboundEventContext ? {
            buildChannelInboundEventContext: telegramDeps.buildChannelInboundEventContext
        } : {},
        ...telegramDeps.readSessionUpdatedAt ? {
            readSessionUpdatedAt: telegramDeps.readSessionUpdatedAt
        } : {},
        ...telegramDeps.recordInboundSession ? {
            recordInboundSession: telegramDeps.recordInboundSession
        } : {},
        ...telegramDeps.resolveInboundLastRouteSessionKey ? {
            resolveInboundLastRouteSessionKey: telegramDeps.resolveInboundLastRouteSessionKey
        } : {},
        ...telegramDeps.resolvePinnedMainDmOwnerFromAllowlist ? {
            resolvePinnedMainDmOwnerFromAllowlist: telegramDeps.resolvePinnedMainDmOwnerFromAllowlist
        } : {},
        resolveStorePath: telegramDeps.resolveStorePath
    };
    const contextRuntime = telegramDeps.recordChannelActivity ? {
        recordChannelActivity: telegramDeps.recordChannelActivity
    } : undefined;
    return async (primaryCtx, allMedia, storeAllowFrom, options, replyMedia, replyChain, promptContext, lifecycle)=>{
        const ingressReceivedAtMs = typeof options?.receivedAtMs === "number" && Number.isFinite(options.receivedAtMs) ? options.receivedAtMs : undefined;
        const ingressDebugEnabled = (0, _runtimeenv.shouldLogVerbose)() || process.env.OPENCLAW_DEBUG_TELEGRAM_INGRESS === "1";
        const ingressContextStartMs = ingressReceivedAtMs ? Date.now() : undefined;
        const context = await (0, _botmessagecontext.buildTelegramMessageContext)({
            primaryCtx,
            allMedia,
            replyMedia,
            replyChain,
            promptContext,
            storeAllowFrom,
            options,
            bot,
            cfg,
            account,
            historyLimit,
            groupHistories,
            dmPolicy,
            allowFrom,
            groupAllowFrom,
            ackReactionScope,
            logger,
            resolveGroupActivation,
            resolveGroupRequireMention,
            resolveTelegramGroupConfig,
            sendChatActionHandler,
            loadFreshConfig,
            runtime: contextRuntime,
            sessionRuntime,
            upsertPairingRequest: telegramDeps.upsertChannelPairingRequest
        });
        if (!context) {
            if (ingressDebugEnabled && ingressReceivedAtMs && ingressContextStartMs) {
                (0, _runtimeenv.logVerbose)(`telegram ingress: chatId=${primaryCtx.message.chat.id} dropped after ${Date.now() - ingressReceivedAtMs}ms` + (options?.ingressBuffer ? ` buffer=${options.ingressBuffer}` : ""));
            }
            return false;
        }
        if (ingressDebugEnabled && ingressReceivedAtMs && ingressContextStartMs) {
            (0, _runtimeenv.logVerbose)(`telegram ingress: chatId=${context.chatId} contextReadyMs=${Date.now() - ingressReceivedAtMs}` + ` preDispatchMs=${Date.now() - ingressContextStartMs}` + (options?.ingressBuffer ? ` buffer=${options.ingressBuffer}` : ""));
        }
        if (context.ctxPayload.InboundEventKind !== "room_event" && context.initialTypingCueSent !== true) {
            void context.sendTyping().catch((err)=>{
                (0, _runtimeenv.logVerbose)(`telegram early typing cue failed for chat ${context.chatId}: ${String(err)}`);
            });
        }
        telegramInboundLog.info(formatTelegramInboundLogLine({
            from: context.ctxPayload.From,
            to: context.primaryCtx.me?.username ? `@${context.primaryCtx.me.username}` : context.ctxPayload.To,
            chatType: context.ctxPayload.ChatType,
            body: context.ctxPayload.RawBody,
            mediaType: allMedia[0]?.contentType
        }));
        await lifecycle?.onDispatchStart?.();
        try {
            await (0, _botmessagedispatch.dispatchTelegramMessage)({
                context,
                bot,
                cfg,
                runtime,
                replyToMode,
                streamMode,
                textLimit,
                telegramCfg,
                telegramDeps,
                opts
            });
            if (ingressDebugEnabled && ingressReceivedAtMs) {
                (0, _runtimeenv.logVerbose)(`telegram ingress: chatId=${context.chatId} dispatchCompleteMs=${Date.now() - ingressReceivedAtMs}` + (options?.ingressBuffer ? ` buffer=${options.ingressBuffer}` : ""));
            }
        } catch (err) {
            runtime.error?.((0, _runtimeenv.danger)(`telegram message processing failed: ${String(err)}`));
            try {
                await bot.api.sendMessage(context.chatId, "Something went wrong while processing your request. Please try again.", (0, _helpers.buildTelegramThreadParams)(context.threadSpec));
            } catch  {}
        }
        return true;
    };
};

//# sourceMappingURL=bot-message.js.map