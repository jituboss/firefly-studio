import { redirect } from 'next/navigation';

/**
 * M1 replaces this with a marketing landing page and routes signed-out visitors
 * to /sign-in, and users without an `ok` connection to /onboarding (E2-13).
 */
export default function Home() {
  redirect('/dashboard');
}
