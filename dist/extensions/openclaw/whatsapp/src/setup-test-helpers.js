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
    get createWhatsAppAllowlistModeInput () {
        return createWhatsAppAllowlistModeInput;
    },
    get createWhatsAppLinkingHarness () {
        return createWhatsAppLinkingHarness;
    },
    get createWhatsAppOwnerAllowlistHarness () {
        return createWhatsAppOwnerAllowlistHarness;
    },
    get createWhatsAppPersonalPhoneHarness () {
        return createWhatsAppPersonalPhoneHarness;
    },
    get createWhatsAppRootAllowFromConfig () {
        return createWhatsAppRootAllowFromConfig;
    },
    get createWhatsAppWorkAccountConfig () {
        return createWhatsAppWorkAccountConfig;
    },
    get expectNoWhatsAppLoginFollowup () {
        return expectNoWhatsAppLoginFollowup;
    },
    get expectWhatsAppAllowlistModeSetup () {
        return expectWhatsAppAllowlistModeSetup;
    },
    get expectWhatsAppDefaultAccountAccessNote () {
        return expectWhatsAppDefaultAccountAccessNote;
    },
    get expectWhatsAppLoginFollowup () {
        return expectWhatsAppLoginFollowup;
    },
    get expectWhatsAppOpenPolicySetup () {
        return expectWhatsAppOpenPolicySetup;
    },
    get expectWhatsAppOwnerAllowlistSetup () {
        return expectWhatsAppOwnerAllowlistSetup;
    },
    get expectWhatsAppPersonalPhoneSetup () {
        return expectWhatsAppPersonalPhoneSetup;
    },
    get expectWhatsAppSeparatePhoneDisabledSetup () {
        return expectWhatsAppSeparatePhoneDisabledSetup;
    },
    get expectWhatsAppWorkAccountAccessNote () {
        return expectWhatsAppWorkAccountAccessNote;
    },
    get expectWhatsAppWorkAccountOpenAccess () {
        return expectWhatsAppWorkAccountOpenAccess;
    }
});
const _vitest = require("vitest");
const WHATSAPP_OWNER_NUMBER_INPUT = "+1 (555) 555-0123";
const WHATSAPP_OWNER_NUMBER_E164 = "+15555550123";
const WHATSAPP_OWNER_NUMBER = "15555550123";
const WHATSAPP_PERSONAL_NUMBER_INPUT = "+1 (555) 111-2222";
const WHATSAPP_PERSONAL_NUMBER = "15551112222";
const WHATSAPP_ACCESS_NOTE_TITLE = "WhatsApp DM access";
const WHATSAPP_LOGIN_NOTE_TITLE = "WhatsApp";
function createWhatsAppRootAllowFromConfig() {
    return {
        channels: {
            whatsapp: {
                allowFrom: [
                    WHATSAPP_OWNER_NUMBER_E164
                ]
            }
        }
    };
}
function createWhatsAppOwnerAllowlistHarness(createPrompter) {
    return createPrompter({
        confirmValues: [
            false
        ],
        textValues: [
            WHATSAPP_OWNER_NUMBER_INPUT
        ]
    });
}
function createWhatsAppPersonalPhoneHarness(createPrompter) {
    return createPrompter({
        confirmValues: [
            false
        ],
        selectValues: [
            "personal"
        ],
        textValues: [
            WHATSAPP_PERSONAL_NUMBER_INPUT
        ]
    });
}
function createWhatsAppLinkingHarness(createPrompter) {
    return createPrompter({
        confirmValues: [
            true
        ],
        selectValues: [
            "separate",
            "disabled"
        ]
    });
}
function createWhatsAppWorkAccountConfig(params = {}) {
    return {
        channels: {
            whatsapp: {
                ...params.defaultAccount ? {
                    defaultAccount: params.defaultAccount
                } : {},
                dmPolicy: "disabled",
                allowFrom: [
                    WHATSAPP_OWNER_NUMBER_E164
                ],
                accounts: {
                    work: {
                        authDir: "/tmp/work"
                    }
                }
            }
        }
    };
}
function createWhatsAppAllowlistModeInput() {
    return {
        selectValues: [
            "separate",
            "allowlist",
            "list"
        ],
        textValues: [
            `${WHATSAPP_OWNER_NUMBER_INPUT}, ${WHATSAPP_OWNER_NUMBER}, *`
        ]
    };
}
function expectWhatsAppDmAccess(cfg, expected) {
    (0, _vitest.expect)(cfg.channels?.whatsapp?.selfChatMode).toBe(expected.selfChatMode);
    (0, _vitest.expect)(cfg.channels?.whatsapp?.dmPolicy).toBe(expected.dmPolicy);
    if ("allowFrom" in expected) {
        (0, _vitest.expect)(cfg.channels?.whatsapp?.allowFrom).toEqual(expected.allowFrom);
    } else {
        (0, _vitest.expect)(cfg.channels?.whatsapp?.allowFrom).toBeUndefined();
    }
}
function expectWhatsAppWorkAccountOpenAccess(cfg) {
    (0, _vitest.expect)(cfg.channels?.whatsapp?.dmPolicy).toBe("disabled");
    (0, _vitest.expect)(cfg.channels?.whatsapp?.allowFrom).toEqual([
        WHATSAPP_OWNER_NUMBER_E164
    ]);
    (0, _vitest.expect)(cfg.channels?.whatsapp?.accounts?.work?.dmPolicy).toBe("open");
    (0, _vitest.expect)(cfg.channels?.whatsapp?.accounts?.work?.allowFrom).toEqual([
        "*",
        WHATSAPP_OWNER_NUMBER
    ]);
}
function expectWhatsAppOwnerNumberPrompt(harness) {
    (0, _vitest.expect)(harness.text).toHaveBeenCalledWith(_vitest.expect.objectContaining({
        message: "Your personal WhatsApp number (the phone you will message from)"
    }));
}
function expectWhatsAppOwnerAllowlistSetup(cfg, harness) {
    expectWhatsAppDmAccess(cfg, {
        selfChatMode: true,
        dmPolicy: "allowlist",
        allowFrom: [
            WHATSAPP_OWNER_NUMBER
        ]
    });
    expectWhatsAppOwnerNumberPrompt(harness);
}
function expectWhatsAppSeparatePhoneDisabledSetup(cfg, harness) {
    expectWhatsAppDmAccess(cfg, {
        selfChatMode: false,
        dmPolicy: "disabled"
    });
    (0, _vitest.expect)(harness.text).not.toHaveBeenCalled();
}
function expectWhatsAppAllowlistModeSetup(cfg) {
    expectWhatsAppDmAccess(cfg, {
        selfChatMode: false,
        dmPolicy: "allowlist",
        allowFrom: [
            WHATSAPP_OWNER_NUMBER,
            "*"
        ]
    });
}
function expectWhatsAppPersonalPhoneSetup(cfg) {
    expectWhatsAppDmAccess(cfg, {
        selfChatMode: true,
        dmPolicy: "allowlist",
        allowFrom: [
            WHATSAPP_PERSONAL_NUMBER
        ]
    });
}
function expectWhatsAppOpenPolicySetup(cfg, harness) {
    expectWhatsAppDmAccess(cfg, {
        selfChatMode: false,
        dmPolicy: "open",
        allowFrom: [
            "*",
            WHATSAPP_OWNER_NUMBER
        ]
    });
    (0, _vitest.expect)(harness.select).toHaveBeenCalledTimes(2);
    (0, _vitest.expect)(harness.text).not.toHaveBeenCalled();
}
function expectNoWhatsAppLoginFollowup(harness) {
    (0, _vitest.expect)(harness.note).not.toHaveBeenCalledWith(_vitest.expect.stringContaining("openclaw channels login"), WHATSAPP_LOGIN_NOTE_TITLE);
}
function expectWhatsAppLoginFollowup(harness) {
    (0, _vitest.expect)(harness.note).toHaveBeenCalledWith(_vitest.expect.stringContaining("openclaw channels login"), WHATSAPP_LOGIN_NOTE_TITLE);
}
function expectWhatsAppWorkAccountAccessNote(harness) {
    (0, _vitest.expect)(harness.note).toHaveBeenCalledWith(_vitest.expect.stringContaining("`channels.whatsapp.accounts.work.dmPolicy` + `channels.whatsapp.accounts.work.allowFrom`"), WHATSAPP_ACCESS_NOTE_TITLE);
}
function expectWhatsAppDefaultAccountAccessNote(harness) {
    (0, _vitest.expect)(harness.note).toHaveBeenCalledWith(_vitest.expect.stringContaining("`channels.whatsapp.accounts.default.dmPolicy` + `channels.whatsapp.accounts.default.allowFrom`"), WHATSAPP_ACCESS_NOTE_TITLE);
}

//# sourceMappingURL=setup-test-helpers.js.map