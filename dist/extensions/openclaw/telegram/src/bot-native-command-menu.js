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
    get TELEGRAM_TOTAL_COMMAND_TEXT_BUDGET () {
        return TELEGRAM_TOTAL_COMMAND_TEXT_BUDGET;
    },
    get buildCappedTelegramMenuCommands () {
        return buildCappedTelegramMenuCommands;
    },
    get buildPluginTelegramMenuCommands () {
        return buildPluginTelegramMenuCommands;
    },
    get hashCommandList () {
        return hashCommandList;
    },
    get syncTelegramMenuCommands () {
        return syncTelegramMenuCommands;
    }
});
const _nodecrypto = require("node:crypto");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _apilogging = require("./api-logging.js");
const _commandconfig = require("./command-config.js");
const TELEGRAM_MAX_COMMANDS = 100;
const TELEGRAM_TOTAL_COMMAND_TEXT_BUDGET = 5700;
const TELEGRAM_COMMAND_RETRY_RATIO = 0.8;
const TELEGRAM_MIN_COMMAND_DESCRIPTION_LENGTH = 1;
const TELEGRAM_MAX_COMMAND_DESCRIPTION_LENGTH = 256;
const TELEGRAM_MENU_RESULT_CACHE_MAX = 128;
const TELEGRAM_COMMAND_MENU_SCOPES = [
    {
        label: "default"
    },
    {
        label: "all_group_chats",
        options: {
            scope: {
                type: "all_group_chats"
            }
        }
    }
];
const cappedTelegramMenuCache = new Map();
function countTelegramCommandText(value) {
    let count = 0;
    for(let index = 0; index < value.length;){
        const codePoint = value.codePointAt(index);
        index += codePoint && codePoint > 0xffff ? 2 : 1;
        count += 1;
    }
    return count;
}
function truncateTelegramCommandText(value, maxLength) {
    if (maxLength <= 0) {
        return "";
    }
    const suffix = maxLength > 1 ? "…" : "";
    const prefixLimit = maxLength - countTelegramCommandText(suffix);
    let count = 0;
    let prefixEnd = 0;
    for (const char of value){
        count += 1;
        if (count <= prefixLimit) {
            prefixEnd += char.length;
        }
        if (count > maxLength) {
            return `${value.slice(0, prefixEnd)}${suffix}`;
        }
    }
    return value;
}
function fitTelegramCommandsWithinTextBudget(commands, maxTotalChars) {
    let candidateCommands = [
        ...commands
    ];
    while(candidateCommands.length > 0){
        const commandNameChars = candidateCommands.reduce((total, command)=>total + countTelegramCommandText(command.command), 0);
        const descriptionBudget = maxTotalChars - commandNameChars;
        const minimumDescriptionBudget = candidateCommands.length * TELEGRAM_MIN_COMMAND_DESCRIPTION_LENGTH;
        if (descriptionBudget < minimumDescriptionBudget) {
            candidateCommands = candidateCommands.slice(0, -1);
            continue;
        }
        const descriptionCap = Math.max(TELEGRAM_MIN_COMMAND_DESCRIPTION_LENGTH, Math.floor(descriptionBudget / candidateCommands.length));
        let descriptionTrimmed = false;
        const fittedCommands = candidateCommands.map((command)=>{
            const description = truncateTelegramCommandText(command.description, Math.min(descriptionCap, TELEGRAM_MAX_COMMAND_DESCRIPTION_LENGTH));
            if (description !== command.description) {
                descriptionTrimmed = true;
                return Object.assign({}, command, {
                    description
                });
            }
            return command;
        });
        return {
            commands: fittedCommands,
            descriptionTrimmed,
            textBudgetDropCount: commands.length - fittedCommands.length
        };
    }
    return {
        commands: [],
        descriptionTrimmed: false,
        textBudgetDropCount: commands.length
    };
}
function readErrorTextField(value, key) {
    if (!value || typeof value !== "object" || !(key in value)) {
        return undefined;
    }
    return (0, _stringcoerceruntime.readStringValue)(value[key]);
}
function isBotCommandsTooMuchError(err) {
    if (!err) {
        return false;
    }
    const pattern = /\bBOT_COMMANDS_TOO_MUCH\b/i;
    if (typeof err === "string") {
        return pattern.test(err);
    }
    if (err instanceof Error) {
        if (pattern.test(err.message)) {
            return true;
        }
    }
    const description = readErrorTextField(err, "description");
    if (description && pattern.test(description)) {
        return true;
    }
    const message = readErrorTextField(err, "message");
    if (message && pattern.test(message)) {
        return true;
    }
    return false;
}
function formatTelegramCommandRetrySuccessLog(params) {
    const omittedCount = Math.max(0, params.initialCount - params.acceptedCount);
    return `Telegram accepted ${params.acceptedCount} commands after BOT_COMMANDS_TOO_MUCH ` + `(started with ${params.initialCount}; omitted ${omittedCount}). ` + "Reduce plugin/skill/custom commands to expose more menu entries.";
}
function buildPluginTelegramMenuCommands(params) {
    const { specs, existingCommands } = params;
    const commands = [];
    const issues = [];
    const pluginCommandNames = new Set();
    for (const spec of specs){
        const rawName = typeof spec.name === "string" ? spec.name : "";
        const normalized = (0, _commandconfig.normalizeTelegramCommandName)(rawName);
        if (!normalized || !_commandconfig.TELEGRAM_COMMAND_NAME_PATTERN.test(normalized)) {
            const invalidName = rawName.trim() ? rawName : "<unknown>";
            issues.push(`Plugin command "/${invalidName}" is invalid for Telegram (use a-z, 0-9, underscore; max 32 chars).`);
            continue;
        }
        const description = (0, _stringcoerceruntime.normalizeOptionalString)(spec.description) ?? "";
        if (!description) {
            issues.push(`Plugin command "/${normalized}" is missing a description.`);
            continue;
        }
        if (existingCommands.has(normalized)) {
            if (pluginCommandNames.has(normalized)) {
                issues.push(`Plugin command "/${normalized}" is duplicated.`);
            } else {
                issues.push(`Plugin command "/${normalized}" conflicts with an existing Telegram command.`);
            }
            continue;
        }
        pluginCommandNames.add(normalized);
        existingCommands.add(normalized);
        const menuCommand = {
            command: normalized,
            description
        };
        if (spec.descriptionLocalizations) {
            menuCommand.descriptionLocalizations = spec.descriptionLocalizations;
        }
        commands.push(menuCommand);
    }
    return {
        commands,
        issues
    };
}
function buildCappedTelegramMenuCommands(params) {
    const maxCommands = params.maxCommands ?? TELEGRAM_MAX_COMMANDS;
    const maxTotalChars = params.maxTotalChars ?? TELEGRAM_TOTAL_COMMAND_TEXT_BUDGET;
    const cacheKey = buildTelegramMenuResultCacheKey({
        allCommands: params.allCommands,
        maxCommands,
        maxTotalChars
    });
    const cached = cappedTelegramMenuCache.get(cacheKey);
    if (cached) {
        return cached;
    }
    const result = buildUncachedCappedTelegramMenuCommands({
        allCommands: params.allCommands,
        maxCommands,
        maxTotalChars
    });
    rememberCappedTelegramMenuResult(cacheKey, result);
    return result;
}
function buildUncachedCappedTelegramMenuCommands(params) {
    const { allCommands } = params;
    const { maxCommands, maxTotalChars } = params;
    const totalCommands = allCommands.length;
    const overflowCount = Math.max(0, totalCommands - maxCommands);
    const canonicalCommands = allCommands.filter((command)=>!command.isAlias);
    const aliasCommands = allCommands.filter((command)=>command.isAlias);
    const aliasBudget = Math.max(0, maxCommands - canonicalCommands.length);
    const budgetedCommands = overflowCount === 0 ? allCommands : [
        ...canonicalCommands,
        ...aliasCommands.slice(0, aliasBudget)
    ];
    const { commands: fittedCommands, descriptionTrimmed, textBudgetDropCount } = fitTelegramCommandsWithinTextBudget(budgetedCommands.slice(0, maxCommands), maxTotalChars);
    const commandsToRegister = fittedCommands.map(({ isAlias: _isAlias, ...command })=>command);
    return {
        commandsToRegister,
        totalCommands,
        maxCommands,
        overflowCount,
        maxTotalChars,
        descriptionTrimmed,
        textBudgetDropCount
    };
}
function buildTelegramMenuResultCacheKey(params) {
    const digest = (0, _nodecrypto.createHash)("sha256");
    updateTelegramCommandDigestField(digest, String(params.maxCommands));
    updateTelegramCommandDigestField(digest, String(params.maxTotalChars));
    for (const command of params.allCommands){
        updateTelegramCommandDigestField(digest, command.command);
        updateTelegramCommandDigestField(digest, command.description);
        updateTelegramCommandDigestField(digest, command.isAlias ? "1" : "0");
        updateTelegramCommandLocalizationDigest(digest, command.descriptionLocalizations);
    }
    return digest.digest("hex").slice(0, 16);
}
function updateTelegramCommandDigestField(digest, value) {
    digest.update(String(value.length));
    digest.update(":");
    digest.update(value);
}
function updateTelegramCommandLocalizationDigest(digest, localizations) {
    const entries = Object.entries(localizations ?? {}).toSorted(([a], [b])=>a.localeCompare(b));
    updateTelegramCommandDigestField(digest, String(entries.length));
    for (const [locale, description] of entries){
        updateTelegramCommandDigestField(digest, locale);
        updateTelegramCommandDigestField(digest, description);
    }
}
function rememberCappedTelegramMenuResult(key, result) {
    cappedTelegramMenuCache.set(key, result);
    if (cappedTelegramMenuCache.size <= TELEGRAM_MENU_RESULT_CACHE_MAX) {
        return;
    }
    const oldestKey = cappedTelegramMenuCache.keys().next().value;
    if (oldestKey) {
        cappedTelegramMenuCache.delete(oldestKey);
    }
}
function hashCommandList(commands) {
    const sorted = [
        ...commands
    ].toSorted((a, b)=>a.command.localeCompare(b.command));
    return (0, _nodecrypto.createHash)("sha256").update(JSON.stringify(sorted)).digest("hex").slice(0, 16);
}
// Keep the sync cache process-local so restarts always re-register commands.
const syncedCommandHashes = new Map();
function getCommandHashKey(accountId, botIdentity) {
    return `${accountId ?? "default"}:${botIdentity ?? ""}`;
}
function readCachedCommandHash(accountId, botIdentity) {
    const key = getCommandHashKey(accountId, botIdentity);
    return syncedCommandHashes.get(key) ?? null;
}
function writeCachedCommandHash(accountId, botIdentity, hash) {
    const key = getCommandHashKey(accountId, botIdentity);
    syncedCommandHashes.set(key, hash);
}
function normalizeTelegramLanguageCode(languageCode) {
    const normalized = languageCode.trim().toLowerCase();
    return /^[a-z]{2}$/.test(normalized) ? normalized : null;
}
function readLocalizedDescription(command, languageCode) {
    for (const [rawLanguageCode, rawDescription] of Object.entries(command.descriptionLocalizations ?? {})){
        if (normalizeTelegramLanguageCode(rawLanguageCode) !== languageCode) {
            continue;
        }
        const description = (0, _stringcoerceruntime.normalizeOptionalString)(rawDescription);
        if (description) {
            return description;
        }
    }
    return undefined;
}
function toTelegramBotCommands(commands) {
    return commands.map((command)=>({
            command: command.command,
            description: command.description
        }));
}
function buildLocalizedCommandVariants(commands) {
    const locales = new Set();
    const unsupportedLanguageCodes = new Set();
    for (const cmd of commands){
        if (cmd.descriptionLocalizations) {
            for (const lang of Object.keys(cmd.descriptionLocalizations)){
                const normalized = normalizeTelegramLanguageCode(lang);
                if (normalized) {
                    locales.add(normalized);
                } else {
                    unsupportedLanguageCodes.add(lang);
                }
            }
        }
    }
    const variants = [
        ...locales
    ].toSorted().map((languageCode)=>{
        const localizedCommands = commands.map((cmd)=>({
                command: cmd.command,
                description: readLocalizedDescription(cmd, languageCode) ?? cmd.description
            }));
        return {
            languageCode,
            commands: fitTelegramCommandsWithinTextBudget(localizedCommands, TELEGRAM_TOTAL_COMMAND_TEXT_BUDGET).commands
        };
    });
    return {
        variants,
        unsupportedLanguageCodes: [
            ...unsupportedLanguageCodes
        ].toSorted()
    };
}
function formatTelegramCommandScopeOperation(operation, scope, languageCode) {
    const base = scope.label === "default" ? operation : `${operation}(${scope.label})`;
    return languageCode ? `${base}(${languageCode})` : base;
}
async function deleteTelegramMenuCommandsForScopes(params) {
    const { bot, runtime } = params;
    if (typeof bot.api.deleteMyCommands !== "function") {
        return true;
    }
    let allDeleted = true;
    for (const scope of TELEGRAM_COMMAND_MENU_SCOPES){
        const deleted = await (0, _apilogging.withTelegramApiErrorLogging)({
            operation: formatTelegramCommandScopeOperation("deleteMyCommands", scope),
            runtime,
            fn: ()=>scope.options ? bot.api.deleteMyCommands(scope.options) : bot.api.deleteMyCommands()
        }).then(()=>true).catch(()=>false);
        allDeleted &&= deleted;
    }
    return allDeleted;
}
async function setTelegramMenuCommandsForScopes(params) {
    const { bot, runtime, commands, languageCode, shouldLog } = params;
    for (const scope of TELEGRAM_COMMAND_MENU_SCOPES){
        await (0, _apilogging.withTelegramApiErrorLogging)({
            operation: formatTelegramCommandScopeOperation("setMyCommands", scope, languageCode),
            runtime,
            shouldLog,
            fn: ()=>{
                const botCommands = toTelegramBotCommands(commands);
                const opts = {
                    ...scope.options,
                    ...languageCode ? {
                        language_code: languageCode
                    } : undefined
                };
                return Object.keys(opts).length > 0 ? bot.api.setMyCommands(botCommands, opts) : bot.api.setMyCommands(botCommands);
            }
        });
    }
}
function syncTelegramMenuCommands(params) {
    const { bot, runtime, commandsToRegister, accountId, botIdentity } = params;
    const sync = async ()=>{
        // Skip sync if the command list hasn't changed since the last successful
        // sync. This prevents hitting Telegram's 429 rate limit when the gateway
        // is restarted several times in quick succession.
        // See: openclaw/openclaw#32017
        const currentHash = hashCommandList(commandsToRegister);
        const cachedHash = readCachedCommandHash(accountId, botIdentity);
        if (cachedHash === currentHash) {
            (0, _runtimeenv.logVerbose)("telegram: command menu unchanged; skipping sync");
            return;
        }
        // Keep delete -> set ordering to avoid stale deletions racing after fresh registrations.
        const deleteSucceeded = await deleteTelegramMenuCommandsForScopes({
            bot,
            runtime
        });
        if (commandsToRegister.length === 0) {
            if (!deleteSucceeded) {
                runtime.log?.("telegram: deleteMyCommands failed; skipping empty-menu hash cache write");
                return;
            }
            if (typeof bot.api.deleteMyCommands !== "function") {
                await setTelegramMenuCommandsForScopes({
                    bot,
                    runtime,
                    commands: []
                });
            }
            writeCachedCommandHash(accountId, botIdentity, currentHash);
            return;
        }
        let retryCommands = commandsToRegister;
        let acceptedCommands = null;
        const initialCommandCount = commandsToRegister.length;
        while(retryCommands.length > 0){
            try {
                await setTelegramMenuCommandsForScopes({
                    bot,
                    runtime,
                    commands: retryCommands,
                    shouldLog: (err)=>!isBotCommandsTooMuchError(err)
                });
                if (retryCommands.length < initialCommandCount) {
                    runtime.log?.(formatTelegramCommandRetrySuccessLog({
                        initialCount: initialCommandCount,
                        acceptedCount: retryCommands.length
                    }));
                }
                acceptedCommands = retryCommands;
                break;
            } catch (err) {
                if (!isBotCommandsTooMuchError(err)) {
                    throw err;
                }
                const nextCount = Math.floor(retryCommands.length * TELEGRAM_COMMAND_RETRY_RATIO);
                const reducedCount = nextCount < retryCommands.length ? nextCount : retryCommands.length - 1;
                if (reducedCount <= 0) {
                    runtime.error?.("Telegram rejected native command registration (BOT_COMMANDS_TOO_MUCH); leaving menu empty. Reduce commands or disable channels.telegram.commands.native.");
                    return;
                }
                runtime.log?.(`Telegram rejected ${retryCommands.length} commands (BOT_COMMANDS_TOO_MUCH); retrying with ${reducedCount}.`);
                retryCommands = retryCommands.slice(0, reducedCount);
            }
        }
        if (!acceptedCommands) {
            return;
        }
        const { variants, unsupportedLanguageCodes } = buildLocalizedCommandVariants(acceptedCommands);
        if (unsupportedLanguageCodes.length > 0) {
            runtime.log?.(`Telegram command menu ignored unsupported description localization codes: ${unsupportedLanguageCodes.join(", ")}.`);
        }
        for (const variant of variants){
            await setTelegramMenuCommandsForScopes({
                bot,
                runtime,
                commands: variant.commands,
                languageCode: variant.languageCode
            });
        }
        writeCachedCommandHash(accountId, botIdentity, currentHash);
    };
    void sync().catch((err)=>{
        runtime.error?.(`Telegram command sync failed: ${String(err)}`);
    });
}

//# sourceMappingURL=bot-native-command-menu.js.map