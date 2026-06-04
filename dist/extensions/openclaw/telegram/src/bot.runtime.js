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
    get Bot () {
        return _grammy.Bot;
    },
    get apiThrottler () {
        return _transformerthrottler.apiThrottler;
    },
    get sequentialize () {
        return _runner.sequentialize;
    }
});
const _runner = require("@grammyjs/runner");
const _transformerthrottler = require("@grammyjs/transformer-throttler");
const _grammy = require("grammy");

//# sourceMappingURL=bot.runtime.js.map