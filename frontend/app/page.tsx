import { redirect } from 'next/navigation';

export default function RootPage() {
  // Always send to /login at root.
  // The login page handles already-authenticated users,
  // and dashboard layout handles auth guard client-side.
  // Relying on cookie here can cause infinite redirect loops when
  // cookie and localStorage session are out of sync.
  redirect('/login');
}
