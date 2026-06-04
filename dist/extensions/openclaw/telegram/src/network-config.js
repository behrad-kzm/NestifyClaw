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
    get TELEGRAM_DISABLE_AUTO_SELECT_FAMILY_ENV () {
        return TELEGRAM_DISABLE_AUTO_SELECT_FAMILY_ENV;
    },
    get TELEGRAM_DNS_RESULT_ORDER_ENV () {
        return TELEGRAM_DNS_RESULT_ORDER_ENV;
    },
    get TELEGRAM_ENABLE_AUTO_SELECT_FAMILY_ENV () {
        return TELEGRAM_ENABLE_AUTO_SELECT_FAMILY_ENV;
    },
    get resetTelegramNetworkConfigStateForTests () {
        return resetTelegramNetworkConfigStateForTests;
    },
    get resolveTelegramAutoSelectFamilyDecision () {
        return resolveTelegramAutoSelectFamilyDecision;
    },
    get resolveTelegramDnsResultOrderDecision () {
        return resolveTelegramDnsResultOrderDecision;
    }
});
const _nodedns = /*#__PURE__*/ _interop_require_wildcard(require("node:dns"));
const _nodeprocess = /*#__PURE__*/ _interop_require_default(require("node:process"));
const _runtimeenv = require("../../../../common/openclaw/plugin-sdk/runtime-env");
const _stringcoerceruntime = require("../../../../common/openclaw/plugin-sdk/string-coerce-runtime");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
const TELEGRAM_DISABLE_AUTO_SELECT_FAMILY_ENV = "OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY";
const TELEGRAM_ENABLE_AUTO_SELECT_FAMILY_ENV = "OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY";
const TELEGRAM_DNS_RESULT_ORDER_ENV = "OPENCLAW_TELEGRAM_DNS_RESULT_ORDER";
let wsl2SyncCache;
function isWSL2SyncCached() {
    if (typeof wsl2SyncCache === "boolean") {
        return wsl2SyncCache;
    }
    wsl2SyncCache = (0, _runtimeenv.isWSL2Sync)();
    return wsl2SyncCache;
}
function resolveTelegramAutoSelectFamilyDecision(params) {
    const env = params?.env ?? _nodeprocess.default.env;
    const nodeMajor = typeof params?.nodeMajor === "number" ? params.nodeMajor : Number(_nodeprocess.default.versions.node.split(".")[0]);
    if ((0, _runtimeenv.isTruthyEnvValue)(env[TELEGRAM_ENABLE_AUTO_SELECT_FAMILY_ENV])) {
        return {
            value: true,
            source: `env:${TELEGRAM_ENABLE_AUTO_SELECT_FAMILY_ENV}`
        };
    }
    if ((0, _runtimeenv.isTruthyEnvValue)(env[TELEGRAM_DISABLE_AUTO_SELECT_FAMILY_ENV])) {
        return {
            value: false,
            source: `env:${TELEGRAM_DISABLE_AUTO_SELECT_FAMILY_ENV}`
        };
    }
    if (typeof params?.network?.autoSelectFamily === "boolean") {
        return {
            value: params.network.autoSelectFamily,
            source: "config"
        };
    }
    // WSL2 has unstable IPv6 connectivity; disable autoSelectFamily to use IPv4 directly
    if (isWSL2SyncCached()) {
        return {
            value: false,
            source: "default-wsl2"
        };
    }
    if (Number.isFinite(nodeMajor) && nodeMajor >= 22) {
        return {
            value: true,
            source: "default-node22"
        };
    }
    return {
        value: null
    };
}
function resolveTelegramDnsResultOrderDecision(params) {
    const env = params?.env ?? _nodeprocess.default.env;
    const nodeMajor = typeof params?.nodeMajor === "number" ? params.nodeMajor : Number(_nodeprocess.default.versions.node.split(".")[0]);
    // Check environment variable
    const envValue = (0, _stringcoerceruntime.normalizeOptionalLowercaseString)(env[TELEGRAM_DNS_RESULT_ORDER_ENV]);
    if (envValue === "ipv4first" || envValue === "verbatim") {
        return {
            value: envValue,
            source: `env:${TELEGRAM_DNS_RESULT_ORDER_ENV}`
        };
    }
    // Check config
    const configValue = (0, _stringcoerceruntime.normalizeOptionalLowercaseString)(params?.network?.dnsResultOrder);
    if (configValue === "ipv4first" || configValue === "verbatim") {
        return {
            value: configValue,
            source: "config"
        };
    }
    const processDefaultValue = (0, _stringcoerceruntime.normalizeOptionalLowercaseString)(params && "defaultResultOrder" in params ? params.defaultResultOrder : _nodedns.getDefaultResultOrder?.());
    if (processDefaultValue === "ipv4first" || processDefaultValue === "verbatim") {
        return {
            value: processDefaultValue,
            source: "process-default"
        };
    }
    // Default to ipv4first on Node 22+ to avoid IPv6 issues
    if (Number.isFinite(nodeMajor) && nodeMajor >= 22) {
        return {
            value: "ipv4first",
            source: "default-node22"
        };
    }
    return {
        value: null
    };
}
function resetTelegramNetworkConfigStateForTests() {
    wsl2SyncCache = undefined;
}

//# sourceMappingURL=network-config.js.map