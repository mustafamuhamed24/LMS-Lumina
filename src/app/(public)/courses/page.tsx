import { BookOpen } from 'lucide-react';
import { getCategories, listPublicCourses } from '@/features/courses/queries';
import { getSessionUser } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CourseCard } from '@/components/shared/course-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { CatalogFilters } from '@/features/courses/components/catalog-filters';
import { PageHeader } from '@/components/dashboard/page-header';

export const metadata = {
  title: 'Course catalog',
  description: 'Explore structured courses across design, engineering, data, leadership and more.',
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : undefined);

  const page = Number(get('page') ?? 1) || 1;
  const [categories, result, user] = await Promise.all([
    getCategories(),
    listPublicCourses({
      search: get('search'),
      category: get('category'),
      difficulty: get('difficulty'),
      sort: (get('sort') as 'newest' | 'popular' | 'title' | undefined) ?? 'newest',
      page,
      pageSize: 9,
    }),
    getSessionUser(),
  ]);

  const enrollmentByCourse = new Map<string, { status: string; progress_percent: number }>();
  if (user && result.items.length) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('enrollments')
      .select('course_id, status, progress_percent')
      .eq('student_id', user.id)
      .in('course_id', result.items.map((course) => course.id));
    for (const enrollment of data ?? []) {
      enrollmentByCourse.set(enrollment.course_id, { status: enrollment.status, progress_percent: Number(enrollment.progress_percent) });
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Course catalog"
        description="Structured programs with clear outcomes, guided lessons and assessments that prove progress."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Courses' }]}
      />

      <div className="mt-8">
        <CatalogFilters
          categories={categories.map((category) => ({ ...category }))}
          total={result.total}
        />
      </div>

      {result.items.length ? (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((course) => (
              <CourseCard key={course.id} course={course} enrollment={enrollmentByCourse.get(course.id)} />
            ))}
          </div>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/courses"
            searchParams={{
              search: get('search'),
              category: get('category'),
              difficulty: get('difficulty'),
              sort: get('sort'),
            }}
            className="mt-10 border-t pt-5"
          />
        </>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses match those filters"
          description="Try a different search term or clear the filters to see the full catalog."
          className="mt-6"
        />
      )}
    </div>
  );
}
