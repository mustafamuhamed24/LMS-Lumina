import Link from 'next/link';
import { Award, BarChart3, BookOpen, ClipboardCheck, GraduationCap, TrendingUp, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminScope } from '@/lib/data/scope';
import { getAdminDashboard } from '@/features/analytics/admin-dashboard';
import { getAdminAnalytics } from '@/features/admin/queries';import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { CategoryBreakdownChart, EnrollmentTrendChart, HorizontalBars } from '@/components/charts/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { formatNumber, percent } from '@/lib/utils';

export const metadata = { title: 'Analytics' };

export default async function AdminAnalyticsPage() {
  const user = await requireAdmin();
  const [dashboard, analytics] = await Promise.all([getAdminDashboard(user), getAdminScope(user).then(getAdminAnalytics)]);

  const totalCourses = analytics.statusCounts.reduce((sum, item) => sum + item.value, 0);
  const published = analytics.statusCounts.find((item) => item.name === 'published')?.value ?? 0;
  const gradingRate = analytics.assignmentSubmissions
    ? (analytics.gradedSubmissions / analytics.assignmentSubmissions) * 100
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Enrollment, completion, assessment and certificate performance across your organizations."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/enrollments">
              <ClipboardCheck /> Enrollment records
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Completion rate" value={percent(dashboard.stats.completionRate, 1)} hint="Active + completed enrollments" icon={TrendingUp} />
        <StatCard label="Average progress" value={percent(dashboard.stats.averageProgress, 1)} hint="Across active learners" icon={GraduationCap} />
        <StatCard label="Certificates issued" value={formatNumber(analytics.certificates)} hint="Verifiable credentials" icon={Award} />
        <StatCard label="Grading rate" value={percent(gradingRate, 1)} hint={`${analytics.gradedSubmissions} of ${analytics.assignmentSubmissions} submissions`} icon={ClipboardCheck} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment and completion trend</CardTitle>
            <CardDescription>Six-month rolling view.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.trend.some((point) => point.enrollments || point.completions) ? (
              <EnrollmentTrendChart data={dashboard.trend} />
            ) : (
              <EmptyState icon={BarChart3} title="No trend data yet" className="border-0 bg-transparent py-10" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course mix</CardTitle>
            <CardDescription>Publishing status across {totalCourses} courses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.statusCounts.length ? (
              <>
                <HorizontalBars
                  data={analytics.statusCounts.map((item) => ({ name: item.name, value: item.value }))}
                  dataKey="value"
                />
                <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Published share</p>
                    <p className="mt-1 font-semibold">{percent(totalCourses ? (published / totalCourses) * 100 : 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Published courses</p>
                    <p className="mt-1 font-semibold">{published}</p>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState icon={BookOpen} title="No courses yet" className="border-0 bg-transparent py-8" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category distribution</CardTitle>
            <CardDescription>Published courses by subject.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.categoryBreakdown.length ? (
              <CategoryBreakdownChart data={dashboard.categoryBreakdown} />
            ) : (
              <EmptyState icon={BookOpen} title="No category data" className="border-0 bg-transparent py-8" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Difficulty distribution</CardTitle>
            <CardDescription>How challenging the catalog is overall.</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.difficultyCounts.length ? (
              <HorizontalBars
                data={analytics.difficultyCounts.map((item) => ({
                  name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
                  value: item.value,
                }))}
                dataKey="value"
                color="var(--chart-2)"
              />
            ) : (
              <EmptyState icon={BarChart3} title="No course data" className="border-0 bg-transparent py-8" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Most active learners</CardTitle>
            <CardDescription>Ranked by completed courses and enrollment volume.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/users">
              <Users /> All users
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {analytics.topStudents.length ? (
            <div className="divide-y">
              {analytics.topStudents.map((student, index) => (
                <div key={student.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{student.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <Progress value={student.progress} className="h-1.5" />
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-sm font-medium">{student.completed} completed</p>
                    <p className="text-[11px] text-muted-foreground">{student.courses} enrolled</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={GraduationCap} title="No learner data yet" className="border-0 bg-transparent py-8" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
