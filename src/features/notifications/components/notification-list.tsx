import Link from 'next/link';
import { Award, Bell, BookOpen, CheckCheck, ClipboardCheck, Mail, Sparkles } from 'lucide-react';
import {
  markAllNotificationsReadFormAction,
  markNotificationReadFormAction,
} from '@/features/notifications/actions';
import type { Database } from '@/types/database';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelative } from '@/lib/utils';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

const typeIcons = {
  enrollment: BookOpen,
  lesson: BookOpen,
  assignment: ClipboardCheck,
  deadline: ClipboardCheck,
  quiz: Sparkles,
  grade: Award,
  feedback: Mail,
  completion: Award,
  system: Bell,
} as const;

export function NotificationList({
  notifications,
  unreadOnly,
  basePath,
}: {
  notifications: NotificationRow[];
  unreadOnly: boolean;
  basePath: string;
}) {
  const filtered = unreadOnly ? notifications.filter((notification) => !notification.read_at) : notifications;
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Course updates, grades, deadlines and platform announcements."
        actions={
          unreadCount ? (
            <form action={markAllNotificationsReadFormAction}>
              <Button type="submit" variant="outline">
                <CheckCheck /> Mark all read
              </Button>
            </form>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant={unreadOnly ? 'outline' : 'secondary'}>
          <Link href={basePath}>All</Link>
        </Button>
        <Button asChild size="sm" variant={unreadOnly ? 'secondary' : 'outline'}>
          <Link href={`${basePath}?filter=unread`}>Unread {unreadCount ? `(${unreadCount})` : ''}</Link>
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        {filtered.length ? (
          <ul className="divide-y">
            {filtered.map((notification) => {
              const Icon = typeIcons[notification.type as keyof typeof typeIcons] ?? Bell;
              return (
                <li
                  key={notification.id}
                  className={cn('flex items-start gap-3 px-4 py-4', !notification.read_at && 'bg-primary/[0.035]')}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
                      notification.read_at ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{notification.title}</p>
                      {!notification.read_at ? (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                          New
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{notification.body}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{formatRelative(notification.created_at)}</span>
                      {notification.link ? (
                        <Link href={notification.link} className="font-medium text-primary hover:underline">
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  {!notification.read_at ? (
                    <form action={markNotificationReadFormAction}>
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Mark read
                      </Button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={Bell}
            title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            description={unreadOnly ? 'You are all caught up.' : 'Course updates and feedback will appear here.'}
            className="m-4 border-0 bg-transparent"
          />
        )}
      </Card>
    </div>
  );
}
