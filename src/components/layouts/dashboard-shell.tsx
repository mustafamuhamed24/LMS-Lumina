'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
} from 'lucide-react';
import { Brand } from '@/components/brand/learnova-logo';
import { DevelopedBy } from '@/components/brand/learnova-logo';
import { SignupWelcomeToast } from '@/features/auth/components/signup-welcome-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { signOutAction } from '@/features/auth/actions';
import { markAllNotificationsRead, markNotificationRead } from '@/features/notifications/actions';
import { getNavigation, roleLabelKey } from '@/constants/navigation';
import { useLocale, useTranslator } from '@/lib/i18n/client';
import type { NotificationPreview } from '@/features/notifications/queries';
import type { Role } from '@/types/app';
import { cn, formatRelative, initials, initialsColor } from '@/lib/utils';

export type ShellUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  orgName: string | null;
};

function NavList({
  role,
  onNavigate,
  collapsed = false,
}: {
  role: Role;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslator();
  const groups = getNavigation(role);

  return (
    <nav className="space-y-6 px-3 py-4">
      {groups.map((group) => (
        <div key={group.labelKey}>
          {!collapsed ? (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">{t(group.labelKey)}</p>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const label = t(item.labelKey);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                      collapsed && 'justify-center px-0',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                    )}
                  >
                    <item.icon className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-sidebar-muted group-hover:text-sidebar-foreground')} />
                    {!collapsed ? <span className="truncate">{label}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function NotificationMenu({
  notifications,
  unreadCount,
  viewAllHref,
}: {
  notifications: NotificationPreview[];
  unreadCount: number;
  viewAllHref: string;
}) {
  const router = useRouter();
  const t = useTranslator();
  const [isPending, startTransition] = useTransition();
  const [unread, setUnread] = useState(unreadCount);

  const markRead = (id: string) => {
    startTransition(async () => {
      const result = await markNotificationRead(id);
      if (result.ok) {
        setUnread((value) => Math.max(0, value - 1));
        router.refresh();
      }
    });
  };

  const markAll = () => {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.ok) {
        setUnread(0);
        router.refresh();
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label={t('common.notifications')}>
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{t('common.notifications')}</p>
            {unread > 0 ? <Badge variant="secondary">{t('common.newCount', { count: unread })}</Badge> : null}
          </div>
          {unread > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px]" onClick={markAll} disabled={isPending}>
              <CheckCheck className="size-3" /> {t('common.markAllRead')}
            </Button>
          ) : null}
        </div>
        <ScrollArea className="max-h-[380px]">
          {notifications.length ? (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={notification.link ?? '#'}
                    onClick={() => {
                      if (!notification.read_at) markRead(notification.id);
                    }}
                    className={cn(
                      'block px-3 py-3 transition-colors hover:bg-muted/50',
                      !notification.read_at && 'bg-primary/[0.03]',
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', notification.read_at ? 'bg-transparent' : 'bg-primary')} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{notification.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{notification.body}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{formatRelative(notification.created_at)}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <Bell className="size-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">{t('common.allCaughtUp')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('common.notificationsEmpty')}</p>
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href={viewAllHref}>{t('common.viewAllNotifications')}</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ user, profileHref, notificationsHref }: { user: ShellUser; profileHref: string; notificationsHref: string }) {
  const t = useTranslator();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md p-1 pe-2 text-left transition-colors hover:bg-accent" aria-label={t('common.userMenu')}>
          <Avatar className="size-7">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className={cn('text-[10px] font-semibold', initialsColor(user.id))}>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 leading-tight sm:block">
            <span className="block max-w-[140px] truncate text-xs font-medium">{user.name}</span>
            <span className="block text-[10px] text-muted-foreground">{t(roleLabelKey[user.role])}</span>
          </span>
          <ChevronDown className="hidden size-3 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={profileHref}>
            <UserRound /> {t('common.profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={notificationsHref}>
            <Bell /> {t('common.notifications')}
          </Link>
        </DropdownMenuItem>
        {user.role === 'student' ? (
          <DropdownMenuItem asChild>
            <Link href="/student/profile">
              <Settings /> {t('common.accountSettings')}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut /> {t('common.signOut')}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardShell({
  user,
  notifications,
  unreadCount,
  children,
}: {
  user: ShellUser;
  notifications: NotificationPreview[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslator();
  const locale = useLocale();
  const profileHref = user.role === 'student' ? '/student/profile' : user.role === 'instructor' ? '/instructor' : '/admin/settings';
  const notificationsHref =
    user.role === 'student'
      ? '/student/notifications'
      : user.role === 'instructor'
        ? '/instructor/notifications'
        : '/admin/notifications';

  return (
    <div className="min-h-dvh bg-background">
      <SignupWelcomeToast />
      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-30 hidden flex-col border-e bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex',
          collapsed ? 'w-[68px]' : 'w-[248px]',
        )}
      >
        <div className={cn('flex h-16 items-center border-b px-4', collapsed && 'justify-center px-2')}>
          {collapsed ? <Brand compact /> : <Brand href={user.role === 'student' ? '/student' : user.role === 'instructor' ? '/instructor' : '/admin'} />}
        </div>
        <ScrollArea className="flex-1">
          <NavList role={user.role} collapsed={collapsed} />
        </ScrollArea>
        <div className="border-t p-3">
          {!collapsed ? (
            <div className="mb-3 rounded-lg border bg-background/60 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('common.organization')}</p>
              <p className="mt-1 truncate text-xs font-medium">{user.orgName ?? t('common.allOrganizations')}</p>
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full text-muted-foreground', collapsed && 'px-0')}
            aria-label={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            {!collapsed ? t('common.collapseSidebar') : null}
          </Button>
        </div>
      </aside>

      <div className={cn('flex min-h-dvh flex-col transition-[padding] duration-200', collapsed ? 'lg:ps-[68px]' : 'lg:ps-[248px]')}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label={t('common.openMenu')}>
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={locale === 'ar' ? 'right' : 'left'} className="w-[270px] p-0">
                <SheetTitle className="sr-only">{t('common.navigation')}</SheetTitle>
                <div className="flex h-16 items-center border-b px-4">
                  <Brand />
                </div>
                <ScrollArea className="h-[calc(100dvh-4rem)]">
                  <NavList role={user.role} onNavigate={() => setMobileOpen(false)} />
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <div className="hidden text-xs text-muted-foreground sm:block">
              <span className="font-medium text-foreground">{user.orgName ?? t('common.platform')}</span>
              <span className="mx-2 text-border">/</span>
              {t(roleLabelKey[user.role])}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <NotificationMenu notifications={notifications} unreadCount={unreadCount} viewAllHref={notificationsHref} />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <UserMenu user={user} profileHref={profileHref} notificationsHref={notificationsHref} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <footer className="border-t px-4 py-4 text-center text-muted-foreground sm:px-6">
          <DevelopedBy />
        </footer>
      </div>
    </div>
  );
}
