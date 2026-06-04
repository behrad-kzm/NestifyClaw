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
    get buildInlineKeyboard () {
        return _inlinekeyboard.buildInlineKeyboard;
    },
    get createForumTopicTelegram () {
        return createForumTopicTelegram;
    },
    get deleteMessageTelegram () {
        return deleteMessageTelegram;
    },
    get editForumTopicTelegram () {
        return editForumTopicTelegram;
    },
    get editMessageReplyMarkupTelegram () {
        return editMessageReplyMarkupTelegram;
    },
    get editMessageTelegram () {
        return editMessageTelegram;
    },
    get pinMessageTelegram () {
        return pinMessageTelegram;
    },
    get reactMessageTelegram () {
        return reactMessageTelegram;
    },
    get renameForumTopicTelegram () {
        return renameForumTopicTelegram;
    },
    get resetTelegramClientOptionsCacheForTests () {
        return resetTelegramClientOptionsCacheForTests;
    },
    get sendMessageTelegram () {
        return sendMessageTelegram;
    },
    get sendPollTelegram () {
        return sendPollTelegram;
    },
    get sendStickerTelegram () {
        return sendStickerTelegram;
    },
    get sendTypingTelegram () {
        return sendTypingTelegram;
    },
    get unpinMessageTelegram () {
        return unpinMessageTelegram;
    }
});
const _grammy = /*#__PURE__*/ _interop_require_wildcard(require("grammy"));
const _channelactivityruntime = require("../../../../common/openclaw/plugin-sdk/channel-activity-runtime");
const _diagnosticruntime = require("../../../../common/openclaw/plugin-sdk/diagnostic-runtime");
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _loggingcore = require("../../../../common/openclaw/plugin-sdk/logging-core");
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _retryruntime = require("../../../../common/openclaw/plugin-sdk/retry-runtime");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _ssrfruntime = require("../../../../common/openclaw/plugin-sdk/ssrf-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _accountthrottler = require("./account-throttler.js");
const _accounts = require("./accounts.js");
const _apilogging = require("./api-logging.js");
const _apiroot = require("./api-root.js");
const _helpers = require("./bot/helpers.js");
const _caption = require("./caption.js");
const _clientfetch = require("./client-fetch.js");
const _fetch = require("./fetch.js");
const _format = require("./format.js");
const _inlinekeyboard = require("./inline-keyboard.js");
const _networkerrors = require("./network-errors.js");
const _outboundmessagecontext = require("./outbound-message-context.js");
const _proxy = require("./proxy.js");
const _replyparameters = require("./reply-parameters.js");
const _sendruntime = require("./send.runtime.js");
const _sentmessagecache = require("./sent-message-cache.js");
const _targetwriteback = require("./target-writeback.js");
const _targets = require("./targets.js");
const _voice = require("./voice.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const InputFileCtor = _grammy.InputFile;
const MAX_TELEGRAM_PHOTO_DIMENSION_SUM = 10_000;
const MAX_TELEGRAM_PHOTO_ASPECT_RATIO = 20;
function resolveTelegramMessageIdOrThrow(result, context) {
    if (typeof result?.message_id === "number" && Number.isFinite(result.message_id)) {
        return Math.trunc(result.message_id);
    }
    throw new Error(`Telegram ${context} returned no message_id`);
}
function splitTelegramPlainTextChunks(text, limit) {
    if (!text) {
        return [];
    }
    const normalizedLimit = Math.max(1, Math.floor(limit));
    const chunks = [];
    for(let start = 0; start < text.length; start += normalizedLimit){
        chunks.push(text.slice(start, start + normalizedLimit));
    }
    return chunks;
}
function splitTelegramPlainTextFallback(text, chunkCount, limit) {
    if (!text) {
        return [];
    }
    const normalizedLimit = Math.max(1, Math.floor(limit));
    const fixedChunks = splitTelegramPlainTextChunks(text, normalizedLimit);
    if (chunkCount <= 1 || fixedChunks.length >= chunkCount) {
        return fixedChunks;
    }
    const chunks = [];
    let offset = 0;
    for(let index = 0; index < chunkCount; index += 1){
        const remainingChars = text.length - offset;
        const remainingChunks = chunkCount - index;
        const nextChunkLength = remainingChunks === 1 ? remainingChars : Math.min(normalizedLimit, Math.ceil(remainingChars / remainingChunks));
        chunks.push(text.slice(offset, offset + nextChunkLength));
        offset += nextChunkLength;
    }
    return chunks;
}
function logTelegramOutboundSendOk(params) {
    const parts = [
        "telegram outbound send ok",
        `accountId=${params.accountId}`,
        `chatId=${params.chatId}`,
        `messageId=${params.messageId}`,
        `operation=${params.operation}`
    ];
    if (params.deliveryKind) {
        parts.push(`deliveryKind=${params.deliveryKind}`);
    }
    if (typeof params.messageThreadId === "number") {
        parts.push(`threadId=${params.messageThreadId}`);
    }
    if (typeof params.replyToMessageId === "number") {
        parts.push(`replyToMessageId=${params.replyToMessageId}`);
    }
    if (params.silent === true) {
        parts.push("silent=true");
    }
    if (typeof params.chunkCount === "number") {
        parts.push(`chunkCount=${params.chunkCount}`);
    }
    sendLogger.info(parts.join(" "));
}
const PARSE_ERR_RE = /can't parse entities|parse entities|find end of the entity/i;
const MESSAGE_NOT_MODIFIED_RE = /400:\s*Bad Request:\s*message is not modified|MESSAGE_NOT_MODIFIED/i;
const MESSAGE_HAS_NO_TEXT_RE = /400:\s*Bad Request:\s*there is no text in the message to edit/i;
const MESSAGE_DELETE_NOOP_RE = /message to delete not found|message can't be deleted|MESSAGE_ID_INVALID|MESSAGE_DELETE_FORBIDDEN/i;
const CHAT_NOT_FOUND_RE = /400: Bad Request: chat not found/i;
const sendLogger = (0, _runtimeenv.createSubsystemLogger)("telegram/send");
const diagLogger = (0, _runtimeenv.createSubsystemLogger)("telegram/diagnostic");
const telegramClientOptionsCache = new Map();
const MAX_TELEGRAM_CLIENT_OPTIONS_CACHE_SIZE = 64;
function resetTelegramClientOptionsCacheForTests() {
    telegramClientOptionsCache.clear();
}
function createTelegramHttpLogger(cfg) {
    const enabled = (0, _diagnosticruntime.isDiagnosticFlagEnabled)("telegram.http", cfg);
    if (!enabled) {
        return ()=>{};
    }
    return (label, err)=>{
        if (!(err instanceof _grammy.HttpError)) {
            return;
        }
        const detail = (0, _loggingcore.redactSensitiveText)((0, _errorruntime.formatUncaughtError)(err.error ?? err));
        diagLogger.warn(`telegram http error (${label}): ${detail}`);
    };
}
function shouldUseTelegramClientOptionsCache() {
    return !process.env.VITEST && process.env.NODE_ENV !== "test";
}
function buildTelegramClientOptionsCacheKey(params) {
    const proxyKey = params.account.config.proxy?.trim() ?? "";
    const autoSelectFamily = params.account.config.network?.autoSelectFamily;
    const autoSelectFamilyKey = typeof autoSelectFamily === "boolean" ? String(autoSelectFamily) : "default";
    const dnsResultOrderKey = params.account.config.network?.dnsResultOrder ?? "default";
    const apiRootKey = params.account.config.apiRoot?.trim() ?? "";
    const timeoutSecondsKey = typeof params.timeoutSeconds === "number" ? String(params.timeoutSeconds) : "default";
    return `${params.account.accountId}::${proxyKey}::${autoSelectFamilyKey}::${dnsResultOrderKey}::${apiRootKey}::${timeoutSecondsKey}`;
}
function setCachedTelegramClientOptions(cacheKey, clientOptions) {
    telegramClientOptionsCache.set(cacheKey, clientOptions);
    if (telegramClientOptionsCache.size > MAX_TELEGRAM_CLIENT_OPTIONS_CACHE_SIZE) {
        const oldestKey = telegramClientOptionsCache.keys().next().value;
        if (oldestKey !== undefined) {
            telegramClientOptionsCache.delete(oldestKey);
        }
    }
    return clientOptions;
}
function resolveTelegramClientOptions(account) {
    const timeoutSeconds = typeof account.config.timeoutSeconds === "number" && Number.isFinite(account.config.timeoutSeconds) ? Math.max(1, Math.floor(account.config.timeoutSeconds)) : undefined;
    const cacheEnabled = shouldUseTelegramClientOptionsCache();
    const cacheKey = cacheEnabled ? buildTelegramClientOptionsCacheKey({
        account,
        timeoutSeconds
    }) : null;
    if (cacheKey && telegramClientOptionsCache.has(cacheKey)) {
        return telegramClientOptionsCache.get(cacheKey);
    }
    const proxyUrl = (0, _stringcoerceruntime.normalizeOptionalString)(account.config.proxy);
    const proxyFetch = proxyUrl ? (0, _proxy.makeProxyFetch)(proxyUrl) : undefined;
    const apiRoot = (0, _stringcoerceruntime.normalizeOptionalString)(account.config.apiRoot);
    const normalizedApiRoot = apiRoot ? (0, _apiroot.normalizeTelegramApiRoot)(apiRoot) : undefined;
    const transport = (0, _fetch.resolveTelegramTransport)(proxyFetch, {
        network: account.config.network
    });
    const fetchImpl = (0, _clientfetch.createTelegramClientFetch)({
        fetchImpl: (0, _clientfetch.asTelegramClientFetch)(transport.fetch),
        timeoutSeconds,
        transport
    });
    const clientOptions = fetchImpl || timeoutSeconds || normalizedApiRoot ? {
        ...fetchImpl ? {
            fetch: (0, _clientfetch.asTelegramClientFetch)(fetchImpl)
        } : {},
        ...timeoutSeconds ? {
            timeoutSeconds
        } : {},
        ...normalizedApiRoot ? {
            apiRoot: normalizedApiRoot
        } : {}
    } : undefined;
    if (cacheKey) {
        return setCachedTelegramClientOptions(cacheKey, clientOptions);
    }
    return clientOptions;
}
function resolveToken(explicit, params) {
    if (explicit?.trim()) {
        return explicit.trim();
    }
    if (!params.token) {
        throw new Error(`Telegram bot token missing for account "${params.accountId}" (set channels.telegram.accounts.${params.accountId}.botToken/tokenFile or TELEGRAM_BOT_TOKEN for default).`);
    }
    return params.token.trim();
}
async function resolveChatId(to, params) {
    const numericChatId = (0, _targets.normalizeTelegramChatId)(to);
    if (numericChatId) {
        return numericChatId;
    }
    const lookupTarget = (0, _targets.normalizeTelegramLookupTarget)(to);
    const getChat = params.api.getChat;
    if (!lookupTarget || typeof getChat !== "function") {
        throw new Error("Telegram recipient must be a numeric chat ID");
    }
    try {
        const chat = await getChat.call(params.api, lookupTarget);
        const resolved = (0, _targets.normalizeTelegramChatId)(String(chat?.id ?? ""));
        if (!resolved) {
            throw new Error(`resolved chat id is not numeric (${String(chat?.id ?? "")})`);
        }
        if (params.verbose) {
            sendLogger.warn(`telegram recipient ${lookupTarget} resolved to numeric chat id ${resolved}`);
        }
        return resolved;
    } catch (err) {
        const detail = (0, _ssrfruntime.formatErrorMessage)(err);
        throw new Error(`Telegram recipient ${lookupTarget} could not be resolved to a numeric chat ID (${detail})`, {
            cause: err
        });
    }
}
async function resolveAndPersistChatId(params) {
    const chatId = await resolveChatId(params.lookupTarget, {
        api: params.api,
        verbose: params.verbose
    });
    await (0, _targetwriteback.maybePersistResolvedTelegramTarget)({
        cfg: params.cfg,
        rawTarget: params.persistTarget,
        resolvedChatId: chatId,
        verbose: params.verbose,
        gatewayClientScopes: params.gatewayClientScopes
    });
    return chatId;
}
function normalizeMessageId(raw) {
    if (typeof raw === "number" && Number.isFinite(raw)) {
        return Math.trunc(raw);
    }
    if (typeof raw === "string") {
        const value = raw.trim();
        if (!value) {
            throw new Error("Message id is required for Telegram actions");
        }
        const parsed = (0, _numberruntime.parseStrictInteger)(value);
        if (parsed !== undefined) {
            return parsed;
        }
    }
    throw new Error("Message id is required for Telegram actions");
}
function isTelegramMessageNotModifiedError(err) {
    return MESSAGE_NOT_MODIFIED_RE.test((0, _ssrfruntime.formatErrorMessage)(err));
}
function isTelegramMessageHasNoTextError(err) {
    return MESSAGE_HAS_NO_TEXT_RE.test((0, _ssrfruntime.formatErrorMessage)(err));
}
function isTelegramMessageDeleteNoopError(err) {
    return MESSAGE_DELETE_NOOP_RE.test((0, _ssrfruntime.formatErrorMessage)(err));
}
function isTelegramHtmlParseError(err) {
    return PARSE_ERR_RE.test((0, _ssrfruntime.formatErrorMessage)(err));
}
async function withTelegramHtmlParseFallback(params) {
    try {
        return await params.requestHtml(params.label);
    } catch (err) {
        if (!isTelegramHtmlParseError(err)) {
            throw err;
        }
        if (params.verbose) {
            sendLogger.warn(`telegram ${params.label} failed with HTML parse error, retrying as plain text: ${(0, _ssrfruntime.formatErrorMessage)(err)}`);
        }
        return await params.requestPlain(`${params.label}-plain`);
    }
}
function resolveTelegramApiContext(opts) {
    const cfg = (0, _sendruntime.requireRuntimeConfig)(opts.cfg, "Telegram API context");
    const account = (0, _accounts.resolveTelegramAccount)({
        cfg,
        accountId: opts.accountId
    });
    const token = resolveToken(opts.token, account);
    const client = resolveTelegramClientOptions(account);
    let api;
    if (opts.api) {
        api = opts.api;
    } else {
        const bot = new _grammy.Bot(token, client ? {
            client
        } : undefined);
        bot.api.config.use((0, _accountthrottler.getOrCreateAccountThrottler)(token));
        api = bot.api;
    }
    return {
        cfg,
        account,
        api
    };
}
function createTelegramRequestWithDiag(params) {
    const request = (0, _retryruntime.createTelegramRetryRunner)({
        retry: params.retry,
        configRetry: params.account.config.retry,
        verbose: params.verbose,
        ...params.shouldRetry ? {
            shouldRetry: params.shouldRetry
        } : {},
        ...params.strictShouldRetry ? {
            strictShouldRetry: true
        } : {}
    });
    const logHttpError = createTelegramHttpLogger(params.cfg);
    return (fn, label, options)=>{
        const runRequest = ()=>request(fn, label);
        const call = params.useApiErrorLogging === false ? runRequest() : (0, _apilogging.withTelegramApiErrorLogging)({
            operation: label ?? "request",
            fn: runRequest,
            ...options?.shouldLog ? {
                shouldLog: options.shouldLog
            } : {}
        });
        return call.catch((err)=>{
            logHttpError(label ?? "request", err);
            throw err;
        });
    };
}
function wrapTelegramChatNotFoundError(err, params) {
    const errorMsg = (0, _ssrfruntime.formatErrorMessage)(err);
    // Check for 403 "bot is not a member" or "bot was blocked" errors
    if (/403.*(bot.*not.*member|bot.*blocked|bot.*kicked)/i.test(errorMsg)) {
        return new Error([
            `Telegram send failed: bot is not a member of the chat, was blocked, or was kicked (chat_id=${params.chatId}).`,
            `Telegram API said: ${errorMsg}.`,
            "Fix: Add the bot to the channel/group, or ensure it has not been removed/blocked/kicked by the user.",
            `Input was: ${JSON.stringify(params.input)}.`
        ].join(" "));
    }
    if (!CHAT_NOT_FOUND_RE.test(errorMsg)) {
        return err;
    }
    return new Error([
        `Telegram send failed: chat not found (chat_id=${params.chatId}).`,
        "Likely: bot not started in DM, bot removed from group/channel, group migrated (new -100… id), or wrong bot token.",
        `Input was: ${JSON.stringify(params.input)}.`
    ].join(" "));
}
function createRequestWithChatNotFound(params) {
    return async (fn, label)=>params.requestWithDiag(fn, label).catch((err)=>{
            throw wrapTelegramChatNotFoundError(err, {
                chatId: params.chatId,
                input: params.input
            });
        });
}
function createTelegramNonIdempotentRequestWithDiag(params) {
    return createTelegramRequestWithDiag({
        cfg: params.cfg,
        account: params.account,
        retry: params.retry,
        verbose: params.verbose,
        useApiErrorLogging: params.useApiErrorLogging,
        shouldRetry: (err)=>(0, _networkerrors.isSafeToRetrySendError)(err) || (0, _networkerrors.isTelegramRateLimitError)(err),
        strictShouldRetry: true
    });
}
async function sendMessageTelegram(to, text, opts) {
    const { cfg, account, api } = resolveTelegramApiContext(opts);
    const target = (0, _targets.parseTelegramTarget)(to);
    const chatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: target.chatId,
        persistTarget: to,
        verbose: opts.verbose,
        gatewayClientScopes: opts.gatewayClientScopes
    });
    const mediaUrl = opts.mediaUrl?.trim();
    const mediaMaxBytes = opts.maxBytes ?? (typeof account.config.mediaMaxMb === "number" ? account.config.mediaMaxMb : 100) * 1024 * 1024;
    const replyMarkup = (0, _inlinekeyboard.buildInlineKeyboard)(opts.buttons);
    const threadParams = (0, _replyparameters.buildTelegramThreadReplyParams)({
        thread: (0, _replyparameters.resolveTelegramSendThreadSpec)({
            targetMessageThreadId: target.messageThreadId,
            messageThreadId: opts.messageThreadId,
            chatType: target.chatType
        }),
        replyToMessageId: opts.replyToMessageId,
        replyQuoteText: opts.quoteText,
        useReplyIdAsQuoteSource: true
    });
    const hasThreadParams = Object.keys(threadParams).length > 0;
    const requestWithDiag = createTelegramNonIdempotentRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose
    });
    const requestWithChatNotFound = createRequestWithChatNotFound({
        requestWithDiag,
        chatId,
        input: to
    });
    const textMode = opts.textMode ?? "markdown";
    const tableMode = (0, _sendruntime.resolveMarkdownTableMode)({
        cfg,
        channel: "telegram",
        accountId: account.accountId
    });
    const renderHtmlText = (value)=>(0, _format.renderTelegramHtmlText)(value, {
            textMode,
            tableMode
        });
    // Resolve link preview setting from config (default: enabled).
    const linkPreviewEnabled = account.config.linkPreview ?? true;
    const linkPreviewOptions = linkPreviewEnabled ? undefined : {
        is_disabled: true
    };
    const sendTelegramTextChunk = async (chunk, params)=>{
        const baseParams = params ? {
            ...params
        } : {};
        if (linkPreviewOptions) {
            baseParams.link_preview_options = linkPreviewOptions;
        }
        const plainParams = {
            ...baseParams,
            ...opts.silent === true ? {
                disable_notification: true
            } : {}
        };
        const hasPlainParams = Object.keys(plainParams).length > 0;
        const requestPlain = (label)=>requestWithChatNotFound(()=>hasPlainParams ? api.sendMessage(chatId, chunk.plainText, plainParams) : api.sendMessage(chatId, chunk.plainText), label);
        const result = !chunk.htmlText ? await requestPlain("message") : await withTelegramHtmlParseFallback({
            label: "message",
            verbose: opts.verbose,
            requestHtml: (label)=>requestWithChatNotFound(()=>api.sendMessage(chatId, chunk.htmlText ?? chunk.plainText, {
                        parse_mode: "HTML",
                        ...plainParams
                    }), label),
            requestPlain
        });
        return {
            result,
            acceptedParams: params
        };
    };
    const buildTextParams = (isLastChunk)=>hasThreadParams || isLastChunk && replyMarkup ? {
            ...threadParams,
            ...isLastChunk && replyMarkup ? {
                reply_markup: replyMarkup
            } : {}
        } : undefined;
    const sendTelegramTextChunks = async (chunks, context)=>{
        let lastMessageId = "";
        let lastChatId = chatId;
        let lastAcceptedParams;
        let sentChunkCount = 0;
        for(let index = 0; index < chunks.length; index += 1){
            const chunk = chunks[index];
            if (!chunk) {
                continue;
            }
            const { result: res, acceptedParams } = await sendTelegramTextChunk(chunk, buildTextParams(index === chunks.length - 1));
            const messageId = resolveTelegramMessageIdOrThrow(res, context);
            (0, _sentmessagecache.recordSentMessage)(chatId, messageId, cfg);
            await (0, _outboundmessagecontext.recordOutboundMessageForPromptContext)({
                cfg,
                account,
                chatId,
                message: res,
                messageId,
                text: chunk.plainText,
                ...acceptedParams?.message_thread_id !== undefined ? {
                    messageThreadId: acceptedParams.message_thread_id
                } : {}
            });
            lastMessageId = String(messageId);
            lastChatId = String(res?.chat?.id ?? chatId);
            lastAcceptedParams = acceptedParams;
            sentChunkCount += 1;
        }
        if (lastMessageId) {
            logTelegramOutboundSendOk({
                accountId: account.accountId,
                chatId: lastChatId,
                messageId: lastMessageId,
                operation: "sendMessage",
                deliveryKind: "text",
                messageThreadId: lastAcceptedParams?.message_thread_id,
                replyToMessageId: opts.replyToMessageId,
                silent: opts.silent,
                chunkCount: sentChunkCount
            });
        }
        return {
            messageId: lastMessageId,
            chatId: lastChatId
        };
    };
    const buildChunkedTextPlan = (rawText, context)=>{
        const htmlText = renderHtmlText(rawText);
        const fallbackText = opts.plainText ?? (textMode === "html" ? (0, _format.telegramHtmlToPlainTextFallback)(htmlText) : rawText);
        let htmlChunks;
        try {
            htmlChunks = (0, _format.splitTelegramHtmlChunks)(htmlText, 4000);
        } catch (error) {
            (0, _runtimeenv.logVerbose)(`telegram ${context} failed HTML chunk planning, retrying as plain text: ${(0, _ssrfruntime.formatErrorMessage)(error)}`);
            return splitTelegramPlainTextChunks(fallbackText, 4000).map((plainText)=>({
                    plainText
                }));
        }
        const fixedPlainTextChunks = splitTelegramPlainTextChunks(fallbackText, 4000);
        if (fixedPlainTextChunks.length > htmlChunks.length) {
            (0, _runtimeenv.logVerbose)(`telegram ${context} plain-text fallback needs more chunks than HTML; sending plain text`);
            return fixedPlainTextChunks.map((plainText)=>({
                    plainText
                }));
        }
        const plainTextChunks = splitTelegramPlainTextFallback(fallbackText, htmlChunks.length, 4000);
        return htmlChunks.map((htmlTextLocal, index)=>({
                htmlText: htmlTextLocal,
                plainText: plainTextChunks[index] ?? htmlTextLocal
            }));
    };
    const sendChunkedText = async (rawText, context)=>await sendTelegramTextChunks(buildChunkedTextPlan(rawText, context), context);
    async function shouldSendTelegramImageAsPhoto(buffer) {
        try {
            const metadata = await (0, _sendruntime.getImageMetadata)(buffer);
            const width = metadata?.width;
            const height = metadata?.height;
            if (typeof width !== "number" || typeof height !== "number") {
                sendLogger.warn("Photo dimensions are unavailable. Sending as document instead.");
                return false;
            }
            const shorterSide = Math.min(width, height);
            const longerSide = Math.max(width, height);
            const isValidPhoto = width + height <= MAX_TELEGRAM_PHOTO_DIMENSION_SUM && shorterSide > 0 && longerSide <= shorterSide * MAX_TELEGRAM_PHOTO_ASPECT_RATIO;
            if (!isValidPhoto) {
                sendLogger.warn(`Photo dimensions (${width}x${height}) are not valid for Telegram photos. Sending as document instead.`);
                return false;
            }
            return true;
        } catch (err) {
            sendLogger.warn(`Failed to validate photo dimensions: ${(0, _ssrfruntime.formatErrorMessage)(err)}. Sending as document instead.`);
            return false;
        }
    }
    if (mediaUrl) {
        const media = await (0, _sendruntime.loadWebMedia)(mediaUrl, (0, _sendruntime.buildOutboundMediaLoadOptions)({
            maxBytes: mediaMaxBytes,
            mediaLocalRoots: opts.mediaLocalRoots,
            mediaReadFile: opts.mediaReadFile,
            optimizeImages: opts.forceDocument ? false : undefined
        }));
        const kind = (0, _sendruntime.kindFromMime)(media.contentType ?? undefined);
        const isGif = (0, _sendruntime.isGifMedia)({
            contentType: media.contentType,
            fileName: media.fileName
        });
        let sendImageAsPhoto = true;
        const deliveryKind = opts.forceDocument === true && (kind === "image" || kind === "video") ? "document" : kind;
        if (deliveryKind === "image" && !isGif) {
            sendImageAsPhoto = await shouldSendTelegramImageAsPhoto(media.buffer);
        }
        const isVideoNote = deliveryKind === "video" && opts.asVideoNote === true;
        const fileName = media.fileName ?? (isGif ? "animation.gif" : inferFilename(kind ?? "document")) ?? "file";
        const file = new InputFileCtor(media.buffer, fileName);
        let caption;
        let followUpText;
        if (isVideoNote) {
            caption = undefined;
            followUpText = text.trim() ? text : undefined;
        } else {
            const split = (0, _caption.splitTelegramCaption)(text);
            caption = split.caption;
            followUpText = split.followUpText;
        }
        const htmlCaption = caption ? renderHtmlText(caption) : undefined;
        // If text exceeds Telegram's caption limit, send media without caption
        // then send text as a separate follow-up message.
        const needsSeparateText = Boolean(followUpText);
        // When splitting, put reply_markup only on the follow-up text (the "main" content),
        // not on the media message.
        const baseMediaParams = {
            ...hasThreadParams ? threadParams : {},
            ...!needsSeparateText && replyMarkup ? {
                reply_markup: replyMarkup
            } : {}
        };
        const videoDimensions = deliveryKind === "video" && !isVideoNote ? await (0, _sendruntime.probeVideoDimensions)(media.buffer) : undefined;
        const mediaParams = {
            ...htmlCaption ? {
                caption: htmlCaption,
                parse_mode: "HTML"
            } : {},
            ...baseMediaParams,
            ...opts.silent === true ? {
                disable_notification: true
            } : {},
            ...videoDimensions ? {
                width: videoDimensions.width,
                height: videoDimensions.height
            } : {}
        };
        const sendMedia = async (label, sender)=>await requestWithChatNotFound(()=>sender(mediaParams), label);
        const mediaSender = (()=>{
            if (isGif && deliveryKind !== "document") {
                return {
                    label: "animation",
                    sender: (effectiveParams)=>api.sendAnimation(chatId, file, effectiveParams)
                };
            }
            if (deliveryKind === "image" && !isGif && sendImageAsPhoto) {
                return {
                    label: "photo",
                    sender: (effectiveParams)=>api.sendPhoto(chatId, file, effectiveParams)
                };
            }
            if (deliveryKind === "video") {
                if (isVideoNote) {
                    return {
                        label: "video_note",
                        sender: (effectiveParams)=>api.sendVideoNote(chatId, file, effectiveParams)
                    };
                }
                return {
                    label: "video",
                    sender: (effectiveParams)=>api.sendVideo(chatId, file, effectiveParams)
                };
            }
            if (kind === "audio") {
                const { useVoice } = (0, _voice.resolveTelegramVoiceSend)({
                    wantsVoice: opts.asVoice === true,
                    contentType: media.contentType,
                    fileName,
                    logFallback: _runtimeenv.logVerbose
                });
                if (useVoice) {
                    return {
                        label: "voice",
                        sender: (effectiveParams)=>api.sendVoice(chatId, file, effectiveParams)
                    };
                }
                return {
                    label: "audio",
                    sender: (effectiveParams)=>api.sendAudio(chatId, file, effectiveParams)
                };
            }
            return {
                label: "document",
                sender: (effectiveParams)=>api.sendDocument(chatId, file, opts.forceDocument ? {
                        ...effectiveParams,
                        disable_content_type_detection: true
                    } : effectiveParams)
            };
        })();
        const result = await sendMedia(mediaSender.label, mediaSender.sender);
        const mediaMessageId = resolveTelegramMessageIdOrThrow(result, "media send");
        const resolvedChatId = String(result?.chat?.id ?? chatId);
        (0, _sentmessagecache.recordSentMessage)(chatId, mediaMessageId, cfg);
        await (0, _outboundmessagecontext.recordOutboundMessageForPromptContext)({
            cfg,
            account,
            chatId,
            message: result,
            messageId: mediaMessageId,
            ...caption ? {
                text: caption
            } : {},
            ...mediaParams.message_thread_id !== undefined ? {
                messageThreadId: mediaParams.message_thread_id
            } : {}
        });
        logTelegramOutboundSendOk({
            accountId: account.accountId,
            chatId: resolvedChatId,
            messageId: String(mediaMessageId),
            operation: `send${mediaSender.label.split("_").map((part)=>part.charAt(0).toUpperCase() + part.slice(1)).join("")}`,
            deliveryKind: mediaSender.label,
            messageThreadId: mediaParams.message_thread_id,
            replyToMessageId: opts.replyToMessageId,
            silent: opts.silent
        });
        (0, _channelactivityruntime.recordChannelActivity)({
            channel: "telegram",
            accountId: account.accountId,
            direction: "outbound"
        });
        // If text was too long for a caption, send it as a separate follow-up message.
        // Use HTML conversion so markdown renders like captions.
        if (needsSeparateText && followUpText) {
            const textResult = await sendChunkedText(followUpText, "text follow-up send");
            return {
                messageId: textResult.messageId,
                chatId: resolvedChatId
            };
        }
        return {
            messageId: String(mediaMessageId),
            chatId: resolvedChatId
        };
    }
    if (!text || !text.trim()) {
        throw new Error("Message must be non-empty for Telegram sends");
    }
    const textResult = await sendChunkedText(text, "text send");
    (0, _channelactivityruntime.recordChannelActivity)({
        channel: "telegram",
        accountId: account.accountId,
        direction: "outbound"
    });
    return textResult;
}
async function sendTypingTelegram(to, opts) {
    const { cfg, account, api } = resolveTelegramApiContext(opts);
    const target = (0, _targets.parseTelegramTarget)(to);
    const chatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: target.chatId,
        persistTarget: to,
        verbose: opts.verbose
    });
    const requestWithDiag = createTelegramRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose,
        shouldRetry: (err)=>(0, _networkerrors.isRecoverableTelegramNetworkError)(err, {
                context: "send"
            })
    });
    const threadParams = (0, _helpers.buildTypingThreadParams)(target.messageThreadId ?? opts.messageThreadId);
    await requestWithDiag(()=>api.sendChatAction(chatId, "typing", threadParams), "typing");
    return {
        ok: true
    };
}
async function reactMessageTelegram(chatIdInput, messageIdInput, emoji, opts) {
    const { cfg, account, api } = resolveTelegramApiContext(opts);
    const rawTarget = String(chatIdInput);
    const chatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: rawTarget,
        persistTarget: rawTarget,
        verbose: opts.verbose,
        gatewayClientScopes: opts.gatewayClientScopes
    });
    const messageId = normalizeMessageId(messageIdInput);
    const requestWithDiag = createTelegramRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose,
        shouldRetry: (err)=>(0, _networkerrors.isRecoverableTelegramNetworkError)(err, {
                context: "send"
            })
    });
    const remove = opts.remove === true;
    const trimmedEmoji = emoji.trim();
    // Build the reaction array. We cast emoji to the grammY union type since
    // Telegram validates emoji server-side; invalid emojis fail gracefully.
    const reactions = remove || !trimmedEmoji ? [] : [
        {
            type: "emoji",
            emoji: trimmedEmoji
        }
    ];
    if (typeof api.setMessageReaction !== "function") {
        throw new Error("Telegram reactions are unavailable in this bot API.");
    }
    try {
        await requestWithDiag(()=>api.setMessageReaction(chatId, messageId, reactions), "reaction");
    } catch (err) {
        const msg = (0, _ssrfruntime.formatErrorMessage)(err);
        if (/REACTION_INVALID/i.test(msg)) {
            return {
                ok: false,
                warning: `Reaction unavailable: ${trimmedEmoji}`
            };
        }
        throw err;
    }
    return {
        ok: true
    };
}
async function deleteMessageTelegram(chatIdInput, messageIdInput, opts) {
    const { cfg, account, api } = resolveTelegramApiContext(opts);
    const rawTarget = String(chatIdInput);
    const chatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: rawTarget,
        persistTarget: rawTarget,
        verbose: opts.verbose,
        gatewayClientScopes: opts.gatewayClientScopes
    });
    const messageId = normalizeMessageId(messageIdInput);
    const requestWithDiag = createTelegramRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose,
        shouldRetry: (err)=>(0, _networkerrors.isRecoverableTelegramNetworkError)(err, {
                context: "send"
            })
    });
    try {
        await requestWithDiag(()=>api.deleteMessage(chatId, messageId), "deleteMessage", {
            shouldLog: (err)=>!isTelegramMessageDeleteNoopError(err)
        });
    } catch (err) {
        if (!isTelegramMessageDeleteNoopError(err)) {
            throw err;
        }
        const detail = (0, _ssrfruntime.formatErrorMessage)(err);
        (0, _runtimeenv.logVerbose)(`[telegram] Delete skipped for message ${messageId} in chat ${chatId}: ${detail}`);
        return {
            ok: false,
            warning: `Message ${messageId} was not deleted: ${detail}`
        };
    }
    (0, _runtimeenv.logVerbose)(`[telegram] Deleted message ${messageId} from chat ${chatId}`);
    return {
        ok: true
    };
}
async function pinMessageTelegram(chatIdInput, messageIdInput, opts) {
    const { cfg, account, api } = resolveTelegramApiContext(opts);
    const rawTarget = String(chatIdInput);
    const chatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: rawTarget,
        persistTarget: rawTarget,
        verbose: opts.verbose,
        gatewayClientScopes: opts.gatewayClientScopes
    });
    const messageId = normalizeMessageId(messageIdInput);
    const requestWithDiag = createTelegramRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose
    });
    await requestWithDiag(()=>api.pinChatMessage(chatId, messageId, {
            disable_notification: opts.notify !== true
        }), "pinChatMessage");
    (0, _runtimeenv.logVerbose)(`[telegram] Pinned message ${messageId} in chat ${chatId}`);
    return {
        ok: true,
        messageId: String(messageId),
        chatId
    };
}
async function unpinMessageTelegram(chatIdInput, messageIdInput, opts) {
    const { cfg, account, api } = resolveTelegramApiContext(opts);
    const rawTarget = String(chatIdInput);
    const chatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: rawTarget,
        persistTarget: rawTarget,
        verbose: opts.verbose,
        gatewayClientScopes: opts.gatewayClientScopes
    });
    const messageId = messageIdInput === undefined ? undefined : normalizeMessageId(messageIdInput);
    const requestWithDiag = createTelegramRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose
    });
    await requestWithDiag(()=>api.unpinChatMessage(chatId, messageId), "unpinChatMessage");
    (0, _runtimeenv.logVerbose)(`[telegram] Unpinned ${messageId != null ? `message ${messageId}` : "active message"} in chat ${chatId}`);
    return {
        ok: true,
        chatId,
        ...messageId != null ? {
            messageId: String(messageId)
        } : {}
    };
}
async function editForumTopicTelegram(chatIdInput, messageThreadIdInput, opts) {
    const nameProvided = opts.name !== undefined;
    const trimmedName = opts.name?.trim();
    if (nameProvided && !trimmedName) {
        throw new Error("Telegram forum topic name is required");
    }
    if (trimmedName && trimmedName.length > 128) {
        throw new Error("Telegram forum topic name must be 128 characters or fewer");
    }
    const iconProvided = opts.iconCustomEmojiId !== undefined;
    const trimmedIconCustomEmojiId = opts.iconCustomEmojiId?.trim();
    if (iconProvided && !trimmedIconCustomEmojiId) {
        throw new Error("Telegram forum topic icon custom emoji ID is required");
    }
    if (!trimmedName && !trimmedIconCustomEmojiId) {
        throw new Error("Telegram forum topic update requires a name or iconCustomEmojiId");
    }
    const { cfg, account, api } = resolveTelegramApiContext(opts);
    const rawTarget = String(chatIdInput);
    const target = (0, _targets.parseTelegramTarget)(rawTarget);
    const chatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: target.chatId,
        persistTarget: rawTarget,
        verbose: opts.verbose,
        gatewayClientScopes: opts.gatewayClientScopes
    });
    const messageThreadId = normalizeMessageId(messageThreadIdInput);
    const requestWithDiag = createTelegramRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose
    });
    const payload = {
        ...trimmedName ? {
            name: trimmedName
        } : {},
        ...trimmedIconCustomEmojiId ? {
            icon_custom_emoji_id: trimmedIconCustomEmojiId
        } : {}
    };
    await requestWithDiag(()=>api.editForumTopic(chatId, messageThreadId, payload), "editForumTopic");
    (0, _runtimeenv.logVerbose)(`[telegram] Edited forum topic ${messageThreadId} in chat ${chatId}`);
    return {
        ok: true,
        chatId,
        messageThreadId,
        ...trimmedName ? {
            name: trimmedName
        } : {},
        ...trimmedIconCustomEmojiId ? {
            iconCustomEmojiId: trimmedIconCustomEmojiId
        } : {}
    };
}
async function renameForumTopicTelegram(chatIdInput, messageThreadIdInput, name, opts) {
    const result = await editForumTopicTelegram(chatIdInput, messageThreadIdInput, {
        ...opts,
        name
    });
    return {
        ok: true,
        chatId: result.chatId,
        messageThreadId: result.messageThreadId,
        name: result.name ?? name.trim()
    };
}
async function editMessageReplyMarkupTelegram(chatIdInput, messageIdInput, buttons, opts) {
    const { cfg, account, api } = resolveTelegramApiContext({
        ...opts,
        cfg: opts.cfg
    });
    const rawTarget = String(chatIdInput);
    const chatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: rawTarget,
        persistTarget: rawTarget,
        verbose: opts.verbose,
        gatewayClientScopes: opts.gatewayClientScopes
    });
    const messageId = normalizeMessageId(messageIdInput);
    const requestWithDiag = createTelegramRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose
    });
    const replyMarkup = (0, _inlinekeyboard.buildInlineKeyboard)(buttons) ?? {
        inline_keyboard: []
    };
    try {
        await requestWithDiag(()=>api.editMessageReplyMarkup(chatId, messageId, {
                reply_markup: replyMarkup
            }), "editMessageReplyMarkup", {
            shouldLog: (err)=>!isTelegramMessageNotModifiedError(err)
        });
    } catch (err) {
        if (!isTelegramMessageNotModifiedError(err)) {
            throw err;
        }
    }
    (0, _runtimeenv.logVerbose)(`[telegram] Edited reply markup for message ${messageId} in chat ${chatId}`);
    return {
        ok: true,
        messageId: String(messageId),
        chatId
    };
}
async function editMessageTelegram(chatIdInput, messageIdInput, text, opts) {
    const { cfg, account, api } = resolveTelegramApiContext({
        ...opts,
        cfg: opts.cfg
    });
    const rawTarget = String(chatIdInput);
    const chatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: rawTarget,
        persistTarget: rawTarget,
        verbose: opts.verbose,
        gatewayClientScopes: opts.gatewayClientScopes
    });
    const messageId = normalizeMessageId(messageIdInput);
    const requestWithDiag = createTelegramRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose,
        shouldRetry: (err)=>(0, _networkerrors.isRecoverableTelegramNetworkError)(err, {
                allowMessageMatch: true
            }) || (0, _networkerrors.isTelegramServerError)(err)
    });
    const requestWithEditShouldLog = (fn, label, shouldLog)=>requestWithDiag(fn, label, shouldLog ? {
            shouldLog
        } : undefined);
    const textMode = opts.textMode ?? "markdown";
    const tableMode = (0, _sendruntime.resolveMarkdownTableMode)({
        cfg,
        channel: "telegram",
        accountId: account.accountId
    });
    const htmlText = (0, _format.renderTelegramHtmlText)(text, {
        textMode,
        tableMode
    });
    const plainText = textMode === "html" ? (0, _format.telegramHtmlToPlainTextFallback)(htmlText) : text;
    // Reply markup semantics:
    // - buttons === undefined → don't send reply_markup (keep existing)
    // - buttons is [] (or filters to empty) → send { inline_keyboard: [] } (remove)
    // - otherwise → send built inline keyboard
    const shouldTouchButtons = opts.buttons !== undefined;
    const builtKeyboard = shouldTouchButtons ? (0, _inlinekeyboard.buildInlineKeyboard)(opts.buttons) : undefined;
    const replyMarkup = shouldTouchButtons ? builtKeyboard ?? {
        inline_keyboard: []
    } : undefined;
    const textEditParams = {
        parse_mode: "HTML"
    };
    if (opts.linkPreview === false) {
        textEditParams.link_preview_options = {
            is_disabled: true
        };
    }
    if (replyMarkup !== undefined) {
        textEditParams.reply_markup = replyMarkup;
    }
    const plainTextParams = {};
    if (opts.linkPreview === false) {
        plainTextParams.link_preview_options = {
            is_disabled: true
        };
    }
    if (replyMarkup !== undefined) {
        plainTextParams.reply_markup = replyMarkup;
    }
    const captionEditParams = {
        caption: htmlText,
        parse_mode: "HTML"
    };
    if (replyMarkup !== undefined) {
        captionEditParams.reply_markup = replyMarkup;
    }
    const plainCaptionParams = {
        caption: plainText
    };
    if (replyMarkup !== undefined) {
        plainCaptionParams.reply_markup = replyMarkup;
    }
    const performTextEdit = ()=>withTelegramHtmlParseFallback({
            label: "editMessage",
            verbose: opts.verbose,
            requestHtml: (retryLabel)=>requestWithEditShouldLog(()=>api.editMessageText(chatId, messageId, htmlText, textEditParams), retryLabel, (err)=>!isTelegramMessageNotModifiedError(err)),
            requestPlain: (retryLabel)=>requestWithEditShouldLog(()=>Object.keys(plainTextParams).length > 0 ? api.editMessageText(chatId, messageId, plainText, plainTextParams) : api.editMessageText(chatId, messageId, plainText), retryLabel, (plainErr)=>!isTelegramMessageNotModifiedError(plainErr))
        });
    const performCaptionEdit = ()=>withTelegramHtmlParseFallback({
            label: "editMessageCaption",
            verbose: opts.verbose,
            requestHtml: (retryLabel)=>requestWithEditShouldLog(()=>api.editMessageCaption(chatId, messageId, captionEditParams), retryLabel, (err)=>!isTelegramMessageNotModifiedError(err)),
            requestPlain: (retryLabel)=>requestWithEditShouldLog(()=>api.editMessageCaption(chatId, messageId, plainCaptionParams), retryLabel, (plainErr)=>!isTelegramMessageNotModifiedError(plainErr))
        });
    try {
        const editMode = opts.editMode ?? "text";
        if (editMode === "caption") {
            await performCaptionEdit();
        } else {
            try {
                await performTextEdit();
            } catch (err) {
                if (editMode === "auto" && isTelegramMessageHasNoTextError(err)) {
                    await performCaptionEdit();
                } else {
                    throw err;
                }
            }
        }
    } catch (err) {
        if (isTelegramMessageNotModifiedError(err)) {
        // no-op: Telegram reports message content unchanged, treat as success
        } else {
            throw err;
        }
    }
    (0, _runtimeenv.logVerbose)(`[telegram] Edited message ${messageId} in chat ${chatId}`);
    return {
        ok: true,
        messageId: String(messageId),
        chatId
    };
}
function inferFilename(kind) {
    switch(kind){
        case "image":
            return "image.jpg";
        case "video":
            return "video.mp4";
        case "audio":
            return "audio.ogg";
        default:
            return "file.bin";
    }
}
async function sendStickerTelegram(to, fileId, opts) {
    if (!fileId?.trim()) {
        throw new Error("Telegram sticker file_id is required");
    }
    const { cfg, account, api } = resolveTelegramApiContext(opts);
    const target = (0, _targets.parseTelegramTarget)(to);
    const chatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: target.chatId,
        persistTarget: to,
        verbose: opts.verbose,
        gatewayClientScopes: opts.gatewayClientScopes
    });
    const threadParams = (0, _replyparameters.buildTelegramThreadReplyParams)({
        thread: (0, _replyparameters.resolveTelegramSendThreadSpec)({
            targetMessageThreadId: target.messageThreadId,
            messageThreadId: opts.messageThreadId,
            chatType: target.chatType
        }),
        replyToMessageId: opts.replyToMessageId
    });
    const hasThreadParams = Object.keys(threadParams).length > 0;
    const requestWithDiag = createTelegramNonIdempotentRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose,
        useApiErrorLogging: false
    });
    const requestWithChatNotFound = createRequestWithChatNotFound({
        requestWithDiag,
        chatId,
        input: to
    });
    const stickerParams = hasThreadParams ? threadParams : undefined;
    const result = await requestWithChatNotFound(()=>api.sendSticker(chatId, fileId.trim(), stickerParams), "sticker");
    const messageId = resolveTelegramMessageIdOrThrow(result, "sticker send");
    const resolvedChatId = String(result?.chat?.id ?? chatId);
    (0, _sentmessagecache.recordSentMessage)(chatId, messageId, opts.cfg);
    (0, _channelactivityruntime.recordChannelActivity)({
        channel: "telegram",
        accountId: account.accountId,
        direction: "outbound"
    });
    return {
        messageId: String(messageId),
        chatId: resolvedChatId
    };
}
async function sendPollTelegram(to, poll, opts) {
    const { cfg, account, api } = resolveTelegramApiContext(opts);
    const target = (0, _targets.parseTelegramTarget)(to);
    const chatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: target.chatId,
        persistTarget: to,
        verbose: opts.verbose,
        gatewayClientScopes: opts.gatewayClientScopes
    });
    // Normalize the poll input (validates question, options, maxSelections)
    const normalizedPoll = (0, _sendruntime.normalizePollInput)(poll, {
        maxOptions: 10
    });
    const threadParams = (0, _replyparameters.buildTelegramThreadReplyParams)({
        thread: (0, _replyparameters.resolveTelegramSendThreadSpec)({
            targetMessageThreadId: target.messageThreadId,
            messageThreadId: opts.messageThreadId,
            chatType: target.chatType
        }),
        replyToMessageId: opts.replyToMessageId
    });
    // Build poll options as simple strings (Grammy accepts string[] or InputPollOption[])
    const pollOptions = normalizedPoll.options;
    const requestWithDiag = createTelegramNonIdempotentRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose
    });
    const requestWithChatNotFound = createRequestWithChatNotFound({
        requestWithDiag,
        chatId,
        input: to
    });
    const durationSeconds = normalizedPoll.durationSeconds;
    if (durationSeconds === undefined && normalizedPoll.durationHours !== undefined) {
        throw new Error("Telegram poll durationHours is not supported. Use durationSeconds (5-600) instead.");
    }
    if (durationSeconds !== undefined && (durationSeconds < 5 || durationSeconds > 600)) {
        throw new Error("Telegram poll durationSeconds must be between 5 and 600");
    }
    // Build poll parameters following Grammy's api.sendPoll signature
    // sendPoll(chat_id, question, options, other?, signal?)
    const pollParams = {
        allows_multiple_answers: normalizedPoll.maxSelections > 1,
        is_anonymous: opts.isAnonymous ?? true,
        ...durationSeconds !== undefined ? {
            open_period: durationSeconds
        } : {},
        ...Object.keys(threadParams).length > 0 ? threadParams : {},
        ...opts.silent === true ? {
            disable_notification: true
        } : {}
    };
    const result = await requestWithChatNotFound(()=>api.sendPoll(chatId, normalizedPoll.question, pollOptions, pollParams), "poll");
    const messageId = resolveTelegramMessageIdOrThrow(result, "poll send");
    const resolvedChatId = String(result?.chat?.id ?? chatId);
    const pollId = result?.poll?.id;
    (0, _sentmessagecache.recordSentMessage)(chatId, messageId, opts.cfg);
    (0, _channelactivityruntime.recordChannelActivity)({
        channel: "telegram",
        accountId: account.accountId,
        direction: "outbound"
    });
    return {
        messageId: String(messageId),
        chatId: resolvedChatId,
        pollId
    };
}
async function createForumTopicTelegram(chatId, name, opts) {
    if (!name?.trim()) {
        throw new Error("Forum topic name is required");
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 128) {
        throw new Error("Forum topic name must be 128 characters or fewer");
    }
    const { cfg, account, api } = resolveTelegramApiContext(opts);
    // Accept topic-qualified targets (e.g. telegram:group:<id>:topic:<thread>)
    // but createForumTopic must always target the base supergroup chat id.
    const target = (0, _targets.parseTelegramTarget)(chatId);
    const normalizedChatId = await resolveAndPersistChatId({
        cfg,
        api,
        lookupTarget: target.chatId,
        persistTarget: chatId,
        verbose: opts.verbose,
        gatewayClientScopes: opts.gatewayClientScopes
    });
    const requestWithDiag = createTelegramNonIdempotentRequestWithDiag({
        cfg,
        account,
        retry: opts.retry,
        verbose: opts.verbose
    });
    const extra = {};
    if (opts.iconColor != null) {
        extra.icon_color = opts.iconColor;
    }
    if (opts.iconCustomEmojiId?.trim()) {
        extra.icon_custom_emoji_id = opts.iconCustomEmojiId.trim();
    }
    const hasExtra = Object.keys(extra).length > 0;
    const result = await requestWithDiag(()=>api.createForumTopic(normalizedChatId, trimmedName, hasExtra ? extra : undefined), "createForumTopic");
    const topicId = result.message_thread_id;
    (0, _channelactivityruntime.recordChannelActivity)({
        channel: "telegram",
        accountId: account.accountId,
        direction: "outbound"
    });
    return {
        topicId,
        name: result.name ?? trimmedName,
        chatId: normalizedChatId
    };
}

//# sourceMappingURL=send.js.map