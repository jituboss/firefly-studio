import { describe, expect, it } from 'vitest';
import { objectGroupPayload } from '@/lib/object-group';

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

describe('objectGroupPayload', () => {
  it('sends a trimmed title — Firefly creates the group if it is new', () => {
    expect(objectGroupPayload(form({ object_group_title: '  Home ' }), 'create')).toEqual({
      object_group_title: 'Home',
    });
  });

  it('clears an assignment on update with an explicit empty string', () => {
    // Omitting the field would leave the old group in place (verified live).
    expect(objectGroupPayload(form({ object_group_title: '   ' }), 'update')).toEqual({
      object_group_title: '',
    });
  });

  it('omits an empty field on create — nothing to clear', () => {
    expect(objectGroupPayload(form({ object_group_title: '' }), 'create')).toEqual({});
  });

  it('says nothing when the form did not render the field', () => {
    expect(objectGroupPayload(form({}), 'update')).toEqual({});
  });
});
