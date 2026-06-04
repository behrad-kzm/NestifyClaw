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
    get telegramMessageActionRuntime () {
        return telegramMessageActionRuntime;
    },
    get telegramMessageActions () {
        return telegramMessageActions;
    }
});
const _channelactions = require("../../../../common/openclaw/plugin-sdk/channel-actions");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
const _toolsend = require("../../../../common/openclaw/plugin-sdk/tool-send");
const _accountinspect = require("./account-inspect.js");
const _accounts = require("./accounts.js");
const _inlinebuttons = require("./inline-buttons.js");
const _messagetoolschema = require("./message-tool-schema.js");
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
let telegramActionRuntimePromise = null;
async function loadTelegramActionRuntime() {
    telegramActionRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./action-runtime.js")));
    return await telegramActionRuntimePromise;
}
const telegramMessageActionRuntime = {
    handleTelegramAction: async (...args)=>{
        const { handleTelegramAction } = await loadTelegramActionRuntime();
        return await handleTelegramAction(...args);
    }
};
const TELEGRAM_MESSAGE_ACTION_MAP = {
    delete: "deleteMessage",
    edit: "editMessage",
    poll: "poll",
    react: "react",
    send: "sendMessage",
    sticker: "sendSticker",
    "sticker-search": "searchSticker",
    "topic-create": "createForumTopic",
    "topic-edit": "editForumTopic"
};
function resolveTelegramMessageActionName(action) {
    return TELEGRAM_MESSAGE_ACTION_MAP[action];
}
function resolveTelegramActionDiscovery(cfg) {
    const inspected = (0, _accounts.listTelegramAccountIds)(cfg).map((accountId)=>(0, _accountinspect.inspectTelegramAccount)({
            cfg,
            accountId
        })).filter((account)=>account.enabled && account.configured);
    const accounts = (0, _channelactions.listTokenSourcedAccounts)(inspected);
    if (accounts.length === 0) {
        return null;
    }
    const unionGate = (0, _channelactions.createUnionActionGate)(accounts, (account)=>(0, _accounts.createTelegramActionGate)({
            cfg,
            accountId: account.accountId
        }));
    const pollEnabled = accounts.some((account)=>{
        const accountGate = (0, _accounts.createTelegramActionGate)({
            cfg,
            accountId: account.accountId
        });
        return (0, _accounts.resolveTelegramPollActionGateState)(accountGate).enabled;
    });
    const buttonsEnabled = accounts.some((account)=>(0, _inlinebuttons.isTelegramInlineButtonsEnabled)({
            cfg,
            accountId: account.accountId
        }));
    return {
        isEnabled: (key, defaultValue = true)=>unionGate(key, defaultValue),
        pollEnabled,
        buttonsEnabled
    };
}
function resolveScopedTelegramActionDiscovery(params) {
    if (!params.accountId) {
        return resolveTelegramActionDiscovery(params.cfg);
    }
    const account = (0, _accountinspect.inspectTelegramAccount)({
        cfg: params.cfg,
        accountId: params.accountId
    });
    if (!account.enabled || !account.configured || account.tokenSource === "none") {
        return null;
    }
    const gate = (0, _accounts.createTelegramActionGate)({
        cfg: params.cfg,
        accountId: account.accountId
    });
    return {
        isEnabled: (key, defaultValue = true)=>gate(key, defaultValue),
        pollEnabled: (0, _accounts.resolveTelegramPollActionGateState)(gate).enabled,
        buttonsEnabled: (0, _inlinebuttons.isTelegramInlineButtonsEnabled)({
            cfg: params.cfg,
            accountId: account.accountId
        })
    };
}
function describeTelegramMessageTool({ cfg, accountId }) {
    const discovery = resolveScopedTelegramActionDiscovery({
        cfg,
        accountId
    });
    if (!discovery) {
        return {
            actions: [],
            capabilities: [],
            schema: null
        };
    }
    const actions = new Set([
        "send"
    ]);
    if (discovery.pollEnabled) {
        actions.add("poll");
    }
    if (discovery.isEnabled("reactions")) {
        actions.add("react");
    }
    if (discovery.isEnabled("deleteMessage")) {
        actions.add("delete");
    }
    if (discovery.isEnabled("editMessage")) {
        actions.add("edit");
    }
    if (discovery.isEnabled("sticker", false)) {
        actions.add("sticker");
        actions.add("sticker-search");
    }
    if (discovery.isEnabled("createForumTopic")) {
        actions.add("topic-create");
    }
    if (discovery.isEnabled("editForumTopic")) {
        actions.add("topic-edit");
    }
    const schema = [];
    if (discovery.pollEnabled) {
        schema.push({
            properties: (0, _messagetoolschema.createTelegramPollExtraToolSchemas)(),
            visibility: "all-configured"
        });
    }
    return {
        actions: Array.from(actions),
        capabilities: discovery.buttonsEnabled ? [
            "presentation",
            "delivery-pin"
        ] : [
            "delivery-pin"
        ],
        schema
    };
}
const telegramMessageActions = {
    describeMessageTool: describeTelegramMessageTool,
    resolveExecutionMode: ()=>"gateway",
    resolveCliActionRequest: ({ action, args })=>{
        if (action !== "thread-create") {
            return {
                action,
                args
            };
        }
        const { threadName, ...rest } = args;
        return {
            action: "topic-create",
            args: {
                ...rest,
                name: (0, _stringcoerceruntime.readStringValue)(threadName)
            }
        };
    },
    extractToolSend: ({ args })=>{
        return (0, _toolsend.extractToolSend)(args, "sendMessage");
    },
    handleAction: async ({ action, params, cfg, accountId, mediaLocalRoots, mediaReadFile, sessionKey, inboundEventKind, toolContext, gatewayClientScopes })=>{
        const telegramAction = resolveTelegramMessageActionName(action);
        if (!telegramAction) {
            throw new Error(`Unsupported Telegram action: ${action}`);
        }
        return await telegramMessageActionRuntime.handleTelegramAction({
            ...params,
            action: telegramAction,
            accountId: accountId ?? undefined,
            ...action === "react" ? {
                messageId: (0, _channelactions.resolveReactionMessageId)({
                    args: params,
                    toolContext
                })
            } : {}
        }, cfg, {
            mediaLocalRoots,
            mediaReadFile,
            sessionKey,
            inboundEventKind,
            gatewayClientScopes
        });
    }
};

//# sourceMappingURL=channel-actions.js.map