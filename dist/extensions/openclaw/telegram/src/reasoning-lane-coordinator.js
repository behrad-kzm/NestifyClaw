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
    get createTelegramReasoningStepState () {
        return createTelegramReasoningStepState;
    },
    get splitTelegramReasoningText () {
        return splitTelegramReasoningText;
    }
});
const _agentruntime = require("../../../../common/openclaw/plugin-sdk/agent-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _textchunking = require("../../../../common/openclaw/plugin-sdk/text-chunking");
const REASONING_MESSAGE_RE = /^Thinking\.{0,3}\s*_/u;
const LEGACY_REASONING_MESSAGE_PREFIX = "Reasoning:\n";
const REASONING_TAG_PREFIXES = [
    "<think",
    "<thinking",
    "<thought",
    "<antthinking",
    "</think",
    "</thinking",
    "</thought",
    "</antthinking"
];
const THINKING_TAG_RE = /<\s*(\/?)\s*(?:think(?:ing)?|thought|antthinking)\b[^<>]*>/gi;
function extractThinkingFromTaggedStreamOutsideCode(text) {
    if (!text) {
        return "";
    }
    const codeRegions = (0, _textchunking.findCodeRegions)(text);
    let result = "";
    let lastIndex = 0;
    let inThinking = false;
    THINKING_TAG_RE.lastIndex = 0;
    for (const match of text.matchAll(THINKING_TAG_RE)){
        const idx = match.index ?? 0;
        if ((0, _textchunking.isInsideCode)(idx, codeRegions)) {
            continue;
        }
        if (inThinking) {
            result += text.slice(lastIndex, idx);
        }
        const isClose = match[1] === "/";
        inThinking = !isClose;
        lastIndex = idx + match[0].length;
    }
    if (inThinking) {
        result += text.slice(lastIndex);
    }
    return result.trim();
}
function isPartialReasoningTagPrefix(text) {
    const trimmed = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(text.trimStart());
    if (!trimmed.startsWith("<")) {
        return false;
    }
    if (trimmed.includes(">")) {
        return false;
    }
    return REASONING_TAG_PREFIXES.some((prefix)=>prefix.startsWith(trimmed));
}
function splitTelegramReasoningText(text, isReasoning) {
    if (typeof text !== "string") {
        return {};
    }
    const trimmed = text.trim();
    if (isPartialReasoningTagPrefix(trimmed)) {
        return {};
    }
    if (REASONING_MESSAGE_RE.test(trimmed)) {
        return {
            reasoningText: trimmed
        };
    }
    if (trimmed.startsWith(LEGACY_REASONING_MESSAGE_PREFIX) && trimmed.length > LEGACY_REASONING_MESSAGE_PREFIX.length) {
        return {
            reasoningText: trimmed
        };
    }
    const taggedReasoning = extractThinkingFromTaggedStreamOutsideCode(text);
    const strippedAnswer = (0, _textchunking.stripReasoningTagsFromText)(text, {
        mode: "strict",
        trim: "both"
    });
    if (isReasoning === true) {
        return {
            reasoningText: (0, _agentruntime.formatReasoningMessage)(taggedReasoning || strippedAnswer || text)
        };
    }
    if (!taggedReasoning && strippedAnswer === text) {
        return {
            answerText: text
        };
    }
    const reasoningText = taggedReasoning ? (0, _agentruntime.formatReasoningMessage)(taggedReasoning) : undefined;
    const answerText = strippedAnswer || undefined;
    return {
        reasoningText,
        answerText
    };
}
function createTelegramReasoningStepState() {
    let reasoningStatus = "none";
    let bufferedFinalAnswer;
    const noteReasoningHint = ()=>{
        if (reasoningStatus === "none") {
            reasoningStatus = "hinted";
        }
    };
    const noteReasoningDelivered = ()=>{
        reasoningStatus = "delivered";
    };
    const shouldBufferFinalAnswer = ()=>{
        return reasoningStatus === "hinted" && !bufferedFinalAnswer;
    };
    const bufferFinalAnswer = (value)=>{
        bufferedFinalAnswer = value;
    };
    const takeBufferedFinalAnswer = (currentGeneration)=>{
        if (currentGeneration !== undefined && bufferedFinalAnswer?.bufferedGeneration !== undefined && bufferedFinalAnswer.bufferedGeneration !== currentGeneration) {
            return undefined;
        }
        const value = bufferedFinalAnswer;
        bufferedFinalAnswer = undefined;
        return value;
    };
    const resetForNextStep = ()=>{
        reasoningStatus = "none";
        bufferedFinalAnswer = undefined;
    };
    return {
        noteReasoningHint,
        noteReasoningDelivered,
        shouldBufferFinalAnswer,
        bufferFinalAnswer,
        takeBufferedFinalAnswer,
        resetForNextStep
    };
}

//# sourceMappingURL=reasoning-lane-coordinator.js.map