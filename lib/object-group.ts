/**
 * E9-05 — the object-group field on the subscription and piggy-bank forms.
 *
 * Firefly takes `object_group_title` on both, and its semantics were checked
 * against a live 6.5.5 instance rather than read off the spec:
 *
 *  - a title that matches no group CREATES the group and assigns it, so the
 *    field doubles as "new group" with no separate call;
 *  - an EMPTY STRING removes the assignment (so does `null`);
 *  - OMITTING the field leaves the assignment as it was.
 *
 * The third rule is why this cannot go through the forms' `compact()`, which
 * drops empty strings: clearing the field on an edit would be silently
 * ignored. On create there is nothing to clear, so an empty field is omitted.
 */
export function objectGroupPayload(
  formData: { get(name: string): FormDataEntryValue | null },
  mode: 'create' | 'update',
): { object_group_title?: string } {
  const raw = formData.get('object_group_title');
  // Absent from the form entirely: the field was not rendered, so say nothing.
  if (raw === null) return {};
  const title = typeof raw === 'string' ? raw.trim() : '';
  if (title) return { object_group_title: title };
  return mode === 'update' ? { object_group_title: '' } : {};
}
