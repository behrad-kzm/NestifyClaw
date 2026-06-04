"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createWhatsAppLoginTool", {
    enumerable: true,
    get: function() {
        return createWhatsAppLoginTool;
    }
});
const _channelactions = require("../../../../common/openclaw/plugin-sdk/channel-actions");
const _typebox = require("typebox");
const _loginqrapi = require("../login-qr-api.js");
const QR_DATA_URL_MAX_LENGTH = 16_384;
function readOptionalString(value) {
    return typeof value === "string" && value.trim() ? value : undefined;
}
function createWhatsAppLoginTool() {
    return {
        label: "WhatsApp Login",
        name: "whatsapp_login",
        description: "Generate a WhatsApp QR code for linking, or wait for the scan to complete.",
        // NOTE: Using Type.Unsafe for action enum instead of Type.Union([Type.Literal(...)]
        // because Claude API on Vertex AI rejects nested anyOf schemas as invalid JSON Schema.
        parameters: _typebox.Type.Object({
            action: _typebox.Type.Unsafe({
                type: "string",
                enum: [
                    "start",
                    "wait"
                ]
            }),
            timeoutMs: (0, _channelactions.optionalPositiveIntegerSchema)(),
            force: _typebox.Type.Optional(_typebox.Type.Boolean()),
            accountId: _typebox.Type.Optional(_typebox.Type.String()),
            currentQrDataUrl: _typebox.Type.Optional(_typebox.Type.String({
                maxLength: QR_DATA_URL_MAX_LENGTH,
                pattern: "^data:image/png;base64,"
            }))
        }),
        execute: async (_toolCallId, args)=>{
            const renderQrReply = (params)=>{
                const text = [
                    params.message,
                    "",
                    "Open WhatsApp → Linked Devices and scan:",
                    "",
                    `![whatsapp-qr](${params.qrDataUrl})`
                ].join("\n");
                return {
                    content: [
                        {
                            type: "text",
                            text
                        }
                    ],
                    details: {
                        connected: params.connected ?? false,
                        qr: true
                    }
                };
            };
            const action = args?.action ?? "start";
            const accountId = readOptionalString(args.accountId);
            const timeoutMs = (0, _channelactions.readPositiveIntegerParam)(args, "timeoutMs");
            if (action === "wait") {
                const result = await (0, _loginqrapi.waitForWebLogin)({
                    accountId,
                    timeoutMs,
                    currentQrDataUrl: readOptionalString(args.currentQrDataUrl)
                });
                if (result.qrDataUrl) {
                    return renderQrReply({
                        message: result.message,
                        qrDataUrl: result.qrDataUrl,
                        connected: result.connected
                    });
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: result.message
                        }
                    ],
                    details: {
                        connected: result.connected
                    }
                };
            }
            const result = await (0, _loginqrapi.startWebLoginWithQr)({
                accountId,
                timeoutMs,
                force: typeof args.force === "boolean" ? args.force : false
            });
            if (!result.qrDataUrl) {
                return {
                    content: [
                        {
                            type: "text",
                            text: result.message
                        }
                    ],
                    details: {
                        qr: false
                    }
                };
            }
            return renderQrReply({
                message: result.message,
                qrDataUrl: result.qrDataUrl,
                connected: result.connected
            });
        }
    };
}

//# sourceMappingURL=agent-tools-login.js.map