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
    get clearAccountThrottlersForTest () {
        return clearAccountThrottlersForTest;
    },
    get createTelegramAccountThrottler () {
        return createTelegramAccountThrottler;
    },
    get getOrCreateAccountThrottler () {
        return getOrCreateAccountThrottler;
    }
});
const _numberruntime = require("../../../../common/openclaw/plugin-sdk/number-runtime");
const _botruntime = require("./bot.runtime.js");
let GroupFairQueue = class GroupFairQueue {
    enqueue(laneKey, run) {
        return new Promise((resolve, reject)=>{
            const request = {
                run,
                resolve: resolve,
                reject
            };
            const existing = this.lanes.get(laneKey);
            if (existing) {
                existing.push(request);
            } else {
                this.lanes.set(laneKey, [
                    request
                ]);
                this.laneOrder.push(laneKey);
            }
            this.start();
        });
    }
    start() {
        if (this.running) {
            return;
        }
        this.running = true;
        void this.drain();
    }
    async drain() {
        try {
            while(true){
                const request = this.takeNext();
                if (!request) {
                    return;
                }
                try {
                    request.resolve(await request.run());
                } catch (err) {
                    request.reject(err);
                }
            }
        } finally{
            this.running = false;
            if (this.laneOrder.length > 0) {
                this.start();
            }
        }
    }
    takeNext() {
        for(let remaining = this.laneOrder.length; remaining > 0; remaining -= 1){
            this.nextLaneIndex %= this.laneOrder.length;
            const laneKey = this.laneOrder[this.nextLaneIndex];
            const queue = this.lanes.get(laneKey);
            if (!queue || queue.length === 0) {
                this.lanes.delete(laneKey);
                this.laneOrder.splice(this.nextLaneIndex, 1);
                if (this.laneOrder.length === 0) {
                    this.nextLaneIndex = 0;
                    return undefined;
                }
                continue;
            }
            const request = queue.shift();
            this.nextLaneIndex += 1;
            return request;
        }
        return undefined;
    }
    constructor(){
        this.lanes = new Map();
        this.laneOrder = [];
        this.nextLaneIndex = 0;
        this.running = false;
    }
};
const throttlerByToken = new Map();
function readNumericId(value) {
    return (0, _numberruntime.parseStrictInteger)(value);
}
function readPayload(payload) {
    return payload && typeof payload === "object" ? payload : undefined;
}
function resolveGroupChatKey(payload) {
    const chatId = readNumericId(payload.chat_id);
    return chatId !== undefined && chatId < 0 ? String(chatId) : undefined;
}
function resolveForumLaneKey(payload) {
    const threadId = readNumericId(payload.message_thread_id);
    if (threadId !== undefined) {
        return `topic:${threadId}`;
    }
    const directTopicId = readNumericId(payload.direct_messages_topic_id);
    if (directTopicId !== undefined) {
        return `direct-topic:${directTopicId}`;
    }
    const messageId = readNumericId(payload.message_id);
    if (messageId !== undefined) {
        return `message:${messageId}`;
    }
    return "main";
}
function createTelegramAccountThrottler(createThrottler = _botruntime.apiThrottler) {
    const baseThrottler = createThrottler();
    const fairQueuesByChat = new Map();
    return (prev, method, payload, signal)=>{
        const apiPayload = readPayload(payload);
        const groupChatKey = apiPayload ? resolveGroupChatKey(apiPayload) : undefined;
        if (!apiPayload || !groupChatKey) {
            return baseThrottler(prev, method, payload, signal);
        }
        let fairQueue = fairQueuesByChat.get(groupChatKey);
        if (!fairQueue) {
            fairQueue = new GroupFairQueue();
            fairQueuesByChat.set(groupChatKey, fairQueue);
        }
        const laneKey = resolveForumLaneKey(apiPayload);
        return fairQueue.enqueue(laneKey, ()=>baseThrottler(prev, method, payload, signal));
    };
}
function getOrCreateAccountThrottler(token, createThrottler = _botruntime.apiThrottler) {
    let throttler = throttlerByToken.get(token);
    if (!throttler) {
        throttler = createTelegramAccountThrottler(createThrottler);
        throttlerByToken.set(token, throttler);
    }
    return throttler;
}
function clearAccountThrottlersForTest() {
    throttlerByToken.clear();
}

//# sourceMappingURL=account-throttler.js.map