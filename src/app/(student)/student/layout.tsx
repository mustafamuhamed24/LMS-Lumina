import { DashboardShell } from '@/components/layouts/dashboard-shell';
import { requireStudent } from '@/lib/auth/session';
import { getNotificationSummary } from '@/features/notifications/queries';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudent();
  const summary = await getNotificationSummary(user.id);

  return (
    <DashboardShell
      user={{
        id: user.id,
        name: user.profile.full_name,
        email: user.email,
        avatarUrl: user.profile.avatar_url,
        role: user.profile.role,
        orgName: user.activeOrg?.name ?? null,
      }}
      notifications={summary.notifications}
      unreadCount={summary.unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
