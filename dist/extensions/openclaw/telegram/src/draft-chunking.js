"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramDraftStreamingChunking", {
    enumerable: true,
    get: function() {
        return resolveTelegramDraftStreamingChunking;
    }
});
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _replychunking = require("../../../../common/openclaw/plugin-sdk/reply-chunking");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _outboundadapter = require("./outbound-adapter.js");
const DEFAULT_TELEGRAM_DRAFT_STREAM_MIN = 200;
const DEFAULT_TELEGRAM_DRAFT_STREAM_MAX = 800;
function resolveTelegramDraftStreamingChunking(cfg, accountId) {
    const textLimit = (0, _replychunking.resolveTextChunkLimit)(cfg, "telegram", accountId, {
        fallbackLimit: _outboundadapter.TELEGRAM_TEXT_CHUNK_LIMIT
    });
    const normalizedAccountId = (0, _routing.normalizeAccountId)(accountId);
    const accountCfg = (0, _routing.resolveAccountEntry)(cfg?.channels?.telegram?.accounts, normalizedAccountId);
    const draftCfg = (0, _channeloutbound.resolveChannelStreamingPreviewChunk)(accountCfg) ?? (0, _channeloutbound.resolveChannelStreamingPreviewChunk)(cfg?.channels?.telegram);
    const maxRequested = Math.max(1, Math.floor(draftCfg?.maxChars ?? DEFAULT_TELEGRAM_DRAFT_STREAM_MAX));
    const maxChars = Math.max(1, Math.min(maxRequested, textLimit));
    const minRequested = Math.max(1, Math.floor(draftCfg?.minChars ?? DEFAULT_TELEGRAM_DRAFT_STREAM_MIN));
    const minChars = Math.min(minRequested, maxChars);
    const breakPreference = draftCfg?.breakPreference === "newline" || draftCfg?.breakPreference === "sentence" ? draftCfg.breakPreference : "paragraph";
    return {
        minChars,
        maxChars,
        breakPreference
    };
}

//# sourceMappingURL=draft-chunking.js.map