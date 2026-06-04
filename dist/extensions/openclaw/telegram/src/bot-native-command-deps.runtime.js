"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "defaultTelegramNativeCommandDeps", {
    enumerable: true,
    get: function() {
        return defaultTelegramNativeCommandDeps;
    }
});
const _conversationruntime = require("../../../../common/openclaw/plugin-sdk/conversation-runtime");
const _pluginruntime = require("../../../../common/openclaw/plugin-sdk/plugin-runtime");
const _replydispatchruntime = require("../../../../common/openclaw/plugin-sdk/reply-dispatch-runtime");
const _runtimeconfigsnapshot = require("../../../../common/openclaw/plugin-sdk/runtime-config-snapshot");
const _skillcommandsruntime = require("../../../../common/openclaw/plugin-sdk/skill-commands-runtime");
const _botnativecommandmenu = require("./bot-native-command-menu.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
let telegramSendRuntimePromise;
async function loadTelegramSendRuntime() {
    telegramSendRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./send.js")));
    return await telegramSendRuntimePromise;
}
const defaultTelegramNativeCommandDeps = {
    get getRuntimeConfig () {
        return _runtimeconfigsnapshot.getRuntimeConfig;
    },
    get readChannelAllowFromStore () {
        return _conversationruntime.readChannelAllowFromStore;
    },
    get dispatchReplyWithBufferedBlockDispatcher () {
        return _replydispatchruntime.dispatchReplyWithBufferedBlockDispatcher;
    },
    get listSkillCommandsForAgents () {
        return _skillcommandsruntime.listSkillCommandsForAgents;
    },
    get syncTelegramMenuCommands () {
        return _botnativecommandmenu.syncTelegramMenuCommands;
    },
    get getPluginCommandSpecs () {
        return _pluginruntime.getPluginCommandSpecs;
    },
    async editMessageTelegram (...args) {
        const { editMessageTelegram } = await loadTelegramSendRuntime();
        return await editMessageTelegram(...args);
    }
};

//# sourceMappingURL=bot-native-command-deps.runtime.js.map