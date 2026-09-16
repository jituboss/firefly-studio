import 'dotenv/config';
import { db, pool, schema } from '@/server/db';
import { logger } from '@/lib/logger';

/**
 * Development seed (E1-04).
 *
 * Seeds only rows that are safe and useful on any machine: feature flags.
 * User and connection seeding arrives with M1, once Argon2 hashing and the
 * envelope-encryption module exist — a seeded user needs a real password hash
 * and a real sealed token, not placeholders.
 */

const FEATURE_FLAGS = [
  { key: 'onboarding.demo_mode', enabled: false, description: 'Read-only demo connection (E2-26)' },
  {
    key: 'connections.multiple',
    enabled: false,
    description: 'Multiple Firefly connections (E2-23)',
  },
  { key: 'reports.custom_builder', enabled: false, description: 'Custom report builder (E14-10)' },
  { key: 'admin.section', enabled: false, description: 'Instance admin section (E20-01)' },
  {
    key: 'danger_zone.enabled',
    enabled: false,
    description: 'Expose /data/destroy and /data/purge (E19-03)',
  },
];

async function main() {
  logger.info('Seeding feature flags…');

  await db
    .insert(schema.featureFlags)
    .values(FEATURE_FLAGS)
    .onConflictDoUpdate({
      target: schema.featureFlags.key,
      set: { description: schema.featureFlags.description, updatedAt: new Date() },
    });

  const flags = await db.select().from(schema.featureFlags);
  logger.info({ count: flags.length }, 'Seed complete');
}

main()
  .catch((error) => {
    logger.error({ err: error }, 'Seed failed');
    process.exitCode = 1;
  })
  .finally(() => pool.end());
