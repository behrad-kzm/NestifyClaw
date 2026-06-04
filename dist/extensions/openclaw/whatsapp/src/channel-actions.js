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
    get describeWhatsAppMessageActions () {
        return describeWhatsAppMessageActions;
    },
    get resolveWhatsAppAgentReactionGuidance () {
        return resolveWhatsAppAgentReactionGuidance;
    }
});
const _channelactionsruntime = require("./channel-actions.runtime.js");
function areWhatsAppAgentReactionsEnabled(params) {
    if (!params.cfg.channels?.whatsapp) {
        return false;
    }
    const gate = (0, _channelactionsruntime.createActionGate)(params.cfg.channels.whatsapp.actions);
    if (!gate("reactions")) {
        return false;
    }
    return (0, _channelactionsruntime.resolveWhatsAppReactionLevel)({
        cfg: params.cfg,
        accountId: params.accountId
    }).agentReactionsEnabled;
}
function hasAnyWhatsAppAccountWithAgentReactionsEnabled(cfg) {
    if (!cfg.channels?.whatsapp) {
        return false;
    }
    return (0, _channelactionsruntime.listWhatsAppAccountIds)(cfg).some((accountId)=>{
        const account = (0, _channelactionsruntime.resolveWhatsAppAccount)({
            cfg,
            accountId
        });
        if (!account.enabled) {
            return false;
        }
        return areWhatsAppAgentReactionsEnabled({
            cfg,
            accountId
        });
    });
}
function resolveWhatsAppAgentReactionGuidance(params) {
    if (!params.cfg.channels?.whatsapp) {
        return undefined;
    }
    const gate = (0, _channelactionsruntime.createActionGate)(params.cfg.channels.whatsapp.actions);
    if (!gate("reactions")) {
        return undefined;
    }
    const resolved = (0, _channelactionsruntime.resolveWhatsAppReactionLevel)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    if (!resolved.agentReactionsEnabled) {
        return undefined;
    }
    return resolved.agentReactionGuidance;
}
function describeWhatsAppMessageActions(params) {
    if (!params.cfg.channels?.whatsapp) {
        return null;
    }
    const gate = (0, _channelactionsruntime.createActionGate)(params.cfg.channels.whatsapp.actions);
    const actions = new Set();
    const canReact = params.accountId != null ? areWhatsAppAgentReactionsEnabled({
        cfg: params.cfg,
        accountId: params.accountId ?? undefined
    }) : hasAnyWhatsAppAccountWithAgentReactionsEnabled(params.cfg);
    if (canReact) {
        actions.add("react");
    }
    if (gate("polls")) {
        actions.add("poll");
    }
    actions.add("upload-file");
    return {
        actions: Array.from(actions)
    };
}

//# sourceMappingURL=channel-actions.js.map