'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertTriangle, CheckCircle2, KeyRound, Star, Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import type { PublicConnection } from '@/server/connections';
import {
  deleteConnectionAction,
  renameConnectionAction,
  rotateTokenAction,
  setDefaultConnectionAction,
  testConnectionAction,
  type ConnectionActionState,
} from '@/server/connections/actions';
import { deleteConfirmMessage } from '@/lib/connection-lifecycle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';

const STATUS_LABEL: Record<string, string> = {
  ok: 'Connected',
  pending: 'Not verified',
  unauthorised: 'Token rejected',
  unreachable: 'Unreachable',
  version_unsupported: 'Version unsupported',
};

function PendingButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} disabled={pending}>
      {pending ? 'Working…' : children}
    </Button>
  );
}

export function ConnectionCard({
  connection,
  isOnly,
}: {
  connection: PublicConnection;
  /** Connection lifecycle fix — the last connection needs an honest warning. */
  isOnly: boolean;
}) {
  const [testState, testAction] = useActionState<ConnectionActionState, FormData>(
    testConnectionAction,
    {},
  );
  const [rotateState, rotateAction] = useActionState<ConnectionActionState, FormData>(
    rotateTokenAction,
    {},
  );
  const [showRotate, setShowRotate] = useState(false);

  const healthy = connection.status === 'ok';

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-semibold">{connection.label}</h2>
              {connection.isDefault ? <Badge variant="secondary">Default</Badge> : null}
            </div>
            <p className="text-muted-foreground truncate font-mono text-xs">{connection.baseUrl}</p>
          </div>

          <Badge variant={healthy ? 'income' : 'warning'}>
            {healthy ? (
              <CheckCircle2 className="size-3" aria-hidden="true" />
            ) : (
              <AlertTriangle className="size-3" aria-hidden="true" />
            )}
            {STATUS_LABEL[connection.status] ?? connection.status}
          </Badge>
        </div>

        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-2 sm:block">
            <dt className="text-muted-foreground text-xs">Firefly III</dt>
            <dd>{connection.fireflyVersion ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-2 sm:block">
            <dt className="text-muted-foreground text-xs">Firefly account</dt>
            <dd className="truncate">{connection.remoteUserEmail ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-2 sm:block">
            <dt className="text-muted-foreground text-xs">Token</dt>
            <dd className="font-mono">{connection.tokenHint}</dd>
          </div>
          <div className="flex justify-between gap-2 sm:block">
            <dt className="text-muted-foreground text-xs">Primary currency</dt>
            <dd>{connection.primaryCurrency ?? '—'}</dd>
          </div>
        </dl>

        {connection.lastError ? (
          <p className="text-expense bg-expense-muted rounded-md px-3 py-2 text-sm">
            {connection.lastError}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {testState.error ? <FormMessage tone="error">{testState.error}</FormMessage> : null}
        {testState.notice ? <FormMessage tone="notice">{testState.notice}</FormMessage> : null}
        {rotateState.error ? <FormMessage tone="error">{rotateState.error}</FormMessage> : null}
        {rotateState.notice ? <FormMessage tone="notice">{rotateState.notice}</FormMessage> : null}

        <div className="flex flex-wrap gap-2">
          <form action={testAction}>
            <input type="hidden" name="connectionId" value={connection.id} />
            <PendingButton variant="outline" size="sm">
              Test now
            </PendingButton>
          </form>

          <Button variant="outline" size="sm" onClick={() => setShowRotate((open) => !open)}>
            <KeyRound className="size-4" aria-hidden="true" />
            Replace token
          </Button>

          {!connection.isDefault ? (
            <form action={setDefaultConnectionAction}>
              <input type="hidden" name="connectionId" value={connection.id} />
              <PendingButton variant="outline" size="sm">
                <Star className="size-4" aria-hidden="true" />
                Make default
              </PendingButton>
            </form>
          ) : null}

          <form action={deleteConnectionAction} className="ml-auto">
            <input type="hidden" name="connectionId" value={connection.id} />
            <ConfirmButton
              message={deleteConfirmMessage(connection.label, isOnly)}
              title="Remove this instance"
              confirmLabel="Remove"
              pendingLabel="Removing…"
              variant="ghost"
              size="sm"
              className="text-expense"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Remove
            </ConfirmButton>
          </form>
        </div>

        {showRotate ? (
          <form action={rotateAction} className="space-y-2 rounded-md border p-3">
            <input type="hidden" name="connectionId" value={connection.id} />
            <Label htmlFor={`token-${connection.id}`}>New Personal Access Token</Label>
            <textarea
              id={`token-${connection.id}`}
              name="token"
              required
              rows={3}
              autoComplete="off"
              spellCheck={false}
              className="border-input bg-background w-full rounded-md border p-2 font-mono text-xs break-all"
            />
            <PendingButton size="sm">Save token</PendingButton>
          </form>
        ) : null}

        <form action={renameConnectionAction} className="flex items-end gap-2 border-t pt-3">
          <input type="hidden" name="connectionId" value={connection.id} />
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={`label-${connection.id}`} className="text-xs">
              Connection name
            </Label>
            <Input id={`label-${connection.id}`} name="label" defaultValue={connection.label} />
          </div>
          <PendingButton variant="outline" size="sm">
            Rename
          </PendingButton>
        </form>
      </CardContent>
    </Card>
  );
}
