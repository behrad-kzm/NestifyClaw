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
    get beginTelegramReplyFence () {
        return beginTelegramReplyFence;
    },
    get buildTelegramNonInterruptingReplyFenceKey () {
        return buildTelegramNonInterruptingReplyFenceKey;
    },
    get buildTelegramReplyFenceLaneKey () {
        return buildTelegramReplyFenceLaneKey;
    },
    get endTelegramReplyFence () {
        return endTelegramReplyFence;
    },
    get getTelegramReplyFenceSizeForTests () {
        return getTelegramReplyFenceSizeForTests;
    },
    get isTelegramReplyFenceSuperseded () {
        return isTelegramReplyFenceSuperseded;
    },
    get releaseTelegramReplyFenceAbortController () {
        return releaseTelegramReplyFenceAbortController;
    },
    get resetTelegramReplyFenceForTests () {
        return resetTelegramReplyFenceForTests;
    },
    get resolveTelegramReplyFenceKey () {
        return resolveTelegramReplyFenceKey;
    },
    get shouldSupersedeTelegramReplyFence () {
        return shouldSupersedeTelegramReplyFence;
    },
    get supersedeTelegramReplyFence () {
        return supersedeTelegramReplyFence;
    },
    get supersedeTelegramReplyFenceLane () {
        return supersedeTelegramReplyFenceLane;
    }
});
const _channelinbound = require("../../../../common/openclaw/plugin-sdk/channel-inbound");
const _commandauthnative = require("../../../../common/openclaw/plugin-sdk/command-auth-native");
const _commandprimitivesruntime = require("../../../../common/openclaw/plugin-sdk/command-primitives-runtime");
const _sequentialkey = require("./sequential-key.js");
// Newer accepted turns and authorized aborts can arrive ahead of older same-session reply work.
const telegramReplyFenceByKey = new Map();
const telegramReplyFenceKeysByLane = new Map();
function buildTelegramReplyFenceLaneKey(params) {
    return `${params.accountId}\0${params.sequentialKey}`;
}
function buildTelegramNonInterruptingReplyFenceKey(params) {
    return `${buildTelegramNonInterruptingReplyFenceKeyPrefix(params.activeKey)}${params.laneKey}`;
}
function buildTelegramNonInterruptingReplyFenceKeyPrefix(activeKey) {
    return `${activeKey}\0non-interrupting\0`;
}
function normalizeTelegramFenceKey(value) {
    if (typeof value !== "string") {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function resolveTelegramReplyFenceKey(params) {
    const baseKey = normalizeTelegramFenceKey(params.ctxPayload.CommandTargetSessionKey) ?? normalizeTelegramFenceKey(params.ctxPayload.SessionKey) ?? `telegram:${String(params.chatId)}:${params.threadSpec.scope ?? "default"}:${params.threadSpec.id ?? "root"}`;
    const roomEventKey = `${baseKey}:room_event`;
    return {
        activeKey: params.ctxPayload.InboundEventKind === "room_event" ? roomEventKey : baseKey,
        roomEventKey
    };
}
function abortTelegramReplyFenceControllers(state) {
    for (const controller of state.abortControllers ?? []){
        controller.abort();
    }
    state.abortControllers?.clear();
}
function deleteTelegramReplyFenceState(key, state) {
    telegramReplyFenceByKey.delete(key);
    for (const laneKey of state.laneKeys ?? []){
        const keys = telegramReplyFenceKeysByLane.get(laneKey);
        keys?.delete(key);
        if (keys?.size === 0) {
            telegramReplyFenceKeysByLane.delete(laneKey);
        }
    }
}
function maybeDeleteTelegramReplyFenceState(key, state) {
    if (state.activeDispatches <= 0 && (state.abortControllers?.size ?? 0) === 0) {
        deleteTelegramReplyFenceState(key, state);
    } else {
        telegramReplyFenceByKey.set(key, state);
    }
}
function beginTelegramReplyFence(params) {
    const existing = telegramReplyFenceByKey.get(params.key);
    const state = existing ?? {
        generation: 0,
        activeDispatches: 0
    };
    if (params.supersede) {
        state.generation += 1;
        abortTelegramReplyFenceControllers(state);
        supersedeTelegramNonInterruptingReplyFenceChildren(params.key);
    }
    if (params.abortController) {
        (state.abortControllers ??= new Set()).add(params.abortController);
    }
    const laneKey = normalizeTelegramFenceKey(params.laneKey);
    if (laneKey) {
        (state.laneKeys ??= new Set()).add(laneKey);
        const keys = telegramReplyFenceKeysByLane.get(laneKey) ?? new Set();
        keys.add(params.key);
        telegramReplyFenceKeysByLane.set(laneKey, keys);
    }
    state.activeDispatches += 1;
    telegramReplyFenceByKey.set(params.key, state);
    return state.generation;
}
function supersedeTelegramReplyFenceState(key) {
    const state = telegramReplyFenceByKey.get(key);
    if (!state) {
        return false;
    }
    state.generation += 1;
    abortTelegramReplyFenceControllers(state);
    maybeDeleteTelegramReplyFenceState(key, state);
    return true;
}
function supersedeTelegramNonInterruptingReplyFenceChildren(key) {
    let superseded = false;
    const childPrefix = buildTelegramNonInterruptingReplyFenceKeyPrefix(key);
    for (const childKey of telegramReplyFenceByKey.keys()){
        if (childKey.startsWith(childPrefix)) {
            superseded = supersedeTelegramReplyFenceState(childKey) || superseded;
        }
    }
    return superseded;
}
function supersedeTelegramReplyFence(key) {
    let superseded = supersedeTelegramReplyFenceState(key);
    superseded = supersedeTelegramNonInterruptingReplyFenceChildren(key) || superseded;
    return superseded;
}
function supersedeTelegramReplyFenceLane(laneKey) {
    const keys = [
        ...telegramReplyFenceKeysByLane.get(laneKey) ?? []
    ];
    let superseded = false;
    for (const key of keys){
        superseded = supersedeTelegramReplyFence(key) || superseded;
    }
    return superseded;
}
function isTelegramReplyFenceSuperseded(params) {
    return (telegramReplyFenceByKey.get(params.key)?.generation ?? 0) !== params.generation;
}
function endTelegramReplyFence(key, abortController) {
    const state = telegramReplyFenceByKey.get(key);
    if (!state) {
        return;
    }
    if (abortController) {
        state.abortControllers?.delete(abortController);
    }
    state.activeDispatches = Math.max(0, state.activeDispatches - 1);
    maybeDeleteTelegramReplyFenceState(key, state);
}
function releaseTelegramReplyFenceAbortController(key, abortController) {
    if (!abortController) {
        return;
    }
    const state = telegramReplyFenceByKey.get(key);
    if (!state) {
        return;
    }
    state.abortControllers?.delete(abortController);
    maybeDeleteTelegramReplyFenceState(key, state);
}
function isRecognizedTelegramTextCommand(rawText) {
    return (0, _commandauthnative.maybeResolveTextAlias)((0, _commandauthnative.normalizeCommandBody)(rawText)) != null;
}
function shouldSupersedeTelegramReplyFence(ctxPayload) {
    const dispatchText = ctxPayload.CommandBody ?? ctxPayload.RawBody ?? ctxPayload.Body ?? "";
    if ((0, _commandprimitivesruntime.isAbortRequestText)(dispatchText)) {
        return ctxPayload.CommandAuthorized;
    }
    if ((0, _commandprimitivesruntime.isBtwRequestText)(dispatchText) || (0, _sequentialkey.isTelegramReadOnlyControlLaneText)({
        rawText: dispatchText
    })) {
        return false;
    }
    if (ctxPayload.ChatType === "direct") {
        if (ctxPayload.CommandAuthorized && ((0, _channelinbound.isExplicitCommandTurn)(ctxPayload.CommandTurn) || isRecognizedTelegramTextCommand(dispatchText))) {
            return true;
        }
        return false;
    }
    return true;
}
function getTelegramReplyFenceSizeForTests() {
    return telegramReplyFenceByKey.size;
}
function resetTelegramReplyFenceForTests() {
    telegramReplyFenceByKey.clear();
    telegramReplyFenceKeysByLane.clear();
}

//# sourceMappingURL=telegram-reply-fence.js.map