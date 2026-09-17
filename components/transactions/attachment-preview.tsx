'use client';

import * as React from 'react';
import { Download, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * E16-04 — inline preview for images and PDFs.
 *
 * The file is fetched through `/api/attachments/{id}/download`, our own proxy
 * route, and turned into an object URL. It is NOT pointed at Firefly's
 * `download_url` directly: that URL needs the PAT, which never reaches the
 * browser (ADR-0002), and a self-hosted Firefly is usually on a LAN address the
 * browser cannot resolve anyway.
 *
 * Only images and PDFs preview. Everything else offers a download, because a
 * viewer that renders a .docx as mojibake is worse than no viewer.
 */

export const isPreviewable = (mime: string): boolean =>
  mime.startsWith('image/') || mime === 'application/pdf';

export function AttachmentPreview({
  id,
  filename,
  mime,
  onClose,
}: {
  id: string;
  filename: string;
  mime: string;
  onClose: () => void;
}) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    fetch(`/api/attachments/${id}/download`)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load (${response.status})`);
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        // Re-type from the recorded mime: a proxied stream can arrive as
        // application/octet-stream, which the browser refuses to render inline.
        revoked = URL.createObjectURL(new Blob([blob], { type: mime }));
        setUrl(revoked);
      })
      .catch((caught: Error) => {
        if (!cancelled) setError(caught.message);
      });

    return () => {
      cancelled = true;
      // Object URLs pin their blob in memory until revoked; a receipt lightbox
      // opened repeatedly would otherwise leak every file it showed.
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [id, mime]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${filename}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4"
    >
      <div className="flex items-center gap-3 pb-3 text-white">
        <FileText className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-sm">{filename}</span>
        <Button asChild variant="ghost" size="icon" aria-label={`Download ${filename}`}>
          <a href={`/api/attachments/${id}/download`} className="text-white">
            <Download className="size-4" />
          </a>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Close preview" onClick={onClose}>
          <X className="size-4 text-white" />
        </Button>
      </div>

      {/* Clicking the backdrop closes; clicking the file itself must not. */}
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 -z-10 cursor-default"
        onClick={onClose}
      />

      <div className="flex min-h-0 flex-1 items-center justify-center">
        {error ? (
          <p className="rounded-md bg-white/10 px-4 py-3 text-sm text-white">{error}</p>
        ) : !url ? (
          <p className="text-sm text-white/70">Loading…</p>
        ) : mime === 'application/pdf' ? (
          <iframe src={url} title={filename} className="h-full w-full rounded-lg bg-white" />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element -- a blob: URL
             has no remote host for next/image to optimise. */
          <img
            src={url}
            alt={filename}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        )}
      </div>
    </div>
  );
}
