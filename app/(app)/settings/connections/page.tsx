import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { listConnections } from '@/server/connections';
import { ConnectionCard } from './connection-card';

export const metadata: Metadata = { title: 'Firefly connections' };

export default async function ConnectionsPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const connections = await listConnections(session.user.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Firefly connections</h1>
        <p className="text-muted-foreground text-sm">
          Your Personal Access Token is encrypted before storage and never sent back to your
          browser. Only the last four characters are shown.
        </p>
      </header>

      {connections.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">No connections yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {connections.map((connection) => (
            <li key={connection.id}>
              <ConnectionCard connection={connection} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
