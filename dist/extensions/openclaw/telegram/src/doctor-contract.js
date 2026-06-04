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
    get legacyConfigRules () {
        return legacyConfigRules;
    },
    get normalizeCompatibilityConfig () {
        return normalizeCompatibilityConfig;
    }
});
const _runtimedoctor = require("../../../../common/openclaw/plugin-sdk/runtime-doctor");
const _previewstreaming = require("./preview-streaming.js");
function hasLegacyTelegramStreamingAliases(value) {
    return (0, _runtimedoctor.hasLegacyStreamingAliases)(value, {
        includePreviewChunk: true
    });
}
function hasRetiredTelegramDmConfig(value) {
    const entry = (0, _runtimedoctor.asObjectRecord)(value);
    if (!entry) {
        return false;
    }
    if ((0, _runtimedoctor.asObjectRecord)(entry.dm)) {
        return true;
    }
    return Object.values((0, _runtimedoctor.asObjectRecord)(entry.direct) ?? {}).some((direct)=>(0, _runtimedoctor.asObjectRecord)(direct)?.threadReplies !== undefined);
}
function hasRetiredTelegramAccountDmConfig(value) {
    const accounts = (0, _runtimedoctor.asObjectRecord)(value);
    if (!accounts) {
        return false;
    }
    return Object.values(accounts).some((account)=>hasRetiredTelegramDmConfig(account));
}
function removeRetiredTelegramDmConfig(params) {
    let updated = params.entry;
    let changed = false;
    const dm = (0, _runtimedoctor.asObjectRecord)(updated.dm);
    if (dm) {
        const { dm: _ignored, ...rest } = updated;
        updated = rest;
        params.changes.push(dm.threadReplies === undefined ? `Removed ${params.pathPrefix}.dm.` : `Removed ${params.pathPrefix}.dm.threadReplies; DM topic sessions now follow Telegram getMe.has_topics_enabled.`);
        changed = true;
    }
    const direct = (0, _runtimedoctor.asObjectRecord)(updated.direct);
    if (direct) {
        let directChanged = false;
        const nextDirect = {
            ...direct
        };
        for (const [chatId, rawDirectConfig] of Object.entries(direct)){
            const directConfig = (0, _runtimedoctor.asObjectRecord)(rawDirectConfig);
            if (!directConfig || directConfig.threadReplies === undefined) {
                continue;
            }
            const nextDirectConfig = {
                ...directConfig
            };
            delete nextDirectConfig.threadReplies;
            nextDirect[chatId] = nextDirectConfig;
            params.changes.push(`Removed ${params.pathPrefix}.direct.${chatId}.threadReplies; DM topic sessions now follow Telegram getMe.has_topics_enabled.`);
            directChanged = true;
        }
        if (directChanged) {
            updated = {
                ...updated,
                direct: nextDirect
            };
            changed = true;
        }
    }
    return {
        entry: updated,
        changed
    };
}
function resolveCompatibleDefaultGroupEntry(section) {
    const existingGroups = section.groups;
    if (existingGroups !== undefined && !(0, _runtimedoctor.asObjectRecord)(existingGroups)) {
        return null;
    }
    const groups = (0, _runtimedoctor.asObjectRecord)(existingGroups) ?? {};
    const defaultKey = "*";
    const existingEntry = groups[defaultKey];
    if (existingEntry !== undefined && !(0, _runtimedoctor.asObjectRecord)(existingEntry)) {
        return null;
    }
    const entry = (0, _runtimedoctor.asObjectRecord)(existingEntry) ?? {};
    return {
        groups,
        entry
    };
}
const legacyConfigRules = [
    {
        path: [
            "channels",
            "telegram",
            "groupMentionsOnly"
        ],
        message: 'channels.telegram.groupMentionsOnly was removed; use channels.telegram.groups."*".requireMention instead. Run "openclaw doctor --fix".'
    },
    {
        path: [
            "channels",
            "telegram"
        ],
        message: 'channels.telegram.dm and direct.<chatId>.threadReplies were removed; DM topic sessions now follow Telegram getMe.has_topics_enabled, so topics-enabled bots may use thread-scoped DM sessions. Run "openclaw doctor --fix".',
        match: hasRetiredTelegramDmConfig
    },
    {
        path: [
            "channels",
            "telegram",
            "accounts"
        ],
        message: 'channels.telegram.accounts.<id>.dm and direct.<chatId>.threadReplies were removed; DM topic sessions now follow Telegram getMe.has_topics_enabled, so topics-enabled bots may use thread-scoped DM sessions. Run "openclaw doctor --fix".',
        match: hasRetiredTelegramAccountDmConfig
    },
    {
        path: [
            "channels",
            "telegram"
        ],
        message: "channels.telegram.streamMode, channels.telegram.streaming (scalar), chunkMode, blockStreaming, draftChunk, and blockStreamingCoalesce are legacy; use channels.telegram.streaming.{mode,chunkMode,preview.chunk,block.enabled,block.coalesce}.",
        match: hasLegacyTelegramStreamingAliases
    },
    {
        path: [
            "channels",
            "telegram",
            "accounts"
        ],
        message: "channels.telegram.accounts.<id>.streamMode, streaming (scalar), chunkMode, blockStreaming, draftChunk, and blockStreamingCoalesce are legacy; use channels.telegram.accounts.<id>.streaming.{mode,chunkMode,preview.chunk,block.enabled,block.coalesce}.",
        match: (value)=>(0, _runtimedoctor.hasLegacyAccountStreamingAliases)(value, hasLegacyTelegramStreamingAliases)
    }
];
function normalizeCompatibilityConfig({ cfg }) {
    const rawEntry = (0, _runtimedoctor.asObjectRecord)(cfg.channels?.telegram);
    if (!rawEntry) {
        return {
            config: cfg,
            changes: []
        };
    }
    const changes = [];
    let updated = rawEntry;
    let changed = false;
    const removedThreadReplies = removeRetiredTelegramDmConfig({
        entry: updated,
        pathPrefix: "channels.telegram",
        changes
    });
    updated = removedThreadReplies.entry;
    changed = changed || removedThreadReplies.changed;
    if (updated.groupMentionsOnly !== undefined) {
        const defaultGroupEntry = resolveCompatibleDefaultGroupEntry(updated);
        if (!defaultGroupEntry) {
            changes.push("Skipped channels.telegram.groupMentionsOnly migration because channels.telegram.groups already has an incompatible shape; fix remaining issues manually.");
        } else {
            const { groups, entry } = defaultGroupEntry;
            if (entry.requireMention === undefined) {
                entry.requireMention = updated.groupMentionsOnly;
                groups["*"] = entry;
                updated = {
                    ...updated,
                    groups
                };
                changes.push('Moved channels.telegram.groupMentionsOnly → channels.telegram.groups."*".requireMention.');
            } else {
                changes.push('Removed channels.telegram.groupMentionsOnly (channels.telegram.groups."*" already set).');
            }
            const { groupMentionsOnly: _ignored, ...rest } = updated;
            updated = rest;
            changed = true;
        }
    }
    const aliases = (0, _runtimedoctor.normalizeLegacyChannelAliases)({
        entry: updated,
        pathPrefix: "channels.telegram",
        changes,
        resolveStreamingOptions: (entry)=>({
                includePreviewChunk: true,
                resolvedMode: (0, _previewstreaming.resolveTelegramPreviewStreamMode)(entry)
            })
    });
    updated = aliases.entry;
    changed = changed || aliases.changed;
    const accounts = (0, _runtimedoctor.asObjectRecord)(updated.accounts);
    if (accounts) {
        let accountsChanged = false;
        const nextAccounts = {
            ...accounts
        };
        for (const [accountId, rawAccount] of Object.entries(accounts)){
            const account = (0, _runtimedoctor.asObjectRecord)(rawAccount);
            if (!account) {
                continue;
            }
            const accountRemovedThreadReplies = removeRetiredTelegramDmConfig({
                entry: account,
                pathPrefix: `channels.telegram.accounts.${accountId}`,
                changes
            });
            if (accountRemovedThreadReplies.changed) {
                nextAccounts[accountId] = accountRemovedThreadReplies.entry;
                accountsChanged = true;
            }
        }
        if (accountsChanged) {
            updated = {
                ...updated,
                accounts: nextAccounts
            };
            changed = true;
        }
    }
    if (!changed && changes.length === 0) {
        return {
            config: cfg,
            changes: []
        };
    }
    return {
        config: {
            ...cfg,
            channels: {
                ...cfg.channels,
                telegram: updated
            }
        },
        changes
    };
}

//# sourceMappingURL=doctor-contract.js.map