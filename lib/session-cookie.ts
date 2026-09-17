/**
 * The session cookie name lives here, apart from `server/auth/session.ts`,
 * because `middleware.ts` runs on the edge runtime and must not pull
 * `node:crypto` (or the pg driver) into its bundle.
 */
export const SESSION_COOKIE_NAME = 'fs_session';
