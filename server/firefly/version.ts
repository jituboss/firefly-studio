import { getEnv } from '@/lib/env';

/** E2-17 — version gate. */

export function parseVersion(raw: string): [number, number, number] {
  const cleaned = raw.trim().replace(/^v/i, '');
  const parts = cleaned.split('.').map((part) => Number.parseInt(part, 10));
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  for (let i = 0; i < 3; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

export type VersionVerdict =
  { status: 'ok' } | { status: 'warn'; message: string } | { status: 'blocked'; message: string };

export function checkVersion(detected: string): VersionVerdict {
  const env = getEnv();

  if (compareVersions(detected, env.MIN_FIREFLY_VERSION) < 0) {
    return {
      status: 'blocked',
      message: `Firefly Studio needs Firefly III ${env.MIN_FIREFLY_VERSION} or newer. This instance reports ${detected}. Please upgrade Firefly III first.`,
    };
  }

  if (compareVersions(detected, env.RECOMMENDED_FIREFLY_VERSION) < 0) {
    return {
      status: 'warn',
      message: `This instance runs ${detected}. Firefly Studio is built against ${env.RECOMMENDED_FIREFLY_VERSION} and newer — exchange rates and some insight endpoints will be hidden.`,
    };
  }

  return { status: 'ok' };
}
