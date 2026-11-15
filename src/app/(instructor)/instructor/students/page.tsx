import { GraduationCap, Search, Users } from 'lucide-react';
import { requireInstructor } from '@/lib/auth/session';
import { listInstructorStudents } from '@/features/instructor/queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/dashboard/stat-card';
import { cn, formatDate, initials, initialsColor, percent } from '@/lib/utils';

export const metadata = { title: 'Students' };

const PAGE_SIZE = 12;

export default async function InstructorStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : undefined);
  const search = get('search')?.trim().toLowerCase() ?? '';
  const status = get('status') ?? '';
  const page = Math.max(1, Number.parseInt(get('page') ?? '1', 10) || 1);

  const user = await requireInstructor();
  const allEnrollments = await listInstructorStudents(user);
  const filtered = allEnrollments.filter((enrollment) => {
    const matchesSearch =
      !search ||
      (enrollment.profiles?.full_name ?? '').toLowerCase().includes(search) ||
      (enrollment.profiles?.email ?? '').toLowerCase().includes(search) ||
      (enrollment.courses?.title ?? '').toLowerCase().includes(search);
    const matchesStatus = !status || enrollment.status === status;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const uniqueStudents = new Set(allEnrollments.map((enrollment) => enrollment.student_id)).size;
  const active = allEnrollments.filter((enrollment) => enrollment.status === 'active').length;
  const completed = allEnrollments.filter((enrollment) => enrollment.status === 'completed').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        description="Every learner enrolled in your courses, with progress and completion status."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Unique learners" value={uniqueStudents} icon={Users} />
        <StatCard label="Enrollments" value={allEnrollments.length} icon={GraduationCap} />
        <StatCard label="Active" value={active} hint="Currently learning" icon={GraduationCap} />
        <StatCard label="Completed" value={completed} hint="Finished a course" icon={GraduationCap} />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <form className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="search" defaultValue={get('search') ?? ''} placeholder="Search by name, email or course…" className="pl-9" />
          </div>
          <select
            name="status"
            defaultValue={status}
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

        {items.length ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Progress</TableHead>
                  <TableHead className="hidden lg:table-cell">Enrolled</TableHead>
                  <TableHead className="hidden xl:table-cell">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          {enrollment.profiles?.avatar_url ? <AvatarImage src={enrollment.profiles.avatar_url} alt="" /> : null}
                          <AvatarFallback className={cn('text-[10px] font-semibold', initialsColor(enrollment.student_id))}>
                            {initials(enrollment.profiles?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="max-w-[190px] truncate font-medium">{enrollment.profiles?.full_name ?? 'Student'}</p>
                          <p className="max-w-[190px] truncate text-xs text-muted-foreground">{enrollment.profiles?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[220px] truncate text-sm">{enrollment.courses?.title ?? 'Course'}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={enrollment.status} />
                    </TableCell>
                    <TableCell className="hidden w-40 md:table-cell">
                      <div className="flex items-center gap-2">
                        <Progress value={Number(enrollment.progress_percent)} className="h-1.5" />
                        <span className="w-9 text-right text-xs text-muted-foreground">{percent(enrollment.progress_percent)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {formatDate(enrollment.enrolled_at)}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                      {enrollment.completed_at ? formatDate(enrollment.completed_at) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4 py-3">
              <Pagination
                page={safePage}
                totalPages={totalPages}
                basePath="/instructor/students"
                searchParams={{ search: get('search'), status }}
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={Users}
            title="No students match those filters"
            description="Once learners enroll in your courses, they will appear here."
            className="m-4 border-0 bg-transparent"
          />
        )}
      </Card>
    </div>
  );
}
