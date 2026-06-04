"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "startWhatsAppQaDriverSession", {
    enumerable: true,
    get: function() {
        return startWhatsAppQaDriverSession;
    }
});
const _extract = require("./inbound/extract.js");
const _sendapi = require("./inbound/send-api.js");
const _session = require("./session.js");
const _textruntime = require("./text-runtime.js");
function normalizeObservedMessage(message, authDir) {
    if (message.key.fromMe) {
        return null;
    }
    const text = (0, _extract.extractText)(message.message ?? undefined);
    if (!text) {
        return null;
    }
    const fromJid = message.key.remoteJid ?? undefined;
    return {
        fromJid,
        fromPhoneE164: fromJid ? (0, _textruntime.jidToE164)(fromJid, {
            authDir
        }) : null,
        messageId: message.key.id ?? undefined,
        observedAt: new Date().toISOString(),
        text
    };
}
function closeSocket(sock) {
    const maybeEnd = sock.end;
    if (typeof maybeEnd === "function") {
        maybeEnd.call(sock);
        return;
    }
    const maybeClose = sock.ws?.close;
    if (typeof maybeClose === "function") {
        maybeClose.call(sock.ws);
    }
}
async function startWhatsAppQaDriverSession(params) {
    const sock = await (0, _session.createWaSocket)(false, false, {
        authDir: params.authDir
    });
    const observedMessages = [];
    const waiters = [];
    let closed = false;
    const removeWaiter = (waiter)=>{
        const index = waiters.indexOf(waiter);
        if (index >= 0) {
            waiters.splice(index, 1);
        }
        clearTimeout(waiter.timeout);
    };
    const observe = (message)=>{
        observedMessages.push(message);
        for (const waiter of waiters.slice()){
            if (!waiter.predicate(message)) {
                continue;
            }
            removeWaiter(waiter);
            waiter.resolve(message);
        }
    };
    const onMessagesUpsert = (event)=>{
        for (const rawMessage of event.messages ?? []){
            const observed = normalizeObservedMessage(rawMessage, params.authDir);
            if (observed) {
                observe(observed);
            }
        }
    };
    const removeMessageListener = ()=>{
        const evWithOff = sock.ev;
        evWithOff.off?.("messages.upsert", onMessagesUpsert);
    };
    const closeSessionResources = (waiterError)=>{
        if (closed) {
            return;
        }
        closed = true;
        for (const waiter of waiters.slice()){
            removeWaiter(waiter);
            if (waiterError) {
                waiter.reject(waiterError);
            }
        }
        removeMessageListener();
        closeSocket(sock);
    };
    sock.ev.on("messages.upsert", onMessagesUpsert);
    let connectionTimeout;
    try {
        await Promise.race([
            (0, _session.waitForWaConnection)(sock),
            new Promise((_, reject)=>{
                connectionTimeout = setTimeout(()=>reject(new Error("timed out waiting for WhatsApp QA driver session")), params.connectionTimeoutMs ?? 45_000);
                connectionTimeout.unref?.();
            })
        ]);
    } catch (error) {
        closeSessionResources(error instanceof Error ? error : new Error("failed starting WhatsApp QA driver session"));
        throw error;
    } finally{
        if (connectionTimeout) {
            clearTimeout(connectionTimeout);
        }
    }
    const sendApi = (0, _sendapi.createWebSendApi)({
        sock,
        defaultAccountId: "qa-driver"
    });
    return {
        async close () {
            closeSessionResources(new Error("WhatsApp QA driver session closed"));
        },
        getObservedMessages () {
            return [
                ...observedMessages
            ];
        },
        async sendText (to, text) {
            const result = await sendApi.sendMessage(to, text);
            return {
                messageId: result.messageId
            };
        },
        async waitForMessage (paramsLocal) {
            const existing = observedMessages.find(paramsLocal.match);
            if (existing) {
                return existing;
            }
            return await new Promise((resolve, reject)=>{
                const waiter = {
                    predicate: paramsLocal.match,
                    resolve,
                    reject,
                    timeout: setTimeout(()=>{
                        removeWaiter(waiter);
                        reject(new Error("timed out waiting for WhatsApp QA driver message"));
                    }, paramsLocal.timeoutMs)
                };
                waiters.push(waiter);
            });
        }
    };
}

//# sourceMappingURL=qa-driver.runtime.js.map