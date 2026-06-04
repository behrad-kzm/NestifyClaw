"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createLaneDeliveryStateTracker", {
    enumerable: true,
    get: function() {
        return createLaneDeliveryStateTracker;
    }
});
function createLaneDeliveryStateTracker() {
    const state = {
        delivered: false,
        skippedNonSilent: 0,
        failedNonSilent: 0
    };
    return {
        markDelivered: ()=>{
            state.delivered = true;
        },
        markNonSilentSkip: ()=>{
            state.skippedNonSilent += 1;
        },
        markNonSilentFailure: ()=>{
            state.failedNonSilent += 1;
        },
        snapshot: ()=>({
                ...state
            })
    };
}

//# sourceMappingURL=lane-delivery-state.js.map