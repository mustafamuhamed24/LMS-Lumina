import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';

const notificationsHome = (role: string) => {
  switch (role) {
    case 'super_admin':
    case 'org_admin':
      return '/admin/notifications';
    case 'instructor':
      return '/instructor/notifications';
    default:
      return '/student/notifications';
  }
};

export default async function NotificationsRedirectPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/notifications');
  if (user.profile.status === 'suspended') redirect('/suspended');
  redirect(notificationsHome(user.profile.role));
}
