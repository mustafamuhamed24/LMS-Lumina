import { requireStudent } from '@/lib/auth/session';
import { listNotifications } from '@/features/notifications/queries';
import { NotificationList } from '@/features/notifications/components/notification-list';

export const metadata = { title: 'Notifications' };

export default async function StudentNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const unreadOnly = params.filter === 'unread';
  const user = await requireStudent();
  const notifications = await listNotifications(user.id, 150);

  return <NotificationList notifications={notifications} unreadOnly={unreadOnly} basePath="/student/notifications" />;
}
