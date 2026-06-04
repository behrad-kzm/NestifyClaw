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
    get generateTelegramTopicLabel () {
        return generateTelegramTopicLabel;
    },
    get resolveAutoTopicLabelConfig () {
        return _autotopiclabelconfig.resolveAutoTopicLabelConfig;
    }
});
const _replydispatchruntime = require("../../../../common/openclaw/plugin-sdk/reply-dispatch-runtime");
const _autotopiclabelconfig = require("./auto-topic-label-config.js");
async function generateTelegramTopicLabel(params) {
    return await (0, _replydispatchruntime.generateConversationLabel)({
        ...params,
        maxLength: 128
    });
}

//# sourceMappingURL=auto-topic-label.js.map