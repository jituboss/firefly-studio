'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';
import { csrfHeaders } from '@/lib/csrf';
import { cn } from '@/lib/utils';
import { FormMessage } from '@/components/auth/form-shell';

/**
 * Drop or pick a filled-in template. Parsing and the duplicate check happen on
 * upload, so the next screen is already the preview — nothing is written to
 * Firefly until the user says so there.
 */
export function UploadForm() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [over, setOver] = React.useState(false);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set('file', file);
      const response = await fetch('/api/import/upload', {
        method: 'POST',
        headers: csrfHeaders(),
        body,
      });
      const payload = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!response.ok || !payload.id) {
        setError(payload.error ?? 'The upload failed.');
        return;
      }
      router.push(`/transactions/import/${payload.id}`);
    } catch {
      setError('The upload failed. Check your connection and try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          const file = event.dataTransfer.files[0];
          if (file) void upload(file);
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors',
          'focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2',
          over ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/40',
          busy && 'cursor-wait opacity-70',
        )}
      >
        {busy ? (
          <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden="true" />
        ) : (
          <Upload className="text-muted-foreground size-6" aria-hidden="true" />
        )}
        <span className="text-sm font-medium">
          {busy ? 'Reading the file and checking for duplicates…' : 'Drop the filled-in file here'}
        </span>
        <span className="text-muted-foreground text-xs">
          or click to choose · .xlsx or .csv · up to 5 MB and 2,000 rows
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose a file to import"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
