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
    get TELEGRAM_COMMAND_NAME_PATTERN () {
        return _commandconfig.TELEGRAM_COMMAND_NAME_PATTERN;
    },
    get buildCommandsPaginationKeyboard () {
        return _commandui.buildCommandsPaginationKeyboard;
    },
    get buildTelegramModelsProviderChannelData () {
        return _commandui.buildTelegramModelsProviderChannelData;
    },
    get collectRuntimeConfigAssignments () {
        return _secretcontract.collectRuntimeConfigAssignments;
    },
    get collectTelegramSecurityAuditFindings () {
        return _securityaudit.collectTelegramSecurityAuditFindings;
    },
    get createTelegramThreadBindingManager () {
        return _threadbindings.createTelegramThreadBindingManager;
    },
    get legacyConfigRules () {
        return _doctorcontract.legacyConfigRules;
    },
    get listTelegramDirectoryGroupsFromConfig () {
        return _directoryconfig.listTelegramDirectoryGroupsFromConfig;
    },
    get listTelegramDirectoryPeersFromConfig () {
        return _directoryconfig.listTelegramDirectoryPeersFromConfig;
    },
    get mergeTelegramAccountConfig () {
        return _accounts.mergeTelegramAccountConfig;
    },
    get normalizeCompatibilityConfig () {
        return _doctorcontract.normalizeCompatibilityConfig;
    },
    get normalizeTelegramCommandDescription () {
        return _commandconfig.normalizeTelegramCommandDescription;
    },
    get normalizeTelegramCommandName () {
        return _commandconfig.normalizeTelegramCommandName;
    },
    get parseTelegramTopicConversation () {
        return _topicconversation.parseTelegramTopicConversation;
    },
    get resetTelegramThreadBindingsForTests () {
        return _threadbindings.resetTelegramThreadBindingsForTests;
    },
    get resolveTelegramCustomCommands () {
        return _commandconfig.resolveTelegramCustomCommands;
    },
    get secretTargetRegistryEntries () {
        return _secretcontract.secretTargetRegistryEntries;
    },
    get singleAccountKeysToMove () {
        return _setupcontract.singleAccountKeysToMove;
    }
});
const _doctorcontract = require("./src/doctor-contract.js");
const _secretcontract = require("./src/secret-contract.js");
const _commandconfig = require("./src/command-config.js");
const _directoryconfig = require("./src/directory-config.js");
const _topicconversation = require("./src/topic-conversation.js");
const _setupcontract = require("./src/setup-contract.js");
const _accounts = require("./src/accounts.js");
const _commandui = require("./src/command-ui.js");
const _threadbindings = require("./src/thread-bindings.js");
const _securityaudit = require("./src/security-audit.js");

//# sourceMappingURL=contract-api.js.map