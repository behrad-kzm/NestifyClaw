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
    get resolveTelegramApiBase () {
        return resolveTelegramApiBase;
    },
    get resolveTelegramFetch () {
        return resolveTelegramFetch;
    },
    get resolveTelegramTransport () {
        return resolveTelegramTransport;
    },
    get shouldRetryTelegramTransportFallback () {
        return shouldRetryTelegramTransportFallback;
    }
});
const _nodecrypto = require("node:crypto");
const _nodedns = /*#__PURE__*/ _interop_require_wildcard(require("node:dns"));
const _errorruntime = require("../../../../common/openclaw/plugin-sdk/error-runtime");
const _fetchruntime = require("../../../../common/openclaw/plugin-sdk/fetch-runtime");
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _proxycapture = require("../../../../common/openclaw/plugin-sdk/proxy-capture");
const _requesturl = require("../../../../common/openclaw/plugin-sdk/request-url");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _undici = require("undici");
const _apiroot = require("./api-root.js");
const _networkconfig = require("./network-config.js");
const _proxy = require("./proxy.js");
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
const log = (0, _runtimeenv.createSubsystemLogger)("telegram/network");
const TELEGRAM_AUTO_SELECT_FAMILY_ATTEMPT_TIMEOUT_MS = 300;
const TELEGRAM_API_HOSTNAME = "api.telegram.org";
const TELEGRAM_FALLBACK_IPS = [
    "149.154.167.220"
];
// Dispatcher defaults that bound the per-origin connection pool. Telegram long
// polling keeps a handful of connections hot for hours, so the defaults must be
// strict enough that (a) idle sockets are closed even when the pool is still
// actively used and (b) the pool itself cannot grow unbounded under transient
// concurrency spikes. These values are a defence-in-depth layer; the primary
// fix for the leak observed in openclaw#68128 is the transport lifecycle that
// calls `close()` on abandoned dispatchers.
const TELEGRAM_DISPATCHER_KEEP_ALIVE_TIMEOUT_MS = 30_000;
const TELEGRAM_DISPATCHER_KEEP_ALIVE_MAX_TIMEOUT_MS = 600_000;
const TELEGRAM_DISPATCHER_CONNECTIONS_PER_ORIGIN = 10;
const TELEGRAM_DISPATCHER_PIPELINING = 1;
const TELEGRAM_STICKY_FALLBACK_PRIMARY_PROBE_SUCCESS_THRESHOLD = 5;
const TELEGRAM_TRANSPORT_ATTEMPT_FAILURE_THRESHOLD = 5;
const TELEGRAM_TRANSPORT_ATTEMPT_INITIAL_COOLDOWN_MS = 10_000;
const TELEGRAM_TRANSPORT_ATTEMPT_MAX_COOLDOWN_MS = 60_000;
function telegramAgentPoolOptions() {
    return {
        allowH2: false,
        keepAliveTimeout: TELEGRAM_DISPATCHER_KEEP_ALIVE_TIMEOUT_MS,
        keepAliveMaxTimeout: TELEGRAM_DISPATCHER_KEEP_ALIVE_MAX_TIMEOUT_MS,
        connections: TELEGRAM_DISPATCHER_CONNECTIONS_PER_ORIGIN,
        pipelining: TELEGRAM_DISPATCHER_PIPELINING
    };
}
const FALLBACK_RETRY_ERROR_CODES = [
    "ETIMEDOUT",
    "ENETDOWN",
    "ENETUNREACH",
    "EHOSTUNREACH",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_SOCKET"
];
function normalizeDnsResultOrder(value) {
    if (value === "ipv4first" || value === "verbatim") {
        return value;
    }
    return null;
}
function createDnsResultOrderLookup(order) {
    if (!order) {
        return undefined;
    }
    const lookup = _nodedns.lookup;
    return (hostname, options, callback)=>{
        const baseOptions = typeof options === "number" ? {
            family: options
        } : options ? {
            ...options
        } : {};
        const lookupOptions = {
            ...baseOptions,
            order,
            verbatim: order === "verbatim"
        };
        lookup(hostname, lookupOptions, callback);
    };
}
const TELEGRAM_KEEPALIVE_INITIAL_DELAY_MS = 30_000;
function buildTelegramConnectOptions(params) {
    const connect = {
        keepAlive: true,
        keepAliveInitialDelay: TELEGRAM_KEEPALIVE_INITIAL_DELAY_MS
    };
    if (params.forceIpv4) {
        connect.family = 4;
        connect.autoSelectFamily = false;
    } else if (typeof params.autoSelectFamily === "boolean") {
        connect.autoSelectFamily = params.autoSelectFamily;
        connect.autoSelectFamilyAttemptTimeout = TELEGRAM_AUTO_SELECT_FAMILY_ATTEMPT_TIMEOUT_MS;
    }
    const lookup = createDnsResultOrderLookup(params.dnsResultOrder);
    if (lookup) {
        connect.lookup = lookup;
    }
    return connect;
}
function shouldBypassEnvProxyForTelegramApi(env = process.env) {
    const noProxyValue = env.no_proxy ?? env.NO_PROXY ?? "";
    if (!noProxyValue) {
        return false;
    }
    if (noProxyValue === "*") {
        return true;
    }
    const targetHostname = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(TELEGRAM_API_HOSTNAME);
    const targetPort = 443;
    const noProxyEntries = noProxyValue.split(/[,\s]/);
    for (const entry of noProxyEntries){
        if (!entry) {
            continue;
        }
        const parsed = entry.match(/^(.+):(\d+)$/);
        const entryHostname = (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)((parsed ? parsed[1] : entry).replace(/^\*?\./, ""));
        const entryPort = parsed ? Number.parseInt(parsed[2], 10) : 0;
        if (entryPort && entryPort !== targetPort) {
            continue;
        }
        if (targetHostname === entryHostname || targetHostname.slice(-(entryHostname.length + 1)) === `.${entryHostname}`) {
            return true;
        }
    }
    return false;
}
function hasEnvHttpProxyForTelegramApi(env = process.env) {
    return (0, _fetchruntime.hasEnvHttpProxyAgentConfigured)(env);
}
function resolveOpenClawProxyUrlForTelegram(env = process.env) {
    const proxyUrl = env.OPENCLAW_PROXY_URL?.trim();
    return proxyUrl ? proxyUrl : undefined;
}
function resolveTelegramDispatcherPolicy(params) {
    const connect = buildTelegramConnectOptions({
        autoSelectFamily: params.autoSelectFamily,
        dnsResultOrder: params.dnsResultOrder,
        forceIpv4: params.forceIpv4
    });
    const explicitProxyUrl = params.proxyUrl?.trim();
    if (explicitProxyUrl) {
        return {
            policy: {
                mode: "explicit-proxy",
                proxyUrl: explicitProxyUrl,
                allowPrivateProxy: true,
                proxyTls: {
                    ...connect
                }
            },
            mode: "explicit-proxy"
        };
    }
    if (params.useEnvProxy) {
        return {
            policy: {
                mode: "env-proxy",
                connect: {
                    ...connect
                },
                proxyTls: {
                    ...connect
                }
            },
            mode: "env-proxy"
        };
    }
    return {
        policy: {
            mode: "direct",
            connect: {
                ...connect
            }
        },
        mode: "direct"
    };
}
function withPinnedLookup(options, pinnedHostname) {
    if (!pinnedHostname) {
        return options ? {
            ...options
        } : undefined;
    }
    const lookup = (0, _fetchruntime.createPinnedLookup)({
        hostname: pinnedHostname.hostname,
        addresses: [
            ...pinnedHostname.addresses
        ],
        fallback: _nodedns.lookup
    });
    return options ? {
        ...options,
        lookup
    } : {
        lookup
    };
}
function createTelegramDispatcher(policy) {
    // Telegram polling uses long-lived connections. Undici 8 enables HTTP/2 ALPN
    // by default, which can stall Telegram long-polling on Windows/IPv6 networks.
    // Force HTTP/1.1 for every dispatcher while keeping bounded pool defaults.
    const poolOptions = telegramAgentPoolOptions();
    if (policy.mode === "explicit-proxy") {
        const requestTlsOptions = withPinnedLookup(policy.proxyTls, policy.pinnedHostname);
        const proxyOptions = {
            uri: policy.proxyUrl,
            ...poolOptions,
            ...requestTlsOptions ? {
                requestTls: requestTlsOptions
            } : {}
        };
        try {
            return {
                dispatcher: (0, _fetchruntime.createHttp1ProxyAgent)(proxyOptions),
                mode: "explicit-proxy",
                effectivePolicy: policy
            };
        } catch (err) {
            const reason = (0, _errorruntime.formatErrorMessage)(err);
            throw new Error(`explicit proxy dispatcher init failed: ${reason}`, {
                cause: err
            });
        }
    }
    if (policy.mode === "env-proxy") {
        const connectOptions = withPinnedLookup(policy.connect, policy.pinnedHostname);
        const proxyTlsOptions = withPinnedLookup(policy.proxyTls, policy.pinnedHostname);
        const proxyOptions = {
            ...poolOptions,
            ...(0, _fetchruntime.resolveEnvHttpProxyAgentOptions)(),
            ...connectOptions ? {
                connect: connectOptions
            } : {},
            ...proxyTlsOptions ? {
                proxyTls: proxyTlsOptions
            } : {}
        };
        try {
            return {
                dispatcher: (0, _fetchruntime.createHttp1EnvHttpProxyAgent)(proxyOptions),
                mode: "env-proxy",
                effectivePolicy: policy
            };
        } catch (err) {
            log.warn(`env proxy dispatcher init failed; falling back to direct dispatcher: ${(0, _errorruntime.formatErrorMessage)(err)}`);
            const directPolicy = {
                mode: "direct",
                ...connectOptions ? {
                    connect: connectOptions
                } : {}
            };
            return {
                dispatcher: new _undici.Agent({
                    ...poolOptions,
                    ...directPolicy.connect ? {
                        connect: directPolicy.connect
                    } : {}
                }),
                mode: "direct",
                effectivePolicy: directPolicy
            };
        }
    }
    const connectOptions = withPinnedLookup(policy.connect, policy.pinnedHostname);
    return {
        dispatcher: new _undici.Agent({
            ...poolOptions,
            ...connectOptions ? {
                connect: connectOptions
            } : {}
        }),
        mode: "direct",
        effectivePolicy: policy
    };
}
function withDispatcherIfMissing(init, dispatcher) {
    const withDispatcher = init;
    if (withDispatcher?.dispatcher) {
        return init ?? {};
    }
    return init ? {
        ...init,
        dispatcher
    } : {
        dispatcher
    };
}
function resolveWrappedFetch(fetchImpl) {
    return (0, _fetchruntime.resolveFetch)(fetchImpl) ?? fetchImpl;
}
function logResolverNetworkDecisions(params) {
    if (params.autoSelectDecision.value !== null) {
        const sourceLabel = params.autoSelectDecision.source ? ` (${params.autoSelectDecision.source})` : "";
        log.debug(`autoSelectFamily=${params.autoSelectDecision.value}${sourceLabel}`);
    }
    if (params.dnsDecision.value !== null) {
        const sourceLabel = params.dnsDecision.source ? ` (${params.dnsDecision.source})` : "";
        log.debug(`dnsResultOrder=${params.dnsDecision.value}${sourceLabel}`);
    }
}
function collectErrorCodes(err) {
    const codes = new Set();
    const queue = [
        err
    ];
    const seen = new Set();
    let queueIndex = 0;
    while(queueIndex < queue.length){
        const current = queue[queueIndex++];
        if (!current || seen.has(current)) {
            continue;
        }
        seen.add(current);
        if (typeof current === "object") {
            const code = current.code;
            if (typeof code === "string" && code.trim()) {
                codes.add(code.trim().toUpperCase());
            }
            const cause = current.cause;
            if (cause && !seen.has(cause)) {
                queue.push(cause);
            }
            const errors = current.errors;
            if (Array.isArray(errors)) {
                for (const nested of errors){
                    if (nested && !seen.has(nested)) {
                        queue.push(nested);
                    }
                }
            }
        }
    }
    return codes;
}
function formatErrorCodes(err) {
    const codes = [
        ...collectErrorCodes(err)
    ];
    return codes.length > 0 ? codes.join(",") : "none";
}
let TelegramTransportAttemptUnhealthyError = class TelegramTransportAttemptUnhealthyError extends Error {
    constructor(unhealthyUntilMs){
        const remainingMs = Math.max(0, unhealthyUntilMs - Date.now());
        super(`telegram transport attempt temporarily unhealthy; retry after ${remainingMs}ms`);
        this.name = "TelegramTransportAttemptUnhealthyError";
    }
};
function shouldUseTelegramTransportFallback(err) {
    if (err instanceof TelegramTransportAttemptUnhealthyError) {
        return true;
    }
    const ctx = {
        message: err && typeof err === "object" && "message" in err ? (0, _stringcoerceruntime.normalizeLowercaseStringOrEmpty)(String(err.message)) : "",
        codes: collectErrorCodes(err)
    };
    const hasFetchFailedEnvelope = ctx.message.includes("fetch failed");
    const hasKnownNetworkCode = FALLBACK_RETRY_ERROR_CODES.some((code)=>ctx.codes.has(code));
    return hasKnownNetworkCode || hasFetchFailedEnvelope && ctx.codes.size === 0;
}
function shouldRetryTelegramTransportFallback(err) {
    return shouldUseTelegramTransportFallback(err);
}
function createTelegramTransportAttempts(params) {
    params.ownedDispatchers.add(params.defaultDispatcher.dispatcher);
    const attempts = [
        {
            createDispatcher: ()=>params.defaultDispatcher.dispatcher,
            exportAttempt: {
                dispatcherPolicy: params.defaultDispatcher.effectivePolicy
            }
        }
    ];
    if (!params.allowFallback || !params.fallbackPolicy) {
        return attempts;
    }
    const fallbackPolicy = params.fallbackPolicy;
    const ownedDispatchers = params.ownedDispatchers;
    let ipv4Dispatcher = null;
    attempts.push({
        createDispatcher: ()=>{
            if (!ipv4Dispatcher) {
                ipv4Dispatcher = createTelegramDispatcher(fallbackPolicy).dispatcher;
                ownedDispatchers.add(ipv4Dispatcher);
            }
            return ipv4Dispatcher;
        },
        exportAttempt: {
            dispatcherPolicy: fallbackPolicy
        },
        logLevel: "debug",
        logMessage: "fetch fallback: enabling sticky IPv4-only dispatcher"
    });
    if (TELEGRAM_FALLBACK_IPS.length === 0) {
        return attempts;
    }
    const fallbackIpPolicy = {
        ...fallbackPolicy,
        pinnedHostname: {
            hostname: TELEGRAM_API_HOSTNAME,
            addresses: [
                ...TELEGRAM_FALLBACK_IPS
            ]
        }
    };
    let fallbackIpDispatcher = null;
    attempts.push({
        createDispatcher: ()=>{
            if (!fallbackIpDispatcher) {
                fallbackIpDispatcher = createTelegramDispatcher(fallbackIpPolicy).dispatcher;
                ownedDispatchers.add(fallbackIpDispatcher);
            }
            return fallbackIpDispatcher;
        },
        exportAttempt: {
            dispatcherPolicy: fallbackIpPolicy
        },
        logLevel: "warn",
        logMessage: "fetch fallback: DNS-resolved IP unreachable; trying alternative Telegram API IP"
    });
    return attempts;
}
async function destroyOwnedDispatchers(dispatchers) {
    // Use destroy() rather than close() so abandoned sockets are released
    // immediately without waiting for in-flight requests that the caller has
    // already decided to abandon (session aborted, or stale transport being
    // replaced after a stall). The per-dispatcher try/catch isolates failures
    // (already-destroyed dispatchers throw) so Promise.all never rejects.
    await Promise.all([
        ...dispatchers
    ].map(async (dispatcher)=>{
        try {
            await dispatcher.destroy();
        } catch  {
        // Intentionally ignored: dispatcher may already be destroyed.
        }
    }));
}
function resolveTelegramTransport(proxyFetch, options) {
    const autoSelectDecision = (0, _networkconfig.resolveTelegramAutoSelectFamilyDecision)({
        network: options?.network
    });
    const dnsDecision = (0, _networkconfig.resolveTelegramDnsResultOrderDecision)({
        network: options?.network
    });
    logResolverNetworkDecisions({
        autoSelectDecision,
        dnsDecision
    });
    const effectiveProxyFetch = proxyFetch ?? (()=>{
        const debugProxyUrl = (0, _proxycapture.resolveEffectiveDebugProxyUrl)(undefined);
        return debugProxyUrl ? (0, _proxy.makeProxyFetch)(debugProxyUrl) : undefined;
    })();
    const explicitProxyUrl = effectiveProxyFetch ? (0, _proxy.getProxyUrlFromFetch)(effectiveProxyFetch) : undefined;
    const hasEnvProxy = !explicitProxyUrl && hasEnvHttpProxyForTelegramApi();
    const managedProxyUrl = !effectiveProxyFetch && !hasEnvProxy ? resolveOpenClawProxyUrlForTelegram() : undefined;
    const resolvedExplicitProxyUrl = explicitProxyUrl ?? managedProxyUrl;
    const undiciSourceFetch = resolveWrappedFetch(_undici.fetch);
    const sourceFetch = resolvedExplicitProxyUrl ? undiciSourceFetch : effectiveProxyFetch ? resolveWrappedFetch(effectiveProxyFetch) : undiciSourceFetch;
    const dnsResultOrder = normalizeDnsResultOrder(dnsDecision.value);
    if (effectiveProxyFetch && !explicitProxyUrl) {
        // The caller owns the underlying dispatcher lifecycle; nothing to close here.
        return {
            fetch: sourceFetch,
            sourceFetch,
            close: async ()=>{}
        };
    }
    const useEnvProxy = !resolvedExplicitProxyUrl && hasEnvProxy;
    const defaultDispatcherResolution = resolveTelegramDispatcherPolicy({
        autoSelectFamily: autoSelectDecision.value,
        dnsResultOrder,
        useEnvProxy,
        forceIpv4: false,
        proxyUrl: resolvedExplicitProxyUrl
    });
    const defaultDispatcher = createTelegramDispatcher(defaultDispatcherResolution.policy);
    const shouldBypassEnvProxy = shouldBypassEnvProxyForTelegramApi();
    const allowStickyFallback = defaultDispatcher.mode === "direct" || defaultDispatcher.mode === "env-proxy" && shouldBypassEnvProxy;
    const fallbackDispatcherPolicy = allowStickyFallback ? resolveTelegramDispatcherPolicy({
        autoSelectFamily: false,
        dnsResultOrder: "ipv4first",
        useEnvProxy: defaultDispatcher.mode === "env-proxy",
        forceIpv4: true,
        proxyUrl: resolvedExplicitProxyUrl
    }).policy : undefined;
    const ownedDispatchers = new Set();
    const transportAttempts = createTelegramTransportAttempts({
        defaultDispatcher,
        allowFallback: allowStickyFallback,
        fallbackPolicy: fallbackDispatcherPolicy,
        ownedDispatchers
    });
    let stickyAttemptIndex = 0;
    let stickySuccessCount = 0;
    let primaryProbeDue = false;
    const attemptHealth = transportAttempts.map(()=>({
            consecutiveFailures: 0,
            cooldownMs: TELEGRAM_TRANSPORT_ATTEMPT_INITIAL_COOLDOWN_MS,
            unhealthyUntilMs: 0
        }));
    const resetStickyRecoveryProbe = ()=>{
        stickySuccessCount = 0;
        primaryProbeDue = false;
    };
    const getAttemptCooldownError = (attemptIndex)=>{
        const health = attemptHealth[attemptIndex];
        if (!(0, _numberruntime.isFutureDateTimestampMs)(health.unhealthyUntilMs)) {
            return null;
        }
        return new TelegramTransportAttemptUnhealthyError(health.unhealthyUntilMs);
    };
    const recordAttemptFailure = (attemptIndex, err)=>{
        if (!shouldUseTelegramTransportFallback(err)) {
            return;
        }
        const health = attemptHealth[attemptIndex];
        health.consecutiveFailures += 1;
        if (health.consecutiveFailures < TELEGRAM_TRANSPORT_ATTEMPT_FAILURE_THRESHOLD) {
            return;
        }
        const cooldownMs = Math.min(TELEGRAM_TRANSPORT_ATTEMPT_MAX_COOLDOWN_MS, Math.max(TELEGRAM_TRANSPORT_ATTEMPT_INITIAL_COOLDOWN_MS, health.cooldownMs));
        health.consecutiveFailures = 0;
        health.cooldownMs = Math.min(TELEGRAM_TRANSPORT_ATTEMPT_MAX_COOLDOWN_MS, cooldownMs * 2);
        const unhealthyUntilMs = (0, _numberruntime.resolveExpiresAtMsFromDurationMs)(cooldownMs);
        if (unhealthyUntilMs === undefined) {
            health.unhealthyUntilMs = 0;
            return;
        }
        health.unhealthyUntilMs = unhealthyUntilMs;
        log.warn(`telegram transport attempt marked temporarily unhealthy for ${cooldownMs}ms (codes=${formatErrorCodes(err)})`);
    };
    const promoteStickyAttempt = (nextIndex, err, reason)=>{
        if (nextIndex <= stickyAttemptIndex || nextIndex >= transportAttempts.length) {
            return false;
        }
        const nextAttempt = transportAttempts[nextIndex];
        if (nextAttempt.logMessage) {
            const reasonText = reason ? `, reason=${reason}` : "";
            const logLine = `${nextAttempt.logMessage} (codes=${formatErrorCodes(err)}${reasonText})`;
            if (nextAttempt.logLevel === "debug") {
                log.debug(logLine);
            } else {
                log.warn(logLine);
            }
        }
        stickyAttemptIndex = nextIndex;
        resetStickyRecoveryProbe();
        return true;
    };
    const recordSuccessfulAttempt = (attemptIndex)=>{
        const health = attemptHealth[attemptIndex];
        health.consecutiveFailures = 0;
        health.cooldownMs = TELEGRAM_TRANSPORT_ATTEMPT_INITIAL_COOLDOWN_MS;
        health.unhealthyUntilMs = 0;
        if (stickyAttemptIndex === 0) {
            resetStickyRecoveryProbe();
            return;
        }
        if (attemptIndex < stickyAttemptIndex) {
            log.debug(`fetch fallback: recovered from attempt ${stickyAttemptIndex} to attempt ${attemptIndex}`);
            stickyAttemptIndex = attemptIndex;
            resetStickyRecoveryProbe();
            return;
        }
        if (attemptIndex !== stickyAttemptIndex) {
            return;
        }
        stickySuccessCount += 1;
        if (stickySuccessCount >= TELEGRAM_STICKY_FALLBACK_PRIMARY_PROBE_SUCCESS_THRESHOLD) {
            stickySuccessCount = 0;
            primaryProbeDue = true;
            log.debug("fetch fallback: scheduling primary dispatcher recovery probe");
        }
    };
    const resolvedFetch = async (input, init)=>{
        const callerProvidedDispatcher = Boolean(init?.dispatcher);
        const stickyStartIndex = Math.min(stickyAttemptIndex, transportAttempts.length - 1);
        const stickyCooldownError = callerProvidedDispatcher ? null : getAttemptCooldownError(stickyStartIndex);
        const primaryProbe = !callerProvidedDispatcher && stickyStartIndex > 0 && (primaryProbeDue || stickyCooldownError !== null);
        const startIndex = primaryProbe ? 0 : stickyStartIndex;
        if (primaryProbe) {
            primaryProbeDue = false;
            log.debug(stickyCooldownError ? "fetch fallback: re-probing primary dispatcher while sticky fallback is cooling down" : "fetch fallback: re-probing primary dispatcher after sticky fallback successes");
        }
        let err;
        if (callerProvidedDispatcher) {
            try {
                const response = await sourceFetch(input, init);
                (0, _proxycapture.captureHttpExchange)({
                    url: (0, _requesturl.resolveRequestUrl)(input),
                    method: init?.method ?? "GET",
                    requestHeaders: init?.headers,
                    requestBody: init?.body ?? null,
                    response,
                    flowId: (0, _nodecrypto.randomUUID)(),
                    meta: {
                        subsystem: "telegram-fetch"
                    }
                });
                return response;
            } catch (caught) {
                if (!shouldUseTelegramTransportFallback(caught)) {
                    throw caught;
                }
                return sourceFetch(input, init ?? {});
            }
        }
        for(let attemptIndex = startIndex; attemptIndex < transportAttempts.length; attemptIndex += 1){
            const attempt = transportAttempts[attemptIndex];
            if (attemptIndex > startIndex) {
                promoteStickyAttempt(attemptIndex, err);
            }
            const cooldownError = getAttemptCooldownError(attemptIndex);
            if (cooldownError) {
                err = cooldownError;
                continue;
            }
            try {
                const response = await sourceFetch(input, withDispatcherIfMissing(init, attempt.createDispatcher()));
                (0, _proxycapture.captureHttpExchange)({
                    url: (0, _requesturl.resolveRequestUrl)(input),
                    method: init?.method ?? "GET",
                    requestHeaders: init?.headers,
                    requestBody: init?.body ?? null,
                    response,
                    flowId: (0, _nodecrypto.randomUUID)(),
                    meta: attemptIndex === startIndex ? {
                        subsystem: "telegram-fetch"
                    } : {
                        subsystem: "telegram-fetch",
                        fallbackAttempt: attemptIndex
                    }
                });
                recordSuccessfulAttempt(attemptIndex);
                return response;
            } catch (caught) {
                err = caught;
                if (!shouldUseTelegramTransportFallback(err)) {
                    throw err;
                }
                recordAttemptFailure(attemptIndex, err);
            }
        }
        throw err;
    };
    let closed = false;
    const close = async ()=>{
        if (closed) {
            return;
        }
        closed = true;
        const toDestroy = [
            ...ownedDispatchers
        ];
        ownedDispatchers.clear();
        await destroyOwnedDispatchers(toDestroy);
    };
    return {
        fetch: resolvedFetch,
        sourceFetch,
        dispatcherAttempts: transportAttempts.map((attempt)=>attempt.exportAttempt),
        forceFallback: (reason)=>promoteStickyAttempt(stickyAttemptIndex + 1, new Error("forced fallback"), reason),
        close
    };
}
function resolveTelegramFetch(proxyFetch, options) {
    return resolveTelegramTransport(proxyFetch, options).fetch;
}
function resolveTelegramApiBase(apiRoot) {
    return (0, _apiroot.normalizeTelegramApiRoot)(apiRoot);
}

//# sourceMappingURL=fetch.js.map