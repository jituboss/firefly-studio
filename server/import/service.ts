import 'server-only';
import { and, desc, eq, lt } from 'drizzle-orm';
import { db } from '@/server/db';
import { importBatches } from '@/server/db/schema';
import { requireSession } from '@/server/auth/session';
import {
  fireflyGet,
  fireflyWrite,
  requireActiveConnection,
  FireflyRequestError,
} from '@/server/firefly/api';
import { invalidateTags, type CacheTag } from '@/server/firefly/cache';
import type { Paged, Transaction } from '@/server/firefly/types';
import { isLiability, type AccountKind, type FlowType } from '@/lib/account-matrix';
import type { ImportRow } from '@/lib/import/cells';
import {
  NO_OVERRIDES,
  normaliseName,
  planImport,
  type ImportOverrides,
  type ImportPlan,
} from '@/lib/import/plan';
import {
  summarise,
  type CommittedRow,
  type ImportSummary,
  type RowResult,
} from '@/lib/import/summary';
import { loadAccounts, loadCurrencies, loadLedgerCounts, loadLists } from './firefly';

/**
 * The import's lifecycle: a batch is uploaded into `preview`, corrected there,
 * frozen and written in chunks while `importing`, ends `done`, and can be
 * rolled back to `undone`.
 *
 * Written in chunks driven by the browser rather than in one request, because
 * there is no job runner and a thousand-row file is a few minutes of POSTs —
 * far past any sensible request timeout. Each chunk records its results before
 * it returns, so a closed tab resumes where it stopped. A row whose POST
 * landed but whose answer was lost is retried, and Firefly's own duplicate
 * hash (`error_if_duplicate_hash`) refuses it the second time, so resuming
 * cannot double-book.
 */

export type BatchStatus = 'preview' | 'importing' | 'done' | 'undone';

export interface BatchOptions {
  applyRules: boolean;
  /** Tag every imported transaction with the batch tag. */
  tag: boolean;
}

export const DEFAULT_OPTIONS: BatchOptions = { applyRules: true, tag: true };

export interface CommittedAccount {
  key: string;
  name: string;
  kind: AccountKind;
  currency: string | null;
  id: string | null;
  error?: string;
}

export interface CommittedImportRow extends CommittedRow {
  force: boolean;
  sourceKey: string | null;
  destinationKey: string | null;
  row: ImportRow;
  /** As resolved by the plan: the ledger's own spelling where a name matched. */
  category?: string | null;
  budget?: string | null;
  tags?: string[];
}

export interface CommittedBudget {
  name: string;
  id: string | null;
  error?: string;
}

export interface CommittedPlan {
  tag: string | null;
  applyRules: boolean;
  accounts: CommittedAccount[];
  rows: CommittedImportRow[];
  /**
   * Budgets the rows name that did not exist. Firefly creates a category or a
   * tag from a bare name on a transaction write, but silently drops an unknown
   * budget — so these are made explicitly, before any row.
   */
  budgets?: CommittedBudget[];
  /** Category and tag names that were new at freeze, so an undo can tidy them. */
  newCategories?: string[];
  newTags?: string[];
  /** Lines rolled back by an undo, so an interrupted undo resumes too. */
  undone: string[];
  /** Accounts the undo deleted. */
  deletedAccounts: string[];
  /** Budgets, categories and tags the undo deleted. */
  removedSetup?: string[];
}

export interface Batch {
  id: string;
  fileName: string;
  status: BatchStatus;
  tag: string | null;
  options: BatchOptions;
  rows: ImportRow[];
  overrides: ImportOverrides;
  ledger: Record<string, number>;
  ledgerTruncated: boolean;
  committed: CommittedPlan | null;
  results: Record<string, RowResult>;
  createdAt: Date;
  completedAt: Date | null;
}

export interface Progress {
  status: BatchStatus;
  total: number;
  done: number;
  imported: number;
  failed: number;
  duplicates: number;
  finished: boolean;
  error?: string;
}

const CHUNK = 20;
/** Everything an import or its undo can change, dashboards included. */
const TOUCHED: CacheTag[] = [
  'transactions',
  'accounts',
  'categories',
  'budgets',
  'tags',
  'summary',
  'insight',
  'charts',
];
const PARALLEL = 4;
/** An abandoned preview is clutter, and holds a copy of someone's ledger data. */
const PREVIEW_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type Row = typeof importBatches.$inferSelect;

function toBatch(row: Row): Batch {
  const options = row.options as Partial<BatchOptions> & { ledgerTruncated?: boolean };
  return {
    id: row.id,
    fileName: row.fileName,
    status: row.status as BatchStatus,
    tag: row.tag,
    options: { ...DEFAULT_OPTIONS, ...options },
    rows: row.rows as ImportRow[],
    overrides: { ...NO_OVERRIDES, ...(row.overrides as Partial<ImportOverrides>) },
    ledger: row.ledger,
    ledgerTruncated: Boolean(options.ledgerTruncated),
    committed: (row.committed as CommittedPlan | null) ?? null,
    results: row.results as Record<string, RowResult>,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  };
}

async function owner() {
  const session = await requireSession();
  const connection = await requireActiveConnection();
  return { userId: session.user.id, connectionId: connection.id, connection };
}

/** A batch of the signed-in user on the ACTIVE connection, or null. */
export async function getBatch(id: string): Promise<Batch | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { userId, connectionId } = await owner();
  const [row] = await db
    .select()
    .from(importBatches)
    .where(
      and(
        eq(importBatches.id, id),
        eq(importBatches.userId, userId),
        eq(importBatches.connectionId, connectionId),
      ),
    )
    .limit(1);
  return row ? toBatch(row) : null;
}

export async function listBatches(): Promise<Batch[]> {
  const { userId, connectionId } = await owner();
  await db
    .delete(importBatches)
    .where(
      and(
        eq(importBatches.userId, userId),
        eq(importBatches.status, 'preview'),
        lt(importBatches.createdAt, new Date(Date.now() - PREVIEW_TTL_MS)),
      ),
    );
  const rows = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.userId, userId), eq(importBatches.connectionId, connectionId)))
    .orderBy(desc(importBatches.createdAt))
    .limit(50);
  return rows.map(toBatch);
}

async function save(id: string, changes: Partial<typeof importBatches.$inferInsert>) {
  await db
    .update(importBatches)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(importBatches.id, id));
}

function dateRange(rows: ImportRow[]): { start: string; end: string } | null {
  const dates = rows.map((row) => row.date).filter((date): date is string => Boolean(date));
  if (dates.length === 0) return null;
  dates.sort();
  return { start: dates[0]!, end: dates[dates.length - 1]! };
}

async function ledgerFor(rows: ImportRow[]) {
  const range = dateRange(rows);
  return range ? loadLedgerCounts(range.start, range.end) : { counts: {}, truncated: false };
}

export async function createBatch(fileName: string, rows: ImportRow[]): Promise<string> {
  const { userId, connectionId } = await owner();
  const ledger = await ledgerFor(rows);
  const [row] = await db
    .insert(importBatches)
    .values({
      userId,
      connectionId,
      fileName,
      rows,
      ledger: ledger.counts,
      options: { ...DEFAULT_OPTIONS, ledgerTruncated: ledger.truncated },
    })
    .returning({ id: importBatches.id });
  return row!.id;
}

/** The plan as it stands now, against the ledger's current accounts. */
export async function currentPlan(batch: Batch): Promise<ImportPlan> {
  const [accounts, currencies, lists] = await Promise.all([
    loadAccounts(),
    loadCurrencies(),
    loadLists(),
  ]);
  return planImport({
    rows: batch.rows,
    accounts,
    ledger: batch.ledger,
    currencies,
    lists,
    overrides: batch.overrides,
  });
}

export async function updateOverrides(batch: Batch, overrides: ImportOverrides) {
  await save(batch.id, { overrides });
}

export async function updateOptions(batch: Batch, options: BatchOptions) {
  await save(batch.id, { options: { ...options, ledgerTruncated: batch.ledgerTruncated } });
}

export async function recheckDuplicates(batch: Batch) {
  const ledger = await ledgerFor(batch.rows);
  await save(batch.id, {
    ledger: ledger.counts,
    options: { ...batch.options, ledgerTruncated: ledger.truncated },
  });
}

export async function discardBatch(batch: Batch) {
  await db.delete(importBatches).where(eq(importBatches.id, batch.id));
}

function progressOf(
  batch: Batch,
  committed: CommittedPlan,
  results: Record<string, RowResult>,
): Progress {
  const values = committed.rows
    .map((row) => results[String(row.line)])
    .filter(Boolean) as RowResult[];
  return {
    status: batch.status,
    total: committed.rows.length,
    done: values.length,
    imported: values.filter((r) => r.status === 'imported').length,
    failed: values.filter((r) => r.status === 'failed').length,
    duplicates: values.filter((r) => r.status === 'duplicate').length,
    finished: values.length >= committed.rows.length,
  };
}

async function pool<T>(items: T[], size: number, work: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next]!;
        next += 1;
        await work(item);
      }
    }),
  );
}

function tagFor(batch: Batch): string {
  const day = batch.createdAt.toISOString().slice(0, 10);
  return `import-${day}-${batch.id.slice(0, 6)}`;
}

/** Freeze the plan: from here on the commit only executes, it never re-decides. */
async function freeze(batch: Batch): Promise<CommittedPlan | string> {
  const plan = await currentPlan(batch);
  const ready = plan.rows.filter((row) => row.status === 'ready');
  if (ready.length === 0) return 'There are no rows ready to import.';
  const tag = batch.options.tag ? tagFor(batch) : null;
  const fresh = (list: Array<{ name: string; isNew: boolean }>) =>
    list.filter((entry) => entry.isNew).map((entry) => entry.name);

  return {
    tag,
    budgets: fresh(plan.setup.budgets).map((name) => ({ name, id: null })),
    newCategories: fresh(plan.setup.categories),
    newTags: [...fresh(plan.setup.tags), ...(tag ? [tag] : [])],
    applyRules: batch.options.applyRules,
    // Only what a ready row needs; the rest were listed for fixing, not making.
    accounts: plan.newAccounts
      .filter((account) => account.needed)
      .map((account) => ({
        key: account.key,
        name: account.name,
        kind: account.kind,
        currency: account.currency,
        id: null,
      })),
    rows: ready.map((row) => ({
      line: row.line,
      type: row.type as FlowType,
      date: row.row.date!,
      amount: row.row.amount!,
      source: { id: row.source!.id, name: row.source!.name, kind: row.source!.kind },
      destination: {
        id: row.destination!.id,
        name: row.destination!.name,
        kind: row.destination!.kind,
      },
      force: Boolean(batch.overrides.rows[String(row.line)]?.force),
      sourceKey: row.source!.newKey,
      destinationKey: row.destination!.newKey,
      row: row.row,
      category: row.category,
      budget: row.budget,
      tags: row.tags,
    })),
    undone: [],
    deletedAccounts: [],
  };
}

async function createAccount(account: CommittedAccount): Promise<CommittedAccount> {
  const payload: Record<string, unknown> = { name: account.name, type: account.kind };
  if (account.kind === 'asset') payload.account_role = 'defaultAsset';
  if (isLiability(account.kind)) {
    payload.type = 'liabilities';
    payload.liability_type = account.kind;
    // "I owe this", which is what nearly every imported loan or debt is.
    payload.liability_direction = 'debit';
  }
  if ((account.kind === 'asset' || isLiability(account.kind)) && account.currency) {
    payload.currency_code = account.currency;
  }

  try {
    const created = await fireflyWrite<{ data: { id: string } }>('/v1/accounts', 'POST', payload);
    return { ...account, id: created.data.id };
  } catch (error) {
    // Made by someone else since the preview — use it rather than fail the rows.
    const existing = (await loadAccounts()).find(
      (entry) =>
        entry.kind === account.kind && normaliseName(entry.name) === normaliseName(account.name),
    );
    if (existing) return { ...account, id: existing.id };
    return {
      ...account,
      error: error instanceof FireflyRequestError ? error.message : 'Could not create the account.',
    };
  }
}

async function createBudget(budget: CommittedBudget): Promise<CommittedBudget> {
  try {
    const created = await fireflyWrite<{ data: { id: string } }>('/v1/budgets', 'POST', {
      name: budget.name,
    });
    return { ...budget, id: created.data.id };
  } catch (error) {
    return {
      ...budget,
      error: error instanceof FireflyRequestError ? error.message : 'Could not create the budget.',
    };
  }
}

async function writeRow(row: CommittedImportRow, plan: CommittedPlan): Promise<RowResult> {
  const lookup = (key: string | null) => plan.accounts.find((account) => account.key === key);
  const sourceId = row.source.id ?? lookup(row.sourceKey)?.id ?? null;
  const destinationId = row.destination.id ?? lookup(row.destinationKey)?.id ?? null;
  if (!sourceId || !destinationId) {
    const missing = !sourceId ? lookup(row.sourceKey) : lookup(row.destinationKey);
    return {
      status: 'failed',
      error: `${missing?.name ?? 'An account'} could not be created${missing?.error ? `: ${missing.error}` : '.'}`,
    };
  }

  const data = row.row;
  const split: Record<string, unknown> = {
    type: row.type,
    date: row.date,
    amount: row.amount,
    description: data.description,
    source_id: sourceId,
    destination_id: destinationId,
  };
  if (data.currency) split.currency_code = data.currency;
  if (data.foreignAmount && data.foreignCurrency) {
    split.foreign_amount = data.foreignAmount;
    split.foreign_currency_code = data.foreignCurrency;
  }
  // A plan frozen before names were resolved carries none; fall back to the file.
  const category = row.category !== undefined ? row.category : data.category || null;
  const budget = row.budget !== undefined ? row.budget : data.budget || null;
  if (category) split.category_name = category;
  if (budget && row.type === 'withdrawal') {
    const made = plan.budgets?.find((entry) => entry.name === budget);
    if (made?.id) split.budget_id = made.id;
    else if (!made) split.budget_name = budget;
  }
  const tags = [...(row.tags ?? data.tags), ...(plan.tag ? [plan.tag] : [])];
  if (tags.length > 0) split.tags = tags;
  if (data.notes) split.notes = data.notes;
  if (data.externalRef) split.external_id = data.externalRef;

  try {
    const created = await fireflyWrite<{ data: Transaction }>('/v1/transactions', 'POST', {
      // A forced row was confirmed by the user as NOT a duplicate.
      error_if_duplicate_hash: !row.force,
      apply_rules: plan.applyRules,
      transactions: [split],
    });
    return {
      status: 'imported',
      groupId: created.data.id,
      currency: created.data.attributes.transactions[0]?.currency_code,
    };
  } catch (error) {
    if (error instanceof FireflyRequestError) {
      if (/duplicate of transaction/i.test(error.message)) {
        return { status: 'duplicate', error: error.message };
      }
      return { status: 'failed', error: error.message };
    }
    return { status: 'failed', error: 'Unexpected error writing this row.' };
  }
}

/** Run the next chunk of an import. Starts it, if it has not started. */
export async function commitChunk(batch: Batch): Promise<Progress> {
  let committed = batch.committed;
  let status = batch.status;

  if (status === 'preview') {
    const frozen = await freeze(batch);
    if (typeof frozen === 'string') {
      return {
        status,
        total: 0,
        done: 0,
        imported: 0,
        failed: 0,
        duplicates: 0,
        finished: false,
        error: frozen,
      };
    }
    committed = frozen;
    status = 'importing';
    await save(batch.id, { committed, status, tag: committed.tag });
  }
  if (!committed) throw new Error('Batch has no committed plan.');
  const current = { ...batch, status, committed };

  if (status !== 'importing') return progressOf(current, committed, batch.results);

  // Accounts first, all of them, before any row needs one.
  if (committed.accounts.some((account) => !account.id && !account.error)) {
    const accounts: CommittedAccount[] = [];
    for (const account of committed.accounts) {
      accounts.push(account.id || account.error ? account : await createAccount(account));
    }
    committed = { ...committed, accounts };
    await save(batch.id, { committed });
  }
  // Then budgets, which Firefly will not create from a name.
  if (committed.budgets?.some((budget) => !budget.id && !budget.error)) {
    const budgets: CommittedBudget[] = [];
    for (const budget of committed.budgets) {
      budgets.push(budget.id || budget.error ? budget : await createBudget(budget));
    }
    committed = { ...committed, budgets };
    await save(batch.id, { committed });
  }

  const results = { ...batch.results };
  const pending = committed.rows.filter((row) => !results[String(row.line)]).slice(0, CHUNK);
  const plan = committed;
  await pool(pending, PARALLEL, async (row) => {
    results[String(row.line)] = await writeRow(row, plan);
  });

  const progress = progressOf(current, committed, results);
  if (progress.finished) {
    status = 'done';
    await save(batch.id, { results, status, completedAt: new Date() });
    const { connectionId } = await owner();
    await invalidateTags(connectionId, TOUCHED);
  } else {
    await save(batch.id, { results });
  }
  return { ...progress, status };
}

export interface UndoProgress {
  total: number;
  done: number;
  finished: boolean;
}

/** Delete a resource only if no transaction uses it any more. True when it is gone. */
async function removeIfUnused(path: string): Promise<boolean> {
  try {
    const used = await fireflyGet<Paged<Transaction>>(`${path}/transactions?limit=1`, {
      noCache: true,
    });
    if (used.data.length > 0) return false;
    await fireflyWrite(path, 'DELETE');
    return true;
  } catch {
    // Gone already, or not ours to remove; leave it.
    return false;
  }
}

async function categoryId(name: string): Promise<string | null> {
  try {
    const hits = await fireflyGet<Array<{ id: string; name: string }>>(
      `/v1/autocomplete/categories?query=${encodeURIComponent(name)}&limit=20`,
      { noCache: true },
    );
    return hits.find((hit) => hit.name === name)?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Roll an import back, in chunks like the import itself: delete every group it
 * created, then — when asked — everything it set up: accounts, budgets,
 * categories and tags, but only those that nothing else has used since. An
 * account someone has started using is theirs now, whoever made it.
 */
export async function undoChunk(batch: Batch, deleteAccounts: boolean): Promise<UndoProgress> {
  const committed = batch.committed;
  if (!committed || (batch.status !== 'done' && batch.status !== 'undone')) {
    return { total: 0, done: 0, finished: true };
  }
  const imported = committed.rows.filter(
    (row) => batch.results[String(row.line)]?.status === 'imported',
  );
  const undone = new Set(committed.undone);
  const pending = imported.filter((row) => !undone.has(String(row.line))).slice(0, CHUNK);

  await pool(pending, PARALLEL, async (row) => {
    const groupId = batch.results[String(row.line)]?.groupId;
    if (groupId) {
      try {
        await fireflyWrite(`/v1/transactions/${groupId}`, 'DELETE');
      } catch (error) {
        // Already deleted by hand is as good as deleted by us.
        if (!(error instanceof FireflyRequestError && error.code === 'not_found')) throw error;
      }
    }
    undone.add(String(row.line));
  });

  const finished = imported.every((row) => undone.has(String(row.line)));
  const deletedAccounts = [...committed.deletedAccounts];
  if (finished && deleteAccounts) {
    for (const account of committed.accounts) {
      if (!account.id || deletedAccounts.includes(account.id)) continue;
      if (await removeIfUnused(`/v1/accounts/${account.id}`)) deletedAccounts.push(account.id);
    }
  }
  const removedSetup = [...(committed.removedSetup ?? [])];
  if (finished && deleteAccounts) {
    for (const budget of committed.budgets ?? []) {
      const key = `budget:${budget.name}`;
      if (!budget.id || removedSetup.includes(key)) continue;
      if (await removeIfUnused(`/v1/budgets/${budget.id}`)) removedSetup.push(key);
    }
    for (const name of committed.newCategories ?? []) {
      const key = `category:${name}`;
      if (removedSetup.includes(key)) continue;
      const id = await categoryId(name);
      if (id && (await removeIfUnused(`/v1/categories/${id}`))) removedSetup.push(key);
    }
    for (const name of committed.newTags ?? []) {
      const key = `tag:${name}`;
      if (removedSetup.includes(key)) continue;
      if (await removeIfUnused(`/v1/tags/${encodeURIComponent(name)}`)) removedSetup.push(key);
    }
  }

  await save(batch.id, {
    committed: { ...committed, undone: [...undone], deletedAccounts, removedSetup },
    ...(finished ? { status: 'undone' } : {}),
  });
  if (finished) {
    const { connectionId } = await owner();
    await invalidateTags(connectionId, TOUCHED);
  }
  return { total: imported.length, done: undone.size, finished };
}

export function batchSummary(batch: Batch): ImportSummary | null {
  if (!batch.committed) return null;
  return summarise(batch.committed.rows, batch.results);
}
