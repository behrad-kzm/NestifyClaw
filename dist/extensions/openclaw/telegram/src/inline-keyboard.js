"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "buildInlineKeyboard", {
    enumerable: true,
    get: function() {
        return buildInlineKeyboard;
    }
});
function toInlineKeyboardButton(button) {
    if (!button?.text) {
        return undefined;
    }
    if (button.url) {
        return button.style ? {
            text: button.text,
            url: button.url,
            style: button.style
        } : {
            text: button.text,
            url: button.url
        };
    }
    if (button.callback_data) {
        return button.style ? {
            text: button.text,
            callback_data: button.callback_data,
            style: button.style
        } : {
            text: button.text,
            callback_data: button.callback_data
        };
    }
    if (button.web_app?.url) {
        return button.style ? {
            text: button.text,
            web_app: {
                url: button.web_app.url
            },
            style: button.style
        } : {
            text: button.text,
            web_app: {
                url: button.web_app.url
            }
        };
    }
    return undefined;
}
function buildInlineKeyboard(buttons) {
    if (!buttons?.length) {
        return undefined;
    }
    const rows = buttons.map((row)=>row.map(toInlineKeyboardButton).filter((button)=>Boolean(button))).filter((row)=>row.length > 0);
    if (rows.length === 0) {
        return undefined;
    }
    return {
        inline_keyboard: rows
    };
}

//# sourceMappingURL=inline-keyboard.js.map