"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "whatsappSetupAdapter", {
    enumerable: true,
    get: function() {
        return whatsappSetupAdapter;
    }
});
const _setup = require("../../../../common/openclaw/plugin-sdk/setup");
const channel = "whatsapp";
const whatsappSetupAdapter = {
    resolveAccountId: ({ accountId })=>(0, _setup.normalizeAccountId)(accountId),
    applyAccountName: ({ cfg, accountId, name })=>(0, _setup.applyAccountNameToChannelSection)({
            cfg,
            channelKey: channel,
            accountId,
            name,
            alwaysUseAccounts: true
        }),
    applyAccountConfig: ({ cfg, accountId, input })=>{
        const namedConfig = (0, _setup.applyAccountNameToChannelSection)({
            cfg,
            channelKey: channel,
            accountId,
            name: input.name,
            alwaysUseAccounts: true
        });
        const next = (0, _setup.migrateBaseNameToDefaultAccount)({
            cfg: namedConfig,
            channelKey: channel,
            alwaysUseAccounts: true
        });
        const entry = {
            ...next.channels?.whatsapp?.accounts?.[accountId],
            ...input.authDir ? {
                authDir: input.authDir
            } : {},
            enabled: true
        };
        return {
            ...next,
            channels: {
                ...next.channels,
                whatsapp: {
                    ...next.channels?.whatsapp,
                    accounts: {
                        ...next.channels?.whatsapp?.accounts,
                        [accountId]: entry
                    }
                }
            }
        };
    }
};

//# sourceMappingURL=setup-core.js.map