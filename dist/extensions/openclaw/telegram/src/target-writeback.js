"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "maybePersistResolvedTelegramTarget", {
    enumerable: true,
    get: function() {
        return maybePersistResolvedTelegramTarget;
    }
});
const _configmutation = require("../../../../common/openclaw/plugin-sdk/config-mutation");
const _cronstoreruntime = require("../../../../common/openclaw/plugin-sdk/cron-store-runtime");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _targets = require("./targets.js");
const writebackLogger = (0, _runtimeenv.createSubsystemLogger)("telegram/target-writeback");
const TELEGRAM_ADMIN_SCOPE = "operator.admin";
function asObjectRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value;
}
function normalizeTelegramLookupTargetForMatch(raw) {
    const normalized = (0, _targets.normalizeTelegramLookupTarget)(raw);
    if (!normalized) {
        return undefined;
    }
    return normalized.startsWith("@") ? (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(normalized) : normalized;
}
function normalizeTelegramTargetForMatch(raw) {
    const parsed = (0, _targets.parseTelegramTarget)(raw);
    const normalized = normalizeTelegramLookupTargetForMatch(parsed.chatId);
    if (!normalized) {
        return undefined;
    }
    const threadKey = parsed.messageThreadId == null ? "" : String(parsed.messageThreadId);
    return `${normalized}|${threadKey}`;
}
function buildResolvedTelegramTarget(params) {
    const { raw, parsed, resolvedChatId } = params;
    if (parsed.messageThreadId == null) {
        return resolvedChatId;
    }
    return raw.includes(":topic:") ? `${resolvedChatId}:topic:${parsed.messageThreadId}` : `${resolvedChatId}:${parsed.messageThreadId}`;
}
function resolveLegacyRewrite(params) {
    const parsed = (0, _targets.parseTelegramTarget)(params.raw);
    if ((0, _targets.normalizeTelegramChatId)(parsed.chatId)) {
        return null;
    }
    const normalized = normalizeTelegramLookupTargetForMatch(parsed.chatId);
    if (!normalized) {
        return null;
    }
    const threadKey = parsed.messageThreadId == null ? "" : String(parsed.messageThreadId);
    return {
        matchKey: `${normalized}|${threadKey}`,
        resolvedTarget: buildResolvedTelegramTarget({
            raw: params.raw,
            parsed,
            resolvedChatId: params.resolvedChatId
        })
    };
}
function rewriteTargetIfMatch(params) {
    if (typeof params.rawValue !== "string" && typeof params.rawValue !== "number") {
        return null;
    }
    const value = (0, _stringcoerceruntime.normalizeOptionalString)(String(params.rawValue)) ?? "";
    if (!value) {
        return null;
    }
    if (normalizeTelegramTargetForMatch(value) !== params.matchKey) {
        return null;
    }
    return params.resolvedTarget;
}
function replaceTelegramDefaultToTargets(params) {
    let changed = false;
    const telegram = asObjectRecord(params.cfg.channels?.telegram);
    if (!telegram) {
        return changed;
    }
    const maybeReplace = (holder, key)=>{
        const nextTarget = rewriteTargetIfMatch({
            rawValue: holder[key],
            matchKey: params.matchKey,
            resolvedTarget: params.resolvedTarget
        });
        if (!nextTarget) {
            return;
        }
        holder[key] = nextTarget;
        changed = true;
    };
    maybeReplace(telegram, "defaultTo");
    const accounts = asObjectRecord(telegram.accounts);
    if (!accounts) {
        return changed;
    }
    for (const accountId of Object.keys(accounts)){
        const account = asObjectRecord(accounts[accountId]);
        if (!account) {
            continue;
        }
        maybeReplace(account, "defaultTo");
    }
    return changed;
}
async function maybePersistResolvedTelegramTarget(params) {
    const raw = params.rawTarget.trim();
    if (!raw) {
        return;
    }
    const rewrite = resolveLegacyRewrite({
        raw,
        resolvedChatId: params.resolvedChatId
    });
    if (!rewrite) {
        return;
    }
    const { matchKey, resolvedTarget } = rewrite;
    if (Array.isArray(params.gatewayClientScopes) && !params.gatewayClientScopes.includes(TELEGRAM_ADMIN_SCOPE)) {
        writebackLogger.warn(`skipping Telegram target writeback for ${raw} because gateway caller is missing ${TELEGRAM_ADMIN_SCOPE}`);
        return;
    }
    try {
        const { snapshot, writeOptions } = await (0, _configmutation.readConfigFileSnapshotForWrite)();
        const nextConfig = structuredClone(snapshot.config ?? {});
        const configChanged = replaceTelegramDefaultToTargets({
            cfg: nextConfig,
            matchKey,
            resolvedTarget
        });
        if (configChanged) {
            await (0, _configmutation.replaceConfigFile)({
                nextConfig,
                snapshot,
                writeOptions,
                afterWrite: {
                    mode: "auto"
                }
            });
            if (params.verbose) {
                writebackLogger.warn(`resolved Telegram defaultTo target ${raw} -> ${resolvedTarget}`);
            }
        }
    } catch (err) {
        if (params.verbose) {
            writebackLogger.warn(`failed to persist Telegram defaultTo target ${raw}: ${String(err)}`);
        }
    }
    try {
        const storePath = (0, _cronstoreruntime.resolveCronStorePath)(params.cfg.cron?.store);
        const store = await (0, _cronstoreruntime.loadCronStore)(storePath);
        let cronChanged = false;
        for (const job of store.jobs){
            if (job.delivery?.channel !== "telegram") {
                continue;
            }
            const nextTarget = rewriteTargetIfMatch({
                rawValue: job.delivery.to,
                matchKey,
                resolvedTarget
            });
            if (!nextTarget) {
                continue;
            }
            job.delivery.to = nextTarget;
            cronChanged = true;
        }
        if (cronChanged) {
            await (0, _cronstoreruntime.saveCronStore)(storePath, store);
            if (params.verbose) {
                writebackLogger.warn(`resolved Telegram cron delivery target ${raw} -> ${resolvedTarget}`);
            }
        }
    } catch (err) {
        if (params.verbose) {
            writebackLogger.warn(`failed to persist Telegram cron target ${raw}: ${String(err)}`);
        }
    }
}

//# sourceMappingURL=target-writeback.js.map