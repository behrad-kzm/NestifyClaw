"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveTelegramReactionLevel", {
    enumerable: true,
    get: function() {
        return resolveTelegramReactionLevel;
    }
});
const _statushelpers = require("../../../../common/openclaw/plugin-sdk/status-helpers");
const _accountinspect = require("./account-inspect.js");
function resolveTelegramReactionLevel(params) {
    const account = (0, _accountinspect.inspectTelegramAccount)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    return (0, _statushelpers.resolveReactionLevel)({
        value: account.config.reactionLevel,
        defaultLevel: "minimal",
        invalidFallback: "ack"
    });
}

//# sourceMappingURL=reaction-level.js.map