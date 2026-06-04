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
    get buildTelegramStatusReactionVariants () {
        return buildTelegramStatusReactionVariants;
    },
    get extractTelegramAllowedEmojiReactions () {
        return extractTelegramAllowedEmojiReactions;
    },
    get isTelegramSupportedReactionEmoji () {
        return isTelegramSupportedReactionEmoji;
    },
    get resolveTelegramAllowedEmojiReactions () {
        return resolveTelegramAllowedEmojiReactions;
    },
    get resolveTelegramReactionVariant () {
        return resolveTelegramReactionVariant;
    },
    get resolveTelegramStatusReactionEmojis () {
        return resolveTelegramStatusReactionEmojis;
    }
});
const _channelfeedback = require("../../../../common/openclaw/plugin-sdk/channel-feedback");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const TELEGRAM_GENERIC_REACTION_FALLBACKS = [
    "👍",
    "👀",
    "🔥"
];
const TELEGRAM_SUPPORTED_REACTION_EMOJI_LIST = [
    "❤",
    "👍",
    "👎",
    "🔥",
    "🥰",
    "👏",
    "😁",
    "🤔",
    "🤯",
    "😱",
    "🤬",
    "😢",
    "🎉",
    "🤩",
    "🤮",
    "💩",
    "🙏",
    "👌",
    "🕊",
    "🤡",
    "🥱",
    "🥴",
    "😍",
    "🐳",
    "❤‍🔥",
    "🌚",
    "🌭",
    "💯",
    "🤣",
    "⚡",
    "🍌",
    "🏆",
    "💔",
    "🤨",
    "😐",
    "🍓",
    "🍾",
    "💋",
    "🖕",
    "😈",
    "😴",
    "😭",
    "🤓",
    "👻",
    "👨‍💻",
    "👀",
    "🎃",
    "🙈",
    "😇",
    "😨",
    "🤝",
    "✍",
    "🤗",
    "🫡",
    "🎅",
    "🎄",
    "☃",
    "💅",
    "🤪",
    "🗿",
    "🆒",
    "💘",
    "🙉",
    "🦄",
    "😘",
    "💊",
    "🙊",
    "😎",
    "👾",
    "🤷‍♂",
    "🤷",
    "🤷‍♀",
    "😡"
];
const TELEGRAM_SUPPORTED_REACTION_EMOJIS = new Set(TELEGRAM_SUPPORTED_REACTION_EMOJI_LIST);
const TELEGRAM_STATUS_REACTION_VARIANTS = {
    queued: [
        "👀",
        "👍",
        "🔥"
    ],
    thinking: [
        "🤔",
        "🤓",
        "👀"
    ],
    tool: [
        "🔥",
        "⚡",
        "👍"
    ],
    coding: [
        "👨‍💻",
        "🔥",
        "⚡"
    ],
    web: [
        "⚡",
        "🔥",
        "👍"
    ],
    deploy: [
        "🔥",
        "⚡",
        "👍"
    ],
    build: [
        "🔥",
        "👨‍💻",
        "⚡"
    ],
    concierge: [
        "👀",
        "🔥",
        "⚡"
    ],
    done: [
        "👍",
        "🎉",
        "💯"
    ],
    error: [
        "😱",
        "😨",
        "🤯"
    ],
    stallSoft: [
        "🥱",
        "😴",
        "🤔"
    ],
    stallHard: [
        "😨",
        "😱",
        "⚡"
    ],
    compacting: [
        "✍",
        "🤔",
        "🤯"
    ]
};
const STATUS_REACTION_EMOJI_KEYS = [
    "queued",
    "thinking",
    "tool",
    "coding",
    "web",
    "deploy",
    "build",
    "concierge",
    "done",
    "error",
    "stallSoft",
    "stallHard",
    "compacting"
];
function toUniqueNonEmpty(values) {
    return (0, _stringcoerceruntime.uniqueStrings)((0, _stringcoerceruntime.normalizeStringEntries)(values));
}
function resolveTelegramStatusReactionEmojis(params) {
    const { overrides } = params;
    const queuedFallback = (0, _stringcoerceruntime.normalizeOptionalString)(params.initialEmoji) ?? _channelfeedback.DEFAULT_EMOJIS.queued;
    return {
        queued: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.queued) ?? queuedFallback,
        thinking: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.thinking) ?? _channelfeedback.DEFAULT_EMOJIS.thinking,
        tool: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.tool) ?? _channelfeedback.DEFAULT_EMOJIS.tool,
        coding: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.coding) ?? _channelfeedback.DEFAULT_EMOJIS.coding,
        web: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.web) ?? _channelfeedback.DEFAULT_EMOJIS.web,
        deploy: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.deploy) ?? _channelfeedback.DEFAULT_EMOJIS.deploy,
        build: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.build) ?? _channelfeedback.DEFAULT_EMOJIS.build,
        concierge: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.concierge) ?? _channelfeedback.DEFAULT_EMOJIS.concierge,
        done: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.done) ?? _channelfeedback.DEFAULT_EMOJIS.done,
        error: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.error) ?? _channelfeedback.DEFAULT_EMOJIS.error,
        stallSoft: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.stallSoft) ?? _channelfeedback.DEFAULT_EMOJIS.stallSoft,
        stallHard: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.stallHard) ?? _channelfeedback.DEFAULT_EMOJIS.stallHard,
        compacting: (0, _stringcoerceruntime.normalizeOptionalString)(overrides?.compacting) ?? _channelfeedback.DEFAULT_EMOJIS.compacting
    };
}
function buildTelegramStatusReactionVariants(emojis) {
    const variantsByRequested = new Map();
    for (const key of STATUS_REACTION_EMOJI_KEYS){
        const requested = (0, _stringcoerceruntime.normalizeOptionalString)(emojis[key]);
        if (!requested) {
            continue;
        }
        const fallbackVariants = TELEGRAM_STATUS_REACTION_VARIANTS[key] ?? [];
        const candidates = toUniqueNonEmpty([
            requested,
            ...fallbackVariants
        ]);
        variantsByRequested.set(requested, candidates);
    }
    return variantsByRequested;
}
function isTelegramSupportedReactionEmoji(emoji) {
    return TELEGRAM_SUPPORTED_REACTION_EMOJIS.has(emoji);
}
function extractTelegramAllowedEmojiReactions(chat) {
    if (!chat) {
        return undefined;
    }
    const availableReactions = chat.available_reactions;
    if (availableReactions === undefined) {
        return undefined;
    }
    if (availableReactions == null) {
        // Explicitly omitted/null => all emoji reactions are allowed in this chat.
        return null;
    }
    if (!Array.isArray(availableReactions)) {
        return new Set();
    }
    const allowed = new Set();
    for (const reaction of availableReactions){
        if (reaction.type !== "emoji") {
            continue;
        }
        const emoji = reaction.emoji.trim();
        if (emoji && isTelegramSupportedReactionEmoji(emoji)) {
            allowed.add(emoji);
        }
    }
    return allowed;
}
async function resolveTelegramAllowedEmojiReactions(params) {
    const fromMessage = extractTelegramAllowedEmojiReactions(params.chat);
    if (fromMessage !== undefined) {
        return fromMessage;
    }
    if (params.getChat) {
        try {
            const chatInfo = await params.getChat(params.chatId);
            const fromLookup = extractTelegramAllowedEmojiReactions(chatInfo);
            if (fromLookup !== undefined) {
                return fromLookup;
            }
        } catch  {
            return null;
        }
    }
    // If unavailable, assume no explicit restriction.
    return null;
}
function resolveTelegramReactionVariant(params) {
    const requestedEmoji = (0, _stringcoerceruntime.normalizeOptionalString)(params.requestedEmoji);
    if (!requestedEmoji) {
        return undefined;
    }
    const configuredVariants = params.variantsByRequestedEmoji.get(requestedEmoji) ?? [
        requestedEmoji
    ];
    const variants = toUniqueNonEmpty([
        ...configuredVariants,
        ...TELEGRAM_GENERIC_REACTION_FALLBACKS
    ]);
    for (const candidate of variants){
        if (!isTelegramSupportedReactionEmoji(candidate)) {
            continue;
        }
        const isAllowedByChat = params.allowedEmojiReactions == null || params.allowedEmojiReactions.has(candidate);
        if (isAllowedByChat) {
            return candidate;
        }
    }
    return undefined;
}

//# sourceMappingURL=status-reaction-variants.js.map