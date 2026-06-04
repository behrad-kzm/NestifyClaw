"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "defaultTelegramBotDeps", {
    enumerable: true,
    get: function() {
        return defaultTelegramBotDeps;
    }
});
const _channelactivityruntime = require("../../../../common/openclaw/plugin-sdk/channel-activity-runtime");
const _channelinbound = require("../../../../common/openclaw/plugin-sdk/channel-inbound");
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _conversationruntime = require("../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _modelsproviderruntime = require("../../../../common/openclaw/plugin-sdk/models-provider-runtime");
const _replydispatchruntime = require("../../../../common/openclaw/plugin-sdk/reply-dispatch-runtime");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _runtimeconfigsnapshot = require("../../../../common/openclaw/plugin-sdk/runtime-config-snapshot");
const _securityruntime = require("../../../../common/openclaw/plugin-sdk/security-runtime");
const _sessionstoreruntime = require("../../../../common/openclaw/plugin-sdk/session-store-runtime");
const _skillcommandsruntime = require("../../../../common/openclaw/plugin-sdk/skill-commands-runtime");
const _systemeventruntime = require("../../../../common/openclaw/plugin-sdk/system-event-runtime");
const _webmedia = require("../../../../common/openclaw/plugin-sdk/web-media");
const _botnativecommandmenu = require("./bot-native-command-menu.js");
const _delivery = require("./bot/delivery.js");
const _draftstream = require("./draft-stream.js");
const _execapprovalresolver = require("./exec-approval-resolver.js");
const _nativetoolprogressdraft = require("./native-tool-progress-draft.js");
const _outboundmessagecontext = require("./outbound-message-context.js");
const _send = require("./send.js");
const _sentmessagecache = require("./sent-message-cache.js");
const defaultTelegramBotDeps = {
    get getRuntimeConfig () {
        return _runtimeconfigsnapshot.getRuntimeConfig;
    },
    get resolveStorePath () {
        return _sessionstoreruntime.resolveStorePath;
    },
    get readChannelAllowFromStore () {
        return _conversationruntime.readChannelAllowFromStore;
    },
    get loadSessionStore () {
        return _sessionstoreruntime.loadSessionStore;
    },
    get readSessionUpdatedAt () {
        return _sessionstoreruntime.readSessionUpdatedAt;
    },
    get recordInboundSession () {
        return _conversationruntime.recordInboundSession;
    },
    get recordChannelActivity () {
        return _channelactivityruntime.recordChannelActivity;
    },
    get resolveInboundLastRouteSessionKey () {
        return _routing.resolveInboundLastRouteSessionKey;
    },
    get resolvePinnedMainDmOwnerFromAllowlist () {
        return _securityruntime.resolvePinnedMainDmOwnerFromAllowlist;
    },
    get buildChannelInboundEventContext () {
        return _channelinbound.buildChannelInboundEventContext;
    },
    get upsertChannelPairingRequest () {
        return _conversationruntime.upsertChannelPairingRequest;
    },
    get enqueueSystemEvent () {
        return _systemeventruntime.enqueueSystemEvent;
    },
    get dispatchReplyWithBufferedBlockDispatcher () {
        return _replydispatchruntime.dispatchReplyWithBufferedBlockDispatcher;
    },
    get loadWebMedia () {
        return _webmedia.loadWebMedia;
    },
    get buildModelsProviderData () {
        return _modelsproviderruntime.buildModelsProviderData;
    },
    get listSkillCommandsForAgents () {
        return _skillcommandsruntime.listSkillCommandsForAgents;
    },
    get syncTelegramMenuCommands () {
        return _botnativecommandmenu.syncTelegramMenuCommands;
    },
    get wasSentByBot () {
        return _sentmessagecache.wasSentByBot;
    },
    get resolveExecApproval () {
        return _execapprovalresolver.resolveTelegramExecApproval;
    },
    get createTelegramDraftStream () {
        return _draftstream.createTelegramDraftStream;
    },
    get createNativeTelegramToolProgressDraft () {
        return _nativetoolprogressdraft.createNativeTelegramToolProgressDraft;
    },
    get deliverReplies () {
        return _delivery.deliverReplies;
    },
    get deliverInboundReplyWithMessageSendContext () {
        return _channeloutbound.deliverInboundReplyWithMessageSendContext;
    },
    get emitInternalMessageSentHook () {
        return _delivery.emitInternalMessageSentHook;
    },
    get editMessageTelegram () {
        return _send.editMessageTelegram;
    },
    get recordOutboundMessageForPromptContext () {
        return _outboundmessagecontext.recordOutboundMessageForPromptContext;
    },
    get createChannelMessageReplyPipeline () {
        return _channeloutbound.createChannelMessageReplyPipeline;
    }
};

//# sourceMappingURL=bot-deps.js.map