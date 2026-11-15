import { ClipboardCheck, Search } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminScope } from '@/lib/data/scope';
import { getAdminCourseOptions, getOrgStudents, listAdminEnrollments } from '@/features/admin/queries';
import { setEnrollmentStatusFormAction } from '@/features/enrollments/actions';
import { ManualEnrollDialog } from '@/features/admin/components/manual-enroll-dialog';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ConfirmButton } from '@/components/forms/confirm-button';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { enrollmentQuerySchema } from '@/lib/validations';
import { cn, formatDate, initials, initialsColor, percent } from '@/lib/utils';

export const metadata = { title: 'Enrollments' };

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : undefined);
  const query = enrollmentQuerySchema.parse({
    search: get('search'),
    status: get('status') || undefined,
    page: get('page') ?? 1,
    pageSize: 10,
  });

  const user = await requireAdmin();
  const scope = await getAdminScope(user);
  const [result, courseOptions, students] = await Promise.all([
    listAdminEnrollments(scope, query),
    getAdminCourseOptions(scope),
    getOrgStudents(scope.orgIds),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Enrollments"
        description="Review requests, approve access and follow learner progress across courses."
        actions={
          <ManualEnrollDialog
            courses={courseOptions.map((course) => ({ id: course.id, title: course.title }))}
            students={students.map((student) => ({ id: student.id, full_name: student.full_name, email: student.email }))}
          />
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        <form className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="search" defaultValue={query.search} placeholder="Search course title…" className="pl-9" />
          </div>
          <select
            name="status"
            defaultValue={query.status ?? ''}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          >
            <option value="">Any status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
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
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Progress</TableHead>
                  <TableHead className="hidden lg:table-cell">Enrolled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          {enrollment.student?.avatar_url ? <AvatarImage src={enrollment.student.avatar_url} alt="" /> : null}
                          <AvatarFallback className={cn('text-[10px] font-semibold', initialsColor(enrollment.student_id))}>
                            {initials(enrollment.student?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate font-medium">{enrollment.student?.full_name ?? 'Student'}</p>
                          <p className="max-w-[180px] truncate text-xs text-muted-foreground">{enrollment.student?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[220px] truncate text-sm">{enrollment.course?.title ?? 'Course'}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={enrollment.status} />
                    </TableCell>
                    <TableCell className="hidden w-40 md:table-cell">
                      <div className="flex items-center gap-2">
                        <Progress value={Number(enrollment.progress_percent)} className="h-1.5" />
                        <span className="w-9 text-right text-xs text-muted-foreground">
                          {percent(enrollment.progress_percent)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {formatDate(enrollment.enrolled_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {enrollment.status === 'pending' ? (
                          <>
                            <form action={setEnrollmentStatusFormAction}>
                              <input type="hidden" name="enrollmentId" value={enrollment.id} />
                              <input type="hidden" name="status" value="active" />
                              <Button type="submit" size="sm" variant="success">
                                Approve
                              </Button>
                            </form>
                            <form action={setEnrollmentStatusFormAction}>
                              <input type="hidden" name="enrollmentId" value={enrollment.id} />
                              <input type="hidden" name="status" value="rejected" />
                              <ConfirmButton message="Reject this enrollment request?" variant="ghost">
                                Reject
                              </ConfirmButton>
                            </form>
                          </>
                        ) : null}
                        {enrollment.status === 'active' ? (
                          <form action={setEnrollmentStatusFormAction}>
                            <input type="hidden" name="enrollmentId" value={enrollment.id} />
                            <input type="hidden" name="status" value="completed" />
                            <ConfirmButton message="Mark this enrollment as completed? A certificate will be issued.">
                              Mark complete
                            </ConfirmButton>
                          </form>
                        ) : null}
                        {enrollment.status === 'rejected' || enrollment.status === 'cancelled' ? (
                          <form action={setEnrollmentStatusFormAction}>
                            <input type="hidden" name="enrollmentId" value={enrollment.id} />
                            <input type="hidden" name="status" value="active" />
                            <ConfirmButton message="Restore access for this learner?">Restore</ConfirmButton>
                          </form>
                        ) : null}
                        {enrollment.status === 'completed' ? (
                          <span className="pr-2 text-xs text-muted-foreground">Recorded</span>
                        ) : null}
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
                basePath="/admin/enrollments"
                searchParams={{ search: query.search, status: query.status }}
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={ClipboardCheck}
            title="No enrollments match those filters"
            description="Adjust the filters or manually enroll a student."
            className="m-4 border-0 bg-transparent"
          />
        )}
      </Card>
    </div>
  );
}
