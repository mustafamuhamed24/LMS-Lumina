import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  GraduationCap,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminDashboard } from '@/features/analytics/admin-dashboard';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { CategoryBreakdownChart, EnrollmentTrendChart } from '@/components/charts/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, formatNumber, formatRelative, initials, initialsColor, percent } from '@/lib/utils';

export const metadata = { title: 'Admin dashboard' };

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const data = await getAdminDashboard(user);
  const orgName = data.scope.isSuperAdmin ? 'All organizations' : (user.activeOrg?.name ?? 'Your organization');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good to see you, ${user.profile.full_name.split(' ')[0]}`}
        description={`Operational overview for ${orgName.toLowerCase()}. Data is scoped to the organizations you administer.`}
        actions={
          <>
            {data.scope.isSuperAdmin ? (
              <Button asChild variant="outline">
                <Link href="/admin/platform">
                  <ShieldCheck /> Platform
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/admin/analytics">
                <BarChart3 /> Analytics
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/courses?new=1">
                <Plus /> New course
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active learners"
          value={formatNumber(data.stats.students)}
          hint={`${formatNumber(data.stats.instructors)} instructors`}
          icon={GraduationCap}
        />
        <StatCard
          label="Courses"
          value={formatNumber(data.stats.courses)}
          hint={`${formatNumber(data.stats.publishedCourses)} published`}
          icon={BookOpen}
        />
        <StatCard
          label="Active enrollments"
          value={formatNumber(data.stats.activeEnrollments)}
          hint={`${formatNumber(data.stats.pendingEnrollments)} awaiting approval`}
          icon={ClipboardCheck}
        />
        <StatCard
          label="Completion rate"
          value={percent(data.stats.completionRate)}
          hint={`${formatNumber(data.stats.completedEnrollments)} completions`}
          icon={Award}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Enrollment activity</CardTitle>
              <CardDescription>New enrollments and course completions over the last six months.</CardDescription>
            </div>
            <Badge variant="muted">6 months</Badge>
          </CardHeader>
          <CardContent>
            {data.trend.some((point) => point.enrollments > 0 || point.completions > 0) ? (
              <EnrollmentTrendChart data={data.trend} />
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No enrollment activity yet"
                description="Enrollment and completion trends will appear once learners join courses."
                className="border-0 bg-transparent py-10"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform health</CardTitle>
            <CardDescription>Learner progress and organizational reach.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Average course progress</span>
                <span className="font-semibold">{percent(data.stats.averageProgress, 1)}</span>
              </div>
              <Progress value={data.stats.averageProgress} className="mt-2 h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Course completion rate</span>
                <span className="font-semibold">{percent(data.stats.completionRate, 1)}</span>
              </div>
              <Progress value={data.stats.completionRate} className="mt-2 h-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t pt-4">
              <div className="rounded-lg border bg-muted/25 p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <Building2 className="size-3" /> Organizations
                </div>
                <p className="mt-1.5 text-xl font-semibold">{formatNumber(data.stats.activeOrganizations)}</p>
              </div>
              <div className="rounded-lg border bg-muted/25 p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <Clock className="size-3" /> Pending
                </div>
                <p className="mt-1.5 text-xl font-semibold">{formatNumber(data.stats.pendingEnrollments)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/admin/users">
                    <Users /> Users
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/admin/enrollments">
                    <ClipboardCheck /> Enrollments
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/admin/categories">
                    <BookOpen /> Categories
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/admin/settings">
                    <CheckCircle2 /> Settings
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Top courses</CardTitle>
              <CardDescription>Ranked by enrolled learners.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/courses">
                Manage <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.topCourses.length ? (
              <div className="divide-y">
                {data.topCourses.map((course, index) => (
                  <div key={course.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/courses/${course.slug}`} className="truncate text-sm font-medium hover:text-primary">
                        {course.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {course.instructorName} · {formatNumber(course.enrollments)} learners
                      </p>
                    </div>
                    <div className="hidden w-28 sm:block">
                      <Progress value={course.completionRate} className="h-1.5" />
                    </div>
                    <span className="w-12 text-right text-xs font-medium text-muted-foreground">
                      {percent(course.completionRate)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No courses yet"
                description="Create your first course to start tracking enrollment and completion."
                action={
                  <Button asChild size="sm">
                    <Link href="/admin/courses?new=1">Create course</Link>
                  </Button>
                }
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course categories</CardTitle>
            <CardDescription>Published course distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length ? (
              <CategoryBreakdownChart data={data.categoryBreakdown} />
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No category data"
                description="Assign categories to published courses to see the distribution."
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Recent registrations</CardTitle>
              <CardDescription>Newest people in your organizations.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/users">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentRegistrations.length ? (
              <div className="divide-y">
                {data.recentRegistrations.map((person) => (
                  <div key={person.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <Avatar className="size-8">
                      <AvatarFallback className={cn('text-[10px] font-semibold', initialsColor(person.id))}>
                        {initials(person.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{person.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{person.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={person.role} />
                      <span className="text-[10px] text-muted-foreground">{formatRelative(person.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="No registrations yet" className="border-0 bg-transparent py-8" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Actions recorded across your organizations.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length ? (
              <ul className="space-y-3">
                {data.recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName ?? 'System'}</span>{' '}
                        <span className="text-muted-foreground">{activity.action.replace(/[._]/g, ' ')}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatRelative(activity.createdAt)}
                        {activity.entityType ? ` · ${activity.entityType}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Clock} title="No activity yet" className="border-0 bg-transparent py-8" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
