'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Download, Eye, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/image-compress';
import { csrfHeaders } from '@/lib/csrf';
import { AttachmentPreview, isPreviewable } from './attachment-preview';

export interface AttachmentRow {
  id: string;
  filename: string;
  size: number;
  mime: string;
}

/** E16-01 … E16-04, E16-06 — upload, list, preview, download, delete, and
 *  camera capture with client-side compression. */
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
  const [preview, setPreview] = React.useState<AttachmentRow | null>(null);
  const [saved, setSaved] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);

  async function upload(files: FileList | File[]) {
    setBusy(true);
    setError(null);

    let savedBytes = 0;

    for (const original of Array.from(files)) {
      // E16-06 — shrink before uploading. A phone photo is 3-8 MB; a legible
      // receipt is a few hundred KB.
      const { file, originalBytes, compressed } = await compressImage(original);
      if (compressed) savedBytes += originalBytes - file.size;

      const body = new FormData();
      body.set('file', file);
      body.set('attachable_type', 'TransactionJournal');
      body.set('attachable_id', journalId);

      try {
        const response = await fetch('/api/attachments/upload', {
          method: 'POST',
          headers: csrfHeaders(),
          body,
        });
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

    setSaved(
      savedBytes > 0
        ? `Compressed before upload, saving ${Math.round(savedBytes / 1024)} KB.`
        : null,
    );
    setBusy(false);
    router.refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/ff/v1/attachments/${id}`, { method: 'DELETE', headers: csrfHeaders() });
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

      <div className="flex flex-wrap gap-2">
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

        {/* E16-06 — `capture` asks a phone to open the camera directly rather
            than the file picker. Desktop browsers ignore it and show the
            picker, so this is safe to render everywhere. */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cameraRef.current?.click()}
          disabled={busy}
          className="sm:hidden"
        >
          <Camera className="size-4" aria-hidden="true" />
          Take a photo
        </Button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(event) => {
            if (event.target.files?.length) void upload(event.target.files);
          }}
        />
      </div>

      {saved ? <p className="text-muted-foreground text-xs">{saved}</p> : null}

      {preview ? (
        <AttachmentPreview
          id={preview.id}
          filename={preview.filename}
          mime={preview.mime}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}
