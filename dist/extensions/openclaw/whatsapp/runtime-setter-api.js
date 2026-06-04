// Keep bundled registration fast: the runtime setter is needed during plugin
// bootstrap, but the broad runtime-api barrel pulls in WhatsApp runtime modules.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "setWhatsAppRuntime", {
    enumerable: true,
    get: function() {
        return _runtime.setWhatsAppRuntime;
    }
});
const _runtime = require("./src/runtime.js");

//# sourceMappingURL=runtime-setter-api.js.map