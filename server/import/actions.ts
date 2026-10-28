'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { FireflyRequestError } from '@/server/firefly/api';
import { ALL_KINDS, type AccountKind } from '@/lib/account-matrix';
import { normaliseName, type AccountOverride, type RowOverride } from '@/lib/import/plan';
import {
  commitChunk,
  discardBatch,
  getBatch,
  recheckDuplicates,
  undoChunk,
  updateOptions,
  updateOverrides,
  type BatchOptions,
  type Progress,
  type UndoProgress,
} from './service';

/**
 * Every export here is a public endpoint (CONTRIBUTING), so each one re-loads
 * the batch through `getBatch`, which scopes it to the signed-in user and the
 * active connection — a batch id alone grants nothing.
 */

async function editable(id: string) {
  const batch = await getBatch(id);
  if (!batch) throw new Error('Import not found.');
  if (batch.status !== 'preview') throw new Error('This import has already started.');
  return batch;
}

function refresh(id: string) {
  revalidatePath(`/transactions/import/${id}`);
}

export async function setRowOverrideAction(id: string, line: number, change: RowOverride) {
  const batch = await editable(id);
  const current = batch.overrides.rows[String(line)] ?? {};
  const next: RowOverride = {
    ...(change.skip !== undefined ? { skip: change.skip } : { skip: current.skip }),
    ...(change.force !== undefined ? { force: change.force } : { force: current.force }),
    ...(change.swap !== undefined ? { swap: change.swap } : { swap: current.swap }),
  };
  await updateOverrides(batch, {
    ...batch.overrides,
    rows: { ...batch.overrides.rows, [String(line)]: next },
  });
  refresh(id);
}

export async function setAccountOverrideAction(
  id: string,
  name: string,
  change: { kind?: string | null; mapTo?: { id: string; name: string; kind: string } | null },
) {
  const batch = await editable(id);
  const key = normaliseName(name);
  const next: AccountOverride = { ...batch.overrides.accounts[key] };

  if (change.kind !== undefined) {
    if (change.kind && !ALL_KINDS.includes(change.kind as AccountKind))
      throw new Error('Bad kind.');
    if (change.kind) next.kind = change.kind as AccountKind;
    else delete next.kind;
  }
  if (change.mapTo !== undefined) {
    if (change.mapTo) {
      if (!ALL_KINDS.includes(change.mapTo.kind as AccountKind)) throw new Error('Bad kind.');
      next.mapTo = { ...change.mapTo, kind: change.mapTo.kind as AccountKind };
    } else {
      delete next.mapTo;
    }
  }

  const accounts = { ...batch.overrides.accounts };
  if (Object.keys(next).length > 0) accounts[key] = next;
  else delete accounts[key];
  await updateOverrides(batch, { ...batch.overrides, accounts });
  refresh(id);
}

/** Skip every row in one status at once — "skip all errors", typically. */
export async function skipRowsAction(id: string, lines: number[]) {
  const batch = await editable(id);
  const rows = { ...batch.overrides.rows };
  for (const line of lines) rows[String(line)] = { ...rows[String(line)], skip: true };
  await updateOverrides(batch, { ...batch.overrides, rows });
  refresh(id);
}

export async function setOptionsAction(id: string, options: BatchOptions) {
  const batch = await editable(id);
  await updateOptions(batch, {
    applyRules: Boolean(options.applyRules),
    tag: Boolean(options.tag),
  });
  refresh(id);
}

export async function recheckDuplicatesAction(id: string) {
  const batch = await editable(id);
  await recheckDuplicates(batch);
  refresh(id);
}

export async function discardImportAction(id: string) {
  const batch = await editable(id);
  await discardBatch(batch);
  redirect('/transactions/import');
}

/*
 * No revalidatePath in the two chunk actions: they are called in a loop, and
 * revalidating appends a re-rendered page to every response (the hang
 * documented on quickAddTransactionAction). The client refreshes once, when
 * the loop ends.
 */

export async function commitChunkAction(id: string): Promise<Progress> {
  const batch = await getBatch(id);
  if (!batch) throw new Error('Import not found.');
  try {
    return await commitChunk(batch);
  } catch (error) {
    if (error instanceof FireflyRequestError) {
      return {
        status: batch.status,
        total: 0,
        done: 0,
        imported: 0,
        failed: 0,
        duplicates: 0,
        finished: false,
        error: error.message,
      };
    }
    throw error;
  }
}

export async function undoChunkAction(
  id: string,
  deleteAccounts: boolean,
): Promise<UndoProgress & { error?: string }> {
  const batch = await getBatch(id);
  if (!batch) throw new Error('Import not found.');
  try {
    return await undoChunk(batch, deleteAccounts);
  } catch (error) {
    if (error instanceof FireflyRequestError) {
      return { total: 0, done: 0, finished: false, error: error.message };
    }
    throw error;
  }
}
