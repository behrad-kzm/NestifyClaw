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
    get MediaFetchError () {
        return _telegrammediaruntime.MediaFetchError;
    },
    get formatErrorMessage () {
        return _ssrfruntime.formatErrorMessage;
    },
    get logVerbose () {
        return _runtimeenv.logVerbose;
    },
    get readRemoteMediaBuffer () {
        return _telegrammediaruntime.readRemoteMediaBuffer;
    },
    get resolveTelegramApiBase () {
        return _fetch.resolveTelegramApiBase;
    },
    get retryAsync () {
        return _runtimeenv.retryAsync;
    },
    get saveMediaBuffer () {
        return _telegrammediaruntime.saveMediaBuffer;
    },
    get saveRemoteMedia () {
        return _telegrammediaruntime.saveRemoteMedia;
    },
    get shouldRetryTelegramTransportFallback () {
        return _fetch.shouldRetryTelegramTransportFallback;
    },
    get warn () {
        return _runtimeenv.warn;
    }
});
const _runtimeenv = require("../../../../../common/openclaw/plugin-sdk/runtime-env");
const _ssrfruntime = require("../../../../../common/openclaw/plugin-sdk/ssrf-runtime");
const _fetch = require("../fetch.js");
const _telegrammediaruntime = require("../telegram-media.runtime.js");

//# sourceMappingURL=delivery.resolve-media.runtime.js.map