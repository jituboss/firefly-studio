/**
 * The template's sample rows carry this note, and the planner skips any row
 * that does — so leaving the samples in a filled-in file is harmless rather
 * than three made-up transactions in the ledger.
 */
export const SAMPLE_NOTE = 'Sample row: replace it, delete it, or leave it — the import skips it.';

export function isSampleRow(notes: string): boolean {
  return notes.trim().toLowerCase().startsWith('sample row');
}
