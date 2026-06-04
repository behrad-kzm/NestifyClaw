"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "loginWeb", {
    enumerable: true,
    get: function() {
        return loginWeb;
    }
});
const _cliruntime = require("../../../../common/openclaw/plugin-sdk/cli-runtime");
const _loggingcore = require("../../../../common/openclaw/plugin-sdk/logging-core");
const _runtimeconfigsnapshot = require("../../../../common/openclaw/plugin-sdk/runtime-config-snapshot");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _accounts = require("./accounts.js");
const _authstore = require("./auth-store.js");
const _connectioncontroller = require("./connection-controller.js");
const _qrterminal = require("./qr-terminal.js");
const _session = require("./session.js");
const _sockettiming = require("./socket-timing.js");
async function loginWeb(verbose, waitForConnection, runtime = _runtimeenv.defaultRuntime, accountId) {
    const cfg = (0, _runtimeconfigsnapshot.getRuntimeConfig)();
    const account = (0, _accounts.resolveWhatsAppAccount)({
        cfg,
        accountId
    });
    const socketTiming = (0, _sockettiming.resolveWhatsAppSocketTiming)(cfg);
    const restoredFromBackup = await (0, _authstore.restoreCredsFromBackupIfNeeded)(account.authDir);
    const onQr = (qr)=>{
        runtime.log("Open the WhatsApp app, go to Linked Devices, then scan this QR:");
        void (0, _qrterminal.renderQrTerminal)(qr, {
            small: true
        }).then((output)=>{
            runtime.log(output.endsWith("\n") ? output.slice(0, -1) : output);
        }).catch((err)=>{
            runtime.error(`failed rendering WhatsApp QR: ${String(err)}`);
        });
    };
    let sock = await (0, _session.createWaSocket)(false, verbose, {
        authDir: account.authDir,
        ...socketTiming,
        onQr
    });
    (0, _loggingcore.logInfo)("Waiting for WhatsApp connection...", runtime);
    try {
        const result = await (0, _connectioncontroller.waitForWhatsAppLoginResult)({
            sock,
            authDir: account.authDir,
            isLegacyAuthDir: account.isLegacyAuthDir,
            verbose,
            runtime,
            waitForConnection,
            socketTiming,
            onQr,
            onSocketReplaced: (replacementSock)=>{
                sock = replacementSock;
            }
        });
        if (result.outcome === "connected") {
            runtime.log((0, _runtimeenv.success)(result.restarted ? "✅ Linked after restart; web session ready." : restoredFromBackup ? "✅ Recovered from creds.json.bak; web session ready." : "✅ Linked! Credentials saved for future sends."));
            return;
        }
        if (result.outcome === "logged-out") {
            runtime.error((0, _runtimeenv.danger)(`WhatsApp reported the session is logged out. Cleared cached web session; please rerun ${(0, _cliruntime.formatCliCommand)("openclaw channels login")} and scan the QR again.`));
            throw new Error("Session logged out; cache cleared. Re-run login.", {
                cause: result.error
            });
        }
        runtime.error((0, _runtimeenv.danger)(`WhatsApp Web connection ended before fully opening. ${result.message}`));
        throw new Error(result.message, {
            cause: result.error
        });
    } finally{
        // Let Baileys flush any final events before closing the socket.
        (0, _connectioncontroller.closeWaSocketSoon)(sock);
    }
}

//# sourceMappingURL=login.js.map