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
    get assertWebChannel () {
        return assertWebChannel;
    },
    get isSelfChatMode () {
        return isSelfChatMode;
    },
    get jidToE164 () {
        return jidToE164;
    },
    get markdownToWhatsApp () {
        return markdownToWhatsApp;
    },
    get resolveJidToE164 () {
        return resolveJidToE164;
    },
    get toWhatsappJid () {
        return toWhatsappJid;
    },
    get toWhatsappJidWithLid () {
        return toWhatsappJidWithLid;
    }
});
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _accountresolution = require("../../../../common/openclaw/plugin-sdk/account-resolution");
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _textutilityruntime = require("../../../../common/openclaw/plugin-sdk/text-utility-runtime");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const WHATSAPP_FENCE_PLACEHOLDER = "\x00FENCE";
const WHATSAPP_INLINE_CODE_PLACEHOLDER = "\x00CODE";
function assertWebChannel(input) {
    if (input !== "web") {
        throw new Error("Web channel must be 'web'");
    }
}
function isSelfChatMode(selfE164, allowFrom) {
    if (!selfE164) {
        return false;
    }
    if (!Array.isArray(allowFrom) || allowFrom.length === 0) {
        return false;
    }
    const normalizedSelf = (0, _accountresolution.normalizeE164)(selfE164);
    return allowFrom.some((n)=>{
        if (n === "*") {
            return false;
        }
        try {
            return (0, _accountresolution.normalizeE164)(String(n)) === normalizedSelf;
        } catch  {
            return false;
        }
    });
}
function toWhatsappJid(number) {
    const withoutPrefix = number.replace(/^whatsapp:/i, "").trim();
    if (withoutPrefix.includes("@")) {
        return withoutPrefix;
    }
    const e164 = (0, _accountresolution.normalizeE164)(withoutPrefix);
    const digits = e164.replace(/\D/g, "");
    return `${digits}@s.whatsapp.net`;
}
function toWhatsappJidWithLid(number, opts) {
    const stripped = number.replace(/^whatsapp:/i, "").trim();
    if (stripped.includes("@")) {
        return stripped;
    }
    const e164 = (0, _accountresolution.normalizeE164)(stripped);
    const phoneDigits = e164.replace(/\D/g, "");
    const lid = readLidForwardMapping({
        phoneDigits,
        opts
    });
    return lid ? `${lid}@lid` : `${phoneDigits}@s.whatsapp.net`;
}
function resolveLidMappingDirs(params) {
    const dirs = new Set();
    const addDir = (dir)=>{
        if (!dir) {
            return;
        }
        dirs.add((0, _textutilityruntime.resolveUserPath)(dir));
    };
    addDir(params.opts?.authDir);
    for (const dir of params.opts?.lidMappingDirs ?? []){
        addDir(dir);
    }
    addDir(_textutilityruntime.CONFIG_DIR);
    addDir(_nodepath.default.join(_textutilityruntime.CONFIG_DIR, "credentials"));
    return [
        ...dirs
    ];
}
function readLidReverseMapping(params) {
    const mappingFilename = `lid-mapping-${params.lid}_reverse.json`;
    const mappingDirs = resolveLidMappingDirs({
        opts: params.opts
    });
    for (const dir of mappingDirs){
        const mappingPath = _nodepath.default.join(dir, mappingFilename);
        try {
            const data = _nodefs.default.readFileSync(mappingPath, "utf8");
            const phone = JSON.parse(data);
            if (phone === null || phone === undefined) {
                continue;
            }
            return (0, _accountresolution.normalizeE164)(String(phone));
        } catch  {
        // next location
        }
    }
    return null;
}
function readLidForwardMapping(params) {
    const mappingFilename = `lid-mapping-${params.phoneDigits}.json`;
    const mappingDirs = resolveLidMappingDirs({
        opts: params.opts
    });
    for (const dir of mappingDirs){
        const mappingPath = _nodepath.default.join(dir, mappingFilename);
        try {
            const data = _nodefs.default.readFileSync(mappingPath, "utf8");
            const lid = JSON.parse(data);
            if (lid === null || lid === undefined) {
                continue;
            }
            const digits = String(lid).replace(/\D/g, "");
            if (digits) {
                return digits;
            }
        } catch  {
        // next location
        }
    }
    return null;
}
function jidToE164(jid, opts) {
    const match = jid.match(/^(\d+)(?::\d+)?@(s\.whatsapp\.net|hosted)$/);
    if (match) {
        return `+${match[1]}`;
    }
    const lidMatch = jid.match(/^(\d+)(?::\d+)?@(lid|hosted\.lid)$/);
    if (!lidMatch) {
        return null;
    }
    const phone = readLidReverseMapping({
        lid: lidMatch[1],
        opts
    });
    if (phone) {
        return phone;
    }
    const shouldLog = opts?.logMissing ?? (0, _runtimeenv.shouldLogVerbose)();
    if (shouldLog) {
        (0, _runtimeenv.logVerbose)(`LID mapping not found for ${lidMatch[1]}; skipping inbound message`);
    }
    return null;
}
async function resolveJidToE164(jid, opts) {
    if (!jid) {
        return null;
    }
    const direct = jidToE164(jid, opts);
    if (direct) {
        return direct;
    }
    if (!/(@lid|@hosted\.lid)$/.test(jid) || !opts?.lidLookup?.getPNForLID) {
        return null;
    }
    try {
        const pnJid = await opts.lidLookup.getPNForLID(jid);
        if (!pnJid) {
            return null;
        }
        return jidToE164(pnJid, opts);
    } catch (err) {
        if ((0, _runtimeenv.shouldLogVerbose)()) {
            (0, _runtimeenv.logVerbose)(`LID mapping lookup failed for ${jid}: ${String(err)}`);
        }
        return null;
    }
}
function markdownToWhatsApp(text) {
    if (!text) {
        return text;
    }
    const fences = [];
    let result = text.replace(/```[\s\S]*?```/g, (match)=>{
        fences.push(match);
        return `${WHATSAPP_FENCE_PLACEHOLDER}${fences.length - 1}`;
    });
    const inlineCodes = [];
    result = result.replace(/`[^`\n]+`/g, (match)=>{
        inlineCodes.push(match);
        return `${WHATSAPP_INLINE_CODE_PLACEHOLDER}${inlineCodes.length - 1}`;
    });
    result = result.replace(/\*\*(.+?)\*\*/g, "*$1*");
    result = result.replace(/__(.+?)__/g, "*$1*");
    result = result.replace(/~~(.+?)~~/g, "~$1~");
    result = result.replace(new RegExp(`${(0, _textutilityruntime.escapeRegExp)(WHATSAPP_INLINE_CODE_PLACEHOLDER)}(\\d+)`, "g"), (_, idx)=>inlineCodes[Number(idx)] ?? "");
    result = result.replace(new RegExp(`${(0, _textutilityruntime.escapeRegExp)(WHATSAPP_FENCE_PLACEHOLDER)}(\\d+)`, "g"), (_, idx)=>fences[Number(idx)] ?? "");
    return result;
}

//# sourceMappingURL=targets-runtime.js.map