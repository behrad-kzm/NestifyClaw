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
    get AcpRuntimeError () {
        return _acpruntime.AcpRuntimeError;
    },
    get DEFAULT_ACCOUNT_ID () {
        return _accountid.DEFAULT_ACCOUNT_ID;
    },
    get PAIRING_APPROVED_MESSAGE () {
        return _channelstatus.PAIRING_APPROVED_MESSAGE;
    },
    get TelegramConfigSchema () {
        return _configapi.TelegramConfigSchema;
    },
    get auditTelegramGroupMembership () {
        return _audit.auditTelegramGroupMembership;
    },
    get buildChannelConfigSchema () {
        return _configapi.buildChannelConfigSchema;
    },
    get buildTelegramExecApprovalPendingPayload () {
        return _execapprovalforwarding.buildTelegramExecApprovalPendingPayload;
    },
    get buildTokenChannelStatusSummary () {
        return _channelstatus.buildTokenChannelStatusSummary;
    },
    get clearAccountEntryFields () {
        return _channelcore.clearAccountEntryFields;
    },
    get collectTelegramUnmentionedGroupIds () {
        return _audit.collectTelegramUnmentionedGroupIds;
    },
    get createForumTopicTelegram () {
        return _send.createForumTopicTelegram;
    },
    get createTelegramThreadBindingManager () {
        return _threadbindings.createTelegramThreadBindingManager;
    },
    get deleteMessageTelegram () {
        return _send.deleteMessageTelegram;
    },
    get editForumTopicTelegram () {
        return _send.editForumTopicTelegram;
    },
    get editMessageReplyMarkupTelegram () {
        return _send.editMessageReplyMarkupTelegram;
    },
    get editMessageTelegram () {
        return _send.editMessageTelegram;
    },
    get emptyPluginConfigSchema () {
        return _channelplugincommon.emptyPluginConfigSchema;
    },
    get formatPairingApproveHint () {
        return _channelplugincommon.formatPairingApproveHint;
    },
    get getChatChannelMeta () {
        return _channelplugincommon.getChatChannelMeta;
    },
    get getTelegramThreadBindingManager () {
        return _threadbindings.getTelegramThreadBindingManager;
    },
    get jsonResult () {
        return _channelactions.jsonResult;
    },
    get makeProxyFetch () {
        return _proxy.makeProxyFetch;
    },
    get monitorTelegramProvider () {
        return _monitor.monitorTelegramProvider;
    },
    get normalizeAccountId () {
        return _accountid.normalizeAccountId;
    },
    get parseTelegramTopicConversation () {
        return _topicconversation.parseTelegramTopicConversation;
    },
    get pinMessageTelegram () {
        return _send.pinMessageTelegram;
    },
    get probeTelegram () {
        return _probe.probeTelegram;
    },
    get projectCredentialSnapshotFields () {
        return _channelstatus.projectCredentialSnapshotFields;
    },
    get reactMessageTelegram () {
        return _send.reactMessageTelegram;
    },
    get readNumberParam () {
        return _channelactions.readNumberParam;
    },
    get readReactionParams () {
        return _channelactions.readReactionParams;
    },
    get readStringArrayParam () {
        return _channelactions.readStringArrayParam;
    },
    get readStringOrNumberParam () {
        return _channelactions.readStringOrNumberParam;
    },
    get readStringParam () {
        return _channelactions.readStringParam;
    },
    get renameForumTopicTelegram () {
        return _send.renameForumTopicTelegram;
    },
    get resetTelegramThreadBindingsForTests () {
        return _threadbindings.resetTelegramThreadBindingsForTests;
    },
    get resolveConfiguredFromCredentialStatuses () {
        return _channelstatus.resolveConfiguredFromCredentialStatuses;
    },
    get resolvePollMaxSelections () {
        return _channelactions.resolvePollMaxSelections;
    },
    get resolveTelegramFetch () {
        return _fetch.resolveTelegramFetch;
    },
    get resolveTelegramPollVisibility () {
        return _pollvisibility.resolveTelegramPollVisibility;
    },
    get resolveTelegramRuntimeGroupPolicy () {
        return _groupaccess.resolveTelegramRuntimeGroupPolicy;
    },
    get resolveTelegramToken () {
        return _token.resolveTelegramToken;
    },
    get resolveTelegramTransport () {
        return _fetch.resolveTelegramTransport;
    },
    get sendMessageTelegram () {
        return _send.sendMessageTelegram;
    },
    get sendPollTelegram () {
        return _send.sendPollTelegram;
    },
    get sendStickerTelegram () {
        return _send.sendStickerTelegram;
    },
    get sendTypingTelegram () {
        return _send.sendTypingTelegram;
    },
    get setTelegramRuntime () {
        return _runtime.setTelegramRuntime;
    },
    get setTelegramThreadBindingIdleTimeoutBySessionKey () {
        return _threadbindings.setTelegramThreadBindingIdleTimeoutBySessionKey;
    },
    get setTelegramThreadBindingMaxAgeBySessionKey () {
        return _threadbindings.setTelegramThreadBindingMaxAgeBySessionKey;
    },
    get shouldRetryTelegramTransportFallback () {
        return _fetch.shouldRetryTelegramTransportFallback;
    },
    get shouldSuppressTelegramExecApprovalForwardingFallback () {
        return _execapprovalforwarding.shouldSuppressTelegramExecApprovalForwardingFallback;
    },
    get telegramMessageActions () {
        return _channelactions1.telegramMessageActions;
    },
    get unpinMessageTelegram () {
        return _send.unpinMessageTelegram;
    }
});
const _acpruntime = require("../../../common/openclaw/plugin-sdk/acp-runtime");
const _channelplugincommon = require("../../../common/openclaw/plugin-sdk/channel-plugin-common");
const _channelcore = require("../../../common/openclaw/plugin-sdk/channel-core");
const _configapi = require("./config-api.js");
const _accountid = require("../../../common/openclaw/plugin-sdk/account-id");
const _channelstatus = require("../../../common/openclaw/plugin-sdk/channel-status");
const _channelactions = require("../../../common/openclaw/plugin-sdk/channel-actions");
const _audit = require("./src/audit.js");
const _groupaccess = require("./src/group-access.js");
const _execapprovalforwarding = require("./src/exec-approval-forwarding.js");
const _channelactions1 = require("./src/channel-actions.js");
const _monitor = require("./src/monitor.js");
const _probe = require("./src/probe.js");
const _fetch = require("./src/fetch.js");
const _proxy = require("./src/proxy.js");
const _send = require("./src/send.js");
const _threadbindings = require("./src/thread-bindings.js");
const _token = require("./src/token.js");
const _runtime = require("./src/runtime.js");
const _topicconversation = require("./src/topic-conversation.js");
const _pollvisibility = require("./src/poll-visibility.js");

//# sourceMappingURL=runtime-api.js.map