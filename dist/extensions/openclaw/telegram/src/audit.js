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
    get auditTelegramGroupMembership () {
        return auditTelegramGroupMembership;
    },
    get collectTelegramUnmentionedGroupIds () {
        return collectTelegramUnmentionedGroupIds;
    }
});
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
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
function collectTelegramUnmentionedGroupIds(groups) {
    if (!groups || typeof groups !== "object") {
        return {
            groupIds: [],
            unresolvedGroups: 0,
            hasWildcardUnmentionedGroups: false
        };
    }
    const hasWildcardUnmentionedGroups = groups["*"]?.requireMention === false && groups["*"]?.enabled !== false;
    const groupIds = [];
    let unresolvedGroups = 0;
    for (const [key, value] of Object.entries(groups)){
        if (key === "*") {
            continue;
        }
        if (!value || typeof value !== "object") {
            continue;
        }
        if (value.enabled === false) {
            continue;
        }
        if (value.requireMention !== false) {
            continue;
        }
        const id = (0, _stringcoerceruntime.normalizeOptionalString)(key) ?? "";
        if (!id) {
            continue;
        }
        if (/^-?\d+$/.test(id)) {
            groupIds.push(id);
        } else {
            unresolvedGroups += 1;
        }
    }
    groupIds.sort((a, b)=>a.localeCompare(b));
    return {
        groupIds,
        unresolvedGroups,
        hasWildcardUnmentionedGroups
    };
}
let auditMembershipRuntimePromise = null;
function loadAuditMembershipRuntime() {
    auditMembershipRuntimePromise ??= Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("./audit-membership-runtime.js")));
    return auditMembershipRuntimePromise;
}
async function auditTelegramGroupMembership(params) {
    const started = Date.now();
    const token = (0, _stringcoerceruntime.normalizeOptionalString)(params.token) ?? "";
    if (!token || params.groupIds.length === 0) {
        return {
            ok: true,
            checkedGroups: 0,
            unresolvedGroups: 0,
            hasWildcardUnmentionedGroups: false,
            groups: [],
            elapsedMs: Date.now() - started
        };
    }
    // Lazy import to avoid pulling `undici` (ProxyAgent) into cold-path callers that only need
    // `collectTelegramUnmentionedGroupIds` (e.g. config audits).
    const { auditTelegramGroupMembershipImpl } = await loadAuditMembershipRuntime();
    const result = await auditTelegramGroupMembershipImpl({
        ...params,
        token
    });
    return {
        ...result,
        elapsedMs: Date.now() - started
    };
}

//# sourceMappingURL=audit.js.map