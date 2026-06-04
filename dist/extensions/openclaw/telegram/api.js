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
    get TELEGRAM_COMMAND_NAME_PATTERN () {
        return _commandconfig.TELEGRAM_COMMAND_NAME_PATTERN;
    },
    get TELEGRAM_TEXT_CHUNK_LIMIT () {
        return _outboundadapter.TELEGRAM_TEXT_CHUNK_LIMIT;
    },
    get buildBrowseProvidersButton () {
        return _modelbuttons.buildBrowseProvidersButton;
    },
    get buildCommandsPaginationKeyboard () {
        return _commandui.buildCommandsPaginationKeyboard;
    },
    get buildGroupLabel () {
        return _helpers.buildGroupLabel;
    },
    get buildModelSelectionCallbackData () {
        return _modelbuttons.buildModelSelectionCallbackData;
    },
    get buildModelsKeyboard () {
        return _modelbuttons.buildModelsKeyboard;
    },
    get buildProviderKeyboard () {
        return _modelbuttons.buildProviderKeyboard;
    },
    get buildSenderLabel () {
        return _helpers.buildSenderLabel;
    },
    get buildSenderName () {
        return _helpers.buildSenderName;
    },
    get buildTelegramExecApprovalPendingPayload () {
        return _execapprovalforwarding.buildTelegramExecApprovalPendingPayload;
    },
    get buildTelegramGroupFrom () {
        return _helpers.buildTelegramGroupFrom;
    },
    get buildTelegramGroupPeerId () {
        return _helpers.buildTelegramGroupPeerId;
    },
    get buildTelegramModelsProviderChannelData () {
        return _commandui.buildTelegramModelsProviderChannelData;
    },
    get buildTelegramParentPeer () {
        return _helpers.buildTelegramParentPeer;
    },
    get buildTelegramRoutingTarget () {
        return _helpers.buildTelegramRoutingTarget;
    },
    get buildTelegramThreadParams () {
        return _helpers.buildTelegramThreadParams;
    },
    get buildTypingThreadParams () {
        return _helpers.buildTypingThreadParams;
    },
    get cacheSticker () {
        return _stickercache.cacheSticker;
    },
    get calculateTotalPages () {
        return _modelbuttons.calculateTotalPages;
    },
    get collectTelegramSecurityAuditFindings () {
        return _securityaudit.collectTelegramSecurityAuditFindings;
    },
    get collectTelegramStatusIssues () {
        return _statusissues.collectTelegramStatusIssues;
    },
    get createTelegramActionGate () {
        return _accounts.createTelegramActionGate;
    },
    get deleteTelegramUpdateOffset () {
        return _updateoffsetstore.deleteTelegramUpdateOffset;
    },
    get describeReplyTarget () {
        return _helpers.describeReplyTarget;
    },
    get describeStickerImage () {
        return _stickercache.describeStickerImage;
    },
    get escapeTelegramHtml () {
        return _format.escapeTelegramHtml;
    },
    get extractTelegramForumFlag () {
        return _helpers.extractTelegramForumFlag;
    },
    get extractTelegramLocation () {
        return _helpers.extractTelegramLocation;
    },
    get fetchTelegramChatId () {
        return _apifetch.fetchTelegramChatId;
    },
    get getAllCachedStickers () {
        return _stickercache.getAllCachedStickers;
    },
    get getCacheStats () {
        return _stickercache.getCacheStats;
    },
    get getCachedSticker () {
        return _stickercache.getCachedSticker;
    },
    get getModelsPageSize () {
        return _modelbuttons.getModelsPageSize;
    },
    get getTelegramExecApprovalApprovers () {
        return _execapprovals.getTelegramExecApprovalApprovers;
    },
    get getTelegramTextParts () {
        return _helpers.getTelegramTextParts;
    },
    get hasBotMention () {
        return _helpers.hasBotMention;
    },
    get inspectTelegramAccount () {
        return _accountinspect.inspectTelegramAccount;
    },
    get isBinaryContent () {
        return _helpers.isBinaryContent;
    },
    get isNumericTelegramChatId () {
        return _targets.isNumericTelegramChatId;
    },
    get isNumericTelegramSenderUserId () {
        return _allowfrom.isNumericTelegramSenderUserId;
    },
    get isNumericTelegramUserId () {
        return _allowfrom.isNumericTelegramUserId;
    },
    get isTelegramExecApprovalApprover () {
        return _execapprovals.isTelegramExecApprovalApprover;
    },
    get isTelegramExecApprovalAuthorizedSender () {
        return _execapprovals.isTelegramExecApprovalAuthorizedSender;
    },
    get isTelegramExecApprovalClientEnabled () {
        return _execapprovals.isTelegramExecApprovalClientEnabled;
    },
    get isTelegramExecApprovalHandlerConfigured () {
        return _execapprovals.isTelegramExecApprovalHandlerConfigured;
    },
    get isTelegramExecApprovalTargetRecipient () {
        return _execapprovals.isTelegramExecApprovalTargetRecipient;
    },
    get isTelegramInlineButtonsEnabled () {
        return _inlinebuttons.isTelegramInlineButtonsEnabled;
    },
    get listEnabledTelegramAccounts () {
        return _accounts.listEnabledTelegramAccounts;
    },
    get listTelegramAccountIds () {
        return _accounts.listTelegramAccountIds;
    },
    get listTelegramDirectoryGroupsFromConfig () {
        return _directoryconfig.listTelegramDirectoryGroupsFromConfig;
    },
    get listTelegramDirectoryPeersFromConfig () {
        return _directoryconfig.listTelegramDirectoryPeersFromConfig;
    },
    get looksLikeTelegramTargetId () {
        return _normalize.looksLikeTelegramTargetId;
    },
    get lookupTelegramChatId () {
        return _apifetch.lookupTelegramChatId;
    },
    get markdownToTelegramChunks () {
        return _format.markdownToTelegramChunks;
    },
    get markdownToTelegramHtml () {
        return _format.markdownToTelegramHtml;
    },
    get markdownToTelegramHtmlChunks () {
        return _format.markdownToTelegramHtmlChunks;
    },
    get mergeTelegramAccountConfig () {
        return _accounts.mergeTelegramAccountConfig;
    },
    get normalizeForwardedContext () {
        return _helpers.normalizeForwardedContext;
    },
    get normalizeTelegramAllowFromEntry () {
        return _allowfrom.normalizeTelegramAllowFromEntry;
    },
    get normalizeTelegramChatId () {
        return _targets.normalizeTelegramChatId;
    },
    get normalizeTelegramCommandDescription () {
        return _commandconfig.normalizeTelegramCommandDescription;
    },
    get normalizeTelegramCommandName () {
        return _commandconfig.normalizeTelegramCommandName;
    },
    get normalizeTelegramLookupTarget () {
        return _targets.normalizeTelegramLookupTarget;
    },
    get normalizeTelegramMessagingTarget () {
        return _normalize.normalizeTelegramMessagingTarget;
    },
    get normalizeTelegramReplyToMessageId () {
        return _outboundparams.normalizeTelegramReplyToMessageId;
    },
    get parseModelCallbackData () {
        return _modelbuttons.parseModelCallbackData;
    },
    get parseTelegramReplyToMessageId () {
        return _outboundparams.parseTelegramReplyToMessageId;
    },
    get parseTelegramTarget () {
        return _targets.parseTelegramTarget;
    },
    get parseTelegramThreadId () {
        return _outboundparams.parseTelegramThreadId;
    },
    get parseTelegramTopicConversation () {
        return _topicconversation.parseTelegramTopicConversation;
    },
    get probeTelegram () {
        return _probe.probeTelegram;
    },
    get readTelegramUpdateOffset () {
        return _updateoffsetstore.readTelegramUpdateOffset;
    },
    get resetMissingDefaultWarnFlag () {
        return _accounts.resetMissingDefaultWarnFlag;
    },
    get resetTelegramForumFlagCacheForTest () {
        return _helpers.resetTelegramForumFlagCacheForTest;
    },
    get resetTelegramProbeFetcherCacheForTests () {
        return _probe.resetTelegramProbeFetcherCacheForTests;
    },
    get resolveDefaultTelegramAccountId () {
        return _accounts.resolveDefaultTelegramAccountId;
    },
    get resolveModelSelection () {
        return _modelbuttons.resolveModelSelection;
    },
    get resolveTelegramAccount () {
        return _accounts.resolveTelegramAccount;
    },
    get resolveTelegramAccountConfig () {
        return _accounts.resolveTelegramAccountConfig;
    },
    get resolveTelegramAutoThreadId () {
        return _actionthreading.resolveTelegramAutoThreadId;
    },
    get resolveTelegramChatLookupFetch () {
        return _apifetch.resolveTelegramChatLookupFetch;
    },
    get resolveTelegramCustomCommands () {
        return _commandconfig.resolveTelegramCustomCommands;
    },
    get resolveTelegramDirectPeerId () {
        return _helpers.resolveTelegramDirectPeerId;
    },
    get resolveTelegramExecApprovalConfig () {
        return _execapprovals.resolveTelegramExecApprovalConfig;
    },
    get resolveTelegramExecApprovalTarget () {
        return _execapprovals.resolveTelegramExecApprovalTarget;
    },
    get resolveTelegramForumFlag () {
        return _helpers.resolveTelegramForumFlag;
    },
    get resolveTelegramForumThreadId () {
        return _helpers.resolveTelegramForumThreadId;
    },
    get resolveTelegramGroupAllowFromContext () {
        return _helpers.resolveTelegramGroupAllowFromContext;
    },
    get resolveTelegramGroupRequireMention () {
        return _grouppolicy.resolveTelegramGroupRequireMention;
    },
    get resolveTelegramGroupToolPolicy () {
        return _grouppolicy.resolveTelegramGroupToolPolicy;
    },
    get resolveTelegramInlineButtonsConfigScope () {
        return _inlinebuttons.resolveTelegramInlineButtonsConfigScope;
    },
    get resolveTelegramInlineButtonsScope () {
        return _inlinebuttons.resolveTelegramInlineButtonsScope;
    },
    get resolveTelegramInlineButtonsScopeFromCapabilities () {
        return _inlinebuttons.resolveTelegramInlineButtonsScopeFromCapabilities;
    },
    get resolveTelegramMediaPlaceholder () {
        return _helpers.resolveTelegramMediaPlaceholder;
    },
    get resolveTelegramMediaRuntimeOptions () {
        return _accounts.resolveTelegramMediaRuntimeOptions;
    },
    get resolveTelegramPollActionGateState () {
        return _accounts.resolveTelegramPollActionGateState;
    },
    get resolveTelegramReactionLevel () {
        return _reactionlevel.resolveTelegramReactionLevel;
    },
    get resolveTelegramReplyId () {
        return _helpers.resolveTelegramReplyId;
    },
    get resolveTelegramStreamMode () {
        return _helpers.resolveTelegramStreamMode;
    },
    get resolveTelegramTargetChatType () {
        return _inlinebuttons.resolveTelegramTargetChatType;
    },
    get resolveTelegramThreadSpec () {
        return _helpers.resolveTelegramThreadSpec;
    },
    get searchStickers () {
        return _stickercache.searchStickers;
    },
    get sendTelegramPayloadMessages () {
        return _outboundadapter.sendTelegramPayloadMessages;
    },
    get shouldEnableTelegramExecApprovalButtons () {
        return _execapprovals.shouldEnableTelegramExecApprovalButtons;
    },
    get shouldHandleTelegramExecApprovalRequest () {
        return _execapprovals.shouldHandleTelegramExecApprovalRequest;
    },
    get shouldInjectTelegramExecApprovalButtons () {
        return _execapprovals.shouldInjectTelegramExecApprovalButtons;
    },
    get shouldSuppressLocalTelegramExecApprovalPrompt () {
        return _execapprovals.shouldSuppressLocalTelegramExecApprovalPrompt;
    },
    get shouldSuppressTelegramExecApprovalForwardingFallback () {
        return _execapprovalforwarding.shouldSuppressTelegramExecApprovalForwardingFallback;
    },
    get splitTelegramHtmlChunks () {
        return _format.splitTelegramHtmlChunks;
    },
    get stripTelegramInternalPrefixes () {
        return _targets.stripTelegramInternalPrefixes;
    },
    get telegramOutbound () {
        return _outboundadapter.telegramOutbound;
    },
    get telegramPlugin () {
        return _channel.telegramPlugin;
    },
    get telegramSetupPlugin () {
        return _channelsetup.telegramSetupPlugin;
    },
    get withResolvedTelegramForumFlag () {
        return _helpers.withResolvedTelegramForumFlag;
    },
    get writeTelegramUpdateOffset () {
        return _updateoffsetstore.writeTelegramUpdateOffset;
    }
});
const _channel = require("./src/channel.js");
const _channelsetup = require("./src/channel.setup.js");
const _accountinspect = require("./src/account-inspect.js");
const _accounts = require("./src/accounts.js");
const _actionthreading = require("./src/action-threading.js");
const _allowfrom = require("./src/allow-from.js");
const _apifetch = require("./src/api-fetch.js");
const _helpers = require("./src/bot/helpers.js");
const _commandconfig = require("./src/command-config.js");
const _commandui = require("./src/command-ui.js");
const _directoryconfig = require("./src/directory-config.js");
const _execapprovalforwarding = require("./src/exec-approval-forwarding.js");
const _execapprovals = require("./src/exec-approvals.js");
const _grouppolicy = require("./src/group-policy.js");
const _inlinebuttons = require("./src/inline-buttons.js");
const _modelbuttons = require("./src/model-buttons.js");
const _normalize = require("./src/normalize.js");
const _outboundadapter = require("./src/outbound-adapter.js");
const _outboundparams = require("./src/outbound-params.js");
const _probe = require("./src/probe.js");
const _reactionlevel = require("./src/reaction-level.js");
const _securityaudit = require("./src/security-audit.js");
const _stickercache = require("./src/sticker-cache.js");
const _statusissues = require("./src/status-issues.js");
const _targets = require("./src/targets.js");
const _topicconversation = require("./src/topic-conversation.js");
const _updateoffsetstore = require("./src/update-offset-store.js");
const _format = require("./src/format.js");

//# sourceMappingURL=api.js.map