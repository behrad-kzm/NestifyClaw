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
    get beginTelegramInboundEventDeliveryCorrelation () {
        return beginTelegramInboundEventDeliveryCorrelation;
    },
    get notifyTelegramInboundEventOutboundSuccess () {
        return notifyTelegramInboundEventOutboundSuccess;
    },
    get resolveTelegramInboundEventDeliveryCorrelationKey () {
        return resolveTelegramInboundEventDeliveryCorrelationKey;
    }
});
const _targets = require("./targets.js");
const registry = new Map();
function normalizeTelegramDeliveryTarget(value) {
    return (0, _targets.stripTelegramInternalPrefixes)(value).toLowerCase();
}
function stripTelegramTopicTarget(value) {
    return value.replace(/:topic:\d+$/u, "");
}
function hasTelegramTopicTarget(value) {
    return /:topic:\d+$/u.test(value);
}
function telegramDeliveryTargetsMatch(expected, actual) {
    const expectedTarget = normalizeTelegramDeliveryTarget(expected);
    const actualTarget = normalizeTelegramDeliveryTarget(actual);
    if (expectedTarget === actualTarget) {
        return true;
    }
    if (hasTelegramTopicTarget(expectedTarget)) {
        return false;
    }
    const expectedBase = stripTelegramTopicTarget(expectedTarget);
    const actualBase = stripTelegramTopicTarget(actualTarget);
    return expectedBase === actualBase && (expectedTarget === expectedBase || actualTarget === actualBase);
}
function resolveTelegramInboundEventDeliveryCorrelationKey(sessionKey, inboundEventKind) {
    const key = sessionKey?.trim();
    if (!key) {
        return undefined;
    }
    return inboundEventKind === "room_event" ? `${key}:room_event` : key;
}
function beginTelegramInboundEventDeliveryCorrelation(sessionKey, event, options) {
    const key = resolveTelegramInboundEventDeliveryCorrelationKey(sessionKey, options?.inboundEventKind);
    if (!key) {
        return ()=>{};
    }
    registry.set(key, event);
    return ()=>{
        if (registry.get(key) === event) {
            registry.delete(key);
        }
    };
}
function notifyTelegramInboundEventOutboundSuccess(params) {
    const key = resolveTelegramInboundEventDeliveryCorrelationKey(params.sessionKey, params.inboundEventKind);
    if (!key) {
        return;
    }
    const event = registry.get(key);
    if (!event || !telegramDeliveryTargetsMatch(event.outboundTo, params.to)) {
        return;
    }
    if (event.outboundAccountId && params.accountId && params.accountId !== event.outboundAccountId) {
        return;
    }
    event.markInboundEventDelivered();
}

//# sourceMappingURL=inbound-event-delivery.js.map