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
    get WA_WEB_AUTH_DIR () {
        return WA_WEB_AUTH_DIR;
    },
    get WHATSAPP_AUTH_UNSTABLE_CODE () {
        return WHATSAPP_AUTH_UNSTABLE_CODE;
    },
    get WhatsAppAuthUnstableError () {
        return WhatsAppAuthUnstableError;
    },
    get formatWhatsAppWebAuthStatusState () {
        return formatWhatsAppWebAuthStatusState;
    },
    get getWebAuthAgeMs () {
        return getWebAuthAgeMs;
    },
    get hasWebCredsSync () {
        return _credsfiles.hasWebCredsSync;
    },
    get logWebSelfId () {
        return logWebSelfId;
    },
    get logoutWeb () {
        return logoutWeb;
    },
    get pickWebChannel () {
        return pickWebChannel;
    },
    get readCredsJsonRaw () {
        return readCredsJsonRaw;
    },
    get readWebAuthExistsBestEffort () {
        return readWebAuthExistsBestEffort;
    },
    get readWebAuthExistsForDecision () {
        return readWebAuthExistsForDecision;
    },
    get readWebAuthSnapshot () {
        return readWebAuthSnapshot;
    },
    get readWebAuthSnapshotBestEffort () {
        return readWebAuthSnapshotBestEffort;
    },
    get readWebAuthState () {
        return readWebAuthState;
    },
    get readWebSelfId () {
        return readWebSelfId;
    },
    get readWebSelfIdentity () {
        return readWebSelfIdentity;
    },
    get readWebSelfIdentityForDecision () {
        return readWebSelfIdentityForDecision;
    },
    get resolveDefaultWebAuthDir () {
        return resolveDefaultWebAuthDir;
    },
    get resolveWebCredsBackupPath () {
        return _credsfiles.resolveWebCredsBackupPath;
    },
    get resolveWebCredsPath () {
        return _credsfiles.resolveWebCredsPath;
    },
    get restoreCredsFromBackupIfNeeded () {
        return restoreCredsFromBackupIfNeeded;
    },
    get webAuthExists () {
        return webAuthExists;
    }
});
const _promises = /*#__PURE__*/ _interop_require_default(require("node:fs/promises"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _cliruntime = require("../../../../common/openclaw/plugin-sdk/cli-runtime");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _authstoreruntime = require("./auth-store.runtime.js");
const _credsfiles = require("./creds-files.js");
const _credspersistence = require("./creds-persistence.js");
const _identity = require("./identity.js");
const _textruntime = require("./text-runtime.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const WHATSAPP_AUTH_UNSTABLE_CODE = "whatsapp-auth-unstable";
const authStoreLogger = (0, _runtimeenv.getChildLogger)({
    module: "web-auth-store"
});
const emptyWebSelfId = ()=>({
        e164: null,
        jid: null,
        lid: null
    });
let WhatsAppAuthUnstableError = class WhatsAppAuthUnstableError extends Error {
    constructor(message = "WhatsApp auth state is still stabilizing; retry shortly."){
        super(message), this.code = WHATSAPP_AUTH_UNSTABLE_CODE;
        this.name = "WhatsAppAuthUnstableError";
    }
};
function resolveDefaultWebAuthDir() {
    return _nodepath.default.join((0, _authstoreruntime.resolveOAuthDir)(), "whatsapp", _routing.DEFAULT_ACCOUNT_ID);
}
const WA_WEB_AUTH_DIR = resolveDefaultWebAuthDir();
function readCredsJsonRaw(filePath) {
    return (0, _credsfiles.readWebCredsJsonRawSync)(filePath);
}
async function waitForWebAuthBarrier(authDir, context) {
    const result = await (0, _credspersistence.waitForCredsSaveQueueWithTimeout)(authDir);
    if (result === "timed_out") {
        authStoreLogger.warn({
            authDir,
            context
        }, "timed out waiting for queued WhatsApp creds save before auth read");
    }
    return result;
}
async function restoreCredsFromBackupIfNeeded(authDir) {
    const logger = (0, _runtimeenv.getChildLogger)({
        module: "web-session"
    });
    try {
        const credsPath = (0, _credsfiles.resolveWebCredsPath)(authDir);
        const backupPath = (0, _credsfiles.resolveWebCredsBackupPath)(authDir);
        try {
            await (0, _credsfiles.assertWebCredsPathRegularFileOrMissing)(credsPath);
        } catch  {
            return false;
        }
        const raw = readCredsJsonRaw(credsPath);
        if (raw) {
            // Validate that creds.json is parseable.
            JSON.parse(raw);
            return false;
        }
        const backupRaw = readCredsJsonRaw(backupPath);
        if (!backupRaw) {
            return false;
        }
        // Ensure backup is parseable before restoring.
        JSON.parse(backupRaw);
        await (0, _credspersistence.writeWebCredsRawAtomically)({
            filePath: credsPath,
            content: backupRaw,
            tempPrefix: ".creds.restore"
        });
        logger.warn({
            credsPath
        }, "restored corrupted WhatsApp creds.json from backup");
        return true;
    } catch  {
    // ignore
    }
    return false;
}
async function webAuthExists(authDir = resolveDefaultWebAuthDir()) {
    const resolvedAuthDir = (0, _textruntime.resolveUserPath)(authDir);
    const credsPath = (0, _credsfiles.resolveWebCredsPath)(resolvedAuthDir);
    const raw = await (0, _credsfiles.readWebCredsJsonRaw)(credsPath);
    if (!raw) {
        return false;
    }
    try {
        JSON.parse(raw);
        return true;
    } catch  {
        return false;
    }
}
function resolveWebAuthState(params) {
    if (params.barrierResult === "timed_out") {
        return "unstable";
    }
    return params.linked ? "linked" : "not-linked";
}
async function readWebAuthStateCore(authDir, context) {
    const resolvedAuthDir = (0, _textruntime.resolveUserPath)(authDir);
    const barrierResult = await waitForWebAuthBarrier(resolvedAuthDir, context);
    const linked = await webAuthExists(resolvedAuthDir);
    return {
        authDir: resolvedAuthDir,
        linked,
        state: resolveWebAuthState({
            linked,
            barrierResult
        })
    };
}
function formatWhatsAppWebAuthStatusState(state) {
    switch(state){
        case "linked":
            return "linked";
        case "not-linked":
            return "not linked";
        case "unstable":
            return "auth stabilizing";
    }
    const exhaustive = state;
    return exhaustive;
}
async function readWebAuthState(authDir = resolveDefaultWebAuthDir()) {
    return (await readWebAuthStateCore(authDir, "readWebAuthState")).state;
}
async function readWebAuthSnapshot(authDir = resolveDefaultWebAuthDir()) {
    const auth = await readWebAuthStateCore(authDir, "readWebAuthSnapshot");
    return {
        state: auth.state,
        authAgeMs: auth.state === "linked" ? getWebAuthAgeMs(auth.authDir) : null,
        selfId: auth.state === "linked" ? readWebSelfId(auth.authDir) : emptyWebSelfId()
    };
}
async function readWebAuthExistsBestEffort(authDir = resolveDefaultWebAuthDir()) {
    const state = await readWebAuthState(authDir);
    return {
        exists: state === "linked",
        timedOut: state === "unstable"
    };
}
async function readWebAuthExistsForDecision(authDir = resolveDefaultWebAuthDir()) {
    const state = await readWebAuthState(authDir);
    if (state === "unstable") {
        return {
            outcome: "unstable"
        };
    }
    return {
        outcome: "stable",
        exists: state === "linked"
    };
}
async function readWebAuthSnapshotBestEffort(authDir = resolveDefaultWebAuthDir()) {
    const snapshot = await readWebAuthSnapshot(authDir);
    return {
        linked: snapshot.state === "linked",
        timedOut: snapshot.state === "unstable",
        authAgeMs: snapshot.authAgeMs,
        selfId: snapshot.selfId
    };
}
function isBaileysAuthFileName(name) {
    if (name === "oauth.json") {
        return false;
    }
    if (name === "creds.json" || name === "creds.json.bak") {
        return true;
    }
    if (!name.endsWith(".json")) {
        return false;
    }
    return /^(app-state-sync|session|sender-key|pre-key)-/.test(name);
}
async function clearBaileysAuthFiles(authDir) {
    const rootStats = await _promises.default.lstat(authDir).catch(()=>null);
    if (!rootStats?.isDirectory() || rootStats.isSymbolicLink()) {
        return;
    }
    const entries = await _promises.default.readdir(authDir, {
        withFileTypes: true
    });
    await Promise.all(entries.map(async (entry)=>{
        if (!entry.isFile()) {
            return;
        }
        if (!isBaileysAuthFileName(entry.name)) {
            return;
        }
        await _promises.default.rm(_nodepath.default.join(authDir, entry.name), {
            force: true
        });
    }));
}
async function shouldClearOnLogout(authDir, isLegacyAuthDir) {
    try {
        const stats = await _promises.default.lstat(authDir);
        if (!stats.isDirectory() || stats.isSymbolicLink()) {
            return false;
        }
        if (isLegacyAuthDir) {
            const entries = await _promises.default.readdir(authDir, {
                withFileTypes: true
            });
            return entries.some((entry)=>{
                if (!entry.isFile()) {
                    return false;
                }
                return isBaileysAuthFileName(entry.name);
            });
        }
        const credsStats = await _promises.default.lstat((0, _credsfiles.resolveWebCredsPath)(authDir)).catch(()=>null);
        if (credsStats?.isFile()) {
            return true;
        }
        const backupStats = await _promises.default.lstat((0, _credsfiles.resolveWebCredsBackupPath)(authDir)).catch(()=>null);
        return backupStats?.isFile() === true;
    } catch (error) {
        const codeValue = error && typeof error === "object" && "code" in error ? error.code : undefined;
        const code = typeof codeValue === "string" ? codeValue : "";
        return code !== "ENOENT";
    }
}
function isPathInsideDirectory(baseDir, targetPath) {
    const relativePath = _nodepath.default.relative(baseDir, targetPath);
    return relativePath !== "" && !relativePath.startsWith("..") && !_nodepath.default.isAbsolute(relativePath);
}
async function pathHasSymlinkComponent(baseDir, targetPath) {
    const relativePath = _nodepath.default.relative(baseDir, targetPath);
    let currentPath = baseDir;
    for (const segment of relativePath.split(_nodepath.default.sep)){
        currentPath = _nodepath.default.join(currentPath, segment);
        const stats = await _promises.default.lstat(currentPath).catch(()=>null);
        if (!stats || stats.isSymbolicLink()) {
            return true;
        }
    }
    return false;
}
async function isLegacyWebAuthDir(authDir) {
    const legacyAuthDir = _nodepath.default.resolve((0, _authstoreruntime.resolveOAuthDir)());
    const resolvedAuthDir = _nodepath.default.resolve(authDir);
    if (resolvedAuthDir !== legacyAuthDir) {
        return false;
    }
    const stats = await _promises.default.lstat(resolvedAuthDir).catch(()=>null);
    return stats?.isDirectory() === true && !stats.isSymbolicLink();
}
async function classifyWebAuthDirOwnership(authDir) {
    const whatsappAuthBase = _nodepath.default.resolve((0, _authstoreruntime.resolveOAuthDir)(), "whatsapp");
    const resolvedAuthDir = _nodepath.default.resolve(authDir);
    if (!isPathInsideDirectory(whatsappAuthBase, resolvedAuthDir)) {
        return {
            kind: "external"
        };
    }
    const [baseRealPath, authDirRealPath] = await Promise.all([
        _promises.default.realpath(whatsappAuthBase).catch(()=>null),
        _promises.default.realpath(resolvedAuthDir).catch(()=>null)
    ]);
    if (!baseRealPath || !authDirRealPath) {
        return {
            kind: "unsafe-owned"
        };
    }
    if (!isPathInsideDirectory(baseRealPath, authDirRealPath)) {
        return {
            kind: "unsafe-owned"
        };
    }
    if (await pathHasSymlinkComponent(whatsappAuthBase, resolvedAuthDir)) {
        return {
            kind: "unsafe-owned"
        };
    }
    return {
        kind: "owned",
        authDir: resolvedAuthDir
    };
}
async function logoutWeb(params) {
    const runtime = params.runtime ?? _runtimeenv.defaultRuntime;
    const resolvedAuthDir = (0, _textruntime.resolveUserPath)(params.authDir ?? resolveDefaultWebAuthDir());
    const barrierResult = await waitForWebAuthBarrier(resolvedAuthDir, "logoutWeb");
    if (barrierResult === "timed_out") {
        runtime.log((0, _runtimeenv.info)("WhatsApp auth state is still stabilizing; clearing cached credentials anyway."));
    }
    if (!await shouldClearOnLogout(resolvedAuthDir, Boolean(params.isLegacyAuthDir))) {
        runtime.log((0, _runtimeenv.info)("No WhatsApp Web session found; nothing to delete."));
        return false;
    }
    if (params.isLegacyAuthDir) {
        if (!await isLegacyWebAuthDir(resolvedAuthDir)) {
            runtime.log((0, _runtimeenv.info)("Skipped WhatsApp Web credential cleanup outside the managed legacy auth directory."));
            return false;
        }
        await clearBaileysAuthFiles(resolvedAuthDir);
    } else {
        const ownership = await classifyWebAuthDirOwnership(resolvedAuthDir);
        if (ownership.kind === "owned") {
            await _promises.default.rm(ownership.authDir, {
                recursive: true,
                force: true
            });
        } else if (ownership.kind === "unsafe-owned") {
            runtime.log((0, _runtimeenv.info)("Skipped WhatsApp Web credential cleanup because the auth directory crosses a symlink boundary."));
            return false;
        } else {
            runtime.log((0, _runtimeenv.info)("Skipped WhatsApp Web credential cleanup outside the managed auth directory."));
            return false;
        }
    }
    runtime.log((0, _runtimeenv.success)("Cleared WhatsApp Web credentials."));
    return true;
}
function readWebSelfId(authDir = resolveDefaultWebAuthDir()) {
    // Read the cached WhatsApp Web identity (jid + E.164) from disk if present.
    try {
        const credsPath = (0, _credsfiles.resolveWebCredsPath)((0, _textruntime.resolveUserPath)(authDir));
        const raw = readCredsJsonRaw(credsPath);
        if (!raw) {
            return emptyWebSelfId();
        }
        const parsed = JSON.parse(raw);
        const identity = (0, _identity.resolveComparableIdentity)({
            jid: parsed?.me?.id ?? null,
            lid: parsed?.me?.lid ?? null
        }, authDir);
        return {
            e164: identity.e164 ?? null,
            jid: identity.jid ?? null,
            lid: identity.lid ?? null
        };
    } catch  {
        return emptyWebSelfId();
    }
}
async function readWebSelfIdentity(authDir = resolveDefaultWebAuthDir(), fallback) {
    const resolvedAuthDir = (0, _textruntime.resolveUserPath)(authDir);
    const raw = await (0, _credsfiles.readWebCredsJsonRaw)((0, _credsfiles.resolveWebCredsPath)(resolvedAuthDir));
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            return (0, _identity.resolveComparableIdentity)({
                jid: parsed?.me?.id ?? null,
                lid: parsed?.me?.lid ?? null
            }, resolvedAuthDir);
        } catch  {
        // Fall through to the live message identity below when cached creds are corrupt.
        }
    }
    return (0, _identity.resolveComparableIdentity)({
        jid: fallback?.id ?? null,
        lid: fallback?.lid ?? null
    }, resolvedAuthDir);
}
async function readWebSelfIdentityForDecision(authDir = resolveDefaultWebAuthDir(), fallback) {
    const resolvedAuthDir = (0, _textruntime.resolveUserPath)(authDir);
    const result = await waitForWebAuthBarrier(resolvedAuthDir, "readWebSelfIdentityForDecision");
    if (result === "timed_out") {
        return {
            outcome: "unstable"
        };
    }
    return {
        outcome: "stable",
        identity: await readWebSelfIdentity(resolvedAuthDir, fallback)
    };
}
function getWebAuthAgeMs(authDir = resolveDefaultWebAuthDir()) {
    const stats = (0, _credsfiles.statWebCredsFileSync)((0, _credsfiles.resolveWebCredsPath)((0, _textruntime.resolveUserPath)(authDir)));
    return stats ? Math.max(0, Date.now() - stats.mtimeMs) : null;
}
function logWebSelfId(authDir = resolveDefaultWebAuthDir(), runtime = _runtimeenv.defaultRuntime, includeChannelPrefix = false) {
    // Human-friendly log of the currently linked personal web session.
    const { e164, jid, lid } = readWebSelfId(authDir);
    const parts = [
        jid ? `jid ${jid}` : null,
        lid ? `lid ${lid}` : null
    ].filter((value)=>Boolean(value));
    const details = e164 || parts.length > 0 ? `${e164 ?? "unknown"}${parts.length > 0 ? ` (${parts.join(", ")})` : ""}` : "unknown";
    const prefix = includeChannelPrefix ? "Web Channel: " : "";
    runtime.log((0, _runtimeenv.info)(`${prefix}${details}`));
}
async function pickWebChannel(pref, authDir = resolveDefaultWebAuthDir()) {
    const choice = pref === "auto" ? "web" : pref;
    const auth = await readWebAuthExistsForDecision(authDir);
    if (auth.outcome === "unstable") {
        throw new WhatsAppAuthUnstableError();
    }
    if (!auth.exists) {
        throw new Error(`No WhatsApp Web session found. Run \`${(0, _cliruntime.formatCliCommand)("openclaw channels login --channel whatsapp --verbose")}\` to link.`);
    }
    return choice;
}

//# sourceMappingURL=auth-store.js.map