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
    get collectTelegramApiRootWarnings () {
        return collectTelegramApiRootWarnings;
    },
    get collectTelegramEmptyAllowlistExtraWarnings () {
        return collectTelegramEmptyAllowlistExtraWarnings;
    },
    get collectTelegramGroupPolicyWarnings () {
        return collectTelegramGroupPolicyWarnings;
    },
    get collectTelegramInvalidAllowFromWarnings () {
        return collectTelegramInvalidAllowFromWarnings;
    },
    get collectTelegramMalformedGroupsWarnings () {
        return collectTelegramMalformedGroupsWarnings;
    },
    get collectTelegramMissingEnvTokenWarnings () {
        return collectTelegramMissingEnvTokenWarnings;
    },
    get collectTelegramSelectedQuoteToolProgressWarnings () {
        return collectTelegramSelectedQuoteToolProgressWarnings;
    },
    get maybeRepairTelegramAllowFromUsernames () {
        return maybeRepairTelegramAllowFromUsernames;
    },
    get maybeRepairTelegramApiRoots () {
        return maybeRepairTelegramApiRoots;
    },
    get scanTelegramBotEndpointApiRoots () {
        return scanTelegramBotEndpointApiRoots;
    },
    get scanTelegramInvalidAllowFromEntries () {
        return scanTelegramInvalidAllowFromEntries;
    },
    get scanTelegramMalformedGroupsConfig () {
        return scanTelegramMalformedGroupsConfig;
    },
    get scanTelegramSelectedQuoteToolProgressWarnings () {
        return scanTelegramSelectedQuoteToolProgressWarnings;
    },
    get telegramDoctor () {
        return telegramDoctor;
    }
});
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accountinspect = require("./account-inspect.js");
const _accounts = require("./accounts.js");
const _allowfrom = require("./allow-from.js");
const _apifetch = require("./api-fetch.js");
const _apiroot = require("./api-root.js");
const _doctorcontract = require("./doctor-contract.js");
const _previewstreaming = require("./preview-streaming.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function asObjectRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function sanitizeForLog(value) {
    return value.replace(/\p{Cc}+/gu, " ").trim();
}
function hasAllowFromEntries(values) {
    return Array.isArray(values) && values.some((entry)=>(0, _stringcoerceruntime.normalizeOptionalString)(String(entry)));
}
function collectTelegramAccountScopes(cfg) {
    const scopes = [];
    const telegram = asObjectRecord(cfg.channels?.telegram);
    if (!telegram) {
        return scopes;
    }
    scopes.push({
        prefix: "channels.telegram",
        pathSegments: [
            "channels",
            "telegram"
        ],
        account: telegram
    });
    const accounts = asObjectRecord(telegram.accounts);
    if (!accounts) {
        return scopes;
    }
    for (const key of Object.keys(accounts)){
        const account = asObjectRecord(accounts[key]);
        if (account) {
            scopes.push({
                prefix: `channels.telegram.accounts.${key}`,
                pathSegments: [
                    "channels",
                    "telegram",
                    "accounts",
                    key
                ],
                account
            });
        }
    }
    return scopes;
}
function collectTelegramAllowFromLists(prefix, account) {
    const refs = [
        {
            pathLabel: `${prefix}.allowFrom`,
            holder: account,
            key: "allowFrom"
        },
        {
            pathLabel: `${prefix}.groupAllowFrom`,
            holder: account,
            key: "groupAllowFrom"
        }
    ];
    const groups = asObjectRecord(account.groups);
    if (!groups) {
        return refs;
    }
    for (const groupId of Object.keys(groups)){
        const group = asObjectRecord(groups[groupId]);
        if (!group) {
            continue;
        }
        refs.push({
            pathLabel: `${prefix}.groups.${groupId}.allowFrom`,
            holder: group,
            key: "allowFrom"
        });
        const topics = asObjectRecord(group.topics);
        if (!topics) {
            continue;
        }
        for (const topicId of Object.keys(topics)){
            const topic = asObjectRecord(topics[topicId]);
            if (!topic) {
                continue;
            }
            refs.push({
                pathLabel: `${prefix}.groups.${groupId}.topics.${topicId}.allowFrom`,
                holder: topic,
                key: "allowFrom"
            });
        }
    }
    return refs;
}
function describeConfigValueType(value) {
    if (Array.isArray(value)) {
        return "array";
    }
    if (value === null) {
        return "null";
    }
    return typeof value;
}
function scanTelegramMalformedGroupsConfig(cfg) {
    const hits = [];
    for (const scope of collectTelegramAccountScopes(cfg)){
        if (!Object.hasOwn(scope.account, "groups")) {
            continue;
        }
        const groups = scope.account.groups;
        if (asObjectRecord(groups)) {
            continue;
        }
        hits.push({
            path: `${scope.prefix}.groups`,
            actualType: describeConfigValueType(groups)
        });
    }
    return hits;
}
function collectTelegramMalformedGroupsWarnings(params) {
    if (params.hits.length === 0) {
        return [];
    }
    const sample = params.hits[0] ?? {
        path: "channels.telegram.groups",
        actualType: "unknown"
    };
    return [
        `- ${sanitizeForLog(sample.path)} has invalid Telegram groups shape (${sanitizeForLog(sample.actualType)}); expected an object map keyed by Telegram group/chat id, not an array, string, or null.`,
        `- Example shape: channels.telegram.groups."-1001234567890".topics."99" = { agentId: "support" }. Use topics for forum-topic routing, then rerun ${params.doctorFixCommand} for any remaining Telegram config cleanup.`
    ];
}
function scanTelegramInvalidAllowFromEntries(cfg) {
    const hits = [];
    const scanList = (pathLabel, list)=>{
        if (!Array.isArray(list)) {
            return;
        }
        for (const entry of list){
            const normalized = (0, _allowfrom.normalizeTelegramAllowFromEntry)(entry);
            if (!normalized || normalized === "*" || (0, _allowfrom.isNumericTelegramSenderUserId)(normalized)) {
                continue;
            }
            hits.push({
                path: pathLabel,
                entry: (0, _stringcoerceruntime.normalizeOptionalString)(String(entry)) ?? ""
            });
        }
    };
    for (const scope of collectTelegramAccountScopes(cfg)){
        for (const ref of collectTelegramAllowFromLists(scope.prefix, scope.account)){
            scanList(ref.pathLabel, ref.holder[ref.key]);
        }
    }
    return hits;
}
function collectTelegramInvalidAllowFromWarnings(params) {
    if (params.hits.length === 0) {
        return [];
    }
    const sampleEntry = sanitizeForLog(params.hits[0]?.entry ?? "@");
    return [
        `- Telegram allowFrom contains ${params.hits.length} invalid sender entries (e.g. ${sampleEntry}); Telegram authorization requires positive numeric sender user IDs.`,
        `- Run "${params.doctorFixCommand}" to auto-resolve @username entries to numeric IDs (requires a Telegram bot token). Move negative chat IDs under channels.telegram.groups instead of allowFrom.`
    ];
}
function scanTelegramBotEndpointApiRoots(cfg) {
    const hits = [];
    for (const scope of collectTelegramAccountScopes(cfg)){
        const value = scope.account.apiRoot;
        if (typeof value !== "string" || !(0, _apiroot.hasTelegramBotEndpointApiRoot)(value)) {
            continue;
        }
        hits.push({
            path: `${scope.prefix}.apiRoot`,
            pathSegments: [
                ...scope.pathSegments,
                "apiRoot"
            ],
            value,
            normalized: (0, _apiroot.normalizeTelegramApiRoot)(value)
        });
    }
    return hits;
}
function collectTelegramApiRootWarnings(params) {
    if (params.hits.length === 0) {
        return [];
    }
    const samplePath = sanitizeForLog(params.hits[0]?.path ?? "channels.telegram.apiRoot");
    return [
        `- ${samplePath} points at a full Telegram bot endpoint; apiRoot must be the Bot API root only. This can make startup calls like deleteWebhook, deleteMyCommands, and setMyCommands fail with 404 even when direct curl commands work.`,
        `- Run "${params.doctorFixCommand}" to remove the trailing /bot<TOKEN> path from Telegram apiRoot.`
    ];
}
function formatTelegramAccountConfigPath(cfg, accountId) {
    const telegram = asObjectRecord(cfg.channels?.telegram);
    const accounts = asObjectRecord(telegram?.accounts);
    if (!accounts || Object.keys(accounts).length === 0) {
        return "channels.telegram";
    }
    return accountId === "default" ? "channels.telegram" : `channels.telegram.accounts.${accountId}`;
}
function scanTelegramSelectedQuoteToolProgressWarnings(cfg) {
    if (!asObjectRecord(cfg.channels?.telegram)) {
        return [];
    }
    return (0, _accounts.listTelegramAccountIds)(cfg).flatMap((accountId)=>{
        const account = (0, _accounts.mergeTelegramAccountConfig)(cfg, accountId);
        const replyToMode = account.replyToMode ?? "off";
        if (replyToMode === "off") {
            return [];
        }
        if ((0, _previewstreaming.resolveTelegramPreviewStreamMode)(account) === "off") {
            return [];
        }
        const blockStreamingEnabled = (0, _channeloutbound.resolveChannelStreamingBlockEnabled)(account) ?? cfg.agents?.defaults?.blockStreamingDefault === "on";
        if (blockStreamingEnabled || !(0, _channeloutbound.resolveChannelStreamingPreviewToolProgress)(account)) {
            return [];
        }
        return [
            {
                path: formatTelegramAccountConfigPath(cfg, accountId),
                replyToMode
            }
        ];
    });
}
function collectTelegramSelectedQuoteToolProgressWarnings(params) {
    if (params.hits.length === 0) {
        return [];
    }
    const sample = params.hits[0] ?? {
        path: "channels.telegram",
        replyToMode: "first"
    };
    return [
        `- ${sanitizeForLog(sample.path)} has replyToMode: "${sanitizeForLog(sample.replyToMode)}" while Telegram preview tool-progress is enabled. Telegram selected quote replies must send the final answer through the native quote-reply path, so those turns skip the short "Working" tool-progress preview. Current-message replies without selected quote text still keep preview streaming.`,
        '- Set replyToMode: "off" when tool-progress preview matters more than native quote replies, or set streaming.preview.toolProgress: false to keep quote replies and silence this warning.'
    ];
}
function maybeRepairTelegramApiRoots(cfg) {
    const hits = scanTelegramBotEndpointApiRoots(cfg);
    if (hits.length === 0) {
        return {
            config: cfg,
            changes: []
        };
    }
    const next = structuredClone(cfg);
    const apply = (path, normalized)=>{
        let target = next;
        for (const segment of path.slice(0, -1)){
            target = asObjectRecord(target?.[segment]);
            if (!target) {
                return;
            }
        }
        target[path[path.length - 1] ?? "apiRoot"] = normalized;
    };
    for (const hit of hits){
        apply(hit.pathSegments, hit.normalized);
    }
    return {
        config: next,
        changes: hits.map((hit)=>`- ${sanitizeForLog(hit.path)}: removed trailing /bot<TOKEN> from Telegram apiRoot.`)
    };
}
function collectTelegramMissingEnvTokenWarnings(params) {
    if ((0, _accounts.resolveDefaultTelegramAccountId)(params.cfg) !== "default") {
        return [];
    }
    const account = (0, _accountinspect.inspectTelegramAccount)({
        cfg: params.cfg,
        accountId: "default",
        envToken: params.env?.TELEGRAM_BOT_TOKEN ?? ""
    });
    if (!account.enabled || account.tokenStatus !== "missing" || account.tokenSource !== "none") {
        return [];
    }
    return [
        "- channels.telegram: default account has no available bot token, and TELEGRAM_BOT_TOKEN is absent in this doctor environment. After migration, verify TELEGRAM_BOT_TOKEN is present in the state-dir .env or configure channels.telegram.botToken / channels.telegram.accounts.default.botToken as a SecretRef."
    ];
}
async function repairTelegramConfig(params) {
    const apiRootRepair = maybeRepairTelegramApiRoots(params.cfg);
    const allowFromRepair = await maybeRepairTelegramAllowFromUsernames(apiRootRepair.config);
    return {
        config: allowFromRepair.config,
        changes: [
            ...apiRootRepair.changes,
            ...allowFromRepair.changes
        ]
    };
}
async function maybeRepairTelegramAllowFromUsernames(cfg) {
    const hits = scanTelegramInvalidAllowFromEntries(cfg);
    if (hits.length === 0) {
        return {
            config: cfg,
            changes: []
        };
    }
    const usernameHits = hits.filter((hit)=>{
        const normalized = (0, _allowfrom.normalizeTelegramAllowFromEntry)(hit.entry);
        return normalized.length > 0 && !/\s/.test(normalized) && !normalized.startsWith("-");
    });
    if (usernameHits.length === 0) {
        return {
            config: cfg,
            changes: hits.slice(0, 5).map((hit)=>`- ${sanitizeForLog(hit.path)}: invalid sender entry ${sanitizeForLog(hit.entry)}; allowFrom requires positive numeric Telegram user IDs. Move group chat IDs under channels.telegram.groups.`)
        };
    }
    const { getChannelsCommandSecretTargetIds, resolveCommandSecretRefsViaGateway } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("../../../../common/openclaw/plugin-sdk/runtime")));
    const { resolvedConfig } = await resolveCommandSecretRefsViaGateway({
        config: cfg,
        commandName: "doctor --fix",
        targetIds: getChannelsCommandSecretTargetIds(),
        mode: "read_only_status"
    });
    const tokenResolutionWarnings = [];
    const resolverAccountIds = [];
    let sawConfiguredUnavailableToken = false;
    for (const accountId of (0, _accounts.listTelegramAccountIds)(resolvedConfig)){
        let inspected;
        try {
            inspected = (0, _accountinspect.inspectTelegramAccount)({
                cfg: resolvedConfig,
                accountId
            });
        } catch (error) {
            tokenResolutionWarnings.push(`- Telegram account ${accountId}: failed to inspect bot token (${(0, _errorruntime.formatErrorMessage)(error)}).`);
            continue;
        }
        if (inspected.tokenStatus === "configured_unavailable") {
            sawConfiguredUnavailableToken = true;
            tokenResolutionWarnings.push(`- Telegram account ${accountId}: failed to inspect bot token (configured but unavailable in this command path).`);
        }
        const token = inspected.tokenSource === "none" ? "" : (0, _stringcoerceruntime.normalizeOptionalString)(inspected.token) ?? "";
        if (token) {
            resolverAccountIds.push(accountId);
        }
    }
    if (resolverAccountIds.length === 0) {
        return {
            config: cfg,
            changes: [
                ...tokenResolutionWarnings,
                sawConfiguredUnavailableToken ? "- Telegram allowFrom contains @username entries, but configured Telegram bot credentials are unavailable in this command path; cannot auto-resolve." : "- Telegram allowFrom contains @username entries, but no Telegram bot token is available in this command path; cannot auto-resolve."
            ]
        };
    }
    const resolveUserId = async (raw)=>{
        const trimmed = (0, _stringcoerceruntime.normalizeOptionalString)(raw) ?? "";
        if (!trimmed) {
            return null;
        }
        const normalized = (0, _allowfrom.normalizeTelegramAllowFromEntry)(trimmed);
        if (!normalized || normalized === "*") {
            return null;
        }
        if ((0, _allowfrom.isNumericTelegramSenderUserId)(normalized) || /\s/.test(normalized)) {
            return (0, _allowfrom.isNumericTelegramSenderUserId)(normalized) ? normalized : null;
        }
        const username = normalized.startsWith("@") ? normalized : `@${normalized}`;
        for (const accountId of resolverAccountIds){
            try {
                const account = (0, _accounts.resolveTelegramAccount)({
                    cfg: resolvedConfig,
                    accountId
                });
                const token = account.token.trim();
                if (!token) {
                    continue;
                }
                const id = await (0, _apifetch.lookupTelegramChatId)({
                    token,
                    chatId: username,
                    network: account.config.network,
                    signal: undefined
                });
                if (id) {
                    return id;
                }
            } catch  {
            // ignore and try next account
            }
        }
        return null;
    };
    const next = structuredClone(cfg);
    const changes = [];
    const repairList = async (pathLabel, holder, key)=>{
        const raw = holder[key];
        if (!Array.isArray(raw)) {
            return;
        }
        const out = [];
        const replaced = [];
        for (const entry of raw){
            const normalized = (0, _allowfrom.normalizeTelegramAllowFromEntry)(entry);
            if (!normalized) {
                continue;
            }
            if (normalized === "*" || (0, _allowfrom.isNumericTelegramSenderUserId)(normalized)) {
                out.push(normalized);
                continue;
            }
            const resolved = await resolveUserId(String(entry));
            if (resolved) {
                out.push(resolved);
                replaced.push({
                    from: (0, _stringcoerceruntime.normalizeOptionalString)(String(entry)) ?? "",
                    to: resolved
                });
            } else {
                out.push((0, _stringcoerceruntime.normalizeOptionalString)(String(entry)) ?? "");
            }
        }
        const deduped = [];
        const seen = new Set();
        for (const entry of out){
            const keyValue = (0, _stringcoerceruntime.normalizeOptionalString)(String(entry)) ?? "";
            if (!keyValue || seen.has(keyValue)) {
                continue;
            }
            seen.add(keyValue);
            deduped.push(entry);
        }
        holder[key] = deduped;
        for (const replacement of replaced.slice(0, 5)){
            changes.push(`- ${sanitizeForLog(pathLabel)}: resolved ${sanitizeForLog(replacement.from)} -> ${sanitizeForLog(replacement.to)}`);
        }
        if (replaced.length > 5) {
            changes.push(`- ${sanitizeForLog(pathLabel)}: resolved ${replaced.length - 5} more @username entries`);
        }
    };
    for (const scope of collectTelegramAccountScopes(next)){
        for (const ref of collectTelegramAllowFromLists(scope.prefix, scope.account)){
            await repairList(ref.pathLabel, ref.holder, ref.key);
        }
    }
    if (changes.length === 0) {
        return {
            config: cfg,
            changes: []
        };
    }
    return {
        config: next,
        changes
    };
}
function hasConfiguredGroups(account, parent) {
    const groups = asObjectRecord(account.groups) ?? asObjectRecord(parent?.groups);
    return Boolean(groups) && Object.keys(groups ?? {}).length > 0;
}
function collectTelegramGroupPolicyWarnings(params) {
    if (!hasConfiguredGroups(params.account, params.parent)) {
        const effectiveDmPolicy = params.dmPolicy ?? "pairing";
        const dmSetupLine = effectiveDmPolicy === "pairing" ? "DMs use pairing mode, so new senders must start a chat and be approved before regular messages are accepted." : effectiveDmPolicy === "allowlist" ? `DMs use allowlist mode, so only sender IDs in ${params.prefix}.allowFrom are accepted.` : effectiveDmPolicy === "open" ? "DMs are open." : "DMs are disabled.";
        return [
            `- ${params.prefix}: Telegram is in first-time setup mode. ${dmSetupLine} Group messages stay blocked until you add allowed chats under ${params.prefix}.groups (and optional sender IDs under ${params.prefix}.groupAllowFrom), or set ${params.prefix}.groupPolicy to "open" if you want broad group access.`
        ];
    }
    const rawGroupAllowFrom = params.account.groupAllowFrom ?? params.parent?.groupAllowFrom;
    const groupAllowFrom = hasAllowFromEntries(rawGroupAllowFrom) ? rawGroupAllowFrom : undefined;
    const effectiveGroupAllowFrom = groupAllowFrom ?? params.effectiveAllowFrom;
    if (hasAllowFromEntries(effectiveGroupAllowFrom)) {
        return [];
    }
    return [
        `- ${params.prefix}.groupPolicy is "allowlist" but groupAllowFrom (and allowFrom) is empty — all group messages will be silently dropped. Add sender IDs to ${params.prefix}.groupAllowFrom or ${params.prefix}.allowFrom, or set ${params.prefix}.groupPolicy to "open".`
    ];
}
function collectTelegramEmptyAllowlistExtraWarnings(params) {
    const account = params.account;
    const parent = params.parent;
    return params.channelName === "telegram" && (account.groupPolicy ?? parent?.groupPolicy ?? undefined) === "allowlist" ? collectTelegramGroupPolicyWarnings({
        account,
        dmPolicy: params.dmPolicy,
        effectiveAllowFrom: params.effectiveAllowFrom,
        parent,
        prefix: params.prefix
    }) : [];
}
const telegramDoctor = {
    legacyConfigRules: _doctorcontract.legacyConfigRules,
    normalizeCompatibilityConfig: _doctorcontract.normalizeCompatibilityConfig,
    collectPreviewWarnings: ({ cfg, doctorFixCommand, env })=>[
            ...collectTelegramMissingEnvTokenWarnings({
                cfg,
                env
            }),
            ...collectTelegramMalformedGroupsWarnings({
                hits: scanTelegramMalformedGroupsConfig(cfg),
                doctorFixCommand
            }),
            ...collectTelegramInvalidAllowFromWarnings({
                hits: scanTelegramInvalidAllowFromEntries(cfg),
                doctorFixCommand
            }),
            ...collectTelegramApiRootWarnings({
                hits: scanTelegramBotEndpointApiRoots(cfg),
                doctorFixCommand
            }),
            ...collectTelegramSelectedQuoteToolProgressWarnings({
                hits: scanTelegramSelectedQuoteToolProgressWarnings(cfg)
            })
        ],
    repairConfig: async ({ cfg })=>await repairTelegramConfig({
            cfg
        }),
    collectEmptyAllowlistExtraWarnings: collectTelegramEmptyAllowlistExtraWarnings,
    shouldSkipDefaultEmptyGroupAllowlistWarning: (params)=>params.channelName === "telegram"
};

//# sourceMappingURL=doctor.js.map