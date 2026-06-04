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
    get AUTO_TOPIC_LABEL_DEFAULT_PROMPT () {
        return AUTO_TOPIC_LABEL_DEFAULT_PROMPT;
    },
    get resolveAutoTopicLabelConfig () {
        return resolveAutoTopicLabelConfig;
    }
});
const AUTO_TOPIC_LABEL_DEFAULT_PROMPT = "Generate a very short topic label (2-4 words, max 25 chars) for a chat conversation based on the user's first message below. No emoji. Use the same language as the message. Be concise and descriptive. Return ONLY the topic name, nothing else.";
function resolveAutoTopicLabelConfig(directConfig, accountConfig) {
    const config = directConfig ?? accountConfig;
    if (config === undefined || config === true) {
        return {
            enabled: true,
            prompt: AUTO_TOPIC_LABEL_DEFAULT_PROMPT
        };
    }
    if (config === false || config.enabled === false) {
        return null;
    }
    return {
        enabled: true,
        prompt: config.prompt?.trim() || AUTO_TOPIC_LABEL_DEFAULT_PROMPT
    };
}

//# sourceMappingURL=auto-topic-label-config.js.map