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
    get ensureConfiguredBindingRouteReady () {
        return _conversationruntime.ensureConfiguredBindingRouteReady;
    },
    get executePluginCommand () {
        return _pluginruntime.executePluginCommand;
    },
    get finalizeInboundContext () {
        return _replydispatchruntime.finalizeInboundContext;
    },
    get getAgentScopedMediaLocalRoots () {
        return _mediaruntime.getAgentScopedMediaLocalRoots;
    },
    get getPluginCommandSpecs () {
        return _pluginruntime.getPluginCommandSpecs;
    },
    get getSessionEntry () {
        return _sessionstoreruntime.getSessionEntry;
    },
    get matchPluginCommand () {
        return _pluginruntime.matchPluginCommand;
    },
    get recordInboundSessionMetaSafe () {
        return _conversationruntime.recordInboundSessionMetaSafe;
    },
    get resolveChunkMode () {
        return _replydispatchruntime.resolveChunkMode;
    },
    get resolveThreadSessionKeys () {
        return _routing.resolveThreadSessionKeys;
    }
});
const _conversationruntime = require("../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _mediaruntime = require("../../../../common/openclaw/plugin-sdk/media-runtime");
const _pluginruntime = require("../../../../common/openclaw/plugin-sdk/plugin-runtime");
const _replydispatchruntime = require("../../../../common/openclaw/plugin-sdk/reply-dispatch-runtime");
const _routing = require("../../../../common/openclaw/plugin-sdk/routing");
const _sessionstoreruntime = require("../../../../common/openclaw/plugin-sdk/session-store-runtime");

//# sourceMappingURL=bot-native-commands.runtime.js.map