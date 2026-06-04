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
    get TELEGRAM_SPOOLED_UPDATE_PROCESSING_STALE_MS () {
        return TELEGRAM_SPOOLED_UPDATE_PROCESSING_STALE_MS;
    },
    get claimTelegramSpooledUpdate () {
        return claimTelegramSpooledUpdate;
    },
    get deleteTelegramSpooledUpdate () {
        return deleteTelegramSpooledUpdate;
    },
    get failTelegramSpooledUpdateClaim () {
        return failTelegramSpooledUpdateClaim;
    },
    get isTelegramSpooledUpdateClaimOwnedByOtherLiveProcess () {
        return isTelegramSpooledUpdateClaimOwnedByOtherLiveProcess;
    },
    get listTelegramSpooledUpdateClaims () {
        return listTelegramSpooledUpdateClaims;
    },
    get listTelegramSpooledUpdates () {
        return listTelegramSpooledUpdates;
    },
    get recoverStaleTelegramSpooledUpdateClaims () {
        return recoverStaleTelegramSpooledUpdateClaims;
    },
    get releaseTelegramSpooledUpdateClaim () {
        return releaseTelegramSpooledUpdateClaim;
    },
    get resolveTelegramIngressSpoolDir () {
        return resolveTelegramIngressSpoolDir;
    },
    get resolveTelegramUpdateId () {
        return resolveTelegramUpdateId;
    },
    get writeTelegramSpooledUpdate () {
        return writeTelegramSpooledUpdate;
    }
});
const _nodecrypto = require("node:crypto");
const _nodeos = /*#__PURE__*/ _interop_require_default(require("node:os"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _statepaths = require("../../../../common/openclaw/plugin-sdk/state-paths");
const _runtime = require("./runtime.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const SPOOL_VERSION = 1;
const TELEGRAM_INGRESS_SPOOL_PREFIX = "ingress-spool-";
const TELEGRAM_SPOOLED_UPDATE_PROCESSING_STALE_MS = 6 * 60 * 60 * 1000;
const TELEGRAM_SPOOLED_UPDATE_FAILED_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TELEGRAM_SPOOLED_UPDATE_FAILED_MAX_ENTRIES = 1000;
const TELEGRAM_SPOOLED_UPDATE_PROCESS_ID = `${process.pid}:${(0, _nodecrypto.randomUUID)()}`;
function normalizeAccountId(accountId) {
    const trimmed = accountId?.trim();
    if (!trimmed) {
        return "default";
    }
    return trimmed.replace(/[^a-z0-9._-]+/gi, "_");
}
function isValidUpdateId(value) {
    return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function resolveTelegramIngressSpoolDir(params) {
    const stateDir = (0, _statepaths.resolveStateDir)(params.env, _nodeos.default.homedir);
    return _nodepath.default.join(stateDir, "telegram", `${TELEGRAM_INGRESS_SPOOL_PREFIX}${normalizeAccountId(params.accountId)}`);
}
function resolveTelegramUpdateId(update) {
    if (!update || typeof update !== "object") {
        return null;
    }
    const value = update.update_id;
    return isValidUpdateId(value) ? value : null;
}
function spoolFileName(updateId) {
    return `${String(updateId).padStart(16, "0")}.json`;
}
function processingFileName(updateId) {
    return `${spoolFileName(updateId)}.processing`;
}
function queueEventId(updateId) {
    return String(updateId).padStart(16, "0");
}
function pendingPath(spoolDir, updateId) {
    return _nodepath.default.join(spoolDir, spoolFileName(updateId));
}
function processingPath(spoolDir, updateId) {
    return _nodepath.default.join(spoolDir, processingFileName(updateId));
}
function resolveQueueParts(spoolDir) {
    const basename = _nodepath.default.basename(spoolDir);
    const accountId = normalizeAccountId(basename.startsWith(TELEGRAM_INGRESS_SPOOL_PREFIX) ? basename.slice(TELEGRAM_INGRESS_SPOOL_PREFIX.length) : basename);
    const stateDir = basename.startsWith(TELEGRAM_INGRESS_SPOOL_PREFIX) && _nodepath.default.basename(_nodepath.default.dirname(spoolDir)) === "telegram" ? _nodepath.default.dirname(_nodepath.default.dirname(spoolDir)) : spoolDir;
    return {
        accountId,
        stateDir
    };
}
function createTelegramIngressQueue(spoolDir) {
    const parts = resolveQueueParts(spoolDir);
    return (0, _runtime.getTelegramRuntime)().state.openChannelIngressQueue({
        accountId: parts.accountId,
        stateDir: parts.stateDir
    });
}
async function pruneTelegramIngressQueue(queue, now) {
    await queue.prune({
        failedTtlMs: TELEGRAM_SPOOLED_UPDATE_FAILED_TTL_MS,
        failedMaxEntries: TELEGRAM_SPOOLED_UPDATE_FAILED_MAX_ENTRIES,
        ...now === undefined ? {} : {
            now
        }
    });
}
function processPidFromOwnerId(ownerId) {
    const pid = Number.parseInt(ownerId.split(":", 1)[0] ?? "", 10);
    return Number.isSafeInteger(pid) && pid > 0 ? pid : -1;
}
function processExists(pid) {
    if (!Number.isSafeInteger(pid) || pid <= 0) {
        return false;
    }
    try {
        process.kill(pid, 0);
        return true;
    } catch (err) {
        const code = err.code;
        return code !== "ESRCH" && code !== "EINVAL";
    }
}
function isFreshClaimOwner(claim) {
    return Date.now() - claim.claimedAt < TELEGRAM_SPOOLED_UPDATE_PROCESSING_STALE_MS;
}
function parseQueueRecord(spoolDir, record) {
    const payload = record.payload;
    if (payload.version !== SPOOL_VERSION || !isValidUpdateId(payload.updateId)) {
        return null;
    }
    return {
        updateId: payload.updateId,
        path: pendingPath(spoolDir, payload.updateId),
        update: payload.update,
        receivedAt: payload.receivedAt
    };
}
function parseQueueClaim(spoolDir, record) {
    const update = parseQueueRecord(spoolDir, record);
    if (!update) {
        return null;
    }
    return {
        ...update,
        path: processingPath(spoolDir, update.updateId),
        pendingPath: pendingPath(spoolDir, update.updateId),
        claim: {
            processId: record.claim.ownerId,
            processPid: processPidFromOwnerId(record.claim.ownerId),
            claimedAt: record.claim.claimedAt,
            claimToken: record.claim.token
        }
    };
}
function sortTelegramUpdates(updates) {
    return updates.toSorted((a, b)=>a.updateId - b.updateId);
}
function queueMutationTarget(update) {
    const id = queueEventId(update.updateId);
    return update.claim?.claimToken ? {
        id,
        claim: {
            token: update.claim.claimToken
        }
    } : id;
}
function isTelegramSpooledUpdateClaimOwnedByOtherLiveProcess(claim) {
    return Boolean(claim.claim && claim.claim.processId !== TELEGRAM_SPOOLED_UPDATE_PROCESS_ID && isFreshClaimOwner(claim.claim) && processExists(claim.claim.processPid));
}
async function writeTelegramSpooledUpdate(params) {
    const updateId = resolveTelegramUpdateId(params.update);
    if (updateId === null) {
        throw new Error("Telegram update missing numeric update_id.");
    }
    const receivedAt = params.now ?? Date.now();
    const queue = createTelegramIngressQueue(params.spoolDir);
    await pruneTelegramIngressQueue(queue, params.now);
    await queue.enqueue(queueEventId(updateId), {
        version: SPOOL_VERSION,
        updateId,
        receivedAt,
        update: params.update
    }, {
        receivedAt
    });
    return updateId;
}
async function listTelegramSpooledUpdates(params) {
    const records = await createTelegramIngressQueue(params.spoolDir).listPending({
        limit: params.limit ?? 100,
        orderBy: "id"
    });
    return sortTelegramUpdates(records.flatMap((record)=>{
        const update = parseQueueRecord(params.spoolDir, record);
        return update ? [
            update
        ] : [];
    }));
}
async function deleteTelegramSpooledUpdate(update) {
    await createTelegramIngressQueue(_nodepath.default.dirname(update.path)).delete(queueMutationTarget(update));
}
async function claimTelegramSpooledUpdate(update) {
    const spoolDir = _nodepath.default.dirname(update.path);
    const claimed = await createTelegramIngressQueue(spoolDir).claim(queueEventId(update.updateId), {
        ownerId: TELEGRAM_SPOOLED_UPDATE_PROCESS_ID
    });
    return claimed ? parseQueueClaim(spoolDir, claimed) : null;
}
async function releaseTelegramSpooledUpdateClaim(update) {
    await createTelegramIngressQueue(_nodepath.default.dirname(update.pendingPath)).release(queueMutationTarget(update));
}
async function failTelegramSpooledUpdateClaim(params) {
    const queue = createTelegramIngressQueue(_nodepath.default.dirname(params.update.pendingPath));
    const failed = await queue.fail(queueMutationTarget(params.update), {
        reason: params.reason,
        message: params.message,
        ...params.now === undefined ? {} : {
            failedAt: params.now
        }
    });
    await pruneTelegramIngressQueue(queue, params.now);
    return failed;
}
async function listTelegramSpooledUpdateClaims(params) {
    const claims = await createTelegramIngressQueue(params.spoolDir).listClaims();
    return sortTelegramUpdates(claims.flatMap((claim)=>{
        const update = parseQueueClaim(params.spoolDir, claim);
        return update ? [
            update
        ] : [];
    }));
}
async function recoverStaleTelegramSpooledUpdateClaims(params) {
    const shouldRecover = params.shouldRecover;
    return await createTelegramIngressQueue(params.spoolDir).recoverStaleClaims({
        staleMs: params.staleMs ?? TELEGRAM_SPOOLED_UPDATE_PROCESSING_STALE_MS,
        ...params.now === undefined ? {} : {
            now: params.now
        },
        ...shouldRecover ? {
            shouldRecover: async (claim)=>{
                const update = parseQueueClaim(params.spoolDir, claim);
                return update ? await shouldRecover(update) : false;
            }
        } : {}
    });
}

//# sourceMappingURL=telegram-ingress-spool.js.map