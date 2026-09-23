'use client';

import * as React from 'react';

/**
 * The set of selected transaction GROUP ids, shared by the toolbar and the
 * grid.
 *
 * It used to be `useState` inside `TransactionGrid`, which was right while the
 * only things that cared were the row checkboxes and the bulk bar. Export now
 * sits in the filter toolbar, beside Filters and Views, and it exports the
 * selection when there is one — two components on opposite sides of the page
 * reading the same state, with a Server Component (the totals strip) rendered
 * between them.
 *
 * Deliberately NOT hoisted into the page: the page is a Server Component, and
 * making it a client one to hold a Set would ship the whole transaction list
 * through a client boundary for no other reason.
 *
 * Selection is per GROUP, not per split: Firefly's PUT operates on the group,
 * so selecting one leg of a split and not the others is not a thing the API
 * can express.
 */

interface SelectionValue {
  selected: ReadonlySet<string>;
  setSelected: React.Dispatch<React.SetStateAction<ReadonlySet<string>>>;
}

const SelectionContext = React.createContext<SelectionValue | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const value = React.useMemo(() => ({ selected, setSelected }), [selected]);
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): SelectionValue {
  const value = React.useContext(SelectionContext);
  if (!value) throw new Error('useSelection must be used inside <SelectionProvider>');
  return value;
}
