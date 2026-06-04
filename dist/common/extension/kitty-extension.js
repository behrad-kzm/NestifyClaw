/**
 * Kitty extension contract.
 *
 * This is the kitty-agents analog of openclaw's `defineBundledChannelEntry`.
 * A channel extension (e.g. Telegram) is hosted by a NestJS module that
 * implements {@link KittyChannel}. The framework starts every registered
 * channel on application bootstrap and stops it on shutdown.
 *
 * The vendored openclaw extension under `src/extensions/<id>` stays pristine;
 * a thin host module adapts it to this contract.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "KITTY_CHANNELS", {
    enumerable: true,
    get: function() {
        return KITTY_CHANNELS;
    }
});
const KITTY_CHANNELS = Symbol('KITTY_CHANNELS');

//# sourceMappingURL=kitty-extension.js.map