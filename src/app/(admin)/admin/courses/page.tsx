import Link from 'next/link';
import { BookOpen, ExternalLink, Search } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminScope } from '@/lib/data/scope';
import { getAdminCategories, getOrgInstructors, listAdminCourses } from '@/features/admin/queries';
import { deleteCourseAction, setCourseStatusAction } from '@/features/admin/actions';
import { CourseDialog } from '@/features/admin/components/course-dialog';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ConfirmButton } from '@/components/forms/confirm-button';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { courseQuerySchema } from '@/lib/validations';
import { formatDate, formatNumber } from '@/lib/utils';

export const metadata = { title: 'Courses' };

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : undefined);
  const query = courseQuerySchema.parse({
    search: get('search'),
    status: get('status') || undefined,
    page: get('page') ?? 1,
    pageSize: 10,
  });

  const user = await requireAdmin();
  const scope = await getAdminScope(user);
  const [result, instructors, categories] = await Promise.all([
    listAdminCourses(scope, query),
    getOrgInstructors(scope.orgIds),
    getAdminCategories(scope),
  ]);

  const orgs = scope.organizations.map((organization) => ({ id: organization.id, name: organization.name }));
  const categoryOptions = categories.map((category) => ({ id: category.id, name: category.name, org_id: category.org_id }));
  const instructorOptions = instructors.map((instructor) => ({
    id: instructor.id,
    full_name: instructor.full_name,
    email: instructor.email,
    default_org_id: instructor.default_org_id,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Courses"
        description="Create courses, assign instructors, control publishing and keep the catalog current."
        actions={
          instructorOptions.length ? (
            <CourseDialog
              orgs={orgs}
              instructors={instructorOptions}
              categories={categoryOptions}
              defaultOrgId={scope.orgIds[0]}
              defaultOpen={get('new') === '1'}
            />
          ) : (
            <Button size="sm" disabled title="Add an instructor first">
              <BookOpen /> New course
            </Button>
          )
        }
      />

      {!instructorOptions.length ? (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Add an instructor account before creating courses. Courses must be owned by an active instructor.
        </Card>
      ) : null}

      <Card className="gap-0 overflow-hidden py-0">
        <form className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="search" defaultValue={query.search} placeholder="Search course titles…" className="pl-9" />
          </div>
          <select
            name="status"
            defaultValue={query.status ?? ''}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          >
            <option value="">Any status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        {result.items.length ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="hidden md:table-cell">Instructor</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Learners</TableHead>
                  <TableHead className="hidden xl:table-cell">Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <BookOpen className="size-4" />
                        </div>
                        <div className="min-w-0 max-w-[260px]">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/courses/${course.slug}`} className="truncate font-medium hover:text-primary">
                              {course.title}
                            </Link>
                            {course.is_featured ? <Badge variant="secondary">Featured</Badge> : null}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {course.lesson_count} lessons · {course.duration_minutes} min
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm">{course.instructor?.full_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{course.organization?.name ?? '—'}</p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {course.category ? (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className="size-2 rounded-full" style={{ backgroundColor: course.category.color }} />
                          {course.category.name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={course.status} />
                    </TableCell>
                    <TableCell className="hidden text-sm sm:table-cell">{formatNumber(course.student_count)}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">{formatDate(course.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <CourseDialog
                          orgs={orgs}
                          instructors={instructorOptions}
                          categories={categoryOptions}
                          course={{
                            id: course.id,
                            org_id: course.org_id,
                            instructor_id: course.instructor_id,
                            category_id: course.category_id,
                            title: course.title,
                            subtitle: course.subtitle,
                            description: course.description,
                            difficulty: course.difficulty,
                            duration_minutes: course.duration_minutes,
                            requires_approval: course.requires_approval,
                            is_featured: course.is_featured,
                            learning_objectives: course.learning_objectives,
                            requirements: course.requirements,
                            thumbnail_url: course.thumbnail_url,
                          }}
                        />
                        {course.status === 'published' ? (
                          <Button asChild variant="ghost" size="icon-sm" aria-label="View public page">
                            <Link href={`/courses/${course.slug}`} target="_blank">
                              <ExternalLink className="size-3.5" />
                            </Link>
                          </Button>
                        ) : null}
                        <form action={setCourseStatusAction}>
                          <input type="hidden" name="courseId" value={course.id} />
                          {course.status === 'published' ? (
                            <>
                              <input type="hidden" name="status" value="draft" />
                              <ConfirmButton message={`Unpublish "${course.title}"? Learners will lose catalog access.`}>Unpublish</ConfirmButton>
                            </>
                          ) : (
                            <>
                              <input type="hidden" name="status" value="published" />
                              <ConfirmButton
                                message={
                                  course.lesson_count
                                    ? `Publish "${course.title}"? It becomes visible in the public catalog.`
                                    : 'Add at least one lesson before publishing.'
                                }
                                variant="default"
                                disabled={course.lesson_count === 0}
                              >
                                Publish
                              </ConfirmButton>
                            </>
                          )}
                        </form>
                        <form action={deleteCourseAction}>
                          <input type="hidden" name="courseId" value={course.id} />
                          <ConfirmButton
                            message={`Archive and remove "${course.title}"? Enrollments and records are retained.`}
                            variant="ghost"
                          >
                            Delete
                          </ConfirmButton>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4 py-3">
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                basePath="/admin/courses"
                searchParams={{ search: query.search, status: query.status }}
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No courses match those filters"
            description="Adjust the search or status, or create a course owned by one of your instructors."
            className="m-4 border-0 bg-transparent"
          />
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {result.items.length} of {result.total} courses. Deleting a course archives it without removing learner records.
      </p>
    </div>
  );
}
