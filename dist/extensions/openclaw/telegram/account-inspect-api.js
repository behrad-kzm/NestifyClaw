"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "inspectTelegramReadOnlyAccount", {
    enumerable: true,
    get: function() {
        return inspectTelegramReadOnlyAccount;
    }
});
const _accountinspect = require("./src/account-inspect.js");
function inspectTelegramReadOnlyAccount(cfg, accountId) {
    return (0, _accountinspect.inspectTelegramAccount)({
        cfg,
        accountId
    });
}

//# sourceMappingURL=account-inspect-api.js.map