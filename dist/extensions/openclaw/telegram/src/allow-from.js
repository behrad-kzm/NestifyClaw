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
    get isNumericTelegramSenderUserId () {
        return isNumericTelegramSenderUserId;
    },
    get isNumericTelegramUserId () {
        return isNumericTelegramUserId;
    },
    get normalizeTelegramAllowFromEntry () {
        return normalizeTelegramAllowFromEntry;
    }
});
function normalizeTelegramAllowFromEntry(raw) {
    const base = typeof raw === "string" ? raw : typeof raw === "number" ? String(raw) : "";
    return base.trim().replace(/^(telegram|tg):/i, "").trim();
}
function isNumericTelegramUserId(raw) {
    return /^-?\d+$/.test(raw);
}
function isNumericTelegramSenderUserId(raw) {
    return /^\d+$/.test(raw);
}

//# sourceMappingURL=allow-from.js.map