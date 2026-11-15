import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import { requireInstructor } from '@/lib/auth/session';
import { getInstructorDashboard } from '@/features/instructor/queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EnrollmentTrendChart } from '@/components/charts/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, formatDate, formatDateTime, formatNumber, formatRelative, initials, initialsColor, percent } from '@/lib/utils';

export const metadata = { title: 'Instructor dashboard' };

export default async function InstructorDashboardPage() {
  const user = await requireInstructor();
  const data = await getInstructorDashboard(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.profile.full_name.split(' ')[0]}`}
        description="Your courses, learners and assessment queue in one workspace."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/instructor/assignments">
                <ClipboardCheck /> Grading queue
              </Link>
            </Button>
            <Button asChild>
              <Link href="/instructor/courses">
                <Plus /> New course
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Courses" value={formatNumber(data.stats.courses)} hint={`${data.stats.publishedCourses} published`} icon={BookOpen} />
        <StatCard label="Active learners" value={formatNumber(data.stats.activeStudents)} hint={`${data.stats.students} unique students`} icon={GraduationCap} />
        <StatCard label="Pending grading" value={formatNumber(data.stats.pendingGrading)} hint="Submissions awaiting review" icon={ClipboardCheck} />
        <StatCard label="Average progress" value={percent(data.stats.averageProgress, 1)} hint={`${data.stats.completions} completions`} icon={TrendingUp} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment activity</CardTitle>
            <CardDescription>Enrollments and completions across your courses.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.trend.some((point) => point.enrollments || point.completions) ? (
              <EnrollmentTrendChart data={data.trend} />
            ) : (
              <EmptyState icon={TrendingUp} title="No enrollment activity yet" className="border-0 bg-transparent py-10" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
            <CardDescription>Assignments scheduled next.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingDeadlines.length ? (
              <ul className="space-y-3">
                {data.upcomingDeadlines.map((deadline) => (
                  <li key={deadline.id} className="rounded-lg border bg-background/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{deadline.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{deadline.course}</p>
                      </div>
                      <span className="shrink-0 rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] font-medium">
                        {formatDate(deadline.dueAt, 'd MMM')}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {deadline.submissions} submissions · due {formatRelative(deadline.dueAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={CalendarClock} title="No upcoming deadlines" className="border-0 bg-transparent py-8" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Your courses</CardTitle>
              <CardDescription>Publishing status and learner reach.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/instructor/courses">
                All courses <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.courses.length ? (
              <div className="divide-y">
                {data.courses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <BookOpen className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/instructor/courses/${course.id}`} className="truncate text-sm font-medium hover:text-primary">
                        {course.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {course.lesson_count} lessons · {formatNumber(course.student_count)} learners
                      </p>
                    </div>
                    <StatusBadge status={course.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="Create your first course"
                description="Build structured lessons, quizzes and assignments for your learners."
                action={
                  <Button asChild size="sm">
                    <Link href="/instructor/courses">Get started</Link>
                  </Button>
                }
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent learners</CardTitle>
            <CardDescription>Latest enrollments.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentStudents.length ? (
              <div className="space-y-3">
                {data.recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className={cn('text-[10px] font-semibold', initialsColor(student.email || student.id))}>
                        {initials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{student.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{student.course}</p>
                    </div>
                    <div className="w-20">
                      <Progress value={student.progress} className="h-1" />
                      <p className="mt-1 text-right text-[10px] text-muted-foreground">{Math.round(student.progress)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="No learners yet" className="border-0 bg-transparent py-8" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Assessment queue</CardTitle>
            <CardDescription>Recent submissions that need your attention.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/instructor/assignments">
              Open grading <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.pendingSubmissions.length ? (
            <div className="divide-y">
              {data.pendingSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className={cn('text-[10px] font-semibold', initialsColor(submission.student_id))}>
                        {initials(submission.student?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{submission.student?.full_name ?? 'Student'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {submission.assignment?.title} · {submission.assignment?.course?.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={submission.status} />
                    <span className="hidden text-xs text-muted-foreground sm:block">{formatDateTime(submission.submitted_at)}</span>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/instructor/assignments">Review</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
              <CheckCircle2 className="size-4" /> Nothing awaiting grading right now.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
