"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveMedia", {
    enumerable: true,
    get: function() {
        return resolveMedia;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _grammy = require("grammy");
const _fileaccessruntime = require("../../../../../common/openclaw/plugin-sdk/file-access-runtime");
const _stickercache = require("../sticker-cache.js");
const _deliveryresolvemediaruntime = require("./delivery.resolve-media.runtime.js");
const _helpers = require("./helpers.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const FILE_TOO_BIG_RE = /file is too big/i;
const GrammyErrorCtor = typeof _grammy.GrammyError === "function" ? _grammy.GrammyError : undefined;
function buildTelegramMediaSsrfPolicy(apiRoot, dangerouslyAllowPrivateNetwork) {
    const hostnames = [
        "api.telegram.org"
    ];
    let allowedHostnames;
    if (apiRoot) {
        try {
            const customHost = new URL(apiRoot).hostname;
            if (customHost && !hostnames.includes(customHost)) {
                hostnames.push(customHost);
                // A configured custom Bot API host is an explicit operator override and
                // may legitimately live on a private network (for example, self-hosted
                // Bot API or an internal reverse proxy). Keep that host reachable while
                // still enforcing resolved-IP checks for the default public host.
                allowedHostnames = [
                    customHost
                ];
            }
        } catch (err) {
            (0, _deliveryresolvemediaruntime.logVerbose)(`telegram: invalid apiRoot URL "${apiRoot}": ${String(err)}`);
        }
    }
    return {
        // Restrict media downloads to the configured Telegram API hosts while still
        // enforcing SSRF checks on the resolved and redirected targets.
        hostnameAllowlist: hostnames,
        ...allowedHostnames ? {
            allowedHostnames
        } : {},
        ...dangerouslyAllowPrivateNetwork ? {
            allowPrivateNetwork: true
        } : {},
        allowRfc2544BenchmarkRange: true
    };
}
/**
 * Returns true if the error is Telegram's "file is too big" error.
 * This happens when trying to download files >20MB via the Bot API.
 * Unlike network errors, this is a permanent error and should not be retried.
 */ function isFileTooBigError(err) {
    if (GrammyErrorCtor && err instanceof GrammyErrorCtor) {
        return FILE_TOO_BIG_RE.test(err.description);
    }
    return FILE_TOO_BIG_RE.test((0, _deliveryresolvemediaruntime.formatErrorMessage)(err));
}
/**
 * Returns true if the error is a transient network error that should be retried.
 * Returns false for permanent errors like "file is too big" (400 Bad Request).
 */ function isRetryableGetFileError(err) {
    // Don't retry "file is too big" - it's a permanent 400 error
    if (isFileTooBigError(err)) {
        return false;
    }
    // Retry all other errors (network issues, timeouts, etc.)
    return true;
}
function resolveMediaMetadata(msg) {
    return {
        fileRef: msg.photo?.[msg.photo.length - 1] ?? msg.video ?? msg.video_note ?? msg.document ?? msg.audio ?? msg.voice,
        fileName: msg.document?.file_name ?? msg.audio?.file_name ?? msg.video?.file_name ?? msg.animation?.file_name,
        mimeType: msg.audio?.mime_type ?? msg.voice?.mime_type ?? msg.video?.mime_type ?? msg.document?.mime_type ?? msg.animation?.mime_type
    };
}
async function resolveTelegramFileWithRetry(ctx) {
    try {
        return await (0, _deliveryresolvemediaruntime.retryAsync)(()=>ctx.getFile(), {
            attempts: 3,
            minDelayMs: 1000,
            maxDelayMs: 4000,
            jitter: 0.2,
            label: "telegram:getFile",
            shouldRetry: isRetryableGetFileError,
            onRetry: ({ attempt, maxAttempts })=>(0, _deliveryresolvemediaruntime.logVerbose)(`telegram: getFile retry ${attempt}/${maxAttempts}`)
        });
    } catch (err) {
        // Handle "file is too big" separately - Telegram Bot API has a 20MB download limit
        if (isFileTooBigError(err)) {
            (0, _deliveryresolvemediaruntime.logVerbose)((0, _deliveryresolvemediaruntime.warn)("telegram: getFile failed - file exceeds Telegram Bot API 20MB limit; skipping attachment"));
            return null;
        }
        // All retries exhausted — return null so the message still reaches the agent
        // with a type-based placeholder (e.g. <media:audio>) instead of being dropped.
        (0, _deliveryresolvemediaruntime.logVerbose)(`telegram: getFile failed after retries: ${String(err)}`);
        return null;
    }
}
function resolveRequiredTelegramTransport(transport) {
    if (transport) {
        return transport;
    }
    const resolvedFetch = globalThis.fetch;
    if (!resolvedFetch) {
        throw new Error("fetch is not available; set channels.telegram.proxy in config");
    }
    return {
        fetch: resolvedFetch,
        sourceFetch: resolvedFetch,
        // Caller-owned transport constructed from the globalThis fetch — it owns
        // no dispatcher lifecycle of its own, so close() is a no-op.
        close: async ()=>{}
    };
}
/** Default idle timeout for Telegram media downloads (30 seconds). */ const TELEGRAM_DOWNLOAD_IDLE_TIMEOUT_MS = 30_000;
function usesTrustedTelegramExplicitProxy(transport) {
    return transport.dispatcherAttempts?.some((attempt)=>attempt.dispatcherPolicy?.mode === "explicit-proxy") ?? false;
}
function resolveTrustedLocalTelegramRoot(filePath, trustedLocalFileRoots) {
    if (!_nodepath.default.isAbsolute(filePath)) {
        return null;
    }
    for (const rootDir of trustedLocalFileRoots ?? []){
        const relativePath = _nodepath.default.relative(rootDir, filePath);
        if (relativePath === "" || relativePath === ".." || relativePath.startsWith(`..${_nodepath.default.sep}`) || _nodepath.default.isAbsolute(relativePath)) {
            continue;
        }
        return {
            rootDir,
            relativePath
        };
    }
    return null;
}
async function downloadAndSaveTelegramFile(params) {
    const trustedLocalFile = resolveTrustedLocalTelegramRoot(params.filePath, params.trustedLocalFileRoots);
    if (trustedLocalFile) {
        let localFile;
        try {
            const root = await (0, _fileaccessruntime.root)(trustedLocalFile.rootDir);
            localFile = await root.read(trustedLocalFile.relativePath, {
                maxBytes: params.maxBytes
            });
        } catch (err) {
            throw new _deliveryresolvemediaruntime.MediaFetchError("fetch_failed", `Failed to read local Telegram Bot API media from ${params.filePath}: ${(0, _deliveryresolvemediaruntime.formatErrorMessage)(err)}`, {
                cause: err
            });
        }
        return await (0, _deliveryresolvemediaruntime.saveMediaBuffer)(localFile.buffer, params.mimeType, "inbound", params.maxBytes, params.telegramFileName ?? _nodepath.default.basename(localFile.realPath));
    }
    if (_nodepath.default.isAbsolute(params.filePath)) {
        throw new _deliveryresolvemediaruntime.MediaFetchError("fetch_failed", `Telegram Bot API returned absolute file path ${params.filePath} outside trustedLocalFileRoots`);
    }
    const transport = resolveRequiredTelegramTransport(params.transport);
    const apiBase = (0, _deliveryresolvemediaruntime.resolveTelegramApiBase)(params.apiRoot);
    const url = `${apiBase}/file/bot${params.token}/${params.filePath}`;
    return await (0, _deliveryresolvemediaruntime.saveRemoteMedia)({
        url,
        fetchImpl: transport.sourceFetch,
        dispatcherAttempts: transport.dispatcherAttempts,
        trustExplicitProxyDns: usesTrustedTelegramExplicitProxy(transport),
        shouldRetryFetchError: _deliveryresolvemediaruntime.shouldRetryTelegramTransportFallback,
        retry: {
            attempts: 3,
            minDelayMs: 1000,
            maxDelayMs: 4000,
            jitter: 0.2,
            label: "telegram:media-download",
            onRetry: ({ attempt, maxAttempts })=>(0, _deliveryresolvemediaruntime.logVerbose)(`telegram: media download retry ${attempt}/${maxAttempts}`)
        },
        filePathHint: params.filePath,
        maxBytes: params.maxBytes,
        readIdleTimeoutMs: TELEGRAM_DOWNLOAD_IDLE_TIMEOUT_MS,
        ssrfPolicy: buildTelegramMediaSsrfPolicy(params.apiRoot, params.dangerouslyAllowPrivateNetwork),
        fallbackContentType: params.mimeType,
        originalFilename: params.telegramFileName
    });
}
async function resolveStickerMedia(params) {
    const { msg, ctx, maxBytes, token, transport } = params;
    if (!msg.sticker) {
        return undefined;
    }
    const sticker = msg.sticker;
    // Skip animated (TGS) and video (WEBM) stickers - only static WEBP supported
    if (sticker.is_animated || sticker.is_video) {
        (0, _deliveryresolvemediaruntime.logVerbose)("telegram: skipping animated/video sticker (only static stickers supported)");
        return null;
    }
    if (!sticker.file_id) {
        return null;
    }
    try {
        const file = await resolveTelegramFileWithRetry(ctx);
        if (!file?.file_path) {
            (0, _deliveryresolvemediaruntime.logVerbose)("telegram: getFile returned no file_path for sticker");
            return null;
        }
        const saved = await downloadAndSaveTelegramFile({
            filePath: file.file_path,
            token,
            transport,
            maxBytes,
            apiRoot: params.apiRoot,
            trustedLocalFileRoots: params.trustedLocalFileRoots,
            dangerouslyAllowPrivateNetwork: params.dangerouslyAllowPrivateNetwork
        });
        // Check sticker cache for existing description
        const cached = sticker.file_unique_id ? (0, _stickercache.getCachedSticker)(sticker.file_unique_id) : null;
        if (cached) {
            (0, _deliveryresolvemediaruntime.logVerbose)(`telegram: sticker cache hit for ${sticker.file_unique_id}`);
            const fileId = sticker.file_id ?? cached.fileId;
            const emoji = sticker.emoji ?? cached.emoji;
            const setName = sticker.set_name ?? cached.setName;
            if (fileId !== cached.fileId || emoji !== cached.emoji || setName !== cached.setName) {
                // Refresh cached sticker metadata on hits so sends/searches use latest file_id.
                (0, _stickercache.cacheSticker)({
                    ...cached,
                    fileId,
                    emoji,
                    setName
                });
            }
            return {
                path: saved.path,
                contentType: saved.contentType,
                placeholder: "<media:sticker>",
                stickerMetadata: {
                    emoji,
                    setName,
                    fileId,
                    fileUniqueId: sticker.file_unique_id,
                    cachedDescription: cached.description
                }
            };
        }
        // Cache miss - return metadata for vision processing
        return {
            path: saved.path,
            contentType: saved.contentType,
            placeholder: "<media:sticker>",
            stickerMetadata: {
                emoji: sticker.emoji ?? undefined,
                setName: sticker.set_name ?? undefined,
                fileId: sticker.file_id,
                fileUniqueId: sticker.file_unique_id
            }
        };
    } catch (err) {
        (0, _deliveryresolvemediaruntime.logVerbose)(`telegram: failed to process sticker: ${String(err)}`);
        return null;
    }
}
async function resolveMedia(params) {
    const { ctx, maxBytes, token, transport, apiRoot, trustedLocalFileRoots, dangerouslyAllowPrivateNetwork } = params;
    const msg = ctx.message;
    const stickerResolved = await resolveStickerMedia({
        msg,
        ctx,
        maxBytes,
        token,
        transport,
        apiRoot,
        trustedLocalFileRoots,
        dangerouslyAllowPrivateNetwork
    });
    if (stickerResolved !== undefined) {
        return stickerResolved;
    }
    const metadata = resolveMediaMetadata(msg);
    const m = metadata.fileRef;
    if (!m?.file_id) {
        return null;
    }
    const file = await resolveTelegramFileWithRetry(ctx);
    if (!file) {
        return null;
    }
    if (!file.file_path) {
        throw new Error("Telegram getFile returned no file_path");
    }
    const saved = await downloadAndSaveTelegramFile({
        filePath: file.file_path,
        token,
        transport,
        maxBytes,
        telegramFileName: metadata.fileName,
        mimeType: metadata.mimeType,
        apiRoot,
        trustedLocalFileRoots,
        dangerouslyAllowPrivateNetwork
    });
    const placeholder = (0, _helpers.resolveTelegramMediaPlaceholder)(msg) ?? "<media:document>";
    return {
        path: saved.path,
        contentType: saved.contentType,
        placeholder
    };
}

//# sourceMappingURL=delivery.resolve-media.js.map