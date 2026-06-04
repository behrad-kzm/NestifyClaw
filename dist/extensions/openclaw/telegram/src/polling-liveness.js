"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TelegramPollingLivenessTracker", {
    enumerable: true,
    get: function() {
        return TelegramPollingLivenessTracker;
    }
});
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _ssrfruntime = require("../../../../common/openclaw/plugin-sdk/ssrf-runtime");
let TelegramPollingLivenessTracker = class TelegramPollingLivenessTracker {
    #lastGetUpdatesAt;
    #lastGetUpdatesActivityAt;
    #lastGetUpdatesStartedAt;
    #lastGetUpdatesFinishedAt;
    #lastGetUpdatesDurationMs;
    #lastGetUpdatesOutcome;
    #lastGetUpdatesError;
    #lastGetUpdatesOffset;
    #inFlightGetUpdates;
    #stallDiagLoggedAt;
    constructor(options = {}){
        this.options = options;
        this.#lastGetUpdatesStartedAt = null;
        this.#lastGetUpdatesFinishedAt = null;
        this.#lastGetUpdatesDurationMs = null;
        this.#lastGetUpdatesOutcome = "not-started";
        this.#lastGetUpdatesError = null;
        this.#lastGetUpdatesOffset = null;
        this.#inFlightGetUpdates = 0;
        this.#stallDiagLoggedAt = 0;
        this.#lastGetUpdatesAt = this.#now();
        this.#lastGetUpdatesActivityAt = this.#lastGetUpdatesAt;
    }
    get inFlightGetUpdates() {
        return this.#inFlightGetUpdates;
    }
    noteGetUpdatesStarted(payload, at = this.#now()) {
        this.#lastGetUpdatesAt = at;
        this.#lastGetUpdatesActivityAt = at;
        this.#lastGetUpdatesStartedAt = at;
        this.#lastGetUpdatesOffset = resolveGetUpdatesOffset(payload);
        this.#inFlightGetUpdates += 1;
        this.#lastGetUpdatesOutcome = "started";
        this.#lastGetUpdatesError = null;
    }
    noteGetUpdatesSuccess(result, at = this.#now()) {
        this.#lastGetUpdatesActivityAt = at;
        this.#lastGetUpdatesFinishedAt = at;
        this.#lastGetUpdatesDurationMs = this.#lastGetUpdatesStartedAt == null ? null : at - this.#lastGetUpdatesStartedAt;
        this.#lastGetUpdatesOutcome = Array.isArray(result) ? `ok:${result.length}` : "ok";
        this.options.onPollSuccess?.(at);
    }
    noteGetUpdatesSuccessCount(count, at = this.#now()) {
        this.#lastGetUpdatesActivityAt = at;
        this.#lastGetUpdatesFinishedAt = at;
        this.#lastGetUpdatesDurationMs = this.#lastGetUpdatesStartedAt == null ? null : at - this.#lastGetUpdatesStartedAt;
        const normalizedCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
        this.#lastGetUpdatesOutcome = `ok:${normalizedCount}`;
        this.options.onPollSuccess?.(at);
    }
    noteGetUpdatesError(err, at = this.#now()) {
        this.#lastGetUpdatesActivityAt = at;
        this.#lastGetUpdatesFinishedAt = at;
        this.#lastGetUpdatesDurationMs = this.#lastGetUpdatesStartedAt == null ? null : at - this.#lastGetUpdatesStartedAt;
        this.#lastGetUpdatesOutcome = "error";
        this.#lastGetUpdatesError = (0, _ssrfruntime.formatErrorMessage)(err);
    }
    noteGetUpdatesFinished() {
        this.#inFlightGetUpdates = Math.max(0, this.#inFlightGetUpdates - 1);
    }
    noteGetUpdatesActivity(at = this.#now()) {
        this.#lastGetUpdatesActivityAt = at;
    }
    detectStall(params) {
        const now = params.now ?? this.#now();
        const activeElapsed = this.#inFlightGetUpdates > 0 && this.#lastGetUpdatesStartedAt != null ? now - this.#lastGetUpdatesActivityAt : 0;
        const idleElapsed = this.#inFlightGetUpdates > 0 ? 0 : now - (this.#lastGetUpdatesFinishedAt ?? this.#lastGetUpdatesAt);
        const elapsed = this.#inFlightGetUpdates > 0 ? activeElapsed : idleElapsed;
        if (elapsed <= params.thresholdMs) {
            return null;
        }
        if (this.#stallDiagLoggedAt && now - this.#stallDiagLoggedAt < params.thresholdMs / 2) {
            return null;
        }
        this.#stallDiagLoggedAt = now;
        const elapsedLabel = this.#inFlightGetUpdates > 0 ? `active getUpdates stuck for ${(0, _runtimeenv.formatDurationPrecise)(elapsed)}` : `no completed getUpdates for ${(0, _runtimeenv.formatDurationPrecise)(elapsed)}`;
        return {
            message: `Polling stall detected (${elapsedLabel}); forcing restart. [diag ${this.formatDiagnosticFields("error")}]`
        };
    }
    formatDiagnosticFields(errorLabel) {
        const error = this.#lastGetUpdatesError && errorLabel ? ` ${errorLabel}=${this.#lastGetUpdatesError}` : "";
        return `inFlight=${this.#inFlightGetUpdates} outcome=${this.#lastGetUpdatesOutcome} startedAt=${this.#lastGetUpdatesStartedAt ?? "n/a"} finishedAt=${this.#lastGetUpdatesFinishedAt ?? "n/a"} durationMs=${this.#lastGetUpdatesDurationMs ?? "n/a"} offset=${this.#lastGetUpdatesOffset ?? "n/a"}${error}`;
    }
    #now() {
        return this.options.now?.() ?? Date.now();
    }
};
function resolveGetUpdatesOffset(payload) {
    if (!payload || typeof payload !== "object" || !("offset" in payload)) {
        return null;
    }
    const offset = payload.offset;
    return typeof offset === "number" ? offset : null;
}

//# sourceMappingURL=polling-liveness.js.map