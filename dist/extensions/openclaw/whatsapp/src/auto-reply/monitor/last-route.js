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
    get awaitBackgroundTasks () {
        return awaitBackgroundTasks;
    },
    get trackBackgroundTask () {
        return trackBackgroundTask;
    },
    get updateLastRouteInBackground () {
        return updateLastRouteInBackground;
    }
});
const _session = require("../../session.js");
const _configruntime = require("../config.runtime.js");
function trackBackgroundTask(backgroundTasks, task) {
    backgroundTasks.add(task);
    const cleanup = ()=>{
        backgroundTasks.delete(task);
    };
    task.then(cleanup, cleanup);
}
function updateLastRouteInBackground(params) {
    const storePath = (0, _configruntime.resolveStorePath)(params.cfg.session?.store, {
        agentId: params.storeAgentId
    });
    const task = (0, _configruntime.updateLastRoute)({
        storePath,
        sessionKey: params.sessionKey,
        deliveryContext: {
            channel: params.channel,
            to: params.to,
            accountId: params.accountId
        },
        ctx: params.ctx
    }).catch((err)=>{
        params.warn({
            error: (0, _session.formatError)(err),
            storePath,
            sessionKey: params.sessionKey,
            to: params.to
        }, "failed updating last route");
    });
    trackBackgroundTask(params.backgroundTasks, task);
}
function awaitBackgroundTasks(backgroundTasks) {
    if (backgroundTasks.size === 0) {
        return Promise.resolve();
    }
    return Promise.allSettled(backgroundTasks).then(()=>{
        backgroundTasks.clear();
    });
}

//# sourceMappingURL=last-route.js.map