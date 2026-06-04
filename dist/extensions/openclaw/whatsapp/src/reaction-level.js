"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveWhatsAppReactionLevel", {
    enumerable: true,
    get: function() {
        return resolveWhatsAppReactionLevel;
    }
});
const _statushelpers = require("../../../../common/openclaw/plugin-sdk/status-helpers");
const _accountconfig = require("./account-config.js");
function resolveWhatsAppReactionLevel(params) {
    const account = (0, _accountconfig.resolveMergedWhatsAppAccountConfig)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    return (0, _statushelpers.resolveReactionLevel)({
        value: account.reactionLevel,
        defaultLevel: "minimal",
        invalidFallback: "minimal"
    });
}

//# sourceMappingURL=reaction-level.js.map