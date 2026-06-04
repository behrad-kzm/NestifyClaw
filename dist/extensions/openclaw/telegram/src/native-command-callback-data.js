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
    get buildTelegramNativeCommandCallbackData () {
        return buildTelegramNativeCommandCallbackData;
    },
    get buildTelegramOpaqueCallbackData () {
        return buildTelegramOpaqueCallbackData;
    },
    get parseTelegramNativeCommandCallbackData () {
        return parseTelegramNativeCommandCallbackData;
    },
    get parseTelegramOpaqueCallbackData () {
        return parseTelegramOpaqueCallbackData;
    }
});
const TELEGRAM_NATIVE_COMMAND_CALLBACK_PREFIX = "tgcmd:";
const TELEGRAM_OPAQUE_CALLBACK_PREFIX = "tgcb1:";
function buildTelegramNativeCommandCallbackData(commandText) {
    return `${TELEGRAM_NATIVE_COMMAND_CALLBACK_PREFIX}${commandText}`;
}
function parseTelegramNativeCommandCallbackData(data) {
    if (!data) {
        return null;
    }
    const trimmed = data.trim();
    if (!trimmed.startsWith(TELEGRAM_NATIVE_COMMAND_CALLBACK_PREFIX)) {
        return null;
    }
    const commandText = trimmed.slice(TELEGRAM_NATIVE_COMMAND_CALLBACK_PREFIX.length).trim();
    return commandText.startsWith("/") ? commandText : null;
}
function buildTelegramOpaqueCallbackData(value) {
    return `${TELEGRAM_OPAQUE_CALLBACK_PREFIX}${checksumTelegramOpaqueCallbackValue(value)}:${value}`;
}
function parseTelegramOpaqueCallbackData(data) {
    if (!data) {
        return null;
    }
    if (!data.startsWith(TELEGRAM_OPAQUE_CALLBACK_PREFIX)) {
        return null;
    }
    const encoded = data.slice(TELEGRAM_OPAQUE_CALLBACK_PREFIX.length);
    const separatorIndex = encoded.indexOf(":");
    if (separatorIndex <= 0) {
        return null;
    }
    const checksum = encoded.slice(0, separatorIndex);
    const value = encoded.slice(separatorIndex + 1);
    if (!value || checksum !== checksumTelegramOpaqueCallbackValue(value)) {
        return null;
    }
    return value;
}
function checksumTelegramOpaqueCallbackValue(value) {
    let hash = 0x811c9dc5;
    for(let index = 0; index < value.length; index += 1){
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(36).slice(0, 5).padStart(5, "0");
}

//# sourceMappingURL=native-command-callback-data.js.map