"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "whatsappOutbound", {
    enumerable: true,
    get: function() {
        return whatsappOutbound;
    }
});
const _replychunking = require("../../../../common/openclaw/plugin-sdk/reply-chunking");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _outboundbase = require("./outbound-base.js");
const _outboundmediacontract = require("./outbound-media-contract.js");
const _resolveoutboundtarget = require("./resolve-outbound-target.js");
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
let whatsAppSendModulePromise;
function loadWhatsAppSendModule() {
    whatsAppSendModulePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./send.js")));
    return whatsAppSendModulePromise;
}
function normalizeOutboundText(text) {
    return (0, _outboundmediacontract.normalizeWhatsAppPayloadText)(text);
}
const whatsappOutbound = (0, _outboundbase.createWhatsAppOutboundBase)({
    chunker: _replychunking.chunkText,
    sendMessageWhatsApp: async (to, text, options)=>await (await loadWhatsAppSendModule()).sendMessageWhatsApp(to, normalizeOutboundText(text), {
            ...options
        }),
    sendPollWhatsApp: async (to, poll, options)=>await (await loadWhatsAppSendModule()).sendPollWhatsApp(to, poll, options),
    shouldLogVerbose: ()=>(0, _runtimeenv.shouldLogVerbose)(),
    resolveTarget: ({ to, allowFrom, mode })=>(0, _resolveoutboundtarget.resolveWhatsAppOutboundTarget)({
            to,
            allowFrom,
            mode
        }),
    normalizeText: normalizeOutboundText,
    skipEmptyText: true
});

//# sourceMappingURL=outbound-adapter.js.map