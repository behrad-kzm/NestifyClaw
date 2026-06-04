"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "telegramSetupPlugin", {
    enumerable: true,
    get: function() {
        return telegramSetupPlugin;
    }
});
const _setupcore = require("./setup-core.js");
const _setupsurface = require("./setup-surface.js");
const _shared = require("./shared.js");
const _statemigrations = require("./state-migrations.js");
const telegramSetupPlugin = {
    ...(0, _shared.createTelegramPluginBase)({
        setupWizard: _setupsurface.telegramSetupWizard,
        setup: _setupcore.telegramSetupAdapter
    }),
    lifecycle: {
        detectLegacyStateMigrations: (params)=>(0, _statemigrations.detectTelegramLegacyStateMigrations)(params)
    }
};

//# sourceMappingURL=channel.setup.js.map