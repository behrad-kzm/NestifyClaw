/**
 * Scans copied openclaw extensions under src/extensions for every
 * `openclaw/plugin-sdk/*` (and other `openclaw/*`) import, and generates a
 * matching adapter module under src/common/openclaw/** exporting the imported
 * symbols as tolerant stubs.
 *
 * Hand-written real implementations are preserved: any adapter file containing
 * the marker `@kitty-real` is never overwritten.
 *
 * Run: npm run gen:adapter
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';

const ROOT = path.resolve(__dirname, '..');
const EXT_DIR = path.join(ROOT, 'src', 'extensions');
const ADAPTER_ROOT = path.join(ROOT, 'src', 'common');

type ModuleNeeds = {
  /** export names consumed by extension code (value and/or type) */
  names: Set<string>;
  /** whether a default import/export is consumed */
  needsDefault: boolean;
  /** `export * from` seen — informational only */
  star: boolean;
};

const GENERATED_SENTINEL = 'AUTO-GENERATED kitty adapter stub';

const modules = new Map<string, ModuleNeeds>();

function need(spec: string): ModuleNeeds {
  let m = modules.get(spec);
  if (!m) {
    m = { names: new Set(), needsDefault: false, star: false };
    modules.set(spec, m);
  }
  return m;
}

function isOpenclaw(spec: string): boolean {
  return spec === 'openclaw' || spec.startsWith('openclaw/');
}

function walk(dir: string, files: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, files);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      files.push(full);
    }
  }
}

function collect(file: string): void {
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);

  // local namespace-import name -> openclaw module specifier (for `ns.member` usage)
  const namespaceLocals = new Map<string, string>();

  const visit = (node: ts.Node): void => {
    // import ... from "openclaw/..."
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const spec = node.moduleSpecifier.text;
      if (isOpenclaw(spec)) {
        const m = need(spec);
        const clause = node.importClause;
        if (clause) {
          if (clause.name) m.needsDefault = true;
          const b = clause.namedBindings;
          if (b && ts.isNamespaceImport(b)) {
            m.star = true;
            namespaceLocals.set(b.name.text, spec);
          } else if (b && ts.isNamedImports(b)) {
            for (const el of b.elements)
              m.names.add((el.propertyName ?? el.name).text);
          }
        }
      }
    }
    // export ... from "openclaw/..."
    else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const spec = node.moduleSpecifier.text;
      if (isOpenclaw(spec)) {
        const m = need(spec);
        if (!node.exportClause) m.star = true;
        else if (ts.isNamedExports(node.exportClause)) {
          for (const el of node.exportClause.elements)
            m.names.add((el.propertyName ?? el.name).text);
        }
      }
    }
    // inline import type: import("openclaw/...").Member
    else if (ts.isImportTypeNode(node)) {
      const arg = node.argument;
      if (
        ts.isLiteralTypeNode(arg) &&
        ts.isStringLiteral(arg.literal) &&
        isOpenclaw(arg.literal.text)
      ) {
        const m = need(arg.literal.text);
        if (node.qualifier) {
          const first = ts.isQualifiedName(node.qualifier)
            ? leftmost(node.qualifier)
            : node.qualifier;
          m.names.add(first.text);
        }
      }
    }
    // dynamic import: import("openclaw/...")
    else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0]) &&
      isOpenclaw(node.arguments[0].text)
    ) {
      need(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  };
  visit(sf);

  // second pass: namespace member access `ns.member`
  if (namespaceLocals.size > 0) {
    const visitNs = (node: ts.Node): void => {
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        namespaceLocals.has(node.expression.text)
      ) {
        need(namespaceLocals.get(node.expression.text)!).names.add(
          node.name.text,
        );
      }
      ts.forEachChild(node, visitNs);
    };
    visitNs(sf);
  }
}

function leftmost(name: ts.QualifiedName): ts.Identifier {
  let left: ts.EntityName = name.left;
  while (ts.isQualifiedName(left)) left = left.left;
  return left;
}

function adapterPathFor(spec: string): string {
  // "openclaw/plugin-sdk/foo" -> src/common/openclaw/plugin-sdk/foo.ts
  // "openclaw" -> src/common/openclaw/openclaw.ts (avoid dir/file clash)
  const rel = spec === 'openclaw' ? 'openclaw/__root' : spec;
  return path.join(ADAPTER_ROOT, `${rel}.ts`);
}

function relativeToStub(fromFile: string): string {
  const stub = path.join(ADAPTER_ROOT, 'openclaw', 'plugin-sdk', '__stub');
  let r = path.relative(path.dirname(fromFile), stub).replace(/\\/g, '/');
  if (!r.startsWith('.')) r = `./${r}`;
  return r;
}

const RESERVED = new Set([
  'default',
  'import',
  'export',
  'const',
  'type',
  'let',
  'var',
  'function',
  'class',
]);

function generate(): void {
  let written = 0;
  const skipped = 0;
  let preserved = 0;

  for (const [spec, m] of modules) {
    const file = adapterPathFor(spec);

    // A file is a hand-written real impl (preserve it) unless it carries the
    // auto-generated sentinel. We can't key off "@kitty-real" because the
    // generated header itself mentions that marker.
    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, 'utf8');
      if (!existing.includes(GENERATED_SENTINEL)) {
        preserved++;
        continue;
      }
    }

    fs.mkdirSync(path.dirname(file), { recursive: true });

    const stubImport = relativeToStub(file);
    const lines: string[] = [];
    lines.push(`/* eslint-disable */`);
    lines.push(`/* ${GENERATED_SENTINEL} for '${spec}'. Do not edit by hand.`);
    lines.push(` * Regenerate with: npm run gen:adapter`);
    lines.push(
      ` * Add the marker @kitty-real to a hand-written replacement to preserve it. */`,
    );
    lines.push(`import { makeStub, type StubAny } from '${stubImport}';`);
    lines.push('');

    // Generic type-parameter list so `Name<T>` / `Name<T, U>` type usages resolve.
    const generics = '<A = any, B = any, C = any, D = any, E = any, F = any>';
    const names = [...m.names].filter((n) => !RESERVED.has(n)).sort();
    for (const name of names) {
      lines.push(
        `export const ${name}: StubAny = makeStub('${spec}#${name}');`,
      );
      lines.push(`export type ${name}${generics} = any;`);
    }
    if (m.needsDefault) {
      lines.push(`export default makeStub('${spec}#default');`);
    }
    if (names.length === 0 && !m.needsDefault) {
      lines.push(`export {};`);
    }

    fs.writeFileSync(file, lines.join('\n') + '\n');
    written++;
  }

  console.log(
    `adapter: ${modules.size} openclaw modules referenced -> ${written} stub files written, ${preserved} real impls preserved, ${skipped} skipped`,
  );
}

function main(): void {
  const files: string[] = [];
  walk(EXT_DIR, files);
  for (const f of files) collect(f);
  generate();
}

main();
