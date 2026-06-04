"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramGroupPromptSettings", {
    enumerable: true,
    get: function() {
        return resolveTelegramGroupPromptSettings;
    }
});
const _botaccess = require("./bot-access.js");
function resolveTelegramGroupPromptSettings(params) {
    const skillFilter = (0, _botaccess.firstDefined)(params.topicConfig?.skills, params.groupConfig?.skills);
    const systemPromptParts = [
        params.groupConfig?.systemPrompt?.trim() || null,
        params.topicConfig?.systemPrompt?.trim() || null
    ].filter((entry)=>Boolean(entry));
    const groupSystemPrompt = systemPromptParts.length > 0 ? systemPromptParts.join("\n\n") : undefined;
    return {
        skillFilter,
        groupSystemPrompt
    };
}

//# sourceMappingURL=group-config-helpers.js.map