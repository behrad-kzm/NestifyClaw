/**
 * @kitty-real
 *
 * Real implementation of the openclaw `string-coerce-runtime` leaf utilities.
 * These are pure functions ported from openclaw's normalization-core; they are
 * on the inbound read path (used by the Telegram extension's body helpers), so
 * they must behave correctly rather than stub out.
 */ /** Reads a value only when it is already a string, preserving whitespace. */ "use strict";
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
    get isRecord () {
        return isRecord;
    },
    get normalizeLowercaseStringOrEmpty () {
        return normalizeLowercaseStringOrEmpty;
    },
    get normalizeNullableString () {
        return normalizeNullableString;
    },
    get normalizeOptionalLowercaseString () {
        return normalizeOptionalLowercaseString;
    },
    get normalizeOptionalString () {
        return normalizeOptionalString;
    },
    get normalizeStringEntries () {
        return normalizeStringEntries;
    },
    get readStringValue () {
        return readStringValue;
    },
    get uniqueStrings () {
        return uniqueStrings;
    }
});
function readStringValue(value) {
    return typeof value === 'string' ? value : undefined;
}
function normalizeNullableString(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
function normalizeOptionalString(value) {
    return normalizeNullableString(value) ?? undefined;
}
function normalizeOptionalLowercaseString(value) {
    return normalizeOptionalString(value)?.toLowerCase();
}
function normalizeLowercaseStringOrEmpty(value) {
    return normalizeOptionalLowercaseString(value) ?? '';
}
function normalizeStringEntries(list) {
    return (list ?? []).map((entry)=>normalizeOptionalString(String(entry)) ?? '').filter(Boolean);
}
function uniqueStrings(values) {
    return [
        ...new Set(values)
    ];
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//# sourceMappingURL=string-coerce-runtime.js.map