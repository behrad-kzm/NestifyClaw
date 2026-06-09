/**
 * Build script for nestify-claw.
 *
 * We bundle with esbuild rather than `tsc`/`nest build` on purpose: vendored
 * openclaw connectors are authored against openclaw's real SDK types, so
 * type-checking them against our adapter stubs is not meaningful (openclaw
 * itself ships via the `tsdown` bundler, not tsc). esbuild transpiles + bundles
 * the reachable graph, resolves the `openclaw/*` path alias from tsconfig, and
 * rewrites the connectors' ESM `.js` import specifiers to their `.ts` sources.
 *
 * Use `npm run typecheck` to type-check nestify-owned framework code.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { build, type Plugin } from 'esbuild';

const ROOT = path.resolve(__dirname, '..');

/** Rewrites local `./foo.js` imports to `./foo.ts` when the .ts source exists. */
const jsToTsResolver: Plugin = {
  name: 'js-to-ts',
  setup(b) {
    b.onResolve({ filter: /\.js$/ }, (args) => {
      if (args.path.startsWith('.') && args.resolveDir) {
        const tsPath = path
          .resolve(args.resolveDir, args.path)
          .replace(/\.js$/, '.ts');
        if (fs.existsSync(tsPath)) return { path: tsPath };
      }
      return undefined;
    });
  },
};

async function main(): Promise<void> {
  await build({
    entryPoints: [path.join(ROOT, 'src', 'main.ts')],
    outfile: path.join(ROOT, 'dist', 'main.mjs'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    sourcemap: true,
    // Keep node_modules (NestJS, grammy, ...) external; bundle only our source
    // and the vendored extension graph.
    packages: 'external',
    tsconfig: path.join(ROOT, 'tsconfig.json'),
    plugins: [jsToTsResolver],
    logLevel: 'info',
    // esbuild emits named ESM imports for CJS deps; this banner restores
    // require/__dirname for any dependency that needs them at runtime.
    banner: {
      js: [
        "import { createRequire as __cr } from 'node:module';",
        "import { fileURLToPath as __furl } from 'node:url';",
        "import { dirname as __dir } from 'node:path';",
        'const require = __cr(import.meta.url);',
        'const __filename = __furl(import.meta.url);',
        'const __dirname = __dir(__filename);',
      ].join('\n'),
    },
  });
  console.log('build complete -> dist/main.mjs');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
