'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTagAction, updateTagAction, type TagFormState } from '@/server/firefly/tag-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';
import type { Tag } from '@/server/firefly/types';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

/** E12-02 — one form for create and edit, including the geo fields. */
export function TagForm({ tag }: { tag?: Tag }) {
  const editing = Boolean(tag);
  const [state, action] = useActionState<TagFormState, FormData>(
    editing ? updateTagAction : createTagAction,
    {},
  );

  // Firefly refuses a half-filled coordinate pair, so the form treats the two
  // as one unit and only enables the zoom level once both are present.
  const [latitude, setLatitude] = useState(tag?.attributes.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(tag?.attributes.longitude?.toString() ?? '');
  const located = latitude.trim() !== '' && longitude.trim() !== '';

  return (
    <form action={action} className="space-y-5">
      {tag ? <input type="hidden" name="original" value={tag.attributes.tag} /> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="tag">Tag</Label>
            <Input id="tag" name="tag" required defaultValue={tag?.attributes.tag} />
            {editing ? (
              <p className="text-muted-foreground text-xs">
                Renaming updates the tag on every transaction that carries it.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={tag?.attributes.description ?? ''}
              className="border-input bg-background w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={tag?.attributes.date?.slice(0, 10) ?? ''}
            />
            <p className="text-muted-foreground text-xs">
              Optional. Useful for tags that mark an event — a trip, a move, a project.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <p className="text-sm font-medium">Location</p>
            <p className="text-muted-foreground text-xs">
              Both coordinates are needed, or neither — Firefly rejects a half-filled pair.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                inputMode="decimal"
                placeholder="52.3676"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                inputMode="decimal"
                placeholder="4.9041"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="zoom_level">Zoom level</Label>
            <Input
              id="zoom_level"
              name="zoom_level"
              type="number"
              min={1}
              max={25}
              disabled={!located}
              defaultValue={tag?.attributes.zoom_level ?? ''}
            />
          </div>
        </CardContent>
      </Card>

      <Submit label={editing ? 'Save changes' : 'Create tag'} />
    </form>
  );
}
