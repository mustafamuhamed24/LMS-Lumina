import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Flame,
  GraduationCap,
  PlayCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { requireStudent } from '@/lib/auth/session';
import { getStudentDashboard } from '@/features/student/queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, formatNumber, formatRelative, percent } from '@/lib/utils';

export const metadata = { title: 'Student dashboard' };

export default async function StudentDashboardPage() {
  const user = await requireStudent();
  const data = await getStudentDashboard(user);
  const firstName = user.profile.full_name.split(' ')[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${firstName}`}
        description="Pick up where you left off, keep an eye on deadlines and track your growing skills."
        actions={
          <Button asChild>
            <Link href="/courses">
              <Compass /> Browse catalog
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active courses" value={data.stats.activeCourses} hint={`${data.stats.completedCourses} completed`} icon={BookOpen} />
        <StatCard label="Average progress" value={percent(data.stats.averageProgress, 1)} hint="Across your courses" icon={TrendingUp} />
        <StatCard label="Pending assignments" value={data.stats.pendingAssignments} hint="Need your attention" icon={ClipboardCheck} />
        <StatCard label="Certificates" value={data.stats.certificates} hint="Verifiable achievements" icon={Award} />
      </div>

      {data.continueLearning ? (
        <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.07] via-card to-chart-2/[0.06]">
          <CardContent className="flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <PlayCircle className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Continue learning</p>
                <h2 className="mt-1 truncate text-lg font-semibold">{data.continueLearning.course.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.continueLearning.course.instructor?.full_name ?? 'Instructor'} ·{' '}
                  {data.continueLearning.course.lesson_count} lessons
                </p>
                <div className="mt-3 flex max-w-md items-center gap-3">
                  <Progress value={Number(data.continueLearning.progress_percent)} className="h-1.5" />
                  <span className="w-10 text-right text-xs font-medium">{percent(data.continueLearning.progress_percent)}</span>
                </div>
              </div>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href={`/learn/${data.continueLearning.course.slug}`}>
                Resume course <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </span>
            <h2 className="mt-3 text-lg font-semibold">Start learning today</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Browse the catalog and enroll in a course that sparks your curiosity. Your progress will show up here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/courses">
                <Compass /> Explore courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>My courses</CardTitle>
              <CardDescription>Everything you are enrolled in.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/student/my-courses">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.enrollments.length ? (
              <div className="divide-y">
                {data.enrollments.slice(0, 4).map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-primary">
                      {enrollment.course.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={enrollment.course.thumbnail_url} alt="" className="size-full object-cover" />
                      ) : (
                        <BookOpen className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/learn/${enrollment.course.slug}`} className="truncate text-sm font-medium hover:text-primary">
                        {enrollment.course.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={Number(enrollment.progress_percent)} className="h-1" />
                        <span className="w-8 text-right text-[10px] text-muted-foreground">{percent(enrollment.progress_percent)}</span>
                      </div>
                    </div>
                    <StatusBadge status={enrollment.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No enrollments yet"
                description="When you enroll in a course it will appear here."
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
            <CardDescription>Assignments due soon.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingAssignments.length ? (
              <ul className="space-y-3">
                {data.upcomingAssignments.map((assignment) => (
                  <li key={assignment.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{assignment.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{assignment.course?.title}</p>
                      </div>
                      <Badge variant={assignment.submission ? 'secondary' : 'outline'} className="shrink-0 text-[10px]">
                        {assignment.submission ? assignment.submission.status : 'Not started'}
                      </Badge>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CalendarClock className="size-3" /> {formatRelative(assignment.due_at)} · {formatDate(assignment.due_at, 'd MMM, HH:mm')}
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

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Certificates</CardTitle>
              <CardDescription>Your verified achievements.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/student/certificates">
                All certificates <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.certificates.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.certificates.slice(0, 4).map((certificate) => (
                  <Link
                    key={certificate.id}
                    href={`/student/certificates/${certificate.id}`}
                    className="group rounded-lg border bg-gradient-to-br from-amber-50 to-background p-3 transition-colors hover:border-amber-300 dark:from-amber-500/5"
                  >
                    <Award className="size-5 text-amber-600" />
                    <p className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-primary">{certificate.course_title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(certificate.issued_at)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Award}
                title="No certificates yet"
                description="Complete a course to earn a verifiable certificate."
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Updates from your courses.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.notifications.length ? (
              <ul className="space-y-3">
                {data.notifications.map((notification) => (
                  <li key={notification.id} className="flex items-start gap-2.5">
                    <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', notification.read_at ? 'bg-muted-foreground/40' : 'bg-primary')} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{notification.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{formatRelative(notification.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Flame} title="Nothing new right now" className="border-0 bg-transparent py-8" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <GraduationCap className="size-3.5" /> {formatNumber(data.learning.length)} learning journeys in progress or completed
        </span>
        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" /> {data.completed.length} courses completed
        </span>
      </div>
    </div>
  );
}
