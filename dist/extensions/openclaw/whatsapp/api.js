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
    get DEFAULT_WEB_MEDIA_BYTES () {
        return _constants.DEFAULT_WEB_MEDIA_BYTES;
    },
    get DEFAULT_WHATSAPP_MEDIA_MAX_MB () {
        return _accounts.DEFAULT_WHATSAPP_MEDIA_MAX_MB;
    },
    get WHATSAPP_LEGACY_OUTBOUND_SEND_DEP_KEYS () {
        return _outboundsenddeps.WHATSAPP_LEGACY_OUTBOUND_SEND_DEP_KEYS;
    },
    get assertWebChannel () {
        return _textruntime.assertWebChannel;
    },
    get hasAnyWhatsAppAuth () {
        return _accounts.hasAnyWhatsAppAuth;
    },
    get isSelfChatMode () {
        return _textruntime.isSelfChatMode;
    },
    get isWhatsAppGroupJid () {
        return _normalizetarget.isWhatsAppGroupJid;
    },
    get isWhatsAppUserTarget () {
        return _normalizetarget.isWhatsAppUserTarget;
    },
    get jidToE164 () {
        return _textruntime.jidToE164;
    },
    get listEnabledWhatsAppAccounts () {
        return _accounts.listEnabledWhatsAppAccounts;
    },
    get listWhatsAppAccountIds () {
        return _accounts.listWhatsAppAccountIds;
    },
    get listWhatsAppAuthDirs () {
        return _accounts.listWhatsAppAuthDirs;
    },
    get listWhatsAppDirectoryGroupsFromConfig () {
        return _directoryconfig.listWhatsAppDirectoryGroupsFromConfig;
    },
    get listWhatsAppDirectoryPeersFromConfig () {
        return _directoryconfig.listWhatsAppDirectoryPeersFromConfig;
    },
    get looksLikeWhatsAppTargetId () {
        return _normalizetarget.looksLikeWhatsAppTargetId;
    },
    get markdownToWhatsApp () {
        return _textruntime.markdownToWhatsApp;
    },
    get normalizeE164 () {
        return _textruntime.normalizeE164;
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
    get resolveDefaultWhatsAppAccountId () {
        return _accounts.resolveDefaultWhatsAppAccountId;
    },
    get resolveJidToE164 () {
        return _textruntime.resolveJidToE164;
    },
    get resolveUserPath () {
        return _textruntime.resolveUserPath;
    },
    get resolveWhatsAppAccount () {
        return _accounts.resolveWhatsAppAccount;
    },
    get resolveWhatsAppAuthDir () {
        return _accounts.resolveWhatsAppAuthDir;
    },
    get resolveWhatsAppGroupIntroHint () {
        return _runtimeapi.resolveWhatsAppGroupIntroHint;
    },
    get resolveWhatsAppGroupRequireMention () {
        return _grouppolicy.resolveWhatsAppGroupRequireMention;
    },
    get resolveWhatsAppGroupToolPolicy () {
        return _grouppolicy.resolveWhatsAppGroupToolPolicy;
    },
    get resolveWhatsAppMediaMaxBytes () {
        return _accounts.resolveWhatsAppMediaMaxBytes;
    },
    get resolveWhatsAppOutboundTarget () {
        return _resolveoutboundtarget.resolveWhatsAppOutboundTarget;
    },
    get startWhatsAppQaDriverSession () {
        return _qadriverruntime.startWhatsAppQaDriverSession;
    },
    get toWhatsappJid () {
        return _textruntime.toWhatsappJid;
    },
    get toWhatsappJidWithLid () {
        return _textruntime.toWhatsappJidWithLid;
    },
    get whatsappAccessControlTesting () {
        return _accesscontrol.testing;
    },
    get whatsappCommandPolicy () {
        return _commandpolicy.whatsappCommandPolicy;
    },
    get whatsappPlugin () {
        return _channel.whatsappPlugin;
    },
    get whatsappSetupPlugin () {
        return _channelsetup.whatsappSetupPlugin;
    }
});
const _channel = require("./src/channel.js");
const _channelsetup = require("./src/channel.setup.js");
const _accounts = require("./src/accounts.js");
const _constants = require("./src/auto-reply/constants.js");
const _commandpolicy = require("./src/command-policy.js");
const _grouppolicy = require("./src/group-policy.js");
const _outboundsenddeps = require("./src/outbound-send-deps.js");
const _textruntime = require("./src/text-runtime.js");
const _directoryconfig = require("./src/directory-config.js");
const _resolveoutboundtarget = require("./src/resolve-outbound-target.js");
const _normalizetarget = require("./src/normalize-target.js");
const _runtimeapi = require("./src/runtime-api.js");
const _accesscontrol = require("./src/inbound/access-control.js");
const _qadriverruntime = require("./src/qa-driver.runtime.js");

//# sourceMappingURL=api.js.map