import { Input, Label } from '@/components/ui/input';

/**
 * E9-05 — pick an existing object group or type a new one. A native datalist,
 * so it is a plain text input everywhere and suggestions where supported;
 * Firefly creates a group from an unknown title itself (lib/object-group.ts).
 */
export function ObjectGroupField({
  groups,
  defaultValue,
}: {
  groups: string[];
  defaultValue?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="object_group_title">Group (optional)</Label>
      <Input
        id="object_group_title"
        name="object_group_title"
        list="object-group-options"
        autoComplete="off"
        defaultValue={defaultValue ?? ''}
        placeholder="None"
      />
      <datalist id="object-group-options">
        {groups.map((title) => (
          <option key={title} value={title} />
        ))}
      </datalist>
      <p className="text-muted-foreground text-xs">
        Choose a group or type a new name to create one. Clear it to remove the item from its group.
      </p>
    </div>
  );
}
