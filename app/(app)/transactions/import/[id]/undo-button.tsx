'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Undo2 } from 'lucide-react';
import { undoChunkAction } from '@/server/import/actions';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ProgressBar } from '@/components/ui/progress-bar';
import { FormMessage } from '@/components/auth/form-shell';

/**
 * Roll a finished import back. Chunked like the import, for the same reason:
 * a thousand deletes do not fit in one request.
 */
export function UndoButton({
  batchId,
  imported,
  createdAccounts,
  createdSetup = 0,
  resume = false,
}: {
  batchId: string;
  imported: number;
  createdAccounts: number;
  /** Budgets, categories and tags the import created. */
  createdSetup?: number;
  /** An undo already started and stopped. */
  resume?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [deleteAccounts, setDeleteAccounts] = React.useState(true);
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      for (;;) {
        const next = await undoChunkAction(batchId, deleteAccounts);
        if (next.error) {
          setError(next.error);
          break;
        }
        setProgress({ done: next.done, total: next.total });
        if (next.finished) {
          setOpen(false);
          break;
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The undo stopped.');
    } finally {
      setRunning(false);
      router.refresh();
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Undo2 className="size-4" aria-hidden="true" />
        {resume ? 'Finish undoing' : 'Undo this import'}
      </Button>
      {open ? (
        <Dialog
          open
          onClose={() => (running ? undefined : setOpen(false))}
          title="Undo this import?"
          description={`Deletes the ${imported} transaction${imported === 1 ? '' : 's'} this import created. Anything you changed on them since is lost with them.`}
        >
          <div className="space-y-4">
            {error ? <FormMessage tone="error">{error}</FormMessage> : null}
            {createdAccounts + createdSetup > 0 ? (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4"
                  checked={deleteAccounts}
                  disabled={running}
                  onChange={(event) => setDeleteAccounts(event.target.checked)}
                />
                <span>
                  Also remove what it set up
                  <span className="text-muted-foreground block text-xs">
                    {[
                      createdAccounts > 0
                        ? `${createdAccounts} account${createdAccounts === 1 ? '' : 's'}`
                        : null,
                      createdSetup > 0
                        ? `${createdSetup} of its budgets, categories and tags`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' and ')}
                    . Only those nothing else uses — anything used since is kept.
                  </span>
                </span>
              </label>
            ) : null}
            {progress ? (
              <ProgressBar
                value={progress.total > 0 ? (progress.done / progress.total) * 100 : 100}
                label="Undo progress"
              />
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" disabled={running} onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={running} onClick={run}>
                {running ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {running ? 'Undoing…' : 'Undo import'}
              </Button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
