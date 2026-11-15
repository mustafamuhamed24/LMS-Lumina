import { BarChart3, BookOpen, GraduationCap, TrendingUp, Users } from 'lucide-react';
import { requireInstructor } from '@/lib/auth/session';
import { getInstructorAnalytics, getInstructorDashboard } from '@/features/instructor/queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { EnrollmentTrendChart, HorizontalBars } from '@/components/charts/charts';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatNumber, percent } from '@/lib/utils';

export const metadata = { title: 'Analytics' };

export default async function InstructorAnalyticsPage() {
  const user = await requireInstructor();
  const [dashboard, analytics] = await Promise.all([getInstructorDashboard(user), getInstructorAnalytics(user)]);

  const averageCompletion = analytics.completionByCourse.length
    ? analytics.completionByCourse.reduce((sum, course) => sum + course.rate, 0) / analytics.completionByCourse.length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teaching analytics"
        description="Understand learner engagement, completion and assessment outcomes across your courses."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Courses" value={dashboard.stats.courses} hint={`${dashboard.stats.publishedCourses} published`} icon={BookOpen} />
        <StatCard label="Learners" value={formatNumber(dashboard.stats.students)} hint={`${dashboard.stats.activeStudents} active`} icon={Users} />
        <StatCard label="Average progress" value={percent(dashboard.stats.averageProgress, 1)} hint="Across enrollments" icon={TrendingUp} />
        <StatCard label="Average completion" value={percent(averageCompletion, 1)} hint="Per course" icon={GraduationCap} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment and completion trend</CardTitle>
            <CardDescription>Six-month rolling view across your courses.</CardDescription>
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
            <CardTitle>Grade distribution</CardTitle>
            <CardDescription>Graded submissions by percentage band.</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.gradeBuckets.some((bucket) => bucket.value) ? (
              <HorizontalBars
                data={analytics.gradeBuckets.map((bucket) => ({ name: bucket.name, value: bucket.value }))}
                dataKey="value"
                color="var(--chart-3)"
              />
            ) : (
              <EmptyState icon={BarChart3} title="No graded submissions yet" className="border-0 bg-transparent py-10" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completion by course</CardTitle>
          <CardDescription>Share of enrolled learners who finished each course.</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.completionByCourse.length ? (
            <div className="space-y-4">
              {analytics.completionByCourse
                .slice()
                .sort((a, b) => b.rate - a.rate)
                .map((course) => (
                  <div key={course.name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="min-w-0 truncate font-medium">{course.name}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {course.students} {course.students === 1 ? 'learner' : 'learners'} · {percent(course.rate, 1)}
                      </span>
                    </div>
                    <Progress value={course.rate} className="h-1.5" />
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState
              icon={GraduationCap}
              title="No enrollment data yet"
              description="Analytics populate once learners enroll in your published courses."
              className="border-0 bg-transparent py-8"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
