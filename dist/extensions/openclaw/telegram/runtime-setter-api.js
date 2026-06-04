// Keep bundled registration fast: the runtime setter is needed during plugin
// bootstrap, but the broad runtime-api barrel is only for compatibility callers.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "setTelegramRuntime", {
    enumerable: true,
    get: function() {
        return _runtime.setTelegramRuntime;
    }
});
const _runtime = require("./src/runtime.js");

//# sourceMappingURL=runtime-setter-api.js.map