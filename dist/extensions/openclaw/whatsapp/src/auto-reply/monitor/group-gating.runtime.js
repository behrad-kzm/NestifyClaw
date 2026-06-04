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
    get createChannelHistoryWindow () {
        return _replyhistory.createChannelHistoryWindow;
    },
    get hasControlCommand () {
        return _commanddetection.hasControlCommand;
    },
    get implicitMentionKindWhen () {
        return _channelmentiongating.implicitMentionKindWhen;
    },
    get normalizeE164 () {
        return _textruntime.normalizeE164;
    },
    get parseActivationCommand () {
        return _groupactivation.parseActivationCommand;
    },
    get resolveInboundMentionDecision () {
        return _channelmentiongating.resolveInboundMentionDecision;
    }
});
const _channelmentiongating = require("../../../../../../common/openclaw/plugin-sdk/channel-mention-gating");
const _commanddetection = require("../../../../../../common/openclaw/plugin-sdk/command-detection");
const _replyhistory = require("../../../../../../common/openclaw/plugin-sdk/reply-history");
const _groupactivation = require("../../../../../../common/openclaw/plugin-sdk/group-activation");
const _textruntime = require("../../text-runtime.js");

//# sourceMappingURL=group-gating.runtime.js.map