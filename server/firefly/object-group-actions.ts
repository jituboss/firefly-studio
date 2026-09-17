import 'server-only';
import { revalidatePath } from 'next/cache';
import { fireflyWrite } from './api';

interface ObjectGroupInput {
  title: string;
  order?: number;
}

/** E9-05 — create a new object group. */
export async function createObjectGroupAction(input: ObjectGroupInput) {
  const result = await fireflyWrite<{ data: { id: string; attributes: { title: string } } }>(
    '/v1/object-groups',
    'POST',
    {
      title: input.title,
      order: input.order ?? 0,
    },
  );
  revalidatePath('/object-groups');
  revalidatePath('/piggy-banks');
  revalidatePath('/bills');
  return result;
}

/** E9-05 — rename / reorder an object group. */
export async function updateObjectGroupAction(id: string, input: Partial<ObjectGroupInput>) {
  const result = await fireflyWrite<{ data: { id: string; attributes: { title: string } } }>(
    `/v1/object-groups/${id}`,
    'PUT',
    {
      title: input.title,
      ...(input.order !== undefined ? { order: input.order } : {}),
    },
  );
  revalidatePath('/object-groups');
  revalidatePath('/piggy-banks');
  revalidatePath('/bills');
  return result;
}

/** E9-05 — delete an empty object group. */
export async function deleteObjectGroupAction(id: string) {
  await fireflyWrite<unknown>(`/v1/object-groups/${id}`, 'DELETE');
  revalidatePath('/object-groups');
  revalidatePath('/piggy-banks');
  revalidatePath('/bills');
}
