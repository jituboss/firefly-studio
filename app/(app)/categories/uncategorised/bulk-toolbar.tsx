'use client';

import { bulkSetCategoryAction } from '@/server/firefly/category-actions';
import { BulkAssignToolbar } from '@/components/bulk-assign-toolbar';

/**
 * E7-04 — sticky bulk-action bar: pick a category and apply it to every
 * selected transaction group. Thin wrapper over the shared BulkAssignToolbar.
 */
export function BulkToolbar({
  selectedIds,
  onSuccess,
}: {
  selectedIds: string[];
  onSuccess?: () => void;
}) {
  return (
    <BulkAssignToolbar
      action={bulkSetCategoryAction}
      endpoint="categories"
      valueName="category_name"
      applyLabel="Set category on"
      placeholder="Pick or type a category…"
      selectedIds={selectedIds}
      onSuccess={onSuccess}
    />
  );
}
