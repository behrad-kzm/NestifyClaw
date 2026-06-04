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
    get WhatsAppRetryableInboundError () {
        return WhatsAppRetryableInboundError;
    },
    get claimRecentInboundMessage () {
        return claimRecentInboundMessage;
    },
    get claimRecentInboundMessageDelivery () {
        return claimRecentInboundMessageDelivery;
    },
    get commitRecentInboundMessage () {
        return commitRecentInboundMessage;
    },
    get isRecentOutboundMessage () {
        return isRecentOutboundMessage;
    },
    get releaseRecentInboundMessage () {
        return releaseRecentInboundMessage;
    },
    get rememberRecentOutboundMessage () {
        return rememberRecentOutboundMessage;
    },
    get resetWebInboundDedupe () {
        return resetWebInboundDedupe;
    }
});
const _persistentdedupe = require("../../../../../common/openclaw/plugin-sdk/persistent-dedupe");
const RECENT_WEB_MESSAGE_TTL_MS = 20 * 60_000;
const RECENT_WEB_MESSAGE_MAX = 5000;
const RECENT_OUTBOUND_MESSAGE_TTL_MS = 20 * 60_000;
const RECENT_OUTBOUND_MESSAGE_MAX = 5000;
const claimableInboundMessages = (0, _persistentdedupe.createClaimableDedupe)({
    ttlMs: RECENT_WEB_MESSAGE_TTL_MS,
    memoryMaxSize: RECENT_WEB_MESSAGE_MAX
});
const recentOutboundMessages = createRecentMessageCache({
    ttlMs: RECENT_OUTBOUND_MESSAGE_TTL_MS,
    maxSize: RECENT_OUTBOUND_MESSAGE_MAX
});
function createRecentMessageCache(options) {
    const ttlMs = Math.max(0, options.ttlMs);
    const maxSize = Math.max(0, Math.floor(options.maxSize));
    const cache = new Map();
    const prune = (now)=>{
        if (ttlMs > 0) {
            const cutoff = now - ttlMs;
            for (const [key, timestamp] of cache){
                if (timestamp < cutoff) {
                    cache.delete(key);
                }
            }
        }
        while(cache.size > maxSize){
            const oldest = cache.keys().next().value;
            if (!oldest) {
                break;
            }
            cache.delete(oldest);
        }
    };
    const peek = (key, now = Date.now())=>{
        if (!key) {
            return false;
        }
        const timestamp = cache.get(key);
        if (timestamp === undefined) {
            return false;
        }
        if (ttlMs > 0 && now - timestamp >= ttlMs) {
            cache.delete(key);
            return false;
        }
        return true;
    };
    return {
        check: (key, now = Date.now())=>{
            if (!key) {
                return false;
            }
            const existed = peek(key, now);
            cache.delete(key);
            cache.set(key, now);
            prune(now);
            return existed;
        },
        peek,
        clear: ()=>cache.clear()
    };
}
let WhatsAppRetryableInboundError = class WhatsAppRetryableInboundError extends Error {
    constructor(message, options){
        super(message, options);
        this.name = "WhatsAppRetryableInboundError";
    }
};
function buildMessageKey(params) {
    const accountId = params.accountId.trim();
    const remoteJid = params.remoteJid.trim();
    const messageId = params.messageId.trim();
    if (!accountId || !remoteJid || !messageId || messageId === "unknown") {
        return null;
    }
    return `${accountId}:${remoteJid}:${messageId}`;
}
function resetWebInboundDedupe() {
    claimableInboundMessages.clearMemory();
    recentOutboundMessages.clear();
}
async function claimRecentInboundMessageDelivery(key) {
    const claim = await claimableInboundMessages.claim(key);
    return claim.kind;
}
async function claimRecentInboundMessage(key) {
    return await claimRecentInboundMessageDelivery(key) === "claimed";
}
async function commitRecentInboundMessage(key) {
    await claimableInboundMessages.commit(key);
}
function releaseRecentInboundMessage(key, error) {
    claimableInboundMessages.release(key, {
        error
    });
}
function rememberRecentOutboundMessage(params) {
    const key = buildMessageKey(params);
    if (!key) {
        return;
    }
    recentOutboundMessages.check(key);
}
function isRecentOutboundMessage(params) {
    const key = buildMessageKey(params);
    if (!key) {
        return false;
    }
    return recentOutboundMessages.peek(key);
}

//# sourceMappingURL=dedupe.js.map