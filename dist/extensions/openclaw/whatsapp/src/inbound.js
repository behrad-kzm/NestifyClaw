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
    get extractContactContext () {
        return _extract.extractContactContext;
    },
    get extractLocationData () {
        return _extract.extractLocationData;
    },
    get extractMediaPlaceholder () {
        return _extract.extractMediaPlaceholder;
    },
    get extractText () {
        return _extract.extractText;
    },
    get monitorWebInbox () {
        return _monitor.monitorWebInbox;
    },
    get resetWebInboundDedupe () {
        return _dedupe.resetWebInboundDedupe;
    }
});
const _dedupe = require("./inbound/dedupe.js");
const _extract = require("./inbound/extract.js");
const _monitor = require("./inbound/monitor.js");

//# sourceMappingURL=inbound.js.map