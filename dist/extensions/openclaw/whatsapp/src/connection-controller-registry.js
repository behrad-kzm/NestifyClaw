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
    get getRegisteredWhatsAppConnectionController () {
        return getRegisteredWhatsAppConnectionController;
    },
    get registerWhatsAppConnectionController () {
        return registerWhatsAppConnectionController;
    },
    get unregisterWhatsAppConnectionController () {
        return unregisterWhatsAppConnectionController;
    }
});
const CONNECTION_REGISTRY_KEY = Symbol.for("openclaw.whatsapp.connectionControllerRegistry");
function getConnectionRegistryState() {
    const globalState = globalThis;
    const existing = globalState[CONNECTION_REGISTRY_KEY];
    if (existing) {
        return existing;
    }
    const created = {
        controllers: new Map()
    };
    globalState[CONNECTION_REGISTRY_KEY] = created;
    return created;
}
function getRegisteredWhatsAppConnectionController(accountId) {
    return getConnectionRegistryState().controllers.get(accountId) ?? null;
}
function registerWhatsAppConnectionController(accountId, controller) {
    getConnectionRegistryState().controllers.set(accountId, controller);
}
function unregisterWhatsAppConnectionController(accountId, controller) {
    const controllers = getConnectionRegistryState().controllers;
    if (controllers.get(accountId) === controller) {
        controllers.delete(accountId);
    }
}

//# sourceMappingURL=connection-controller-registry.js.map