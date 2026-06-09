/**
 * Runtime stub used by auto-generated openclaw/plugin-sdk adapter modules.
 *
 * The vendored connectors (copied unchanged) import ~100 plugin-sdk modules
 * each. Only the inbound read path is implemented for real (see modules marked
 * `@nestify-real`); everything else resolves to a tolerant stub so the extension
 * loads without crashing. A stub is callable, constructable, and returns itself
 * on property access, so deeply chained SDK calls degrade to no-ops instead of
 * throwing at import time.
 */

/**
 * Type of a stub value. Aliased to `any` on purpose: the vendored connectors
 * are authored against openclaw's real SDK types (functions that return
 * strings, arrays, generic stores, etc.), so the stub stand-ins must be fully
 * permissive — callable with type arguments, constructable, indexable, and
 * assignable to whatever concrete type the extension expects. These files are
 * transpiled/bundled, never type-checked, so this loses no real safety.
 */
export type StubAny = any;

export function makeStub(label: string): StubAny {
  const target = function nestifyStub() {
    return stub;
  };
  Object.defineProperty(target, 'name', { value: label, configurable: true });

  const stub: any = new Proxy(target, {
    get(_t, prop) {
      if (prop === 'then') return undefined; // never look like a Promise
      if (prop === '__nestifyStub') return true;
      if (prop === Symbol.toPrimitive) return () => undefined;
      if (typeof prop === 'symbol') return undefined;
      if (prop === 'name') return label;
      return stub;
    },
    apply() {
      return stub;
    },
    construct() {
      return stub;
    },
  });
  return stub as StubAny;
}
