/**
 * Runtime stub used by auto-generated openclaw/plugin-sdk adapter modules.
 *
 * The vendored extensions (copied unchanged) import ~100 plugin-sdk modules
 * each. Only the inbound read path is implemented for real (see modules marked
 * `@kitty-real`); everything else resolves to a tolerant stub so the extension
 * loads without crashing. A stub is callable, constructable, and returns itself
 * on property access, so deeply chained SDK calls degrade to no-ops instead of
 * throwing at import time.
 */ /**
 * Type of a stub value. Aliased to `any` on purpose: the vendored extensions
 * are authored against openclaw's real SDK types (functions that return
 * strings, arrays, generic stores, etc.), so the stub stand-ins must be fully
 * permissive — callable with type arguments, constructable, indexable, and
 * assignable to whatever concrete type the extension expects. These files are
 * transpiled/bundled, never type-checked, so this loses no real safety.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "makeStub", {
    enumerable: true,
    get: function() {
        return makeStub;
    }
});
function makeStub(label) {
    const target = function kittyStub() {
        return stub;
    };
    Object.defineProperty(target, 'name', {
        value: label,
        configurable: true
    });
    const stub = new Proxy(target, {
        get (_t, prop) {
            if (prop === 'then') return undefined; // never look like a Promise
            if (prop === '__kittyStub') return true;
            if (prop === Symbol.toPrimitive) return ()=>undefined;
            if (typeof prop === 'symbol') return undefined;
            if (prop === 'name') return label;
            return stub;
        },
        apply () {
            return stub;
        },
        construct () {
            return stub;
        }
    });
    return stub;
}

//# sourceMappingURL=__stub.js.map