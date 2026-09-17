# Releasing

Firefly Studio ships as a container image on Docker Hub:
[`jituboss/firefly-studio`](https://hub.docker.com/r/jituboss/firefly-studio).

## Versioning

`MAJOR.MINOR.PATCH`, with `-alpha.N`, `-beta.N` or `-rc.N` for prereleases.
The git tag is the version with a `v` prefix: `v0.1.0-alpha.1`.

`package.json` is the source of truth. The release workflow refuses a tag that
disagrees with it, so the two can never drift apart silently.

## Image tags

| Release              | Tags published                |
| -------------------- | ----------------------------- |
| `1.2.3` (stable)     | `1.2.3`, `1.2`, `1`, `latest` |
| `0.1.0-alpha.1`      | `0.1.0-alpha.1`, `alpha`      |
| `0.2.0-beta.1`       | `0.2.0-beta.1`, `beta`        |
| `1.0.0-rc.1`         | `1.0.0-rc.1`, `rc`            |
| any commit on `main` | `edge`                        |

**`latest` never points at a prerelease.** Someone running
`docker pull jituboss/firefly-studio` with no tag is asking for the stable
line; handing them an alpha would be a trap. Prereleases get a moving channel
tag instead, so `:alpha` always means "the newest alpha".

`edge` is the tip of `main`, republished by every green pipeline run. It is not
a release: it has had no changelog entry written for it and no version tag, so
treat it as a preview rather than something to pin a deployment to.

Every image is built for `linux/amd64` and `linux/arm64` and carries OCI
labels; `/api/health` reports the version and the commit it was built from.

## Cutting a release

1. Be on `main`, up to date, with a clean tree.
2. Write the section in `CHANGELOG.md` under a `## [x.y.z]` heading. This is
   what becomes the GitHub release body, so write it for someone deciding
   whether to upgrade.
3. Stamp and tag:

   ```bash
   pnpm release 0.1.0-alpha.2
   ```

   That verifies the tree, writes the version into `package.json`, commits
   `chore(release): …` and creates an annotated tag. It does **not** push.

4. Move the `latest` git tag, if this is a stable release:

   ```bash
   git tag -f -a latest -m "Latest release: v0.3.0" main
   ```

   This is a convenience pointer to the newest stable commit. It is separate
   from the `latest` DOCKER tag, which the workflow computes from the version —
   see the table above. Two things to know about it:

   - It deliberately does not start with `v`, so it does not match the
     workflow's `tags: ['v*']` trigger and cannot set off a second build.
   - It is a **moving** tag, which git does not really intend. Updating it means
     `-f` here and `--force` on the push, and anyone who already fetched it
     keeps the old one until they prune. Leave it alone for prereleases.

5. Push. This is the step that publishes:

   ```bash
   git push origin main v0.1.0-alpha.2
   git push --force origin latest      # only when latest moved
   ```

## The pipeline

There is one workflow, `.github/workflows/release.yml`, and it runs on every
pull request, every push to `main` and every `v*` tag. What differs between
those is only how far it goes:

| Trigger         | Gate | Image built | Pushed to Docker Hub | GitHub release |
| --------------- | ---- | ----------- | -------------------- | -------------- |
| pull request    | ✅   | ✅          | —                    | —              |
| push to `main`  | ✅   | ✅          | `edge`               | —              |
| push a `v*` tag | ✅   | ✅          | version tags         | ✅             |

Three things keep it quick:

- **Each architecture builds on a runner of its own architecture** and the two
  run in parallel, then a manifest step stitches them into one multi-arch tag.
  The previous workflow emulated `linux/arm64` through QEMU on an amd64 runner,
  which by itself accounted for most of a forty-minute release — a Next.js
  build under binfmt runs about an order of magnitude slower than native.
- **The gate and the image build run side by side** rather than one after the
  other. The layers go to the registry addressed by digest with no tag on them,
  so nothing is pullable until the gate is green and the manifest step names it.
- **The version check happens first**, in a job that takes seconds. A tag that
  disagrees with `package.json` used to fail after the gate and the image build.

Tag pushes additionally open the GitHub release — marked as a prerelease when
the version has a suffix — and upload Sentry source maps, in a job beside the
publish rather than inside it.

## Repository secrets

The workflow needs two secrets under **Settings → Secrets and variables →
Actions**:

| Secret               | Value                                                                     |
| -------------------- | ------------------------------------------------------------------------- |
| `DOCKERHUB_USERNAME` | `jituboss`                                                                |
| `DOCKERHUB_TOKEN`    | A Docker Hub **access token** with Read & Write, not the account password |

Create the token at <https://app.docker.com/settings/personal-access-tokens>.
Use a token rather than the password so it can be revoked on its own.

## Publishing by hand

If Actions is unavailable, the same image can be pushed from a workstation:

```bash
docker login -u jituboss
VERSION=0.1.0-alpha.1
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --file docker/Dockerfile \
  --build-arg APP_VERSION="$VERSION" \
  --build-arg VCS_REF="$(git rev-parse HEAD)" \
  --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --tag "jituboss/firefly-studio:$VERSION" \
  --tag "jituboss/firefly-studio:alpha" \
  --push .
```

Keep `latest` out of a hand-push unless the version is stable.

## Running a published image

```bash
docker run -d --name firefly-studio -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/firefly_studio \
  -e REDIS_URL=redis://host:6379 \
  -e APP_ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  -e APP_URL=https://studio.example.com \
  -e RUN_MIGRATIONS_ON_BOOT=true \
  jituboss/firefly-studio:0.1.0-alpha.1
```

Generate `APP_ENCRYPTION_KEY` and `AUTH_SECRET` once and keep them: the
encryption key is what decrypts stored Firefly tokens, and losing it means
every connection has to be re-authorised.
