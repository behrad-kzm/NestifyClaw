"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveMergedWhatsAppAccountConfig", {
    enumerable: true,
    get: function() {
        return resolveMergedWhatsAppAccountConfig;
    }
});
const _accountcore = require("../../../../common/openclaw/plugin-sdk/account-core");
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
function resolveWhatsAppDefaultAccountSharedConfig(cfg) {
    const defaultAccount = (0, _accountcore.resolveAccountEntry)(cfg.channels?.whatsapp?.accounts, _accountcore.DEFAULT_ACCOUNT_ID);
    if (!defaultAccount) {
        return undefined;
    }
    const { enabled: _ignoredEnabled, name: _ignoredName, authDir: _ignoredAuthDir, selfChatMode: _ignoredSelfChatMode, ...sharedDefaults } = defaultAccount;
    return sharedDefaults;
}
function resolveWhatsAppAccountConfigForTest(cfg, accountId) {
    return (0, _accountcore.resolveAccountEntry)(cfg.channels?.whatsapp?.accounts, accountId);
}
function resolveMergedNamedWhatsAppAccountConfig(params) {
    const rootCfg = params.cfg.channels?.whatsapp;
    const accountConfig = resolveWhatsAppAccountConfigForTest(params.cfg, params.accountId);
    return {
        ...(0, _accountcore.mergeAccountConfig)({
            channelConfig: rootCfg,
            accountConfig: undefined,
            omitKeys: [
                "defaultAccount"
            ]
        }),
        ...resolveWhatsAppDefaultAccountSharedConfig(params.cfg),
        ...accountConfig
    };
}
function resolveMergedWhatsAppAccountConfig(params) {
    const rootCfg = params.cfg.channels?.whatsapp;
    const accountId = params.accountId?.trim() || rootCfg?.defaultAccount || _accountcore.DEFAULT_ACCOUNT_ID;
    const base = (0, _accountcore.resolveMergedAccountConfig)({
        channelConfig: rootCfg,
        accounts: rootCfg?.accounts,
        accountId,
        omitKeys: [
            "defaultAccount"
        ]
    });
    const merged = accountId === _accountcore.DEFAULT_ACCOUNT_ID ? base : resolveMergedNamedWhatsAppAccountConfig({
        cfg: params.cfg,
        accountId
    });
    return {
        accountId,
        ...merged,
        chunkMode: (0, _channeloutbound.resolveChannelStreamingChunkMode)(merged) ?? merged.chunkMode,
        blockStreaming: (0, _channeloutbound.resolveChannelStreamingBlockEnabled)(merged) ?? merged.blockStreaming
    };
}

//# sourceMappingURL=account-config.js.map