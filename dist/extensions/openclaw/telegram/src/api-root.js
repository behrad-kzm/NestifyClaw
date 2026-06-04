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
    get DEFAULT_TELEGRAM_API_ROOT () {
        return DEFAULT_TELEGRAM_API_ROOT;
    },
    get hasTelegramBotEndpointApiRoot () {
        return hasTelegramBotEndpointApiRoot;
    },
    get normalizeTelegramApiRoot () {
        return normalizeTelegramApiRoot;
    }
});
const DEFAULT_TELEGRAM_API_ROOT = "https://api.telegram.org";
const TELEGRAM_BOT_ENDPOINT_SEGMENT_RE = /^bot\d+:[^/]+$/u;
function isTelegramBotEndpointSegment(segment) {
    try {
        return TELEGRAM_BOT_ENDPOINT_SEGMENT_RE.test(decodeURIComponent(segment));
    } catch  {
        return TELEGRAM_BOT_ENDPOINT_SEGMENT_RE.test(segment);
    }
}
function normalizeTelegramApiRoot(apiRoot) {
    const trimmed = apiRoot?.trim();
    if (!trimmed) {
        return DEFAULT_TELEGRAM_API_ROOT;
    }
    let normalized = trimmed.replace(/\/+$/u, "");
    try {
        const url = new URL(normalized);
        const segments = url.pathname.split("/").filter(Boolean);
        if (segments.length > 0 && isTelegramBotEndpointSegment(segments[segments.length - 1] ?? "")) {
            segments.pop();
            url.pathname = segments.length > 0 ? `/${segments.join("/")}` : "/";
            url.search = "";
            url.hash = "";
            normalized = url.toString().replace(/\/+$/u, "");
        }
    } catch  {
    // Config validation catches invalid URLs; keep legacy runtime behavior for
    // callers that reached this helper with unchecked input.
    }
    return normalized;
}
function hasTelegramBotEndpointApiRoot(apiRoot) {
    if (typeof apiRoot !== "string" || !apiRoot.trim()) {
        return false;
    }
    try {
        const url = new URL(apiRoot.trim());
        const segments = url.pathname.split("/").filter(Boolean);
        const last = segments[segments.length - 1];
        return Boolean(last && isTelegramBotEndpointSegment(last));
    } catch  {
        return false;
    }
}

//# sourceMappingURL=api-root.js.map