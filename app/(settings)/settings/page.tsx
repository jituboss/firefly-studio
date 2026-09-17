import { redirect } from 'next/navigation';

/**
 * Settings has no landing page of its own — connections is the one people come
 * here for, and an index that only lists four links would be a page you always
 * click through.
 */
export default function SettingsIndexPage() {
  redirect('/settings/connections');
}
