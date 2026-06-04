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
    get buildCommandsPaginationKeyboard () {
        return buildCommandsPaginationKeyboard;
    },
    get buildTelegramCommandsListChannelData () {
        return buildTelegramCommandsListChannelData;
    },
    get buildTelegramModelBrowseChannelData () {
        return buildTelegramModelBrowseChannelData;
    },
    get buildTelegramModelsAddProviderChannelData () {
        return buildTelegramModelsAddProviderChannelData;
    },
    get buildTelegramModelsListChannelData () {
        return buildTelegramModelsListChannelData;
    },
    get buildTelegramModelsMenuButtons () {
        return buildTelegramModelsMenuButtons;
    },
    get buildTelegramModelsMenuChannelData () {
        return buildTelegramModelsMenuChannelData;
    },
    get buildTelegramModelsProviderChannelData () {
        return buildTelegramModelsProviderChannelData;
    }
});
const _modelbuttons = require("./model-buttons.js");
const _nativecommandcallbackdata = require("./native-command-callback-data.js");
function buildCommandsPaginationKeyboard(currentPage, totalPages, agentId) {
    const buttons = [];
    const suffix = agentId ? `:${agentId}` : "";
    if (currentPage > 1) {
        buttons.push({
            text: "◀ Prev",
            callback_data: `commands_page_${currentPage - 1}${suffix}`
        });
    }
    buttons.push({
        text: `${currentPage}/${totalPages}`,
        callback_data: `commands_page_noop${suffix}`
    });
    if (currentPage < totalPages) {
        buttons.push({
            text: "Next ▶",
            callback_data: `commands_page_${currentPage + 1}${suffix}`
        });
    }
    return [
        buttons
    ];
}
function buildTelegramModelsMenuButtons(params) {
    return (0, _modelbuttons.buildProviderKeyboard)(params.providers);
}
function buildTelegramModelsMenuChannelData(params) {
    if (params.providers.length === 0) {
        return null;
    }
    return {
        telegram: {
            buttons: buildTelegramModelsMenuButtons(params)
        }
    };
}
function buildTelegramCommandsListChannelData(params) {
    if (params.totalPages <= 1) {
        return null;
    }
    return {
        telegram: {
            buttons: buildCommandsPaginationKeyboard(params.currentPage, params.totalPages, params.agentId)
        }
    };
}
function buildTelegramModelsProviderChannelData(params) {
    if (params.providers.length === 0) {
        return null;
    }
    return {
        telegram: {
            buttons: (0, _modelbuttons.buildProviderKeyboard)(params.providers)
        }
    };
}
function buildTelegramModelsAddProviderChannelData(params) {
    if (params.providers.length === 0) {
        return null;
    }
    const buttons = params.providers.map((provider)=>[
            {
                text: provider.id,
                callback_data: (0, _nativecommandcallbackdata.buildTelegramNativeCommandCallbackData)(`/models add ${provider.id}`)
            }
        ]);
    return {
        telegram: {
            buttons
        }
    };
}
function buildTelegramModelsListChannelData(params) {
    return {
        telegram: {
            buttons: (0, _modelbuttons.buildModelsKeyboard)(params)
        }
    };
}
function buildTelegramModelBrowseChannelData() {
    return {
        telegram: {
            buttons: (0, _modelbuttons.buildBrowseProvidersButton)()
        }
    };
}

//# sourceMappingURL=command-ui.js.map