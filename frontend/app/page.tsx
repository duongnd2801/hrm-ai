import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = (await cookieStore).get('hrm_token');
  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
