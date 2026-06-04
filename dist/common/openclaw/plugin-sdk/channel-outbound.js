/* eslint-disable */ /* AUTO-GENERATED kitty adapter stub for 'openclaw/plugin-sdk/channel-outbound'. Do not edit by hand.
 * Regenerate with: npm run gen:adapter
 * Add the marker @kitty-real to a hand-written replacement to preserve it. */ "use strict";
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
    get ChannelIngressQueue () {
        return ChannelIngressQueue;
    },
    get ChannelIngressQueueClaim () {
        return ChannelIngressQueueClaim;
    },
    get ChannelIngressQueueClaimRef () {
        return ChannelIngressQueueClaimRef;
    },
    get ChannelIngressQueueRecord () {
        return ChannelIngressQueueRecord;
    },
    get ChannelMessageSendResult () {
        return ChannelMessageSendResult;
    },
    get ChannelProgressDraftLine () {
        return ChannelProgressDraftLine;
    },
    get DurableMessageBatchSendResult () {
        return DurableMessageBatchSendResult;
    },
    get MessageAckPolicy () {
        return MessageAckPolicy;
    },
    get MessageReceipt () {
        return MessageReceipt;
    },
    get MessageReceiptPartKind () {
        return MessageReceiptPartKind;
    },
    get MessageReceiptSourceResult () {
        return MessageReceiptSourceResult;
    },
    get MessageReceiveContext () {
        return MessageReceiveContext;
    },
    get OutboundDeliveryFormattingOptions () {
        return OutboundDeliveryFormattingOptions;
    },
    get OutboundSendDeps () {
        return OutboundSendDeps;
    },
    get StreamingMode () {
        return StreamingMode;
    },
    get buildChannelProgressDraftLineForEntry () {
        return buildChannelProgressDraftLineForEntry;
    },
    get buildOutboundSessionContext () {
        return buildOutboundSessionContext;
    },
    get createAccountStatusSink () {
        return createAccountStatusSink;
    },
    get createChannelMessageAdapterFromOutbound () {
        return createChannelMessageAdapterFromOutbound;
    },
    get createChannelMessageReplyPipeline () {
        return createChannelMessageReplyPipeline;
    },
    get createChannelProgressDraftGate () {
        return createChannelProgressDraftGate;
    },
    get createDurableInboundReceiveJournalFromQueue () {
        return createDurableInboundReceiveJournalFromQueue;
    },
    get createFinalizableDraftStreamControlsForState () {
        return createFinalizableDraftStreamControlsForState;
    },
    get createMessageReceiptFromOutboundResults () {
        return createMessageReceiptFromOutboundResults;
    },
    get createMessageReceiveContext () {
        return createMessageReceiveContext;
    },
    get createOutboundPayloadPlan () {
        return createOutboundPayloadPlan;
    },
    get createPreviewMessageReceipt () {
        return createPreviewMessageReceipt;
    },
    get defineChannelMessageAdapter () {
        return defineChannelMessageAdapter;
    },
    get deliverInboundReplyWithMessageSendContext () {
        return deliverInboundReplyWithMessageSendContext;
    },
    get deriveDurableFinalDeliveryRequirements () {
        return deriveDurableFinalDeliveryRequirements;
    },
    get formatChannelProgressDraftLine () {
        return formatChannelProgressDraftLine;
    },
    get formatChannelProgressDraftLineForEntry () {
        return formatChannelProgressDraftLineForEntry;
    },
    get formatChannelProgressDraftText () {
        return formatChannelProgressDraftText;
    },
    get isChannelProgressDraftWorkToolName () {
        return isChannelProgressDraftWorkToolName;
    },
    get isPotentialTruncatedFinal () {
        return isPotentialTruncatedFinal;
    },
    get listMessageReceiptPlatformIds () {
        return listMessageReceiptPlatformIds;
    },
    get mergeChannelProgressDraftLine () {
        return mergeChannelProgressDraftLine;
    },
    get projectOutboundPayloadPlanForDelivery () {
        return projectOutboundPayloadPlanForDelivery;
    },
    get resolveChannelMessageSourceReplyDeliveryMode () {
        return resolveChannelMessageSourceReplyDeliveryMode;
    },
    get resolveChannelPreviewStreamMode () {
        return resolveChannelPreviewStreamMode;
    },
    get resolveChannelProgressDraftMaxLines () {
        return resolveChannelProgressDraftMaxLines;
    },
    get resolveChannelStreamingBlockEnabled () {
        return resolveChannelStreamingBlockEnabled;
    },
    get resolveChannelStreamingChunkMode () {
        return resolveChannelStreamingChunkMode;
    },
    get resolveChannelStreamingPreviewChunk () {
        return resolveChannelStreamingPreviewChunk;
    },
    get resolveChannelStreamingPreviewNativeToolProgress () {
        return resolveChannelStreamingPreviewNativeToolProgress;
    },
    get resolveChannelStreamingPreviewNativeToolProgressAllowFrom () {
        return resolveChannelStreamingPreviewNativeToolProgressAllowFrom;
    },
    get resolveChannelStreamingPreviewToolProgress () {
        return resolveChannelStreamingPreviewToolProgress;
    },
    get resolveOutboundSendDep () {
        return resolveOutboundSendDep;
    },
    get resolveTranscriptBackedChannelFinalText () {
        return resolveTranscriptBackedChannelFinalText;
    },
    get sanitizeForPlainText () {
        return sanitizeForPlainText;
    },
    get selectLongerFinalText () {
        return selectLongerFinalText;
    },
    get sendDurableMessageBatch () {
        return sendDurableMessageBatch;
    },
    get takeMessageIdAfterStop () {
        return takeMessageIdAfterStop;
    }
});
const __stub = require("./__stub");
const ChannelIngressQueue = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#ChannelIngressQueue');
const ChannelIngressQueueClaim = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#ChannelIngressQueueClaim');
const ChannelIngressQueueClaimRef = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#ChannelIngressQueueClaimRef');
const ChannelIngressQueueRecord = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#ChannelIngressQueueRecord');
const ChannelMessageSendResult = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#ChannelMessageSendResult');
const ChannelProgressDraftLine = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#ChannelProgressDraftLine');
const DurableMessageBatchSendResult = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#DurableMessageBatchSendResult');
const MessageAckPolicy = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#MessageAckPolicy');
const MessageReceipt = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#MessageReceipt');
const MessageReceiptPartKind = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#MessageReceiptPartKind');
const MessageReceiptSourceResult = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#MessageReceiptSourceResult');
const MessageReceiveContext = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#MessageReceiveContext');
const OutboundDeliveryFormattingOptions = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#OutboundDeliveryFormattingOptions');
const OutboundSendDeps = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#OutboundSendDeps');
const StreamingMode = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#StreamingMode');
const buildChannelProgressDraftLineForEntry = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#buildChannelProgressDraftLineForEntry');
const buildOutboundSessionContext = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#buildOutboundSessionContext');
const createAccountStatusSink = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#createAccountStatusSink');
const createChannelMessageAdapterFromOutbound = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#createChannelMessageAdapterFromOutbound');
const createChannelMessageReplyPipeline = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#createChannelMessageReplyPipeline');
const createChannelProgressDraftGate = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#createChannelProgressDraftGate');
const createDurableInboundReceiveJournalFromQueue = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#createDurableInboundReceiveJournalFromQueue');
const createFinalizableDraftStreamControlsForState = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#createFinalizableDraftStreamControlsForState');
const createMessageReceiptFromOutboundResults = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#createMessageReceiptFromOutboundResults');
const createMessageReceiveContext = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#createMessageReceiveContext');
const createOutboundPayloadPlan = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#createOutboundPayloadPlan');
const createPreviewMessageReceipt = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#createPreviewMessageReceipt');
const defineChannelMessageAdapter = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#defineChannelMessageAdapter');
const deliverInboundReplyWithMessageSendContext = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#deliverInboundReplyWithMessageSendContext');
const deriveDurableFinalDeliveryRequirements = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#deriveDurableFinalDeliveryRequirements');
const formatChannelProgressDraftLine = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#formatChannelProgressDraftLine');
const formatChannelProgressDraftLineForEntry = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#formatChannelProgressDraftLineForEntry');
const formatChannelProgressDraftText = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#formatChannelProgressDraftText');
const isChannelProgressDraftWorkToolName = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#isChannelProgressDraftWorkToolName');
const isPotentialTruncatedFinal = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#isPotentialTruncatedFinal');
const listMessageReceiptPlatformIds = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#listMessageReceiptPlatformIds');
const mergeChannelProgressDraftLine = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#mergeChannelProgressDraftLine');
const projectOutboundPayloadPlanForDelivery = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#projectOutboundPayloadPlanForDelivery');
const resolveChannelMessageSourceReplyDeliveryMode = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#resolveChannelMessageSourceReplyDeliveryMode');
const resolveChannelPreviewStreamMode = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#resolveChannelPreviewStreamMode');
const resolveChannelProgressDraftMaxLines = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#resolveChannelProgressDraftMaxLines');
const resolveChannelStreamingBlockEnabled = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#resolveChannelStreamingBlockEnabled');
const resolveChannelStreamingChunkMode = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#resolveChannelStreamingChunkMode');
const resolveChannelStreamingPreviewChunk = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#resolveChannelStreamingPreviewChunk');
const resolveChannelStreamingPreviewNativeToolProgress = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#resolveChannelStreamingPreviewNativeToolProgress');
const resolveChannelStreamingPreviewNativeToolProgressAllowFrom = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#resolveChannelStreamingPreviewNativeToolProgressAllowFrom');
const resolveChannelStreamingPreviewToolProgress = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#resolveChannelStreamingPreviewToolProgress');
const resolveOutboundSendDep = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#resolveOutboundSendDep');
const resolveTranscriptBackedChannelFinalText = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#resolveTranscriptBackedChannelFinalText');
const sanitizeForPlainText = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#sanitizeForPlainText');
const selectLongerFinalText = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#selectLongerFinalText');
const sendDurableMessageBatch = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#sendDurableMessageBatch');
const takeMessageIdAfterStop = (0, __stub.makeStub)('openclaw/plugin-sdk/channel-outbound#takeMessageIdAfterStop');

//# sourceMappingURL=channel-outbound.js.map