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
    get buildMentionConfig () {
        return buildMentionConfig;
    },
    get debugMention () {
        return debugMention;
    },
    get isBotMentionedFromTargets () {
        return isBotMentionedFromTargets;
    },
    get resolveMentionTargets () {
        return resolveMentionTargets;
    },
    get resolveOwnerList () {
        return resolveOwnerList;
    }
});
const _channelmentiongating = require("../../../../../common/openclaw/plugin-sdk/channel-mention-gating");
const _identity = require("../identity.js");
const _normalizetarget = require("../normalize-target.js");
const _textruntime = require("../text-runtime.js");
function buildMentionConfig(cfg, agentId, options) {
    const mentionRegexes = (0, _channelmentiongating.buildMentionRegexes)(cfg, agentId, options);
    return {
        mentionRegexes,
        allowFrom: cfg.channels?.whatsapp?.allowFrom
    };
}
function resolveMentionTargets(msg, authDir) {
    const normalizedMentions = (0, _identity.getMentionIdentities)(msg, authDir);
    const self = (0, _identity.getSelfIdentity)(msg, authDir);
    return {
        normalizedMentions,
        self
    };
}
function isBotMentionedFromTargets(msg, mentionCfg, targets) {
    const clean = (text)=>// Remove zero-width and directionality markers WhatsApp injects around display names
        (0, _channelmentiongating.normalizeMentionText)(text);
    const explicitSelfChatOverride = typeof mentionCfg.isSelfChat === "boolean";
    // `isSelfChatMode` is a config-shaped check ("is the bot's own E.164 in
    // allowFrom?"), not a conversation-shaped check, so it returns true even
    // for group conversations whenever the operator put their own number in
    // allowFrom — which is the common config. The original mention-skip path
    // was designed to prevent owner-mentioning-self in a true 1:1 self DM
    // from falsely triggering the bot, so when we derive the flag implicitly
    // from `allowFrom`, confine the suppression to non-group conversations
    // and let real group @mentions go through the identity-overlap check
    // (#49317). Explicit `mentionCfg.isSelfChat` overrides from the caller
    // are honored as-is so multi-account / precomputed paths keep working.
    const isGroupConversation = (0, _normalizetarget.isWhatsAppGroupJid)(msg.from);
    const isSelfChat = explicitSelfChatOverride ? Boolean(mentionCfg.isSelfChat) : (0, _textruntime.isSelfChatMode)(targets.self.e164, mentionCfg.allowFrom) && !isGroupConversation;
    const hasMentions = targets.normalizedMentions.length > 0;
    if (hasMentions && !isSelfChat) {
        for (const mention of targets.normalizedMentions){
            if ((0, _identity.identitiesOverlap)(targets.self, mention)) {
                return true;
            }
        }
        // If the message explicitly mentions someone else, do not fall back to regex matches.
        return false;
    } else if (hasMentions && isSelfChat) {
    // Self-chat mode: ignore WhatsApp @mention JIDs, otherwise @mentioning the owner in self-chat triggers the bot.
    }
    const bodyClean = clean(msg.body);
    if (mentionCfg.mentionRegexes.some((re)=>re.test(bodyClean))) {
        return true;
    }
    // Fallback: detect body containing our own number (with or without +, spacing)
    if (targets.self.e164) {
        const selfDigits = targets.self.e164.replace(/\D/g, "");
        if (selfDigits) {
            const bodyDigits = bodyClean.replace(/[^\d]/g, "");
            if (bodyDigits.includes(selfDigits)) {
                return true;
            }
            const bodyNoSpace = msg.body.replace(/[\s-]/g, "");
            const pattern = new RegExp(`\\+?${selfDigits}`, "i");
            if (pattern.test(bodyNoSpace)) {
                return true;
            }
        }
    }
    return false;
}
function debugMention(msg, mentionCfg, authDir) {
    const mentionTargets = resolveMentionTargets(msg, authDir);
    const result = isBotMentionedFromTargets(msg, mentionCfg, mentionTargets);
    const details = {
        from: msg.from,
        body: msg.body,
        bodyClean: (0, _channelmentiongating.normalizeMentionText)(msg.body),
        mentionedJids: msg.mentions ?? msg.mentionedJids ?? null,
        normalizedMentionedJids: mentionTargets.normalizedMentions.length ? mentionTargets.normalizedMentions.map((identity)=>(0, _identity.getComparableIdentityValues)(identity)) : null,
        selfJid: msg.self?.jid ?? msg.selfJid ?? null,
        selfLid: msg.self?.lid ?? msg.selfLid ?? null,
        selfE164: msg.self?.e164 ?? msg.selfE164 ?? null,
        resolvedSelf: mentionTargets.self
    };
    return {
        wasMentioned: result,
        details
    };
}
function resolveOwnerList(mentionCfg, selfE164) {
    const allowFrom = mentionCfg.allowFrom;
    const raw = Array.isArray(allowFrom) && allowFrom.length > 0 ? allowFrom : selfE164 ? [
        selfE164
    ] : [];
    return raw.filter((entry)=>Boolean(entry && entry !== "*")).map((entry)=>(0, _textruntime.normalizeE164)(entry)).filter((entry)=>Boolean(entry));
}

//# sourceMappingURL=mentions.js.map