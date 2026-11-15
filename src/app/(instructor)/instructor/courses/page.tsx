import Link from 'next/link';
import { BookOpen, ExternalLink, GraduationCap, Users } from 'lucide-react';
import { requireInstructor } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listInstructorCourses } from '@/features/instructor/queries';
import { InstructorCourseDialog } from '@/features/instructor/components/course-dialog';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatNumber } from '@/lib/utils';

export const metadata = { title: 'My courses' };

export default async function InstructorCoursesPage() {
  const user = await requireInstructor();
  const supabase = await createServerSupabaseClient();
  const [courses, categoriesResult] = await Promise.all([
    listInstructorCourses(user),
    supabase.from('categories').select('id,name,color,org_id').in('org_id', user.profile.memberships.map((membership) => membership.orgId)).order('name'),
  ]);

  const orgs = user.profile.memberships
    .filter((membership) => membership.role === 'instructor' || membership.role === 'org_admin')
    .map((membership) => ({ id: membership.orgId, name: membership.organization.name }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="My courses"
        description="Create and maintain the courses you teach. Open the builder to manage curriculum and assessments."
        actions={<InstructorCourseDialog orgs={orgs} categories={categoriesResult.data ?? []} />}
      />

      {courses.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <div className="relative h-28 bg-gradient-to-br from-primary/15 via-primary/5 to-chart-2/10">
                {course.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnail_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <BookOpen className="size-8 text-primary/40" />
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <StatusBadge status={course.status} />
                </div>
              </div>
              <CardContent className="space-y-3">
                <div>
                  <p className="line-clamp-1 font-semibold">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.organization?.name ?? 'Organization'} · updated {formatDate(course.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="size-3" /> {course.lesson_count} lessons
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3" /> {formatNumber(course.student_count)} learners
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="size-3" /> {course.duration_minutes} min
                  </span>
                </div>
                <div className="flex items-center gap-2 border-t pt-3">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/instructor/courses/${course.id}`}>Open builder</Link>
                  </Button>
                  {course.status === 'published' ? (
                    <Button asChild variant="outline" size="icon-sm" aria-label="View public page">
                      <Link href={`/courses/${course.slug}`} target="_blank">
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to start adding sections, lessons and assessments."
          action={<InstructorCourseDialog orgs={orgs} categories={categoriesResult.data ?? []} />}
        />
      )}
    </div>
  );
}
