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
    get DEFAULT_ACCOUNT_ID () {
        return _accountid.DEFAULT_ACCOUNT_ID;
    },
    get ToolAuthorizationError () {
        return _channelactions.ToolAuthorizationError;
    },
    get WhatsAppConfigSchema () {
        return _configapi.WhatsAppConfigSchema;
    },
    get buildChannelConfigSchema () {
        return _configapi.buildChannelConfigSchema;
    },
    get createActionGate () {
        return _channelactions.createActionGate;
    },
    get createWhatsAppOutboundBase () {
        return _outboundbase.createWhatsAppOutboundBase;
    },
    get formatWhatsAppConfigAllowFromEntries () {
        return _configaccessors.formatWhatsAppConfigAllowFromEntries;
    },
    get getChatChannelMeta () {
        return _core.getChatChannelMeta;
    },
    get isWhatsAppGroupJid () {
        return _normalizetarget.isWhatsAppGroupJid;
    },
    get isWhatsAppUserTarget () {
        return _normalizetarget.isWhatsAppUserTarget;
    },
    get jsonResult () {
        return _channelactions.jsonResult;
    },
    get loadOutboundMediaFromUrl () {
        return _outboundmediaruntime.loadOutboundMediaFromUrl;
    },
    get looksLikeWhatsAppTargetId () {
        return _normalizetarget.looksLikeWhatsAppTargetId;
    },
    get monitorWebChannel () {
        return monitorWebChannel;
    },
    get normalizeE164 () {
        return _accountresolution.normalizeE164;
    },
    get normalizeWhatsAppAllowFromEntries () {
        return _normalizetarget.normalizeWhatsAppAllowFromEntries;
    },
    get normalizeWhatsAppMessagingTarget () {
        return _normalizetarget.normalizeWhatsAppMessagingTarget;
    },
    get normalizeWhatsAppTarget () {
        return _normalizetarget.normalizeWhatsAppTarget;
    },
    get readReactionParams () {
        return _channelactions.readReactionParams;
    },
    get readStringParam () {
        return _channelactions.readStringParam;
    },
    get resolveWhatsAppConfigAllowFrom () {
        return _configaccessors.resolveWhatsAppConfigAllowFrom;
    },
    get resolveWhatsAppConfigDefaultTo () {
        return _configaccessors.resolveWhatsAppConfigDefaultTo;
    },
    get resolveWhatsAppGroupIntroHint () {
        return _groupintro.resolveWhatsAppGroupIntroHint;
    },
    get resolveWhatsAppGroupRequireMention () {
        return _grouppolicy.resolveWhatsAppGroupRequireMention;
    },
    get resolveWhatsAppGroupToolPolicy () {
        return _grouppolicy.resolveWhatsAppGroupToolPolicy;
    },
    get resolveWhatsAppMentionStripRegexes () {
        return _groupintro.resolveWhatsAppMentionStripRegexes;
    },
    get resolveWhatsAppOutboundTarget () {
        return _resolveoutboundtarget.resolveWhatsAppOutboundTarget;
    },
    get resolveWhatsAppReactionLevel () {
        return _reactionlevel.resolveWhatsAppReactionLevel;
    }
});
const _core = require("../../../../common/openclaw/plugin-sdk/core");
const _configapi = require("../config-api.js");
const _accountid = require("../../../../common/openclaw/plugin-sdk/account-id");
const _configaccessors = require("./config-accessors.js");
const _channelactions = require("../../../../common/openclaw/plugin-sdk/channel-actions");
const _accountresolution = require("../../../../common/openclaw/plugin-sdk/account-resolution");
const _outboundmediaruntime = require("./outbound-media.runtime.js");
const _grouppolicy = require("./group-policy.js");
const _groupintro = require("./group-intro.js");
const _outboundbase = require("./outbound-base.js");
const _normalizetarget = require("./normalize-target.js");
const _resolveoutboundtarget = require("./resolve-outbound-target.js");
const _reactionlevel = require("./reaction-level.js");
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
let channelRuntimePromise = null;
function loadChannelRuntime() {
    channelRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./channel.runtime.js")));
    return channelRuntimePromise;
}
async function monitorWebChannel(...args) {
    const { monitorWebChannel: monitorWebChannelLocal } = await loadChannelRuntime();
    return await monitorWebChannelLocal(...args);
}

//# sourceMappingURL=runtime-api.js.map