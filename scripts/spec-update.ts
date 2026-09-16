import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

/**
 * E1-06 — refresh the vendored Firefly III spec and report the drift.
 *
 * api-docs.firefly-iii.org sits behind Cloudflare and rejects non-browser
 * clients, so we read the same artefacts from the GitHub repository that
 * publishes them.
 *
 * Exit codes:
 *   0  up to date, or updated with only additive changes
 *   1  fetch/parse failure
 *   2  operations were REMOVED or CHANGED — always breaking for us, review required
 */

const REPO_CONTENTS =
  'https://api.github.com/repos/firefly-iii/api-docs/contents/dist?per_page=100';
const RAW_BASE = 'https://raw.githubusercontent.com/firefly-iii/api-docs/main/dist';
const SPEC_PATH = path.resolve('spec/firefly-iii-v1.yaml');
const VERSION_PATH = path.resolve('spec/VERSION');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface SpecDoc {
  info: { version: string };
  paths: Record<string, Record<string, { operationId?: string; tags?: string[] }>>;
}

const compareSemver = (a: string, b: string): number => {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10));
  const pb = b.split('.').map((n) => Number.parseInt(n, 10));
  for (let i = 0; i < 3; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

/** Flatten a spec to "METHOD /path" -> operationId for set comparison. */
function operationMap(doc: SpecDoc): Map<string, string> {
  const map = new Map<string, string>();
  for (const [specPath, methods] of Object.entries(doc.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = methods[method];
      if (operation) {
        map.set(`${method.toUpperCase()} ${specPath}`, operation.operationId ?? '(none)');
      }
    }
  }
  return map;
}

async function findLatestVersion(): Promise<string> {
  const response = await fetch(REPO_CONTENTS, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'firefly-studio-spec-update' },
  });
  if (!response.ok) {
    throw new Error(`GitHub contents API returned ${response.status} ${response.statusText}`);
  }
  const entries = (await response.json()) as Array<{ name: string }>;

  const versions = entries
    .map((entry) => /^firefly-iii-(\d+\.\d+\.\d+)-v1\.yaml$/.exec(entry.name)?.[1])
    .filter((version): version is string => Boolean(version));

  if (versions.length === 0) throw new Error('No v1 spec files found in the api-docs repository');

  return versions.sort(compareSemver).at(-1)!;
}

async function main() {
  const applyChanges = !process.argv.includes('--check');

  const currentRaw = await readFile(SPEC_PATH, 'utf8');
  const current = YAML.parse(currentRaw) as SpecDoc;
  const currentVersion = (await readFile(VERSION_PATH, 'utf8')).trim();

  console.log(`Vendored: Firefly III ${currentVersion}`);

  const latestVersion = await findLatestVersion();
  console.log(`Latest:   Firefly III ${latestVersion}`);

  if (compareSemver(latestVersion, currentVersion) <= 0) {
    console.log('\nSpec is up to date.');
    return;
  }

  const url = `${RAW_BASE}/firefly-iii-${latestVersion}-v1.yaml`;
  console.log(`\nFetching ${url}`);
  const response = await fetch(url, { headers: { 'user-agent': 'firefly-studio-spec-update' } });
  if (!response.ok) {
    throw new Error(`Spec download returned ${response.status} ${response.statusText}`);
  }
  const nextRaw = await response.text();
  const next = YAML.parse(nextRaw) as SpecDoc;

  // --- diff ---------------------------------------------------------------
  const before = operationMap(current);
  const after = operationMap(next);

  const added = [...after.keys()].filter((key) => !before.has(key)).sort();
  const removed = [...before.keys()].filter((key) => !after.has(key)).sort();
  const renamed = [...after.entries()]
    .filter(([key, id]) => before.has(key) && before.get(key) !== id)
    .map(([key, id]) => `${key}  ${before.get(key)} -> ${id}`)
    .sort();

  console.log(`\n--- Operation diff ${currentVersion} -> ${latestVersion} ---`);
  console.log(`  ${before.size} -> ${after.size} operations`);
  if (added.length)
    console.log(`\n  ADDED (${added.length}):\n${added.map((l) => `    + ${l}`).join('\n')}`);
  if (removed.length)
    console.log(`\n  REMOVED (${removed.length}):\n${removed.map((l) => `    - ${l}`).join('\n')}`);
  if (renamed.length)
    console.log(
      `\n  CHANGED operationId (${renamed.length}):\n${renamed.map((l) => `    ~ ${l}`).join('\n')}`,
    );
  if (!added.length && !removed.length && !renamed.length)
    console.log('  No operation-level changes.');

  const breaking = removed.length > 0 || renamed.length > 0;

  if (applyChanges) {
    await writeFile(SPEC_PATH, nextRaw, 'utf8');
    await writeFile(VERSION_PATH, `${latestVersion}\n`, 'utf8');
    console.log(`\nWrote spec/firefly-iii-v1.yaml (${latestVersion}).`);
    console.log('Next: pnpm spec:codegen && pnpm typecheck');
  } else {
    console.log('\n--check: no files written.');
  }

  if (breaking) {
    console.error('\nBREAKING: operations were removed or renamed. Review before merging.');
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
