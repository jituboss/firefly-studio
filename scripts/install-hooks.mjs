/**
 * E23-08 — install the pre-commit hook, from `pnpm prepare`.
 *
 * No husky. The hook is fifteen lines; a dependency that writes those fifteen
 * lines is a dependency to keep updated, approve a postinstall script for, and
 * explain to anyone reading package.json.
 *
 * The hook is deliberately tolerant: if gitleaks is not installed it prints how
 * to get it and lets the commit through. A pre-commit hook that blocks work on
 * a machine missing an optional tool gets uninstalled within the day, and then
 * it protects nobody. CI runs the same scan as a hard gate, so the hook is the
 * fast feedback, not the enforcement.
 */
import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const HOOK = `#!/bin/sh
# Managed by scripts/install-hooks.mjs (E23-08). Edit that, not this.
if ! command -v gitleaks >/dev/null 2>&1; then
  echo "note: gitleaks not installed — skipping the secret scan."
  echo "      brew install gitleaks   (CI scans every push regardless)"
  exit 0
fi

if ! gitleaks protect --staged --redact --config .gitleaks.toml; then
  echo
  echo "A staged change looks like a secret. Nothing has been committed."
  echo "If it is a false positive, add it to the allowlist in .gitleaks.toml"
  echo "with a comment saying why — do not pass --no-verify."
  exit 1
fi
`;

const gitDir = join(process.cwd(), '.git');
if (!existsSync(gitDir)) {
  // A tarball install or a Docker build context without .git — nothing to do,
  // and failing here would break `pnpm install` in the image build.
  process.exit(0);
}

const hooksDir = join(gitDir, 'hooks');
mkdirSync(hooksDir, { recursive: true });
const hookPath = join(hooksDir, 'pre-commit');

writeFileSync(hookPath, HOOK, 'utf8');
chmodSync(hookPath, 0o755);
console.log('pre-commit hook installed (secret scan)');
