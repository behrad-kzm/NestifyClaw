"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "finalizeWhatsAppSetup", {
    enumerable: true,
    get: function() {
        return finalizeWhatsAppSetup;
    }
});
const _setup = require("../../../../common/openclaw/plugin-sdk/setup");
const _setuptools = require("../../../../common/openclaw/plugin-sdk/setup-tools");
const _accounts = require("./accounts.js");
const _credsfiles = require("./creds-files.js");
const _normalizetarget = require("./normalize-target.js");
const _setupcore = require("./setup-core.js");
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
const t = (0, _setup.createSetupTranslator)();
function trimPromptText(value) {
    return value?.trim() ?? "";
}
function isDefaultWhatsAppAccountKey(accountId) {
    return accountId.trim().toLowerCase() === _setup.DEFAULT_ACCOUNT_ID;
}
function shouldWriteDefaultWhatsAppAccountConfigAtAccountScope(cfg) {
    const accounts = cfg.channels?.whatsapp?.accounts;
    if (!accounts) {
        return false;
    }
    if (accounts.default) {
        return true;
    }
    return Object.keys(accounts).some((accountId)=>!isDefaultWhatsAppAccountKey(accountId));
}
function resolveDefaultWhatsAppAccountWriteKey(cfg) {
    const accounts = cfg.channels?.whatsapp?.accounts;
    if (!accounts) {
        return _setup.DEFAULT_ACCOUNT_ID;
    }
    const match = Object.keys(accounts).find((accountId)=>isDefaultWhatsAppAccountKey(accountId));
    return match ?? _setup.DEFAULT_ACCOUNT_ID;
}
function resolveWhatsAppConfigPathPrefix(cfg, accountId) {
    if (accountId === _setup.DEFAULT_ACCOUNT_ID && shouldWriteDefaultWhatsAppAccountConfigAtAccountScope(cfg)) {
        return `channels.whatsapp.accounts.${resolveDefaultWhatsAppAccountWriteKey(cfg)}`;
    }
    return accountId === _setup.DEFAULT_ACCOUNT_ID ? "channels.whatsapp" : `channels.whatsapp.accounts.${accountId}`;
}
function mergeWhatsAppConfig(cfg, accountId, patch, options) {
    const channelConfig = {
        ...cfg.channels?.whatsapp
    };
    const mutableChannelConfig = channelConfig;
    const targetPathPrefix = resolveWhatsAppConfigPathPrefix(cfg, accountId);
    if (targetPathPrefix === "channels.whatsapp") {
        for (const [key, value] of Object.entries(patch)){
            if (value === undefined) {
                if (options?.unsetOnUndefined?.includes(key)) {
                    delete mutableChannelConfig[key];
                }
                continue;
            }
            mutableChannelConfig[key] = value;
        }
        return {
            ...cfg,
            channels: {
                ...cfg.channels,
                whatsapp: channelConfig
            }
        };
    }
    const accounts = {
        ...channelConfig.accounts
    };
    const targetAccountId = accountId === _setup.DEFAULT_ACCOUNT_ID ? resolveDefaultWhatsAppAccountWriteKey(cfg) : accountId;
    const lowerDefaultAccount = accountId === _setup.DEFAULT_ACCOUNT_ID && targetAccountId !== _setup.DEFAULT_ACCOUNT_ID ? accounts[_setup.DEFAULT_ACCOUNT_ID] : undefined;
    const nextAccount = {
        ...accounts[targetAccountId],
        ...lowerDefaultAccount
    };
    const mutableNextAccount = nextAccount;
    for (const [key, value] of Object.entries(patch)){
        if (value === undefined) {
            if (options?.unsetOnUndefined?.includes(key)) {
                delete mutableNextAccount[key];
            }
            continue;
        }
        mutableNextAccount[key] = value;
    }
    accounts[targetAccountId] = nextAccount;
    if (lowerDefaultAccount) {
        delete accounts[_setup.DEFAULT_ACCOUNT_ID];
    }
    return {
        ...cfg,
        channels: {
            ...cfg.channels,
            whatsapp: {
                ...channelConfig,
                accounts
            }
        }
    };
}
function setWhatsAppDmPolicy(cfg, accountId, dmPolicy) {
    return mergeWhatsAppConfig(cfg, accountId, {
        dmPolicy
    });
}
function setWhatsAppAllowFrom(cfg, accountId, allowFrom) {
    return mergeWhatsAppConfig(cfg, accountId, {
        allowFrom
    }, {
        unsetOnUndefined: [
            "allowFrom"
        ]
    });
}
function setWhatsAppSelfChatMode(cfg, accountId, selfChatMode) {
    return mergeWhatsAppConfig(cfg, accountId, {
        selfChatMode
    });
}
async function detectWhatsAppLinked(cfg, accountId) {
    const { authDir } = (0, _accounts.resolveWhatsAppAuthDir)({
        cfg,
        accountId
    });
    return (0, _credsfiles.hasWebCredsSync)(authDir);
}
async function promptWhatsAppOwnerAllowFrom(params) {
    const { prompter, existingAllowFrom } = params;
    await prompter.note(t("wizard.whatsapp.ownerNumberNote"), t("wizard.whatsapp.numberTitle"));
    const entry = await prompter.text({
        message: t("wizard.whatsapp.personalNumberPrompt"),
        placeholder: "+15555550123",
        initialValue: existingAllowFrom[0],
        validate: (value)=>{
            const raw = trimPromptText(value);
            if (!raw) {
                return t("common.required");
            }
            const normalized = (0, _normalizetarget.normalizeWhatsAppAllowFromEntry)(raw);
            if (!normalized) {
                return `Invalid number: ${raw}`;
            }
            return undefined;
        }
    });
    const normalized = (0, _normalizetarget.normalizeWhatsAppAllowFromEntry)(trimPromptText(entry));
    if (!normalized) {
        throw new Error("Invalid WhatsApp owner number (expected E.164 after validation).");
    }
    const allowFrom = (0, _normalizetarget.normalizeWhatsAppAllowFromEntries)([
        ...existingAllowFrom.filter((item)=>item !== "*"),
        normalized
    ]);
    return {
        normalized,
        allowFrom
    };
}
async function applyWhatsAppOwnerAllowlist(params) {
    const { normalized, allowFrom } = await promptWhatsAppOwnerAllowFrom({
        prompter: params.prompter,
        existingAllowFrom: params.existingAllowFrom
    });
    let next = setWhatsAppSelfChatMode(params.cfg, params.accountId, true);
    next = setWhatsAppDmPolicy(next, params.accountId, "allowlist");
    next = setWhatsAppAllowFrom(next, params.accountId, allowFrom);
    await params.prompter.note([
        ...params.messageLines,
        `- allowFrom includes ${normalized}`
    ].join("\n"), params.title);
    return next;
}
function parseWhatsAppAllowFromEntries(raw) {
    const parts = (0, _setup.splitSetupEntries)(raw);
    if (parts.length === 0) {
        return {
            entries: []
        };
    }
    const entries = [];
    for (const part of parts){
        if (part === "*") {
            entries.push("*");
            continue;
        }
        const normalized = (0, _normalizetarget.normalizeWhatsAppAllowFromEntry)(part);
        if (!normalized) {
            return {
                entries: [],
                invalidEntry: part
            };
        }
        entries.push(normalized);
    }
    return {
        entries: (0, _normalizetarget.normalizeWhatsAppAllowFromEntries)(entries)
    };
}
async function promptWhatsAppDmAccess(params) {
    const accountId = params.accountId.trim() || _setup.DEFAULT_ACCOUNT_ID;
    const account = (0, _accounts.resolveWhatsAppAccount)({
        cfg: params.cfg,
        accountId
    });
    const existingPolicy = account.dmPolicy ?? "pairing";
    const existingAllowFrom = account.allowFrom ?? [];
    const existingLabel = existingAllowFrom.length > 0 ? existingAllowFrom.join(", ") : "unset";
    const configPathPrefix = resolveWhatsAppConfigPathPrefix(params.cfg, accountId);
    const policyKey = `${configPathPrefix}.dmPolicy`;
    const allowFromKey = `${configPathPrefix}.allowFrom`;
    if (params.forceAllowFrom) {
        return await applyWhatsAppOwnerAllowlist({
            cfg: params.cfg,
            accountId,
            prompter: params.prompter,
            existingAllowFrom,
            title: t("wizard.whatsapp.allowlistTitle"),
            messageLines: [
                t("wizard.whatsapp.allowlistModeEnabled")
            ]
        });
    }
    await params.prompter.note([
        `WhatsApp direct chats are gated by \`${policyKey}\` + \`${allowFromKey}\`.`,
        "- pairing (default): unknown senders get a pairing code; owner approves",
        "- allowlist: unknown senders are blocked",
        '- open: public inbound DMs (requires allowFrom to include "*")',
        "- disabled: ignore WhatsApp DMs",
        "",
        `Current: dmPolicy=${existingPolicy}, allowFrom=${existingLabel}`,
        t("wizard.channels.docs", {
            link: (0, _setuptools.formatDocsLink)("/whatsapp", "whatsapp")
        })
    ].join("\n"), t("wizard.whatsapp.dmAccessTitle"));
    const phoneMode = await params.prompter.select({
        message: t("wizard.whatsapp.phoneSetupPrompt"),
        options: [
            {
                value: "personal",
                label: t("wizard.whatsapp.personalPhoneLabel")
            },
            {
                value: "separate",
                label: t("wizard.whatsapp.separatePhoneLabel")
            }
        ]
    });
    if (phoneMode === "personal") {
        return await applyWhatsAppOwnerAllowlist({
            cfg: params.cfg,
            accountId,
            prompter: params.prompter,
            existingAllowFrom,
            title: t("wizard.whatsapp.personalPhoneTitle"),
            messageLines: [
                t("wizard.whatsapp.personalPhoneModeEnabled"),
                t("wizard.whatsapp.dmPolicySetAllowlist")
            ]
        });
    }
    const policy = await params.prompter.select({
        message: t("wizard.whatsapp.dmPolicyPrompt"),
        options: [
            {
                value: "pairing",
                label: t("wizard.channels.dmPolicyPairing")
            },
            {
                value: "allowlist",
                label: t("wizard.whatsapp.dmPolicyAllowlistOnly")
            },
            {
                value: "open",
                label: t("wizard.channels.dmPolicyOpenOption")
            },
            {
                value: "disabled",
                label: t("wizard.whatsapp.dmPolicyDisabled")
            }
        ]
    });
    let next = setWhatsAppSelfChatMode(params.cfg, accountId, false);
    next = setWhatsAppDmPolicy(next, accountId, policy);
    if (policy === "open") {
        const allowFrom = (0, _normalizetarget.normalizeWhatsAppAllowFromEntries)([
            "*",
            ...existingAllowFrom
        ]);
        next = setWhatsAppAllowFrom(next, accountId, allowFrom.length > 0 ? allowFrom : [
            "*"
        ]);
        return next;
    }
    if (policy === "disabled") {
        return next;
    }
    const allowOptions = existingAllowFrom.length > 0 ? [
        {
            value: "keep",
            label: t("wizard.whatsapp.keepCurrentAllowFrom")
        },
        {
            value: "unset",
            label: t("wizard.whatsapp.unsetAllowFromPairing")
        },
        {
            value: "list",
            label: t("wizard.whatsapp.setAllowFromNumbers")
        }
    ] : [
        {
            value: "unset",
            label: t("wizard.whatsapp.unsetAllowFromDefault")
        },
        {
            value: "list",
            label: t("wizard.whatsapp.setAllowFromNumbers")
        }
    ];
    const mode = await params.prompter.select({
        message: t("wizard.whatsapp.allowFromPrompt"),
        options: allowOptions.map((opt)=>({
                value: opt.value,
                label: opt.label
            }))
    });
    if (mode === "keep") {
        return next;
    }
    if (mode === "unset") {
        return setWhatsAppAllowFrom(next, accountId, undefined);
    }
    const allowRaw = await params.prompter.text({
        message: t("wizard.whatsapp.allowedSenderNumbers"),
        placeholder: "+15555550123, +447700900123",
        validate: (value)=>{
            const raw = trimPromptText(value);
            if (!raw) {
                return t("common.required");
            }
            const parsed = parseWhatsAppAllowFromEntries(raw);
            if (parsed.entries.length === 0 && !parsed.invalidEntry) {
                return t("common.required");
            }
            if (parsed.invalidEntry) {
                return `Invalid number: ${parsed.invalidEntry}`;
            }
            return undefined;
        }
    });
    const parsed = parseWhatsAppAllowFromEntries(trimPromptText(allowRaw));
    if (parsed.invalidEntry) {
        throw new Error(`Invalid number: ${parsed.invalidEntry}`);
    }
    if (parsed.entries.length === 0) {
        throw new Error("Invalid WhatsApp allowFrom list (expected at least one E.164 number).");
    }
    return setWhatsAppAllowFrom(next, accountId, parsed.entries);
}
async function finalizeWhatsAppSetup(params) {
    const accountId = params.accountId.trim() || (0, _accounts.resolveDefaultWhatsAppAccountId)(params.cfg);
    let next = accountId === _setup.DEFAULT_ACCOUNT_ID ? params.cfg : _setupcore.whatsappSetupAdapter.applyAccountConfig({
        cfg: params.cfg,
        accountId,
        input: {}
    });
    const linked = await detectWhatsAppLinked(next, accountId);
    const { authDir } = (0, _accounts.resolveWhatsAppAuthDir)({
        cfg: next,
        accountId
    });
    if (!linked) {
        await params.prompter.note([
            t("wizard.whatsapp.scanQr"),
            t("wizard.whatsapp.credentialsStored", {
                authDir
            }),
            t("wizard.channels.docs", {
                link: (0, _setuptools.formatDocsLink)("/whatsapp", "whatsapp")
            })
        ].join("\n"), t("wizard.whatsapp.linkingTitle"));
    }
    const wantsLink = await params.prompter.confirm({
        message: linked ? t("wizard.whatsapp.relinkPrompt") : t("wizard.whatsapp.linkNowPrompt"),
        initialValue: !linked
    });
    if (wantsLink) {
        try {
            const { loginWeb } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./login.js")));
            await loginWeb(false, undefined, params.runtime, accountId);
        } catch (error) {
            params.runtime.error(`WhatsApp login failed: ${String(error)}`);
            await params.prompter.note(t("wizard.channels.docs", {
                link: (0, _setuptools.formatDocsLink)("/whatsapp", "whatsapp")
            }), t("wizard.whatsapp.helpTitle"));
        }
    } else if (!linked) {
        await params.prompter.note(t("wizard.whatsapp.linkLater", {
            command: (0, _setuptools.formatCliCommand)("openclaw channels login")
        }), "WhatsApp");
    }
    next = await promptWhatsAppDmAccess({
        cfg: next,
        accountId,
        forceAllowFrom: params.forceAllowFrom,
        prompter: params.prompter
    });
    return {
        cfg: next
    };
}

//# sourceMappingURL=setup-finalize.js.map