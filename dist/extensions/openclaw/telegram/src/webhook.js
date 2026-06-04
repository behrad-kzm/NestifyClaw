"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "startTelegramWebhook", {
    enumerable: true,
    get: function() {
        return startTelegramWebhook;
    }
});
const _nodehttp = require("node:http");
const _nodenet = /*#__PURE__*/ _interop_require_default(require("node:net"));
const _grammy = require("grammy");
const _diagnosticruntime = require("../../../../common/openclaw/plugin-sdk/diagnostic-runtime");
const _loggingcore = require("../../../../common/openclaw/plugin-sdk/logging-core");
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _securityruntime = require("../../../../common/openclaw/plugin-sdk/security-runtime");
const _ssrfruntime = require("../../../../common/openclaw/plugin-sdk/ssrf-runtime");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _webhookingress = require("../../../../common/openclaw/plugin-sdk/webhook-ingress");
const _webhookrequestguards = require("../../../../common/openclaw/plugin-sdk/webhook-request-guards");
const _allowedupdates = require("./allowed-updates.js");
const _apilogging = require("./api-logging.js");
const _bot = require("./bot.js");
const _networkerrors = require("./network-errors.js");
const _webhookstatus = require("./webhook-status.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const TELEGRAM_WEBHOOK_MAX_BODY_BYTES = 1024 * 1024;
const TELEGRAM_WEBHOOK_BODY_TIMEOUT_MS = 30_000;
const TELEGRAM_WEBHOOK_REGISTRATION_RETRY_POLICY = {
    initialMs: 5_000,
    maxMs: 60_000,
    factor: 2,
    jitter: 0.2
};
async function listenHttpServer(params) {
    await new Promise((resolve, reject)=>{
        const onError = (err)=>{
            params.server.off("error", onError);
            reject(err);
        };
        params.server.once("error", onError);
        params.server.listen(params.port, params.host, ()=>{
            params.server.off("error", onError);
            resolve();
        });
    });
}
function resolveWebhookPublicUrl(params) {
    if (params.configuredPublicUrl) {
        return params.configuredPublicUrl;
    }
    const address = params.server.address();
    if (address && typeof address !== "string") {
        const resolvedHost = params.host === "0.0.0.0" || address.address === "0.0.0.0" || address.address === "::" ? "localhost" : address.address;
        return `http://${resolvedHost}:${address.port}${params.path}`;
    }
    const fallbackHost = params.host === "0.0.0.0" ? "localhost" : params.host;
    return `http://${fallbackHost}:${params.port}${params.path}`;
}
async function initializeTelegramWebhookBot(params) {
    const initSignal = params.abortSignal;
    await (0, _apilogging.withTelegramApiErrorLogging)({
        operation: "getMe",
        runtime: params.runtime,
        fn: ()=>params.bot.init(initSignal)
    });
}
function resolveSingleHeaderValue(header) {
    if (typeof header === "string") {
        return header;
    }
    if (Array.isArray(header) && header.length === 1) {
        return header[0];
    }
    return undefined;
}
function hasValidTelegramWebhookSecret(secretHeader, expectedSecret) {
    return (0, _securityruntime.safeEqualSecret)(secretHeader, expectedSecret);
}
function parseIpLiteral(value) {
    const trimmed = (0, _stringcoerceruntime.normalizeOptionalString)(value);
    if (!trimmed) {
        return undefined;
    }
    if (trimmed.startsWith("[")) {
        const end = trimmed.indexOf("]");
        if (end !== -1) {
            const candidate = trimmed.slice(1, end);
            return _nodenet.default.isIP(candidate) === 0 ? undefined : candidate;
        }
    }
    if (_nodenet.default.isIP(trimmed) !== 0) {
        return trimmed;
    }
    const lastColon = trimmed.lastIndexOf(":");
    if (lastColon > -1 && trimmed.includes(".") && trimmed.indexOf(":") === lastColon) {
        const candidate = trimmed.slice(0, lastColon);
        return _nodenet.default.isIP(candidate) === 4 ? candidate : undefined;
    }
    return undefined;
}
function isTrustedProxyAddress(ip, trustedProxies) {
    const candidate = parseIpLiteral(ip);
    if (!candidate || !trustedProxies?.length) {
        return false;
    }
    const blockList = new _nodenet.default.BlockList();
    for (const proxy of trustedProxies){
        const trimmed = (0, _stringcoerceruntime.normalizeOptionalString)(proxy) ?? "";
        if (!trimmed) {
            continue;
        }
        if (trimmed.includes("/")) {
            const [address, prefix] = trimmed.split("/", 2);
            const parsedPrefix = (0, _numberruntime.parseStrictNonNegativeInteger)(prefix);
            const family = _nodenet.default.isIP(address);
            if (family === 4 && parsedPrefix !== undefined && parsedPrefix >= 0 && parsedPrefix <= 32) {
                blockList.addSubnet(address, parsedPrefix, "ipv4");
            }
            if (family === 6 && parsedPrefix !== undefined && parsedPrefix >= 0 && parsedPrefix <= 128) {
                blockList.addSubnet(address, parsedPrefix, "ipv6");
            }
            continue;
        }
        if (_nodenet.default.isIP(trimmed) === 4) {
            blockList.addAddress(trimmed, "ipv4");
            continue;
        }
        if (_nodenet.default.isIP(trimmed) === 6) {
            blockList.addAddress(trimmed, "ipv6");
        }
    }
    return blockList.check(candidate, _nodenet.default.isIP(candidate) === 6 ? "ipv6" : "ipv4");
}
function resolveForwardedClientIp(forwardedFor, trustedProxies) {
    if (!trustedProxies?.length) {
        return undefined;
    }
    const forwardedChain = forwardedFor?.split(",").map((entry)=>parseIpLiteral(entry)).filter((entry)=>Boolean(entry));
    if (!forwardedChain?.length) {
        return undefined;
    }
    for(let index = forwardedChain.length - 1; index >= 0; index -= 1){
        const hop = forwardedChain[index];
        if (!isTrustedProxyAddress(hop, trustedProxies)) {
            return hop;
        }
    }
    return undefined;
}
function resolveTelegramWebhookClientIp(req, config) {
    const remoteAddress = parseIpLiteral(req.socket.remoteAddress);
    const trustedProxies = config?.gateway?.trustedProxies;
    if (!remoteAddress) {
        return "unknown";
    }
    if (!isTrustedProxyAddress(remoteAddress, trustedProxies)) {
        return remoteAddress;
    }
    const forwardedFor = Array.isArray(req.headers["x-forwarded-for"]) ? req.headers["x-forwarded-for"][0] : req.headers["x-forwarded-for"];
    const forwardedClientIp = resolveForwardedClientIp(forwardedFor, trustedProxies);
    if (forwardedClientIp) {
        return forwardedClientIp;
    }
    if (config?.gateway?.allowRealIpFallback === true) {
        const realIp = Array.isArray(req.headers["x-real-ip"]) ? req.headers["x-real-ip"][0] : req.headers["x-real-ip"];
        return parseIpLiteral(realIp) ?? "unknown";
    }
    return "unknown";
}
function resolveTelegramWebhookRateLimitKey(req, path, config) {
    return `${path}:${resolveTelegramWebhookClientIp(req, config)}`;
}
async function startTelegramWebhook(opts) {
    const path = opts.path ?? "/telegram-webhook";
    const healthPath = opts.healthPath ?? "/healthz";
    const port = opts.port ?? 8787;
    const host = opts.host ?? "127.0.0.1";
    const secret = (0, _stringcoerceruntime.normalizeOptionalString)(opts.secret) ?? "";
    if (!secret) {
        throw new Error("Telegram webhook mode requires a non-empty secret token. " + "Set channels.telegram.webhookSecret in your config.");
    }
    const runtime = opts.runtime ?? _runtimeenv.defaultRuntime;
    const status = (0, _webhookstatus.createTelegramWebhookStatusPublisher)(opts.setStatus);
    status.noteWebhookStart();
    const webhookRegistrationRetryPolicy = opts.webhookRegistrationRetryPolicy ?? TELEGRAM_WEBHOOK_REGISTRATION_RETRY_POLICY;
    const diagnosticsEnabled = (0, _diagnosticruntime.isDiagnosticsEnabled)(opts.config);
    const bot = (0, _bot.createTelegramBot)({
        token: opts.token,
        runtime,
        proxyFetch: opts.fetch,
        config: opts.config,
        accountId: opts.accountId
    });
    await initializeTelegramWebhookBot({
        bot,
        runtime,
        abortSignal: opts.abortSignal
    });
    const telegramWebhookRateLimiter = (0, _webhookingress.createFixedWindowRateLimiter)({
        windowMs: _webhookingress.WEBHOOK_RATE_LIMIT_DEFAULTS.windowMs,
        maxRequests: _webhookingress.WEBHOOK_RATE_LIMIT_DEFAULTS.maxRequests,
        maxTrackedKeys: _webhookingress.WEBHOOK_RATE_LIMIT_DEFAULTS.maxTrackedKeys
    });
    if (diagnosticsEnabled) {
        (0, _loggingcore.startDiagnosticHeartbeat)(opts.config);
    }
    const server = (0, _nodehttp.createServer)((req, res)=>{
        const respondText = (statusCode, text = "")=>{
            if (res.headersSent || res.writableEnded) {
                return;
            }
            res.writeHead(statusCode, {
                "Content-Type": "text/plain; charset=utf-8"
            });
            res.end(text);
        };
        if (req.url === healthPath) {
            res.writeHead(200);
            res.end("ok");
            return;
        }
        if (req.url !== path || req.method !== "POST") {
            res.writeHead(404);
            res.end();
            return;
        }
        // Apply the per-source limit before auth so invalid secret guesses consume budget
        // in the same window as any later request from that source.
        if (!(0, _webhookingress.applyBasicWebhookRequestGuards)({
            req,
            res,
            rateLimiter: telegramWebhookRateLimiter,
            rateLimitKey: resolveTelegramWebhookRateLimitKey(req, path, opts.config)
        })) {
            return;
        }
        const startTime = Date.now();
        if (diagnosticsEnabled) {
            (0, _loggingcore.logWebhookReceived)({
                channel: "telegram",
                updateType: "telegram-post"
            });
        }
        const secretHeader = resolveSingleHeaderValue(req.headers["x-telegram-bot-api-secret-token"]);
        if (!hasValidTelegramWebhookSecret(secretHeader, secret)) {
            res.shouldKeepAlive = false;
            res.setHeader("Connection", "close");
            respondText(401, "unauthorized");
            return;
        }
        void (async ()=>{
            const body = await (0, _webhookrequestguards.readJsonBodyWithLimit)(req, {
                maxBytes: TELEGRAM_WEBHOOK_MAX_BODY_BYTES,
                timeoutMs: TELEGRAM_WEBHOOK_BODY_TIMEOUT_MS,
                emptyObjectOnEmpty: false
            });
            if (!body.ok) {
                if (body.code === "PAYLOAD_TOO_LARGE") {
                    respondText(413, body.error);
                    return;
                }
                if (body.code === "REQUEST_BODY_TIMEOUT") {
                    respondText(408, body.error);
                    return;
                }
                if (body.code === "CONNECTION_CLOSED") {
                    respondText(400, body.error);
                    return;
                }
                respondText(400, body.error);
                return;
            }
            respondText(200);
            status.noteWebhookUpdateReceived();
            void (async ()=>{
                await bot.handleUpdate(body.value);
                if (diagnosticsEnabled) {
                    (0, _loggingcore.logWebhookProcessed)({
                        channel: "telegram",
                        updateType: "telegram-post",
                        durationMs: Date.now() - startTime
                    });
                }
            })().catch((err)=>{
                const errMsg = (0, _ssrfruntime.formatErrorMessage)(err);
                if (diagnosticsEnabled) {
                    (0, _loggingcore.logWebhookError)({
                        channel: "telegram",
                        updateType: "telegram-post",
                        error: errMsg
                    });
                }
                runtime.log?.(`webhook update processing failed after ack: ${errMsg}`);
            });
        })().catch((err)=>{
            const errMsg = (0, _ssrfruntime.formatErrorMessage)(err);
            if (diagnosticsEnabled) {
                (0, _loggingcore.logWebhookError)({
                    channel: "telegram",
                    updateType: "telegram-post",
                    error: errMsg
                });
            }
            runtime.log?.(`webhook request failed: ${errMsg}`);
            respondText(500);
        });
    });
    await listenHttpServer({
        server,
        port,
        host
    });
    const boundAddress = server.address();
    const boundPort = boundAddress && typeof boundAddress !== "string" ? boundAddress.port : port;
    const publicUrl = resolveWebhookPublicUrl({
        configuredPublicUrl: opts.publicUrl,
        server,
        path,
        host,
        port
    });
    let shutDown = false;
    let webhookAdvertised = false;
    const shutdown = ()=>{
        if (shutDown) {
            return;
        }
        shutDown = true;
        void (0, _apilogging.withTelegramApiErrorLogging)({
            operation: "deleteWebhook",
            runtime,
            fn: ()=>bot.api.deleteWebhook({
                    drop_pending_updates: false
                })
        }).catch(()=>{
        // withTelegramApiErrorLogging has already emitted the failure.
        });
        server.close();
        void bot.stop();
        status.noteWebhookStop();
        if (diagnosticsEnabled) {
            (0, _loggingcore.stopDiagnosticHeartbeat)();
        }
    };
    if (opts.abortSignal?.aborted) {
        shutdown();
    } else if (opts.abortSignal) {
        opts.abortSignal.addEventListener("abort", shutdown, {
            once: true
        });
    }
    const advertiseWebhook = async ()=>{
        if (shutDown || opts.abortSignal?.aborted) {
            return;
        }
        try {
            await (0, _apilogging.withTelegramApiErrorLogging)({
                operation: "setWebhook",
                runtime,
                fn: ()=>bot.api.setWebhook(publicUrl, {
                        secret_token: secret,
                        allowed_updates: (0, _allowedupdates.resolveTelegramAllowedUpdates)(),
                        certificate: opts.webhookCertPath ? new _grammy.InputFile(opts.webhookCertPath) : undefined
                    })
            });
        } catch (err) {
            status.noteWebhookRegistrationFailure((0, _ssrfruntime.formatErrorMessage)(err));
            throw err;
        }
        if (shutDown) {
            return;
        }
        webhookAdvertised = true;
        status.noteWebhookAdvertised();
        runtime.log?.(`webhook advertised to telegram on ${publicUrl}`);
    };
    const shouldRetryWebhookRegistration = (err)=>(0, _networkerrors.isRecoverableTelegramNetworkError)(err, {
            context: "webhook"
        }) || (0, _networkerrors.isTelegramServerError)(err) || (0, _networkerrors.isTelegramRateLimitError)(err);
    const retryWebhookRegistration = async (firstAttempt)=>{
        let attempt = firstAttempt;
        while(true){
            if (shutDown || opts.abortSignal?.aborted || webhookAdvertised) {
                return;
            }
            const delayMs = (0, _runtimeenv.computeBackoff)(webhookRegistrationRetryPolicy, attempt);
            runtime.log?.(`telegram setWebhook retry ${attempt} scheduled in ${(0, _runtimeenv.formatDurationPrecise)(delayMs)}`);
            try {
                await (0, _runtimeenv.sleepWithAbort)(delayMs, opts.abortSignal);
            } catch  {
                return;
            }
            if (shutDown || opts.abortSignal?.aborted || webhookAdvertised) {
                return;
            }
            try {
                await advertiseWebhook();
                return;
            } catch (err) {
                if (!shouldRetryWebhookRegistration(err)) {
                    runtime.error?.(`telegram setWebhook retry stopped after non-recoverable error: ${(0, _ssrfruntime.formatErrorMessage)(err)}`);
                    return;
                }
            }
            attempt += 1;
        }
    };
    const closeAfterStartupFailure = ()=>{
        shutDown = true;
        server.close();
        void bot.stop();
        status.noteWebhookStop();
        if (diagnosticsEnabled) {
            (0, _loggingcore.stopDiagnosticHeartbeat)();
        }
    };
    runtime.log?.(`webhook local listener on http://${host}:${boundPort}${path}`);
    if (!shutDown) {
        try {
            await advertiseWebhook();
        } catch (err) {
            if (!shouldRetryWebhookRegistration(err)) {
                closeAfterStartupFailure();
                throw err;
            }
            void retryWebhookRegistration(1);
        }
    }
    return {
        server,
        bot,
        stop: shutdown
    };
}

//# sourceMappingURL=webhook.js.map