#!/usr/bin/env node
/**
 * Print one version's section of CHANGELOG.md.
 *
 * The release workflow feeds this into the GitHub release body, so the notes
 * a human wrote are what ships — not an auto-generated commit dump.
 */
import { readFile } from 'node:fs/promises';

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/changelog-section.mjs <version>');
  process.exit(1);
}

const changelog = await readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const lines = changelog.split('\n');

const heading = lines.findIndex((line) => line.startsWith(`## [${version}]`));
if (heading === -1) {
  // Not fatal: a release with no hand-written notes still deserves to ship,
  // and the workflow appends the auto-generated commit list underneath.
  console.error(`No CHANGELOG.md section for ${version}.`);
  process.exit(0);
}

const end = lines.findIndex((line, index) => index > heading && line.startsWith('## ['));
console.log(
  lines
    .slice(heading + 1, end === -1 ? lines.length : end)
    .join('\n')
    .trim(),
);
