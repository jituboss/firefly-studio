import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import openapiTS, { astToString } from 'openapi-typescript';
import YAML from 'yaml';

/**
 * E1-06 — generate the typed surface from the vendored Firefly III spec.
 *
 * Produces two artefacts:
 *   generated/types.ts      — full request/response types (openapi-typescript)
 *   generated/operations.ts — a path registry used by the proxy for routing,
 *                             allowlisting and cache-tag derivation
 */

const SPEC_PATH = path.resolve('spec/firefly-iii-v1.yaml');
const OUT_DIR = path.resolve('spec/generated');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

interface OperationRecord {
  path: string;
  method: HttpMethod;
  operationId: string;
  tag: string;
  summary: string;
}

/**
 * Endpoints the proxy refuses by default (docs/PROJECT_PLAN.md §4.3). These either
 * destroy data irrecoverably or reach past the signed-in user's own ledger.
 * Each can be individually re-enabled in settings, behind a step-up re-auth.
 */
const GUARDED_PATH_PATTERNS = [
  /^\/v1\/data\/destroy$/,
  /^\/v1\/data\/purge$/,
  /^\/v1\/cron\//,
  /^\/v1\/users(\/|$)/,
  // Webhooks were dropped from scope (E17), so nothing in this app calls them.
  // They stay in the vendored spec because the spec is a faithful copy of
  // Firefly's API — but an endpoint that configures the user's instance to POST
  // to an arbitrary URL is not surface worth leaving open for a feature that
  // does not exist. Configure webhooks in Firefly III itself.
  /^\/v1\/webhooks(\/|$)/,
];

function toPattern(specPath: string): string {
  // "/v1/accounts/{id}/transactions" -> "^/v1/accounts/[^/]+/transactions$"
  return `^${specPath.replace(/\{[^}]+\}/g, '[^/]+')}$`;
}

async function main() {
  const raw = await readFile(SPEC_PATH, 'utf8');
  const doc = YAML.parse(raw) as {
    info: { version: string; title: string };
    paths: Record<
      string,
      Record<string, { operationId?: string; tags?: string[]; summary?: string }>
    >;
  };

  await mkdir(OUT_DIR, { recursive: true });

  // --- 1. full types -------------------------------------------------------
  const ast = await openapiTS(new URL(`file://${SPEC_PATH}`), {
    alphabetize: true,
    exportType: true,
  });
  await writeFile(
    path.join(OUT_DIR, 'types.ts'),
    `/* eslint-disable */\n// Generated from spec/firefly-iii-v1.yaml (${doc.info.version}).\n// Run \`pnpm spec:codegen\` to regenerate. Do not edit.\n\n${astToString(ast)}`,
    'utf8',
  );

  // --- 2. operation registry ----------------------------------------------
  const operations: OperationRecord[] = [];
  for (const [specPath, methods] of Object.entries(doc.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = methods[method];
      if (!operation) continue;
      operations.push({
        path: specPath,
        method,
        operationId: operation.operationId ?? `${method}${specPath}`,
        tag: operation.tags?.[0] ?? 'untagged',
        summary: (operation.summary ?? '').replace(/\s+/g, ' ').trim(),
      });
    }
  }

  operations.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  const tags = [...new Set(operations.map((operation) => operation.tag))].sort();
  const guarded = operations.filter((operation) =>
    GUARDED_PATH_PATTERNS.some((pattern) => pattern.test(operation.path)),
  );

  const registry = `/* eslint-disable */
// Generated from spec/firefly-iii-v1.yaml (${doc.info.version}).
// Run \`pnpm spec:codegen\` to regenerate. Do not edit.

export const FIREFLY_SPEC_VERSION = ${JSON.stringify(doc.info.version)} as const;

export type FireflyHttpMethod = ${HTTP_METHODS.map((m) => JSON.stringify(m)).join(' | ')};

export type FireflyTag = ${tags.map((t) => JSON.stringify(t)).join(' | ')};

export interface FireflyOperation {
  readonly path: string;
  readonly method: FireflyHttpMethod;
  readonly operationId: string;
  readonly tag: FireflyTag;
  readonly summary: string;
  /** Anchored regex matching a concrete request path. */
  readonly pattern: string;
  /** Denied by the proxy unless explicitly enabled (docs/PROJECT_PLAN.md §4.3). */
  readonly guarded: boolean;
}

export const FIREFLY_TAGS = ${JSON.stringify(tags, null, 2)} as const;

export const FIREFLY_OPERATIONS: readonly FireflyOperation[] = ${JSON.stringify(
    operations.map((operation) => ({
      ...operation,
      pattern: toPattern(operation.path),
      guarded: GUARDED_PATH_PATTERNS.some((pattern) => pattern.test(operation.path)),
    })),
    null,
    2,
  )} as const;

/** Total operations in the spec — asserted by the coverage test. */
export const FIREFLY_OPERATION_COUNT = ${operations.length};
export const FIREFLY_PATH_COUNT = ${Object.keys(doc.paths ?? {}).length};
`;

  await writeFile(path.join(OUT_DIR, 'operations.ts'), registry, 'utf8');

  console.log(`Firefly III ${doc.info.version}`);
  console.log(`  paths      ${Object.keys(doc.paths ?? {}).length}`);
  console.log(`  operations ${operations.length}`);
  console.log(`  tags       ${tags.length}`);
  console.log(`  guarded    ${guarded.length} (${guarded.map((o) => o.path).join(', ')})`);
  console.log(`\nWrote spec/generated/types.ts and spec/generated/operations.ts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
