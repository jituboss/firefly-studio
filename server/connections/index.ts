import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { connectionPublicColumns, fireflyConnections } from '@/server/db/schema';
import { open, seal, tokenHint } from '@/server/crypto';
import type { InstanceInfo, RemoteUser } from '@/server/firefly/probe';

/**
 * E2-16 / E2-22 — Firefly connection persistence.
 *
 * Every read used by a page goes through `connectionPublicColumns`, which omits
 * the sealed token fields entirely. `getConnectionToken` is the single function
 * that can produce a plaintext PAT, and it is only called from server code that
 * is about to make a Firefly request.
 */

/** Exactly the columns in `connectionPublicColumns` — nullability preserved. */
export type PublicConnection = Pick<
  typeof fireflyConnections.$inferSelect,
  keyof typeof connectionPublicColumns
>;

/** The crypto context binds a sealed token to its own row (see server/crypto). */
const context = (connectionId: string) => `connection:${connectionId}:token`;

export async function listConnections(userId: string): Promise<PublicConnection[]> {
  return db
    .select(connectionPublicColumns)
    .from(fireflyConnections)
    .where(eq(fireflyConnections.userId, userId));
}

export async function getDefaultConnection(userId: string): Promise<PublicConnection | null> {
  const rows = await db
    .select(connectionPublicColumns)
    .from(fireflyConnections)
    .where(eq(fireflyConnections.userId, userId));

  return rows.find((row) => row.isDefault) ?? rows[0] ?? null;
}

export async function createConnection(input: {
  userId: string;
  label: string;
  baseUrl: string;
  token: string;
  instance: InstanceInfo;
  remoteUser: RemoteUser;
  primaryCurrency: string | null;
}): Promise<PublicConnection> {
  // The row is inserted first so the generated id can salt the key derivation,
  // then updated with the sealed token. Both steps run in one transaction.
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(fireflyConnections)
      .values({
        userId: input.userId,
        label: input.label,
        baseUrl: input.baseUrl,
        tokenCiphertext: '',
        tokenNonce: '',
        tokenAuthTag: '',
        tokenHint: tokenHint(input.token),
        fireflyVersion: input.instance.version,
        apiVersion: input.instance.apiVersion,
        phpVersion: input.instance.phpVersion,
        osName: input.instance.os,
        driver: input.instance.driver,
        remoteUserId: input.remoteUser.id,
        remoteUserEmail: input.remoteUser.email,
        remoteUserRole: input.remoteUser.role,
        primaryCurrency: input.primaryCurrency,
        status: 'ok',
        lastCheckedAt: new Date(),
        lastOkAt: new Date(),
        isDefault: false,
      })
      .returning({ id: fireflyConnections.id });

    const id = created!.id;
    const sealed = seal(input.token, context(id));

    // First connection for this user becomes the default.
    const existing = await tx
      .select({ id: fireflyConnections.id })
      .from(fireflyConnections)
      .where(eq(fireflyConnections.userId, input.userId));

    const [row] = await tx
      .update(fireflyConnections)
      .set({
        tokenCiphertext: sealed.ciphertext,
        tokenNonce: sealed.nonce,
        tokenAuthTag: sealed.authTag,
        keyVersion: sealed.keyVersion,
        isDefault: existing.length === 1,
      })
      .where(eq(fireflyConnections.id, id))
      .returning(connectionPublicColumns);

    return row!;
  });
}

/** Replace the stored PAT after a rotation (E2-22). */
export async function rotateConnectionToken(
  userId: string,
  connectionId: string,
  token: string,
  remoteUser: RemoteUser,
): Promise<void> {
  const sealed = seal(token, context(connectionId));

  await db
    .update(fireflyConnections)
    .set({
      tokenCiphertext: sealed.ciphertext,
      tokenNonce: sealed.nonce,
      tokenAuthTag: sealed.authTag,
      keyVersion: sealed.keyVersion,
      tokenHint: tokenHint(token),
      remoteUserId: remoteUser.id,
      remoteUserEmail: remoteUser.email,
      remoteUserRole: remoteUser.role,
      status: 'ok',
      lastError: null,
      lastCheckedAt: new Date(),
      lastOkAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(fireflyConnections.id, connectionId), eq(fireflyConnections.userId, userId)));
}

/**
 * The ONLY path to a plaintext token. Callers must be server-side and must be
 * about to issue a Firefly request — never to render.
 */
export async function getConnectionToken(
  userId: string,
  connectionId: string,
): Promise<{ baseUrl: string; token: string } | null> {
  const [row] = await db
    .select({
      baseUrl: fireflyConnections.baseUrl,
      ciphertext: fireflyConnections.tokenCiphertext,
      nonce: fireflyConnections.tokenNonce,
      authTag: fireflyConnections.tokenAuthTag,
      keyVersion: fireflyConnections.keyVersion,
    })
    .from(fireflyConnections)
    .where(and(eq(fireflyConnections.id, connectionId), eq(fireflyConnections.userId, userId)))
    .limit(1);

  if (!row || !row.ciphertext) return null;

  return {
    baseUrl: row.baseUrl,
    token: open(
      {
        ciphertext: row.ciphertext,
        nonce: row.nonce,
        authTag: row.authTag,
        keyVersion: row.keyVersion,
      },
      context(connectionId),
    ),
  };
}

export async function setDefaultConnection(userId: string, connectionId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(fireflyConnections)
      .set({ isDefault: false })
      .where(eq(fireflyConnections.userId, userId));
    await tx
      .update(fireflyConnections)
      .set({ isDefault: true })
      .where(and(eq(fireflyConnections.id, connectionId), eq(fireflyConnections.userId, userId)));
  });
}

export async function renameConnection(
  userId: string,
  connectionId: string,
  label: string,
): Promise<void> {
  await db
    .update(fireflyConnections)
    .set({ label, updatedAt: new Date() })
    .where(and(eq(fireflyConnections.id, connectionId), eq(fireflyConnections.userId, userId)));
}

export async function deleteConnection(userId: string, connectionId: string): Promise<void> {
  await db
    .delete(fireflyConnections)
    .where(and(eq(fireflyConnections.id, connectionId), eq(fireflyConnections.userId, userId)));
}

export async function recordConnectionCheck(
  connectionId: string,
  result: { status: 'ok' | 'unauthorised' | 'unreachable' | 'version_unsupported'; error?: string },
): Promise<void> {
  await db
    .update(fireflyConnections)
    .set({
      status: result.status,
      lastError: result.error ?? null,
      lastCheckedAt: new Date(),
      ...(result.status === 'ok' ? { lastOkAt: new Date() } : {}),
    })
    .where(eq(fireflyConnections.id, connectionId));
}
