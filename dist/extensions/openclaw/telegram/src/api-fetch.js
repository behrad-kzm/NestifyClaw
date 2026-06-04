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
    get fetchTelegramChatId () {
        return fetchTelegramChatId;
    },
    get lookupTelegramChatId () {
        return lookupTelegramChatId;
    },
    get resolveTelegramChatLookupFetch () {
        return resolveTelegramChatLookupFetch;
    }
});
const _fetch = require("./fetch.js");
const _proxy = require("./proxy.js");
function resolveTelegramChatLookupFetch(params) {
    const proxyUrl = params?.proxyUrl?.trim();
    const proxyFetch = proxyUrl ? (0, _proxy.makeProxyFetch)(proxyUrl) : undefined;
    return (0, _fetch.resolveTelegramFetch)(proxyFetch, {
        network: params?.network
    });
}
async function lookupTelegramChatId(params) {
    return fetchTelegramChatId({
        token: params.token,
        chatId: params.chatId,
        signal: params.signal,
        apiRoot: params.apiRoot,
        fetchImpl: resolveTelegramChatLookupFetch({
            proxyUrl: params.proxyUrl,
            network: params.network
        })
    });
}
async function fetchTelegramChatId(params) {
    const apiBase = (0, _fetch.resolveTelegramApiBase)(params.apiRoot);
    const url = `${apiBase}/bot${params.token}/getChat?chat_id=${encodeURIComponent(params.chatId)}`;
    const fetchImpl = params.fetchImpl ?? fetch;
    try {
        const res = await fetchImpl(url, params.signal ? {
            signal: params.signal
        } : undefined);
        if (!res.ok) {
            return null;
        }
        const data = await res.json().catch(()=>null);
        const id = data?.ok ? data?.result?.id : undefined;
        if (typeof id === "number" || typeof id === "string") {
            return String(id);
        }
        return null;
    } catch  {
        return null;
    }
}

//# sourceMappingURL=api-fetch.js.map