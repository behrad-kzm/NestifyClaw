"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createTelegramUpdateTracker", {
    enumerable: true,
    get: function() {
        return createTelegramUpdateTracker;
    }
});
const _channeloutbound = require("../../../../common/openclaw/plugin-sdk/channel-outbound");
const _botupdates = require("./bot-updates.js");
function sortedIds(ids) {
    return [
        ...ids
    ].toSorted((a, b)=>a - b);
}
function createTelegramUpdateTracker(options = {}) {
    const initialUpdateId = typeof options.initialUpdateId === "number" ? options.initialUpdateId : null;
    const persistenceFloorUpdateId = typeof options.persistenceFloorUpdateId === "number" ? options.persistenceFloorUpdateId : initialUpdateId;
    const ackPolicy = options.ackPolicy ?? "after_receive_record";
    const recentUpdates = (0, _botupdates.createTelegramUpdateDedupe)();
    const pendingUpdateKeys = new Set();
    const activeHandledUpdateKeys = new Map();
    const pendingUpdateIds = new Set();
    const failedUpdateIds = new Set();
    const completedFloorReplayUpdateIds = new Set();
    let highestAcceptedUpdateId = initialUpdateId;
    let highestPersistedAcceptedUpdateId = persistenceFloorUpdateId;
    let highestPersistenceRequestedUpdateId = persistenceFloorUpdateId;
    let highestCompletedUpdateId = persistenceFloorUpdateId;
    let persistInFlight = false;
    let persistTargetUpdateId = null;
    const skip = (key)=>{
        options.onSkip?.(key);
    };
    const drainPersistQueue = async ()=>{
        const persist = options.onAcceptedUpdateId;
        if (persistInFlight || typeof persist !== "function") {
            return;
        }
        persistInFlight = true;
        try {
            while(persistTargetUpdateId !== null){
                const updateId = persistTargetUpdateId;
                persistTargetUpdateId = null;
                try {
                    await persist(updateId);
                    if (highestPersistedAcceptedUpdateId === null || updateId > highestPersistedAcceptedUpdateId) {
                        highestPersistedAcceptedUpdateId = updateId;
                    }
                } catch (err) {
                    options.onPersistError?.(err);
                }
            }
        } finally{
            persistInFlight = false;
        }
    };
    const requestPersistAcceptedUpdateId = (updateId)=>{
        if (typeof options.onAcceptedUpdateId !== "function") {
            return;
        }
        if (highestPersistenceRequestedUpdateId !== null && updateId <= highestPersistenceRequestedUpdateId) {
            return;
        }
        highestPersistenceRequestedUpdateId = updateId;
        persistTargetUpdateId = updateId;
        void drainPersistQueue().catch((err)=>{
            options.onPersistError?.(err);
        });
    };
    const acceptUpdateId = (updateId)=>{
        if (highestAcceptedUpdateId !== null && updateId <= highestAcceptedUpdateId) {
            return;
        }
        highestAcceptedUpdateId = updateId;
    };
    const isFloorReplayUpdateId = (updateId)=>initialUpdateId === null && persistenceFloorUpdateId !== null && updateId <= persistenceFloorUpdateId;
    function resolveSafeCompletedUpdateId() {
        if (highestCompletedUpdateId === null) {
            return null;
        }
        let safeCompletedUpdateId = highestCompletedUpdateId;
        for (const updateId of pendingUpdateIds){
            if (persistenceFloorUpdateId !== null && updateId <= persistenceFloorUpdateId) {
                continue;
            }
            if (updateId <= safeCompletedUpdateId) {
                safeCompletedUpdateId = updateId - 1;
            }
        }
        for (const updateId of failedUpdateIds){
            if (persistenceFloorUpdateId !== null && updateId <= persistenceFloorUpdateId) {
                continue;
            }
            if (updateId <= safeCompletedUpdateId) {
                safeCompletedUpdateId = updateId - 1;
            }
        }
        return safeCompletedUpdateId;
    }
    const persistUpdateIdAfterAck = async (updateId)=>{
        const persistUpdateId = ackPolicy === "after_agent_dispatch" ? resolveSafeCompletedUpdateId() : updateId;
        if (persistUpdateId !== null) {
            requestPersistAcceptedUpdateId(persistUpdateId);
        }
    };
    const ackUpdateAfterStage = (receiveContext, stage)=>{
        if (!receiveContext?.shouldAckAfter(stage)) {
            return;
        }
        void receiveContext.ack().catch((err)=>{
            options.onPersistError?.(err);
        });
    };
    const beginUpdate = (ctx)=>{
        const updateId = (0, _botupdates.resolveTelegramUpdateId)(ctx);
        const updateKey = (0, _botupdates.buildTelegramUpdateKey)(ctx);
        if (typeof updateId === "number") {
            if (highestAcceptedUpdateId !== null && updateId <= highestAcceptedUpdateId) {
                const floorReplay = isFloorReplayUpdateId(updateId);
                if (!floorReplay && !failedUpdateIds.has(updateId)) {
                    skip(`update:${updateId}`);
                    return {
                        accepted: false,
                        reason: "accepted-watermark"
                    };
                }
                if (floorReplay && completedFloorReplayUpdateIds.has(updateId)) {
                    skip(`update:${updateId}`);
                    return {
                        accepted: false,
                        reason: "accepted-watermark"
                    };
                }
            } else {
                failedUpdateIds.delete(updateId);
            }
        }
        if (updateKey) {
            if (pendingUpdateKeys.has(updateKey) || recentUpdates.peek(updateKey)) {
                skip(updateKey);
                return {
                    accepted: false,
                    reason: "semantic-dedupe"
                };
            }
            pendingUpdateKeys.add(updateKey);
            activeHandledUpdateKeys.set(updateKey, false);
        }
        let receiveContext;
        if (typeof updateId === "number") {
            pendingUpdateIds.add(updateId);
            acceptUpdateId(updateId);
            receiveContext = (0, _channeloutbound.createMessageReceiveContext)({
                id: updateKey ?? `telegram:update:${updateId}`,
                channel: "telegram",
                message: ctx,
                ackPolicy,
                onAck: ()=>persistUpdateIdAfterAck(updateId)
            });
            ackUpdateAfterStage(receiveContext, "receive_record");
        }
        return {
            accepted: true,
            update: {
                ...updateKey ? {
                    key: updateKey
                } : {},
                ...typeof updateId === "number" ? {
                    updateId
                } : {},
                ...receiveContext ? {
                    receiveContext
                } : {}
            }
        };
    };
    const finishUpdate = (update, finish)=>{
        if (update.key) {
            activeHandledUpdateKeys.delete(update.key);
            if (finish.completed) {
                recentUpdates.check(update.key);
            }
            pendingUpdateKeys.delete(update.key);
        }
        if (typeof update.updateId === "number") {
            pendingUpdateIds.delete(update.updateId);
            if (finish.completed) {
                failedUpdateIds.delete(update.updateId);
                if (isFloorReplayUpdateId(update.updateId)) {
                    completedFloorReplayUpdateIds.add(update.updateId);
                }
                if (highestCompletedUpdateId === null || update.updateId > highestCompletedUpdateId) {
                    highestCompletedUpdateId = update.updateId;
                }
                ackUpdateAfterStage(update.receiveContext, "agent_dispatch");
            } else {
                failedUpdateIds.add(update.updateId);
                void update.receiveContext?.nack(new Error("Telegram update handler did not complete")).catch((err)=>{
                    options.onPersistError?.(err);
                });
            }
        }
    };
    const shouldSkipHandlerDispatch = (ctx)=>{
        const updateId = (0, _botupdates.resolveTelegramUpdateId)(ctx);
        if (typeof updateId === "number" && initialUpdateId !== null && updateId <= initialUpdateId) {
            return true;
        }
        const key = (0, _botupdates.buildTelegramUpdateKey)(ctx);
        if (!key) {
            return false;
        }
        const handled = activeHandledUpdateKeys.get(key);
        if (handled != null) {
            if (handled) {
                skip(key);
                return true;
            }
            activeHandledUpdateKeys.set(key, true);
            return false;
        }
        const skipped = recentUpdates.check(key);
        if (skipped) {
            skip(key);
        }
        return skipped;
    };
    const getState = ()=>({
            highestAcceptedUpdateId,
            highestPersistedAcceptedUpdateId,
            highestCompletedUpdateId,
            safeCompletedUpdateId: resolveSafeCompletedUpdateId(),
            pendingUpdateIds: sortedIds(pendingUpdateIds),
            failedUpdateIds: sortedIds(failedUpdateIds)
        });
    return {
        beginUpdate,
        finishUpdate,
        getState,
        shouldSkipHandlerDispatch
    };
}

//# sourceMappingURL=bot-update-tracker.js.map