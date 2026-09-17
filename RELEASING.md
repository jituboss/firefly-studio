# Releasing

Firefly Studio ships as a container image on Docker Hub:
[`jituboss/firefly-studio`](https://hub.docker.com/r/jituboss/firefly-studio).

## Versioning

`MAJOR.MINOR.PATCH`, with `-alpha.N`, `-beta.N` or `-rc.N` for prereleases.
The git tag is the version with a `v` prefix: `v0.1.0-alpha.1`.

`package.json` is the source of truth. The release workflow refuses a tag that
disagrees with it, so the two can never drift apart silently.

## Image tags

| Release          | Tags published                |
| ---------------- | ----------------------------- |
| `1.2.3` (stable) | `1.2.3`, `1.2`, `1`, `latest` |
| `0.1.0-alpha.1`  | `0.1.0-alpha.1`, `alpha`      |
| `0.2.0-beta.1`   | `0.2.0-beta.1`, `beta`        |
| `1.0.0-rc.1`     | `1.0.0-rc.1`, `rc`            |

**`latest` never points at a prerelease.** Someone running
`docker pull jituboss/firefly-studio` with no tag is asking for the stable
line; handing them an alpha would be a trap. Prereleases get a moving channel
tag instead, so `:alpha` always means "the newest alpha".

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

4. Push. This is the step that publishes:

   ```bash
   git push origin main v0.1.0-alpha.2
   ```

The `Release` workflow then runs the full gate (format, lint, typecheck, tests,
migrations, build), builds both architectures, pushes to Docker Hub and opens
the GitHub release — marked as a prerelease when the version has a suffix.

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
