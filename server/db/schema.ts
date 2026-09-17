import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Firefly Studio — application schema (docs/PROJECT_PLAN.md §3).
 *
 * INVARIANT: this database stores identity, connection credentials, preferences
 * and derived artefacts. It stores NO financial records. Firefly III remains the
 * system of record for every account, transaction, budget and balance.
 */

/** Case-insensitive text, for emails. Requires the `citext` extension. */
const citext = customType<{ data: string }>({
  dataType: () => 'citext',
});

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'deleted']);
export const mfaTypeEnum = pgEnum('mfa_type', ['totp', 'webauthn']);
export const emailTokenPurposeEnum = pgEnum('email_token_purpose', [
  'verify_email',
  'reset_password',
  'change_email',
]);
export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);
export const densityEnum = pgEnum('density', ['comfortable', 'compact']);

/**
 * Connection health. `pending` is the pre-validation state during onboarding;
 * everything else is set by the validator or the hourly health check (E2-24).
 */
export const connectionStatusEnum = pgEnum('connection_status', [
  'pending',
  'ok',
  'unauthorised',
  'unreachable',
  'version_unsupported',
]);

export const reportRunStatusEnum = pgEnum('report_run_status', [
  'queued',
  'running',
  'succeeded',
  'failed',
]);

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: citext('email').notNull(),
    passwordHash: text('password_hash'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    locale: text('locale').notNull().default('en-US'),
    timezone: text('timezone').notNull().default('UTC'),
    status: userStatusEnum('status').notNull().default('active'),
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
    /**
     * E2-21 — wizard progress, so a reload or a new device resumes where the
     * user left off rather than restarting at step 1. Holds only the in-flight
     * base URL and the step reached; never the token.
     */
    onboardingState: jsonb('onboarding_state').$type<{
      step?: number;
      baseUrl?: string;
      detectedVersion?: string;
    }>(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    failedLoginCount: integer('failed_login_count').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('users_email_unique')
      .on(table.email)
      .where(sql`${table.deletedAt} is null`),
    index('users_status_idx').on(table.status),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Only the hash is stored; the raw token lives in the cookie alone.
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    idleExpiresAt: timestamp('idle_expires_at', { withTimezone: true }).notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    /** Set after a step-up re-auth; gates destructive proxy calls (E23-04). */
    elevatedUntil: timestamp('elevated_until', { withTimezone: true }),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('sessions_token_hash_unique').on(table.tokenHash),
    index('sessions_user_idx').on(table.userId),
    index('sessions_expires_idx').on(table.expiresAt),
  ],
);

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('oauth_provider_account_unique').on(table.provider, table.providerAccountId),
    index('oauth_user_idx').on(table.userId),
  ],
);

export const emailTokens = pgTable(
  'email_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: emailTokenPurposeEnum('purpose').notNull(),
    tokenHash: text('token_hash').notNull(),
    /** For change_email: the address being moved to. */
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('email_tokens_hash_unique').on(table.tokenHash),
    index('email_tokens_user_purpose_idx').on(table.userId, table.purpose),
  ],
);

export const mfaCredentials = pgTable(
  'mfa_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: mfaTypeEnum('type').notNull(),
    label: text('label'),
    /** TOTP seed / WebAuthn key material, sealed by server/crypto. */
    secretCiphertext: text('secret_ciphertext').notNull(),
    secretNonce: text('secret_nonce').notNull(),
    secretAuthTag: text('secret_auth_tag').notNull(),
    keyVersion: smallint('key_version').notNull().default(1),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index('mfa_user_idx').on(table.userId)],
);

export const mfaRecoveryCodes = pgTable(
  'mfa_recovery_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    codeHash: text('code_hash').notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index('mfa_recovery_user_idx').on(table.userId)],
);

// ---------------------------------------------------------------------------
// Firefly connections — the heart of onboarding (E2-14 … E2-22)
// ---------------------------------------------------------------------------

export const fireflyConnections = pgTable(
  'firefly_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: text('label').notNull().default('My Firefly III'),
    /** Normalised origin + optional path prefix, no trailing slash, no /api/v1. */
    baseUrl: text('base_url').notNull(),

    // --- sealed Personal Access Token (AES-256-GCM, see server/crypto) -------
    tokenCiphertext: text('token_ciphertext').notNull(),
    tokenNonce: text('token_nonce').notNull(),
    tokenAuthTag: text('token_auth_tag').notNull(),
    keyVersion: smallint('key_version').notNull().default(1),
    /** Last 4 characters, for display only — never the token itself. */
    tokenHint: text('token_hint').notNull(),

    // --- probed from GET /api/v1/about and /about/user ----------------------
    fireflyVersion: text('firefly_version'),
    apiVersion: text('api_version'),
    phpVersion: text('php_version'),
    osName: text('os_name'),
    driver: text('driver'),
    remoteUserId: text('remote_user_id'),
    remoteUserEmail: text('remote_user_email'),
    remoteUserRole: text('remote_user_role'),
    primaryCurrency: text('primary_currency'),

    status: connectionStatusEnum('status').notNull().default('pending'),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
    lastOkAt: timestamp('last_ok_at', { withTimezone: true }),
    lastError: text('last_error'),
    isDefault: boolean('is_default').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index('firefly_connections_user_idx').on(table.userId),
    // At most one default connection per user.
    uniqueIndex('firefly_connections_one_default')
      .on(table.userId)
      .where(sql`${table.isDefault}`),
    index('firefly_connections_status_idx').on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// Preferences and saved artefacts
// ---------------------------------------------------------------------------

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: themeEnum('theme').notNull().default('system'),
  density: densityEnum('density').notNull().default('comfortable'),
  numberFormat: text('number_format').notNull().default('en-US'),
  dateFormat: text('date_format').notNull().default('medium'),
  weekStart: smallint('week_start').notNull().default(1),
  defaultDateRange: text('default_date_range').notNull().default('this-month'),
  defaultLandingPage: text('default_landing_page').notNull().default('/dashboard'),
  defaultAccountIds: text('default_account_ids')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  dashboardLayout: jsonb('dashboard_layout').$type<Record<string, unknown>>(),
  hideBalances: boolean('hide_balances').notNull().default(false),
  reducedMotion: boolean('reduced_motion').notNull().default(false),
  ...timestamps,
});

export const savedViews = pgTable(
  'saved_views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Which list this view belongs to: transactions, accounts, bills … */
    entity: text('entity').notNull(),
    query: jsonb('query').$type<Record<string, unknown>>().notNull(),
    isPinned: boolean('is_pinned').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (table) => [index('saved_views_user_entity_idx').on(table.userId, table.entity)],
);

export const savedReports = pgTable(
  'saved_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    config: jsonb('config').$type<Record<string, unknown>>().notNull(),
    scheduleCron: text('schedule_cron'),
    deliverTo: text('deliver_to').array(),
    isPinned: boolean('is_pinned').notNull().default(false),
    ...timestamps,
  },
  (table) => [index('saved_reports_user_idx').on(table.userId)],
);

export const reportRuns = pgTable(
  'report_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    savedReportId: uuid('saved_report_id')
      .notNull()
      .references(() => savedReports.id, { onDelete: 'cascade' }),
    status: reportRunStatusEnum('status').notNull().default('queued'),
    filePath: text('file_path'),
    error: text('error'),
    generatedAt: timestamp('generated_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index('report_runs_report_idx').on(table.savedReportId)],
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('notifications_user_unread_idx')
      .on(table.userId)
      .where(sql`${table.readAt} is null`),
  ],
);

// ---------------------------------------------------------------------------
// Security / operational
// ---------------------------------------------------------------------------

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Nullable so failed sign-in attempts against unknown emails still record.
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity'),
    entityId: text('entity_id'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_log_user_idx').on(table.userId, table.createdAt),
    index('audit_log_action_idx').on(table.action, table.createdAt),
  ],
);

/** Proxy response cache. Used only when REDIS_URL is unset (E22-01). */
export const apiCache = pgTable(
  'api_cache',
  {
    cacheKey: text('cache_key').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    connectionId: uuid('connection_id').references(() => fireflyConnections.id, {
      onDelete: 'cascade',
    }),
    /** Cache tags for bulk invalidation on write (see §9.6). */
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    payload: jsonb('payload').notNull(),
    etag: text('etag'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('api_cache_user_idx').on(table.userId),
    index('api_cache_expires_idx').on(table.expiresAt),
  ],
);

/** Sliding-window counters. Used only when REDIS_URL is unset (E22-03). */
export const rateLimits = pgTable(
  'rate_limits',
  {
    bucket: text('bucket').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.bucket, table.windowStart] }),
    index('rate_limits_window_idx').on(table.windowStart),
  ],
);

export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  description: text('description'),
  rules: jsonb('rules').$type<Record<string, unknown>>(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type FireflyConnection = typeof fireflyConnections.$inferSelect;
export type NewFireflyConnection = typeof fireflyConnections.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type ManagedFireflyUser = typeof managedFireflyUsers.$inferSelect;
export type ConnectionStatus = (typeof connectionStatusEnum.enumValues)[number];

/**
 * The permanent link between an app user and their account on the managed
 * Firefly III instance (the one this deployment operates, if MANAGED_FIREFLY_URL
 * is set).
 *
 * This row outlives any connection built from it. A user may switch to their
 * own Firefly instance and back again any number of times; each switch back has
 * to land on the SAME Firefly account, or their managed ledger would be
 * orphaned and silently replaced with an empty one. That is why the mapping is
 * kept even when no connection currently points at it, and why deleting it is
 * not part of disconnecting.
 *
 * The password is stored sealed because Firefly has no API for minting a token
 * on another user's behalf: re-provisioning means logging in as them through
 * Firefly's own login form, which needs the password back in plaintext at that
 * moment. `server/managed-firefly` is the only place that opens it.
 */
export const managedFireflyUsers = pgTable(
  'managed_firefly_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** The instance this mapping belongs to; re-pointing the env invalidates it. */
    baseUrl: text('base_url').notNull(),
    /** Firefly's own user id, read back from /about/user after provisioning. */
    remoteUserId: text('remote_user_id').notNull(),
    remoteEmail: text('remote_email').notNull(),
    passwordCiphertext: text('password_ciphertext').notNull(),
    passwordNonce: text('password_nonce').notNull(),
    passwordAuthTag: text('password_auth_tag').notNull(),
    keyVersion: smallint('key_version').notNull().default(1),
    lastProvisionedAt: timestamp('last_provisioned_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    // One managed account per user per instance.
    uniqueIndex('managed_firefly_users_user_base_url_unique').on(table.userId, table.baseUrl),
    index('managed_firefly_users_user_idx').on(table.userId),
  ],
);

/**
 * Columns safe to select into a render path. The sealed token fields are
 * deliberately absent — only server/crypto, called from the proxy, reads those.
 */
export const connectionPublicColumns = {
  id: fireflyConnections.id,
  userId: fireflyConnections.userId,
  label: fireflyConnections.label,
  baseUrl: fireflyConnections.baseUrl,
  tokenHint: fireflyConnections.tokenHint,
  fireflyVersion: fireflyConnections.fireflyVersion,
  apiVersion: fireflyConnections.apiVersion,
  remoteUserEmail: fireflyConnections.remoteUserEmail,
  remoteUserRole: fireflyConnections.remoteUserRole,
  primaryCurrency: fireflyConnections.primaryCurrency,
  status: fireflyConnections.status,
  lastCheckedAt: fireflyConnections.lastCheckedAt,
  lastError: fireflyConnections.lastError,
  isDefault: fireflyConnections.isDefault,
  createdAt: fireflyConnections.createdAt,
} as const;
