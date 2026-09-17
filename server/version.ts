import 'server-only';

/**
 * Which build is running.
 *
 * Stamped into the image by `docker/Dockerfile` from the `APP_VERSION` and
 * `VCS_REF` build args, which the release workflow fills from the tag being
 * published. It is a runtime environment variable rather than something
 * inlined at build time, because the Next.js build happens in an earlier stage
 * that does not know the version yet — so this must be read on the server and
 * passed down, not imported into a client bundle.
 *
 * A container built outside the release pipeline reports `0.0.0-dev`, which is
 * the honest answer rather than a version nobody released.
 */
export function appVersion(): string {
  return process.env.APP_VERSION ?? '0.0.0-dev';
}

export function appRevision(): string {
  return process.env.APP_VCS_REF ?? 'unknown';
}
