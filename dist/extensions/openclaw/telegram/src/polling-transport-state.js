"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TelegramPollingTransportState", {
    enumerable: true,
    get: function() {
        return TelegramPollingTransportState;
    }
});
let TelegramPollingTransportState = class TelegramPollingTransportState {
    #telegramTransport;
    #transportDirty;
    #disposed;
    constructor(opts){
        this.opts = opts;
        this.#transportDirty = false;
        this.#disposed = false;
        this.#telegramTransport = opts.initialTransport;
    }
    markDirty() {
        this.#transportDirty = true;
    }
    acquireForNextCycle() {
        if (this.#disposed) {
            return undefined;
        }
        const previous = this.#telegramTransport;
        const shouldCreateTransport = this.#transportDirty || !previous;
        const nextTransport = shouldCreateTransport ? this.opts.createTelegramTransport?.() ?? previous : previous;
        // When the dirty flag triggered a rebuild, release the old transport's
        // dispatchers. Without this, each network stall / recoverable error
        // leaves a full pool of keep-alive sockets to api.telegram.org dangling
        // forever — which over long-running sessions accumulates into the
        // hundreds of ESTABLISHED connections that choke per-IP upstream quotas.
        if (this.#transportDirty && previous && nextTransport !== previous) {
            this.opts.log("[telegram][diag] closing stale transport before rebuild");
            this.#closeTransportAsync(previous, "stale-transport rebuild");
        }
        if (this.#transportDirty && nextTransport) {
            this.opts.log("[telegram][diag] rebuilding transport for next polling cycle");
        }
        this.#telegramTransport = nextTransport;
        this.#transportDirty = false;
        return nextTransport;
    }
    async dispose() {
        if (this.#disposed) {
            return;
        }
        this.#disposed = true;
        const transport = this.#telegramTransport;
        this.#telegramTransport = undefined;
        if (!transport) {
            return;
        }
        try {
            await transport.close();
        } catch (err) {
            this.opts.log(`[telegram][diag] failed to close transport during dispose: ${formatCloseError(err)}`);
        }
    }
    // Fire-and-forget close used on the rebuild path so the polling cycle is not
    // blocked by a slow destroy. The error path is logged but never rethrown.
    #closeTransportAsync(transport, context) {
        void transport.close().catch((err)=>{
            this.opts.log(`[telegram][diag] failed to close transport (${context}): ${formatCloseError(err)}`);
        });
    }
};
function formatCloseError(err) {
    if (err instanceof Error) {
        return err.message;
    }
    return String(err);
}

//# sourceMappingURL=polling-transport-state.js.map