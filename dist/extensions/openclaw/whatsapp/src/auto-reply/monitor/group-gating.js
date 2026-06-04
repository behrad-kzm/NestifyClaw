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
    get applyGroupGating () {
        return applyGroupGating;
    },
    get resetGroupDropWarningsForTests () {
        return resetGroupDropWarningsForTests;
    }
});
const _groupconfigpath = require("../../group-config-path.js");
const _identity = require("../../identity.js");
const _inboundpolicy = require("../../inbound-policy.js");
const _mentions = require("../mentions.js");
const _commands = require("./commands.js");
const _groupactivation = require("./group-activation.js");
const _groupgatingruntime = require("./group-gating.runtime.js");
const _groupmembers = require("./group-members.js");
const MAX_GROUP_DROP_WARNINGS = 100;
const groupDropWarned = new Set();
function resetGroupDropWarningsForTests() {
    groupDropWarned.clear();
}
function shouldWarnForGroupDrop(warnKey) {
    if (groupDropWarned.has(warnKey)) {
        return false;
    }
    groupDropWarned.add(warnKey);
    while(groupDropWarned.size > MAX_GROUP_DROP_WARNINGS){
        const oldest = groupDropWarned.values().next().value;
        if (!oldest) {
            break;
        }
        groupDropWarned.delete(oldest);
    }
    return true;
}
function isOwnerSender(baseMentionConfig, msg) {
    const sender = (0, _groupgatingruntime.normalizeE164)((0, _identity.getSenderIdentity)(msg).e164 ?? "");
    if (!sender) {
        return false;
    }
    const owners = (0, _mentions.resolveOwnerList)(baseMentionConfig, (0, _identity.getSelfIdentity)(msg).e164 ?? undefined);
    return owners.includes(sender);
}
function recordPendingGroupHistoryEntry(params) {
    const senderIdentity = (0, _identity.getSenderIdentity)(params.msg);
    const sender = senderIdentity.name && senderIdentity.e164 ? `${senderIdentity.name} (${senderIdentity.e164})` : senderIdentity.name ?? senderIdentity.e164 ?? (0, _identity.getPrimaryIdentityId)(senderIdentity) ?? "Unknown";
    (0, _groupgatingruntime.createChannelHistoryWindow)({
        historyMap: params.groupHistories
    }).record({
        historyKey: params.groupHistoryKey,
        limit: params.groupHistoryLimit,
        entry: {
            sender,
            body: params.body ?? params.msg.body,
            timestamp: params.msg.timestamp,
            id: params.msg.id,
            senderJid: senderIdentity.jid ?? params.msg.senderJid
        }
    });
}
function skipGroupMessageAndStoreHistory(params, verboseMessage, body) {
    params.logVerbose(verboseMessage);
    recordPendingGroupHistoryEntry({
        msg: params.msg,
        body,
        groupHistories: params.groupHistories,
        groupHistoryKey: params.groupHistoryKey,
        groupHistoryLimit: params.groupHistoryLimit
    });
    return {
        shouldProcess: false
    };
}
async function applyGroupGating(params) {
    const sender = (0, _identity.getSenderIdentity)(params.msg);
    const self = (0, _identity.getSelfIdentity)(params.msg, params.authDir);
    const inboundPolicy = (0, _inboundpolicy.resolveWhatsAppInboundPolicy)({
        cfg: params.cfg,
        accountId: params.msg.accountId,
        selfE164: self.e164 ?? null
    });
    const conversationGroupPolicy = inboundPolicy.resolveConversationGroupPolicy(params.conversationId);
    if (conversationGroupPolicy.allowlistEnabled && !conversationGroupPolicy.allowed) {
        const accountId = inboundPolicy.account.accountId;
        const warnKey = `${accountId}:${params.conversationId}`;
        if (shouldWarnForGroupDrop(warnKey)) {
            const groupsPath = (0, _groupconfigpath.resolveWhatsAppGroupsConfigPath)({
                cfg: params.cfg,
                accountId
            });
            params.replyLogger.warn({
                conversationId: params.conversationId,
                accountId,
                groupsPath
            }, `WhatsApp group ${params.conversationId} not in ${groupsPath} — inbound dropped. Add the group JID to ${groupsPath} (or add "*" there to admit all groups). Sender authorization still applies.`);
        }
        params.logVerbose(`Dropping message from unregistered WhatsApp group ${params.conversationId}. Add the group JID to channels.whatsapp.groups, or add "*" there to admit all groups. Sender authorization still applies.`);
        return {
            shouldProcess: false
        };
    }
    (0, _groupmembers.noteGroupMember)(params.groupMemberNames, params.groupHistoryKey, sender.e164 ?? undefined, sender.name ?? undefined);
    const baseMentionConfig = {
        ...params.baseMentionConfig,
        allowFrom: inboundPolicy.configuredAllowFrom
    };
    const mentionConfig = {
        ...(0, _mentions.buildMentionConfig)(params.cfg, params.agentId, {
            provider: "whatsapp",
            conversationId: params.conversationId,
            providerPolicy: params.providerMentionPatterns
        }),
        allowFrom: inboundPolicy.configuredAllowFrom
    };
    const mentionMsg = params.mentionText !== undefined ? {
        ...params.msg,
        body: params.mentionText
    } : params.msg;
    const commandBody = (0, _commands.stripMentionsForCommand)(mentionMsg.body, mentionConfig.mentionRegexes, self.e164);
    const activationCommand = (0, _groupgatingruntime.parseActivationCommand)(commandBody);
    const owner = isOwnerSender(baseMentionConfig, params.msg);
    const shouldBypassMention = owner && (0, _groupgatingruntime.hasControlCommand)(commandBody, params.cfg);
    if (activationCommand.hasCommand && !owner) {
        return skipGroupMessageAndStoreHistory(params, `Ignoring /activation from non-owner in group ${params.conversationId}`);
    }
    const mentionDebug = (0, _mentions.debugMention)(mentionMsg, mentionConfig, params.authDir);
    params.replyLogger.debug({
        conversationId: params.conversationId,
        wasMentioned: mentionDebug.wasMentioned,
        ...mentionDebug.details
    }, "group mention debug");
    const wasMentioned = mentionDebug.wasMentioned;
    const activation = await (0, _groupactivation.resolveGroupActivationFor)({
        cfg: params.cfg,
        accountId: inboundPolicy.account.accountId,
        agentId: params.agentId,
        sessionKey: params.sessionKey,
        conversationId: params.conversationId
    });
    const requireMention = activation !== "always";
    const replyContext = (0, _identity.getReplyContext)(params.msg, params.authDir);
    const sharedNumberSelfChat = params.selfChatMode === true;
    // Detect reply-to-bot: compare JIDs, LIDs, and E.164 numbers.
    // WhatsApp may report the quoted message sender as either a phone JID
    // (xxxxx@s.whatsapp.net) or a LID (xxxxx@lid), so we compare both.
    // But in shared-number/selfChatMode setups, replies from the same self number
    // should not count as implicit bot mentions unless the message explicitly
    // mentioned the bot in text.
    const implicitReplyToSelf = sharedNumberSelfChat && (0, _identity.identitiesOverlap)(self, sender);
    const implicitMentionKinds = (0, _groupgatingruntime.implicitMentionKindWhen)("quoted_bot", !implicitReplyToSelf && (0, _identity.identitiesOverlap)(self, replyContext?.sender));
    const mentionDecision = (0, _groupgatingruntime.resolveInboundMentionDecision)({
        facts: {
            canDetectMention: true,
            wasMentioned,
            implicitMentionKinds
        },
        policy: {
            isGroup: true,
            requireMention,
            allowTextCommands: false,
            hasControlCommand: false,
            commandAuthorized: false
        }
    });
    const effectiveWasMentioned = mentionDecision.effectiveWasMentioned || shouldBypassMention;
    params.msg.wasMentioned = effectiveWasMentioned;
    if (!shouldBypassMention && requireMention && mentionDecision.shouldSkip) {
        if (params.deferMissingMention === true) {
            params.logVerbose(`Deferring group mention skip until audio preflight completes in ${params.conversationId}`);
            return {
                shouldProcess: false,
                needsMentionText: true
            };
        }
        return skipGroupMessageAndStoreHistory(params, `Group message stored for context (no mention detected) in ${params.conversationId}: ${mentionMsg.body}`, params.mentionText);
    }
    return {
        shouldProcess: true
    };
}

//# sourceMappingURL=group-gating.js.map