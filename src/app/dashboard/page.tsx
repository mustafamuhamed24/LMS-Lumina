import { redirect } from 'next/navigation';
import { getSessionUser, roleHome } from '@/lib/auth/session';

export default async function DashboardRedirectPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.profile.status === 'suspended') redirect('/suspended');
  redirect(roleHome(user.profile.role));
}
