"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "auditTelegramGroupMembershipImpl", {
    enumerable: true,
    get: function() {
        return auditTelegramGroupMembershipImpl;
    }
});
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _textutilityruntime = require("../../../../common/openclaw/plugin-sdk/text-utility-runtime");
const _fetch = require("./fetch.js");
const _proxy = require("./proxy.js");
async function auditTelegramGroupMembershipImpl(params) {
    const proxyFetch = params.proxyUrl ? (0, _proxy.makeProxyFetch)(params.proxyUrl) : undefined;
    const fetcher = (0, _fetch.resolveTelegramFetch)(proxyFetch, {
        network: params.network
    });
    const apiBase = (0, _fetch.resolveTelegramApiBase)(params.apiRoot);
    const base = `${apiBase}/bot${params.token}`;
    const groups = [];
    for (const chatId of params.groupIds){
        try {
            const url = `${base}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${encodeURIComponent(String(params.botId))}`;
            const res = await (0, _textutilityruntime.fetchWithTimeout)(url, {}, params.timeoutMs, fetcher);
            const json = await res.json();
            if (!res.ok || !(0, _stringcoerceruntime.isRecord)(json) || !json.ok) {
                const desc = (0, _stringcoerceruntime.isRecord)(json) && !json.ok && typeof json.description === "string" ? json.description : `getChatMember failed (${res.status})`;
                groups.push({
                    chatId,
                    ok: false,
                    status: null,
                    error: desc,
                    matchKey: chatId,
                    matchSource: "id"
                });
                continue;
            }
            const status = (0, _stringcoerceruntime.isRecord)(json.result) && typeof json.result.status === "string" ? json.result.status : null;
            const ok = status === "creator" || status === "administrator" || status === "member";
            groups.push({
                chatId,
                ok,
                status,
                error: ok ? null : "bot not in group",
                matchKey: chatId,
                matchSource: "id"
            });
        } catch (err) {
            groups.push({
                chatId,
                ok: false,
                status: null,
                error: (0, _errorruntime.formatErrorMessage)(err),
                matchKey: chatId,
                matchSource: "id"
            });
        }
    }
    return {
        ok: groups.every((g)=>g.ok),
        checkedGroups: groups.length,
        unresolvedGroups: 0,
        hasWildcardUnmentionedGroups: false,
        groups
    };
}

//# sourceMappingURL=audit-membership-runtime.js.map