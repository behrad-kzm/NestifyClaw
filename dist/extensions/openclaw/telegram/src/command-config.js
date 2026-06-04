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
    get TELEGRAM_COMMAND_NAME_PATTERN () {
        return TELEGRAM_COMMAND_NAME_PATTERN;
    },
    get normalizeTelegramCommandDescription () {
        return normalizeTelegramCommandDescription;
    },
    get normalizeTelegramCommandName () {
        return normalizeTelegramCommandName;
    },
    get resolveTelegramCustomCommands () {
        return resolveTelegramCustomCommands;
    }
});
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const TELEGRAM_COMMAND_NAME_PATTERN = /^[a-z0-9_]{1,32}$/;
function normalizeTelegramCommandName(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return "";
    }
    const withoutSlash = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    return ((0, _stringcoerceruntime.normalizeOptionalLowercaseString)(withoutSlash) ?? "").replace(/-/g, "_");
}
function normalizeTelegramCommandDescription(value) {
    return value.trim();
}
function resolveTelegramCustomCommands(params) {
    const entries = Array.isArray(params.commands) ? params.commands : [];
    const reserved = params.reservedCommands ?? new Set();
    const checkReserved = params.checkReserved !== false;
    const checkDuplicates = params.checkDuplicates !== false;
    const seen = new Set();
    const resolved = [];
    const issues = [];
    for(let index = 0; index < entries.length; index += 1){
        const entry = entries[index];
        const normalized = normalizeTelegramCommandName(entry?.command ?? "");
        if (!normalized) {
            issues.push({
                index,
                field: "command",
                message: "Telegram custom command is missing a command name."
            });
            continue;
        }
        if (!TELEGRAM_COMMAND_NAME_PATTERN.test(normalized)) {
            issues.push({
                index,
                field: "command",
                message: `Telegram custom command "/${normalized}" is invalid (use a-z, 0-9, underscore; max 32 chars).`
            });
            continue;
        }
        if (checkReserved && reserved.has(normalized)) {
            issues.push({
                index,
                field: "command",
                message: `Telegram custom command "/${normalized}" conflicts with a native command.`
            });
            continue;
        }
        if (checkDuplicates && seen.has(normalized)) {
            issues.push({
                index,
                field: "command",
                message: `Telegram custom command "/${normalized}" is duplicated.`
            });
            continue;
        }
        const description = normalizeTelegramCommandDescription(entry?.description ?? "");
        if (!description) {
            issues.push({
                index,
                field: "description",
                message: `Telegram custom command "/${normalized}" is missing a description.`
            });
            continue;
        }
        if (checkDuplicates) {
            seen.add(normalized);
        }
        resolved.push({
            command: normalized,
            description
        });
    }
    return {
        commands: resolved,
        issues
    };
}

//# sourceMappingURL=command-config.js.map