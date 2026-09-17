#!/usr/bin/env node
/**
 * Cut a release: verify the tree, stamp the version, tag it.
 *
 *   pnpm release 0.1.0-alpha.1
 *
 * Deliberately does NOT push. Pushing the tag is what triggers the build and
 * the publish to Docker Hub, so that stays a separate, deliberate command the
 * script prints at the end.
 */
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const SEMVER = /^\d+\.\d+\.\d+(-(alpha|beta|rc)\.\d+)?$/;

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const version = process.argv[2];
if (!version || !SEMVER.test(version)) {
  console.error('Usage: pnpm release <version>');
  console.error('  e.g. 0.1.0-alpha.1, 0.2.0-beta.3, 1.0.0-rc.1, 1.0.0');
  process.exit(1);
}

const tag = `v${version}`;

if (git('status', '--porcelain') !== '') {
  console.error('Working tree is dirty. Commit or stash first.');
  process.exit(1);
}

const tags = git('tag', '--list', tag);
if (tags !== '') {
  console.error(`Tag ${tag} already exists.`);
  process.exit(1);
}

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch !== 'main') {
  console.error(`Releases are cut from main; you are on ${branch}.`);
  process.exit(1);
}

// package.json is the source of truth; the workflow refuses a tag that
// disagrees with it, so keep the two in lockstep here.
const packagePath = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
pkg.version = version;
await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

const changelogPath = new URL('../CHANGELOG.md', import.meta.url);
const changelog = await readFile(changelogPath, 'utf8');
if (!changelog.includes(`## [${version}]`)) {
  console.error(`CHANGELOG.md has no "## [${version}]" section. Write the notes first.`);
  process.exit(1);
}

git('add', 'package.json', 'CHANGELOG.md');
git('commit', '-m', `chore(release): ${version}`);
git('tag', '-a', tag, '-m', `Firefly Studio ${version}`);

const prerelease = version.includes('-');
console.log(`\nTagged ${tag} on ${branch}.`);
console.log('\nPush to publish:');
console.log(`  git push origin ${branch} ${tag}\n`);
console.log('That builds linux/amd64 + linux/arm64 and pushes:');
console.log(`  jituboss/firefly-studio:${version}`);
console.log(
  prerelease
    ? `  jituboss/firefly-studio:${version.split('-')[1].split('.')[0]}   (moving channel tag)`
    : '  jituboss/firefly-studio:latest (plus major and major.minor)',
);
