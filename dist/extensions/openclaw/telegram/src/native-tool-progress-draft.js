"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createNativeTelegramToolProgressDraft", {
    enumerable: true,
    get: function() {
        return createNativeTelegramToolProgressDraft;
    }
});
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _helpers = require("./bot/helpers.js");
const TELEGRAM_NATIVE_DRAFT_MAX_CHARS = 4096;
const TELEGRAM_DRAFT_ID_STATE_KEY = Symbol.for("openclaw.telegramNativeDraftIdState");
function resolveSendMessageDraftApi(api) {
    const sendMessageDraft = api.sendMessageDraft;
    if (typeof sendMessageDraft !== "function") {
        return undefined;
    }
    return sendMessageDraft.bind(api);
}
function allocateTelegramDraftId() {
    const globalStore = globalThis;
    const state = globalStore[TELEGRAM_DRAFT_ID_STATE_KEY] ?? {};
    const nextDraftId = Math.trunc(state.nextDraftId ?? 0) + 1;
    state.nextDraftId = nextDraftId;
    globalStore[TELEGRAM_DRAFT_ID_STATE_KEY] = state;
    return nextDraftId;
}
function normalizeDraftText(text) {
    const trimmed = text.trimEnd();
    return trimmed.length > TELEGRAM_NATIVE_DRAFT_MAX_CHARS ? trimmed.slice(0, TELEGRAM_NATIVE_DRAFT_MAX_CHARS) : trimmed;
}
function createNativeTelegramToolProgressDraft(params) {
    const sendMessageDraft = resolveSendMessageDraftApi(params.api);
    if (!sendMessageDraft) {
        return undefined;
    }
    const draftId = allocateTelegramDraftId();
    const threadParams = (0, _helpers.buildTelegramThreadParams)(params.thread) ?? {};
    let stopped = false;
    let lastSentText;
    return {
        update: async (text)=>{
            if (stopped) {
                return false;
            }
            const normalizedText = normalizeDraftText(text);
            if (!normalizedText) {
                return false;
            }
            if (normalizedText === lastSentText) {
                return true;
            }
            try {
                await sendMessageDraft(params.chatId, draftId, normalizedText, Object.keys(threadParams).length > 0 ? threadParams : undefined);
                lastSentText = normalizedText;
                return true;
            } catch (err) {
                stopped = true;
                params.log?.(`telegram native tool-progress draft disabled: ${(0, _errorruntime.formatErrorMessage)(err)}`);
                return false;
            }
        },
        stop: ()=>{
            stopped = true;
        }
    };
}

//# sourceMappingURL=native-tool-progress-draft.js.map