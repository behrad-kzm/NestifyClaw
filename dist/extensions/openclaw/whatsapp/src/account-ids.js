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
    get listConfiguredAccountIds () {
        return listConfiguredAccountIds;
    },
    get listWhatsAppAccountIds () {
        return listAccountIds;
    },
    get resolveDefaultWhatsAppAccountId () {
        return resolveDefaultWhatsAppAccountId;
    }
});
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
const { listConfiguredAccountIds, listAccountIds, resolveDefaultAccountId: resolveDefaultWhatsAppAccountId } = (0, _accountcore.createAccountListHelpers)("whatsapp", {
    implicitDefaultAccount: {
        channelKeys: [
            "authDir"
        ]
    }
});

//# sourceMappingURL=account-ids.js.map