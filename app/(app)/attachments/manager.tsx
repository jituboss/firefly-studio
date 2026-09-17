'use client';

import * as React from 'react';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Download, Eye, FileText, Pencil, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { AttachmentPreview, isPreviewable } from '@/components/transactions/attachment-preview';
import {
  deleteAttachmentAction,
  renameAttachmentAction,
  type AttachmentState,
} from '@/server/firefly/attachment-actions';

export interface ManagedAttachment {
  id: string;
  filename: string;
  title: string | null;
  mime: string;
  size: number;
  attachableType: string;
  attachableId: string;
  createdAt: string;
}

/** Firefly reports the model as a PHP class name; that is not a label. */
const MODEL_LABELS: Record<string, string> = {
  TransactionJournal: 'Transaction',
  Account: 'Account',
  Budget: 'Budget',
  Bill: 'Subscription',
  Category: 'Category',
  PiggyBank: 'Piggy bank',
  Tag: 'Tag',
};

const modelLabel = (type: string) => MODEL_LABELS[type] ?? type;

/** Where the thing an attachment belongs to lives in this app. */
function modelHref(type: string, id: string): string | null {
  switch (type) {
    case 'TransactionJournal':
      // No link on purpose. Firefly reports the SPLIT (journal) id here, and
      // the detail route keys on the enclosing GROUP id, which this payload
      // does not carry. A link that lands on the wrong transaction — or a 404 —
      // is worse than plain text.
      return null;
    case 'Account':
      return `/accounts/${id}`;
    case 'Budget':
      return `/budgets/${id}`;
    case 'Bill':
      return `/bills/${id}`;
    case 'Category':
      return `/categories/${id}`;
    case 'PiggyBank':
      return `/piggy-banks/${id}`;
    default:
      return null;
  }
}

function formatBytes(size: number): string {
  if (size <= 0) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function SubmitIcon({
  children,
  label,
  destructive,
}: {
  children: React.ReactNode;
  label: string;
  destructive?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      aria-label={label}
      disabled={pending}
      className={destructive ? 'text-expense' : undefined}
    >
      {children}
    </Button>
  );
}

export function AttachmentManager({
  rows,
  timezone,
  locale,
  total,
}: {
  rows: ManagedAttachment[];
  timezone: string;
  locale: string;
  total: number;
}) {
  const [query, setQuery] = React.useState('');
  const [model, setModel] = React.useState('all');
  const [editing, setEditing] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<ManagedAttachment | null>(null);

  const [renamed, renameAction] = useActionState<AttachmentState, FormData>(
    renameAttachmentAction,
    {},
  );
  const [removed, deleteAction] = useActionState<AttachmentState, FormData>(
    deleteAttachmentAction,
    {},
  );

  React.useEffect(() => {
    if (renamed.ok) setEditing(null);
  }, [renamed]);

  const models = React.useMemo(
    () => [...new Set(rows.map((row) => row.attachableType))].sort(),
    [rows],
  );

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (model !== 'all' && row.attachableType !== model) return false;
      if (!needle) return true;
      return (
        row.filename.toLowerCase().includes(needle) ||
        (row.title ?? '').toLowerCase().includes(needle)
      );
    });
  }, [rows, query, model]);

  return (
    <div className="min-w-0 space-y-4">
      {renamed.error ? <FormMessage tone="error">{renamed.error}</FormMessage> : null}
      {removed.error ? <FormMessage tone="error">{removed.error}</FormMessage> : null}
      {removed.notice ? <FormMessage tone="notice">{removed.notice}</FormMessage> : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by name…"
            aria-label="Filter attachments by name"
            className="pl-8"
          />
        </div>

        <label className="sr-only" htmlFor="model-filter">
          Filter by what it is attached to
        </label>
        <select
          id="model-filter"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
        >
          <option value="all">Everything</option>
          {models.map((entry) => (
            <option key={entry} value={entry}>
              {modelLabel(entry)}
            </option>
          ))}
        </select>

        <span className="text-muted-foreground text-xs">
          {visible.length} of {total}
        </span>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">
              {rows.length === 0
                ? 'No attachments yet. Add a receipt from any transaction.'
                : 'Nothing matches these filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="min-w-0 overflow-hidden">
          <ul className="divide-border divide-y">
            {visible.map((row) => {
              const href = modelHref(row.attachableType, row.attachableId);
              const isEditing = editing === row.id;

              return (
                <li key={row.id} className="flex min-w-0 items-center gap-3 p-3">
                  <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />

                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <form action={renameAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={row.id} />
                        <Input
                          name="title"
                          defaultValue={row.title ?? row.filename}
                          aria-label={`New name for ${row.filename}`}
                          className="h-8 max-w-xs"
                          autoFocus
                        />
                        <SubmitIcon label="Save name">
                          <Check className="size-4" />
                        </SubmitIcon>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Cancel rename"
                          onClick={() => setEditing(null)}
                        >
                          <X className="size-4" />
                        </Button>
                      </form>
                    ) : (
                      <>
                        <p className="truncate text-sm font-medium">{row.title || row.filename}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {formatBytes(row.size)} · {row.mime} ·{' '}
                          {formatDate(row.createdAt, { timezone, locale })} ·{' '}
                          {href ? (
                            <Link href={href} className="hover:text-primary hover:underline">
                              {modelLabel(row.attachableType)}
                            </Link>
                          ) : (
                            modelLabel(row.attachableType)
                          )}
                        </p>
                      </>
                    )}
                  </div>

                  {isEditing ? null : (
                    <div className={cn('flex shrink-0 items-center')}>
                      {isPreviewable(row.mime) ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Preview ${row.filename}`}
                          onClick={() => setPreview(row)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      ) : null}

                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label={`Download ${row.filename}`}
                      >
                        <a href={`/api/attachments/${row.id}/download`}>
                          <Download className="size-4" />
                        </a>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Rename ${row.filename}`}
                        onClick={() => setEditing(row.id)}
                      >
                        <Pencil className="size-4" />
                      </Button>

                      <form
                        action={deleteAction}
                        onSubmit={(event) => {
                          if (
                            !confirm(`Delete ${row.title || row.filename}? This cannot be undone.`)
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={row.id} />
                        <SubmitIcon label={`Delete ${row.filename}`} destructive>
                          <Trash2 className="size-4" />
                        </SubmitIcon>
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {preview ? (
        <AttachmentPreview
          id={preview.id}
          filename={preview.title || preview.filename}
          mime={preview.mime}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}
