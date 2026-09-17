'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Download, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AttachmentRow {
  id: string;
  filename: string;
  size: number;
  mime: string;
}

/** E16-01 / E16-02 / E16-03 — upload, list, download, delete. */
export function Attachments({
  journalId,
  initial,
}: {
  journalId: string;
  initial: AttachmentRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function upload(files: FileList | File[]) {
    setBusy(true);
    setError(null);

    for (const file of Array.from(files)) {
      const body = new FormData();
      body.set('file', file);
      body.set('attachable_type', 'TransactionJournal');
      body.set('attachable_id', journalId);

      try {
        const response = await fetch('/api/attachments/upload', { method: 'POST', body });
        const payload = (await response.json()) as { id?: string; error?: string };
        if (!response.ok) {
          setError(payload.error ?? 'Upload failed');
          continue;
        }
        setRows((current) => [
          ...current,
          { id: payload.id!, filename: file.name, size: file.size, mime: file.type },
        ]);
      } catch {
        setError('Upload failed');
      }
    }

    setBusy(false);
    router.refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/ff/v1/attachments/${id}`, { method: 'DELETE' });
      setRows((current) => current.filter((row) => row.id !== id));
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length > 0) void upload(event.dataTransfer.files);
        }}
        onPaste={(event) => {
          const files = Array.from(event.clipboardData.files);
          if (files.length > 0) void upload(files);
        }}
        className={cn(
          'rounded-lg border border-dashed p-6 text-center transition-colors',
          dragging ? 'border-primary bg-accent' : 'border-border',
        )}
      >
        <Paperclip className="text-muted-foreground mx-auto size-5" aria-hidden="true" />
        <p className="text-muted-foreground mt-2 text-sm">
          Drop a receipt here, paste one, or{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-foreground underline underline-offset-4"
          >
            choose a file
          </button>
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files?.length) void upload(event.target.files);
          }}
        />
        {busy ? (
          <p className="text-muted-foreground mt-2 flex items-center justify-center gap-1.5 text-xs">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Uploading…
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="bg-expense-muted text-expense rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="divide-border divide-y rounded-lg border">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-3 py-2">
              <Paperclip className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm">{row.filename}</span>
              <span className="text-muted-foreground text-xs">
                {row.size > 0 ? `${Math.max(1, Math.round(row.size / 1024))} KB` : ''}
              </span>
              <Button asChild variant="ghost" size="icon" aria-label={`Download ${row.filename}`}>
                <a href={`/api/attachments/${row.id}/download`}>
                  <Download className="size-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.filename}`}
                className="text-expense"
                onClick={() => void remove(row.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        <Upload className="size-4" aria-hidden="true" />
        Add attachment
      </Button>
    </div>
  );
}
