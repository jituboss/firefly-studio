import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getAttachments } from '@/server/firefly/queries';
import { AttachmentManager } from './manager';

export const metadata: Metadata = { title: 'Attachments' };

/**
 * E16-05 — every receipt in one place.
 *
 * Firefly's `/attachments` endpoint takes no filter parameters, so the type
 * filter and the search are applied client-side over what comes back. That is
 * the right trade for a personal ledger; a five-figure attachment count would
 * need real paging instead.
 */
export default async function AttachmentsPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const attachments = await getAttachments({ limit: 200 });

  const rows = attachments.data.map((row) => ({
    id: row.id,
    filename: row.attributes.filename,
    title: row.attributes.title,
    mime: row.attributes.mime,
    size: row.attributes.size,
    attachableType: row.attributes.attachable_type,
    attachableId: row.attributes.attachable_id,
    createdAt: row.attributes.created_at,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Attachments</h1>
        <p className="text-muted-foreground text-sm">
          Every receipt and document stored on {connection.label}.
        </p>
      </header>

      <AttachmentManager
        rows={rows}
        timezone={session.user.timezone}
        locale={session.user.locale}
        total={attachments.meta.pagination?.total ?? rows.length}
      />
    </div>
  );
}
