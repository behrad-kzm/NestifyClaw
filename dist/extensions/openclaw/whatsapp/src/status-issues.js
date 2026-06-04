"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "collectWhatsAppStatusIssues", {
    enumerable: true,
    get: function() {
        return collectWhatsAppStatusIssues;
    }
});
const _cliruntime = require("../../../../common/openclaw/plugin-sdk/cli-runtime");
const _statushelpers = require("../../../../common/openclaw/plugin-sdk/status-helpers");
const RECENT_DISCONNECT_WARNING_WINDOW_MS = 15 * 60 * 1000;
function readWhatsAppAccountStatus(value) {
    if (!(0, _statushelpers.isRecord)(value)) {
        return null;
    }
    return {
        accountId: value.accountId,
        statusState: value.statusState,
        enabled: value.enabled,
        linked: value.linked,
        connected: value.connected,
        running: value.running,
        reconnectAttempts: value.reconnectAttempts,
        lastDisconnect: value.lastDisconnect,
        lastInboundAt: value.lastInboundAt,
        lastError: value.lastError,
        healthState: value.healthState
    };
}
function readLastDisconnect(value) {
    if (typeof value === "string") {
        const error = (0, _statushelpers.asString)(value);
        return error ? {
            at: null,
            error
        } : null;
    }
    if (!(0, _statushelpers.isRecord)(value)) {
        return null;
    }
    return {
        at: typeof value.at === "number" ? value.at : null,
        error: (0, _statushelpers.asString)(value.error)
    };
}
function isRecentDisconnect(disconnect, now = Date.now()) {
    if (disconnect?.at == null) {
        return false;
    }
    return now - disconnect.at <= RECENT_DISCONNECT_WARNING_WINDOW_MS;
}
function collectWhatsAppStatusIssues(accounts) {
    return (0, _statushelpers.collectIssuesForEnabledAccounts)({
        accounts,
        readAccount: readWhatsAppAccountStatus,
        collectIssues: ({ account, accountId, issues })=>{
            const linked = account.linked === true;
            const statusState = (0, _statushelpers.asString)(account.statusState);
            const running = account.running === true;
            const connected = account.connected === true;
            const reconnectAttempts = typeof account.reconnectAttempts === "number" ? account.reconnectAttempts : null;
            const lastInboundAt = typeof account.lastInboundAt === "number" ? account.lastInboundAt : null;
            const lastDisconnect = readLastDisconnect(account.lastDisconnect);
            const lastError = (0, _statushelpers.asString)(account.lastError) ?? lastDisconnect?.error;
            const healthState = (0, _statushelpers.asString)(account.healthState);
            if (statusState === "unstable") {
                issues.push({
                    channel: "whatsapp",
                    accountId,
                    kind: "auth",
                    message: "Auth state is still stabilizing.",
                    fix: "Wait a moment for queued credential writes to finish, then retry the command or rerun health."
                });
                return;
            }
            if (!linked) {
                issues.push({
                    channel: "whatsapp",
                    accountId,
                    kind: "auth",
                    message: "Not linked (no WhatsApp Web session).",
                    fix: `Run: ${(0, _cliruntime.formatCliCommand)("openclaw channels login")} (scan QR on the gateway host).`
                });
                return;
            }
            if (healthState === "stale") {
                const staleSuffix = lastInboundAt != null ? ` (last inbound ${Math.max(0, Math.floor((Date.now() - lastInboundAt) / 60000))}m ago)` : "";
                issues.push({
                    channel: "whatsapp",
                    accountId,
                    kind: "runtime",
                    message: `Linked but stale${staleSuffix}${lastError ? `: ${lastError}` : "."}`,
                    fix: `Run: ${(0, _cliruntime.formatCliCommand)("openclaw doctor")} (or restart the gateway). If it persists, relink via channels login and check logs.`
                });
                return;
            }
            if (healthState === "reconnecting" || healthState === "conflict" || healthState === "stopped") {
                const stateLabel = healthState === "conflict" ? "session conflict" : healthState === "reconnecting" ? "reconnecting" : "stopped";
                issues.push({
                    channel: "whatsapp",
                    accountId,
                    kind: "runtime",
                    message: `Linked but ${stateLabel}${reconnectAttempts != null ? ` (reconnectAttempts=${reconnectAttempts})` : ""}${lastError ? `: ${lastError}` : "."}`,
                    fix: `Run: ${(0, _cliruntime.formatCliCommand)("openclaw doctor")} (or restart the gateway). If it persists, relink via channels login and check logs.`
                });
                return;
            }
            if (healthState === "logged-out") {
                issues.push({
                    channel: "whatsapp",
                    accountId,
                    kind: "auth",
                    message: `Linked session logged out${lastError ? `: ${lastError}` : "."}`,
                    fix: `Run: ${(0, _cliruntime.formatCliCommand)("openclaw channels login")} (scan QR on the gateway host).`
                });
                return;
            }
            if (linked && running && connected && reconnectAttempts != null && reconnectAttempts > 0 && isRecentDisconnect(lastDisconnect)) {
                issues.push({
                    channel: "whatsapp",
                    accountId,
                    kind: "runtime",
                    message: `Linked but recently reconnected (reconnectAttempts=${reconnectAttempts})${lastError ? `: ${lastError}` : "."}`,
                    fix: `Watch: ${(0, _cliruntime.formatCliCommand)("openclaw logs --follow")} and run ${(0, _cliruntime.formatCliCommand)("openclaw channels status --probe")} if disconnects continue. If it keeps flapping, restart the gateway or relink via channels login.`
                });
                return;
            }
            if (running && !connected) {
                issues.push({
                    channel: "whatsapp",
                    accountId,
                    kind: "runtime",
                    message: `Linked but disconnected${reconnectAttempts != null ? ` (reconnectAttempts=${reconnectAttempts})` : ""}${lastError ? `: ${lastError}` : "."}`,
                    fix: `Run: ${(0, _cliruntime.formatCliCommand)("openclaw doctor")} (or restart the gateway). If it persists, relink via channels login and check logs.`
                });
            }
        }
    });
}

//# sourceMappingURL=status-issues.js.map