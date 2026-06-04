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
    get WHATSAPP_AUTH_UNSTABLE_CODE () {
        return _authstore.WHATSAPP_AUTH_UNSTABLE_CODE;
    },
    get WhatsAppAuthUnstableError () {
        return _authstore.WhatsAppAuthUnstableError;
    },
    get createWaSocket () {
        return createWaSocket;
    },
    get formatError () {
        return _sessionerrors.formatError;
    },
    get getStatusCode () {
        return _sessionerrors.getStatusCode;
    },
    get getWebAuthAgeMs () {
        return _authstore.getWebAuthAgeMs;
    },
    get logWebSelfId () {
        return _authstore.logWebSelfId;
    },
    get logoutWeb () {
        return _authstore.logoutWeb;
    },
    get newConnectionId () {
        return newConnectionId;
    },
    get pickWebChannel () {
        return _authstore.pickWebChannel;
    },
    get readWebAuthExistsBestEffort () {
        return _authstore.readWebAuthExistsBestEffort;
    },
    get readWebAuthExistsForDecision () {
        return _authstore.readWebAuthExistsForDecision;
    },
    get readWebAuthSnapshot () {
        return _authstore.readWebAuthSnapshot;
    },
    get readWebAuthSnapshotBestEffort () {
        return _authstore.readWebAuthSnapshotBestEffort;
    },
    get readWebAuthState () {
        return _authstore.readWebAuthState;
    },
    get readWebSelfId () {
        return _authstore.readWebSelfId;
    },
    get readWebSelfIdentityForDecision () {
        return _authstore.readWebSelfIdentityForDecision;
    },
    get waitForCredsSaveQueue () {
        return _credspersistence.waitForCredsSaveQueue;
    },
    get waitForCredsSaveQueueWithTimeout () {
        return _credspersistence.waitForCredsSaveQueueWithTimeout;
    },
    get waitForWaConnection () {
        return waitForWaConnection;
    },
    get webAuthExists () {
        return _authstore.webAuthExists;
    },
    get writeCredsJsonAtomically () {
        return _credspersistence.writeCredsJsonAtomically;
    }
});
const _nodecrypto = require("node:crypto");
const _cliruntime = require("../../../../common/openclaw/plugin-sdk/cli-runtime");
const _fetchruntime = require("../../../../common/openclaw/plugin-sdk/fetch-runtime");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _textutilityruntime = require("../../../../common/openclaw/plugin-sdk/text-utility-runtime");
const _authstore = require("./auth-store.js");
const _credsfiles = require("./creds-files.js");
const _credspersistence = require("./creds-persistence.js");
const _qrterminal = require("./qr-terminal.js");
const _sessionerrors = require("./session-errors.js");
const _sessionruntime = require("./session.runtime.js");
const _sockettiming = require("./socket-timing.js");
const LOGGED_OUT_STATUS = _sessionruntime.DisconnectReason?.loggedOut ?? 401;
const WHATSAPP_WEBSOCKET_PROXY_TARGET = "https://mmg.whatsapp.net/";
const CREDS_FLUSH_TIMEOUT_MESSAGE = "Queued WhatsApp creds save did not finish before auth bootstrap; skipping repair and continuing with primary creds.";
async function rejectUnsafeWebCredsPath(authDir) {
    await (0, _credsfiles.assertWebCredsPathRegularFileOrMissing)((0, _authstore.resolveWebCredsPath)(authDir));
}
function enqueueSaveCreds(authDir, saveCreds, logger) {
    (0, _credspersistence.enqueueCredsSave)(authDir, ()=>safeSaveCreds(authDir, saveCreds, logger), (err)=>{
        logger.warn({
            error: String(err)
        }, "WhatsApp creds save queue error");
    });
}
async function safeSaveCreds(authDir, saveCreds, logger) {
    try {
        // Best-effort backup so we can recover after abrupt restarts.
        // Important: don't clobber a good backup with a corrupted/truncated creds.json.
        const credsPath = (0, _authstore.resolveWebCredsPath)(authDir);
        const backupPath = (0, _authstore.resolveWebCredsBackupPath)(authDir);
        const raw = (0, _authstore.readCredsJsonRaw)(credsPath);
        if (raw) {
            try {
                JSON.parse(raw);
                await (0, _credspersistence.writeWebCredsRawAtomically)({
                    filePath: backupPath,
                    content: raw,
                    tempPrefix: ".creds.backup"
                });
            } catch  {
            // keep existing backup
            }
        }
    } catch  {
    // ignore backup failures
    }
    try {
        await Promise.resolve(saveCreds());
    } catch (err) {
        logger.warn({
            error: String(err)
        }, "failed saving WhatsApp creds");
    }
}
async function printTerminalQr(qr) {
    const output = await (0, _qrterminal.renderQrTerminal)(qr, {
        small: true
    });
    process.stdout.write(output.endsWith("\n") ? output : `${output}\n`);
}
async function createWaSocket(printQr, verbose, opts = {}) {
    const baseLogger = (0, _runtimeenv.getChildLogger)({
        module: "baileys"
    }, {
        level: verbose ? "info" : "silent"
    });
    const logger = (0, _runtimeenv.toPinoLikeLogger)(baseLogger, verbose ? "info" : "silent");
    const authDir = (0, _textutilityruntime.resolveUserPath)(opts.authDir ?? (0, _authstore.resolveDefaultWebAuthDir)());
    await rejectUnsafeWebCredsPath(authDir);
    await (0, _textutilityruntime.ensureDir)(authDir);
    const sessionLogger = (0, _runtimeenv.getChildLogger)({
        module: "web-session"
    });
    const queueResult = await (0, _credspersistence.waitForCredsSaveQueueWithTimeout)(authDir);
    if (queueResult === "timed_out") {
        sessionLogger.warn({
            authDir
        }, CREDS_FLUSH_TIMEOUT_MESSAGE);
    } else {
        await rejectUnsafeWebCredsPath(authDir);
        await (0, _authstore.restoreCredsFromBackupIfNeeded)(authDir);
    }
    await rejectUnsafeWebCredsPath(authDir);
    const { state } = await (0, _sessionruntime.useMultiFileAuthState)(authDir);
    const saveCreds = async ()=>{
        await (0, _credspersistence.writeCredsJsonAtomically)(authDir, state.creds);
    };
    const { version } = await (0, _sessionruntime.fetchLatestBaileysVersion)();
    const agent = await resolveEnvProxyAgent(sessionLogger);
    const fetchAgent = await resolveEnvFetchDispatcher(sessionLogger, agent);
    const socketTiming = {
        keepAliveIntervalMs: opts.keepAliveIntervalMs ?? _sockettiming.DEFAULT_WHATSAPP_SOCKET_TIMING.keepAliveIntervalMs,
        connectTimeoutMs: opts.connectTimeoutMs ?? _sockettiming.DEFAULT_WHATSAPP_SOCKET_TIMING.connectTimeoutMs,
        defaultQueryTimeoutMs: opts.defaultQueryTimeoutMs ?? _sockettiming.DEFAULT_WHATSAPP_SOCKET_TIMING.defaultQueryTimeoutMs
    };
    const sock = (0, _sessionruntime.makeWASocket)({
        auth: {
            creds: state.creds,
            keys: (0, _sessionruntime.makeCacheableSignalKeyStore)(state.keys, logger)
        },
        version,
        logger,
        printQRInTerminal: false,
        browser: [
            "openclaw",
            "cli",
            _cliruntime.VERSION
        ],
        syncFullHistory: false,
        markOnlineOnConnect: false,
        ...socketTiming,
        agent,
        // Baileys types still model `fetchAgent` as a Node agent even though the
        // runtime path accepts an undici dispatcher for upload fetches.
        fetchAgent: fetchAgent
    });
    sock.ev.on("creds.update", ()=>enqueueSaveCreds(authDir, saveCreds, sessionLogger));
    sock.ev.on("connection.update", (update)=>{
        void (async ()=>{
            try {
                const { connection, lastDisconnect, qr } = update;
                if (qr) {
                    opts.onQr?.(qr);
                    if (printQr) {
                        console.log("Open the WhatsApp app, go to Linked Devices, then scan this QR:");
                        void printTerminalQr(qr).catch((err)=>{
                            sessionLogger.warn({
                                error: String(err)
                            }, "failed rendering WhatsApp QR");
                        });
                    }
                }
                if (connection === "close") {
                    const status = (0, _sessionerrors.getStatusCode)(lastDisconnect?.error);
                    if (status === LOGGED_OUT_STATUS) {
                        console.error((0, _runtimeenv.danger)(`WhatsApp session logged out. Run: ${(0, _cliruntime.formatCliCommand)("openclaw channels login")}`));
                    }
                }
                if (connection === "open" && verbose) {
                    console.log((0, _runtimeenv.success)("WhatsApp Web connected."));
                }
            } catch (err) {
                sessionLogger.error({
                    error: String(err)
                }, "connection.update handler error");
            }
        })();
    });
    // Handle WebSocket-level errors to prevent unhandled exceptions from crashing the process
    if (sock.ws && typeof sock.ws.on === "function") {
        sock.ws.on("error", (err)=>{
            sessionLogger.error({
                error: String(err)
            }, "WebSocket error");
        });
    }
    return sock;
}
async function resolveEnvProxyAgent(logger) {
    try {
        const agent = (0, _fetchruntime.createNodeProxyAgent)({
            mode: "env",
            targetUrl: WHATSAPP_WEBSOCKET_PROXY_TARGET,
            protocol: "https"
        });
        if (!agent) {
            return undefined;
        }
        logger.info("Using ambient env proxy for WhatsApp WebSocket connection");
        return agent;
    } catch (error) {
        logger.warn({
            error: String(error)
        }, "Failed to initialize env proxy agent for WhatsApp WebSocket connection");
        return undefined;
    }
}
async function resolveEnvFetchDispatcher(logger, agent) {
    const proxyUrl = resolveProxyUrlFromAgent(agent);
    const envProxyUrl = resolveEnvHttpsProxyUrl();
    if (!proxyUrl && !envProxyUrl) {
        return undefined;
    }
    try {
        return proxyUrl ? (0, _fetchruntime.createHttp1ProxyAgent)({
            uri: proxyUrl
        }) : (0, _fetchruntime.createHttp1EnvHttpProxyAgent)();
    } catch (error) {
        logger.warn({
            error: String(error)
        }, "Failed to initialize env proxy dispatcher for WhatsApp media uploads");
        return undefined;
    }
}
function resolveProxyUrlFromAgent(agent) {
    if (typeof agent === "object" && agent !== null && "getProxyForUrl" in agent && typeof agent.getProxyForUrl === "function") {
        const proxyUrl = agent.getProxyForUrl(WHATSAPP_WEBSOCKET_PROXY_TARGET);
        return typeof proxyUrl === "string" && proxyUrl.length > 0 ? proxyUrl : undefined;
    }
    if (typeof agent !== "object" || agent === null || !("proxy" in agent)) {
        return undefined;
    }
    const proxy = agent.proxy;
    if (proxy instanceof URL) {
        return proxy.toString();
    }
    return typeof proxy === "string" && proxy.length > 0 ? proxy : undefined;
}
function resolveEnvHttpsProxyUrl(env = process.env) {
    const lowerHttpsProxy = normalizeEnvProxyValue(env.https_proxy);
    const lowerHttpProxy = normalizeEnvProxyValue(env.http_proxy);
    const httpsProxy = lowerHttpsProxy !== undefined ? lowerHttpsProxy : normalizeEnvProxyValue(env.HTTPS_PROXY);
    const httpProxy = lowerHttpProxy !== undefined ? lowerHttpProxy : normalizeEnvProxyValue(env.HTTP_PROXY);
    return httpsProxy ?? httpProxy ?? undefined;
}
function normalizeEnvProxyValue(value) {
    if (typeof value !== "string") {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
async function waitForWaConnection(sock) {
    return new Promise((resolve, reject)=>{
        const evWithOff = sock.ev;
        const handler = (...args)=>{
            const update = args[0] ?? {};
            if (update.connection === "open") {
                evWithOff.off?.("connection.update", handler);
                resolve();
            }
            if (update.connection === "close") {
                evWithOff.off?.("connection.update", handler);
                reject(toLintErrorObject(update.lastDisconnect ?? new Error("Connection closed"), "Non-Error rejection"));
            }
        };
        sock.ev.on("connection.update", handler);
    });
}
function newConnectionId() {
    return (0, _nodecrypto.randomUUID)();
}
function toLintErrorObject(value, fallbackMessage) {
    if (value instanceof Error) {
        return value;
    }
    if (typeof value === "string") {
        return new Error(value);
    }
    const error = new Error(fallbackMessage, {
        cause: value
    });
    if (typeof value === "object" && value !== null || typeof value === "function") {
        Object.assign(error, value);
    }
    return error;
}

//# sourceMappingURL=session.js.map