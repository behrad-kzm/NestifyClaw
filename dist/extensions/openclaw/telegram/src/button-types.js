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
    get buildTelegramInteractiveButtons () {
        return buildTelegramInteractiveButtons;
    },
    get buildTelegramPresentationButtons () {
        return buildTelegramPresentationButtons;
    },
    get resolveTelegramInlineButtons () {
        return resolveTelegramInlineButtons;
    }
});
const _approvalreplyruntime = require("../../../../common/openclaw/plugin-sdk/approval-reply-runtime");
const _interactiveruntime = require("../../../../common/openclaw/plugin-sdk/interactive-runtime");
const _approvalcallbackdata = require("./approval-callback-data.js");
const _nativecommandcallbackdata = require("./native-command-callback-data.js");
const TELEGRAM_INTERACTIVE_ROW_SIZE = 3;
function toTelegramButtonStyle(style) {
    return style === "danger" || style === "success" || style === "primary" ? style : undefined;
}
function toTelegramInlineButton(button) {
    const style = toTelegramButtonStyle(button.style);
    if (button.url) {
        return {
            text: button.label,
            url: button.url,
            style
        };
    }
    const callbackData = toTelegramCallbackData(button);
    if (callbackData) {
        return {
            text: button.label,
            callback_data: callbackData,
            style
        };
    }
    if (button.webApp?.url) {
        return {
            text: button.label,
            web_app: {
                url: button.webApp.url
            },
            style
        };
    }
    return undefined;
}
function toTelegramCallbackData(button) {
    if (button.action?.type === "command") {
        const command = button.action.command.trim();
        if (!command) {
            return undefined;
        }
        if ((0, _approvalreplyruntime.parseExecApprovalCommandText)(command)) {
            return (0, _approvalcallbackdata.sanitizeTelegramCallbackData)(command);
        }
        const callbackData = (0, _nativecommandcallbackdata.buildTelegramNativeCommandCallbackData)(command);
        return (0, _approvalcallbackdata.sanitizeTelegramCallbackData)(callbackData);
    }
    if (button.action?.type === "callback") {
        return (0, _approvalcallbackdata.sanitizeTelegramCallbackData)((0, _nativecommandcallbackdata.buildTelegramOpaqueCallbackData)(button.action.value));
    }
    return button.value ? (0, _approvalcallbackdata.sanitizeTelegramCallbackData)(button.value) : undefined;
}
function chunkInteractiveButtons(buttons, rows) {
    for(let i = 0; i < buttons.length; i += TELEGRAM_INTERACTIVE_ROW_SIZE){
        const row = buttons.slice(i, i + TELEGRAM_INTERACTIVE_ROW_SIZE).map(toTelegramInlineButton).filter((button)=>Boolean(button));
        if (row.length > 0) {
            rows.push(row);
        }
    }
}
function buildTelegramInteractiveButtons(interactive) {
    const rows = (0, _interactiveruntime.reduceInteractiveReply)(interactive, [], (state, block)=>{
        if (block.type === "buttons") {
            chunkInteractiveButtons(block.buttons, state);
            return state;
        }
        if (block.type === "select") {
            chunkInteractiveButtons(block.options.map((option)=>({
                    label: option.label,
                    value: option.value
                })), state);
        }
        return state;
    });
    return rows.length > 0 ? rows : undefined;
}
function buildTelegramPresentationButtons(presentation) {
    const rows = [];
    for (const block of presentation?.blocks ?? []){
        if (!(0, _interactiveruntime.isMessagePresentationInteractiveBlock)(block)) {
            continue;
        }
        if (block.type === "buttons") {
            chunkInteractiveButtons(block.buttons, rows);
            continue;
        }
        chunkInteractiveButtons(block.options.map((option)=>({
                label: option.label,
                action: option.action,
                value: option.value
            })), rows);
    }
    return rows.length > 0 ? rows : undefined;
}
function resolveTelegramInlineButtons(params) {
    return params.buttons ?? buildTelegramInteractiveButtons((0, _interactiveruntime.normalizeInteractiveReply)(params.interactive)) ?? buildTelegramPresentationButtons((0, _interactiveruntime.normalizeMessagePresentation)(params.presentation));
}

//# sourceMappingURL=button-types.js.map