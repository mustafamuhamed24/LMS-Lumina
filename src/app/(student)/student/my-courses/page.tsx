import Link from 'next/link';
import { BookOpen, Clock, Compass, GraduationCap, PlayCircle, Search, Users } from 'lucide-react';
import { requireStudent } from '@/lib/auth/session';
import { listStudentCourses } from '@/features/student/queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, formatNumber, percent } from '@/lib/utils';

export const metadata = { title: 'My courses' };

export default async function StudentCoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : undefined);
  const search = get('search')?.trim().toLowerCase() ?? '';
  const status = get('status') ?? '';

  const user = await requireStudent();
  const enrollments = await listStudentCourses(user);
  const filtered = enrollments.filter((enrollment) => {
    const matchesSearch =
      !search ||
      enrollment.course.title.toLowerCase().includes(search) ||
      (enrollment.course.instructor?.full_name ?? '').toLowerCase().includes(search) ||
      (enrollment.course.category?.name ?? '').toLowerCase().includes(search);
    const matchesStatus = !status || enrollment.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="My courses"
        description="Your learning library, progress and next steps."
        actions={
          <Button asChild variant="outline">
            <Link href="/courses">
              <Compass /> Browse catalog
            </Link>
          </Button>
        }
      />

      {enrollments.some((enrollment) => enrollment.status === 'pending') ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
          Some enrollment requests are awaiting approval. You will be notified as soon as they are reviewed.
        </div>
      ) : null}

      <form className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="search" defaultValue={get('search') ?? ''} placeholder="Search your courses…" className="pl-9" />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
        >
          <option value="">All enrollments</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((enrollment) => {
            const canLearn = enrollment.status === 'active' || enrollment.status === 'completed';
            return (
              <Card key={enrollment.id} className="overflow-hidden">
                <div className="relative h-32 bg-gradient-to-br from-primary/15 via-primary/5 to-chart-2/10">
                  {enrollment.course.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={enrollment.course.thumbnail_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <BookOpen className="size-8 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <StatusBadge status={enrollment.status} />
                  </div>
                </div>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {enrollment.course.category ? (
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 text-[10px]"
                          style={{ borderColor: `${enrollment.course.category.color}55`, color: enrollment.course.category.color }}
                        >
                          {enrollment.course.category.name}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 font-semibold">{enrollment.course.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {enrollment.course.instructor?.full_name ?? 'Instructor'} · enrolled {formatDate(enrollment.enrolled_at)}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium text-foreground">{percent(enrollment.progress_percent)}</span>
                    </div>
                    <Progress value={Number(enrollment.progress_percent)} className="h-1.5" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="size-3" /> {enrollment.course.lesson_count} lessons
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" /> {enrollment.course.duration_minutes} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" /> {formatNumber(enrollment.course.student_count)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    {canLearn ? (
                      <Button asChild size="sm" className="w-full">
                        <Link href={`/learn/${enrollment.course.slug}`}>
                          <PlayCircle /> {enrollment.status === 'completed' ? 'Review course' : 'Continue learning'}
                        </Link>
                      </Button>
                    ) : enrollment.status === 'pending' ? (
                      <Button disabled size="sm" variant="outline" className="w-full">
                        Awaiting approval
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="w-full">
                        <Link href={`/courses/${enrollment.course.slug}`}>View course</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={enrollments.length ? 'No courses match those filters' : 'You have not enrolled in a course yet'}
          description={
            enrollments.length
              ? 'Try a different search or status filter.'
              : 'Explore the catalog and find your next learning adventure.'
          }
          action={
            <Button asChild>
              <Link href="/courses">
                <Compass /> Browse catalog
              </Link>
            </Button>
          }
          className={cn(!enrollments.length && 'bg-card')}
        />
      )}
    </div>
  );
}
