import Link from 'next/link';
import { CalendarClock, CheckCircle2, ClipboardCheck, Clock, FileText, Search } from 'lucide-react';
import { requireStudent } from '@/lib/auth/session';
import { listStudentAssignments } from '@/features/student/queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatDateTime, isOverdue } from '@/lib/utils';

export const metadata = { title: 'Assignments' };

export default async function StudentAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : undefined);
  const search = get('search')?.trim().toLowerCase() ?? '';
  const status = get('status') ?? '';

  const user = await requireStudent();
  const { assignments } = await listStudentAssignments(user);

  const filtered = assignments.filter((assignment) => {
    const matchesSearch =
      !search ||
      assignment.title.toLowerCase().includes(search) ||
      (assignment.course?.title ?? '').toLowerCase().includes(search);
    const submissionStatus = assignment.submission?.status ?? 'not_started';
    const matchesStatus =
      !status ||
      (status === 'pending' && submissionStatus !== 'graded') ||
      (status === 'graded' && submissionStatus === 'graded') ||
      (status === 'submitted' && submissionStatus === 'submitted') ||
      (status === 'returned' && submissionStatus === 'returned');
    return matchesSearch && matchesStatus;
  });

  const pending = assignments.filter((assignment) => !assignment.submission || assignment.submission.status === 'returned').length;
  const submitted = assignments.filter((assignment) => assignment.submission?.status === 'submitted').length;
  const graded = assignments.filter((assignment) => assignment.submission?.status === 'graded').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assignments"
        description="Submit your work, track due dates and review instructor feedback."
        actions={
          <Button asChild variant="outline">
            <Link href="/student/my-courses">
              <ClipboardCheck /> My courses
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total assignments" value={assignments.length} icon={FileText} />
        <StatCard label="Needs attention" value={pending} hint="Not submitted or returned" icon={Clock} />
        <StatCard label="Awaiting grading" value={submitted} icon={ClipboardCheck} />
        <StatCard label="Graded" value={graded} icon={CheckCircle2} />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <form className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="search" defaultValue={get('search') ?? ''} placeholder="Search assignments or courses…" className="pl-9" />
          </div>
          <select
            name="status"
            defaultValue={status}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          >
            <option value="">All assignments</option>
            <option value="pending">Needs attention</option>
            <option value="submitted">Awaiting grading</option>
            <option value="graded">Graded</option>
            <option value="returned">Returned</option>
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        {filtered.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Score</TableHead>
                <TableHead className="hidden lg:table-cell">Due</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <p className="max-w-[240px] truncate font-medium">{assignment.title}</p>
                    <p className="max-w-[240px] truncate text-xs text-muted-foreground">{assignment.max_points} points</p>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[220px] truncate text-sm">{assignment.course?.title ?? 'Course'}</p>
                  </TableCell>
                  <TableCell>
                    {assignment.submission ? (
                      <StatusBadge status={assignment.submission.status} />
                    ) : (
                      <Badge variant="outline">Not started</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {assignment.submission?.status === 'graded' ? (
                      <span className="text-sm font-medium">
                        {Number(assignment.submission.grade ?? 0)} / {assignment.max_points}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {assignment.due_at ? (
                      <span className={cn('inline-flex items-center gap-1 text-xs', isOverdue(assignment.due_at) ? 'text-destructive' : 'text-muted-foreground')}>
                        <CalendarClock className="size-3" /> {formatDateTime(assignment.due_at)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No deadline</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant={assignment.submission?.status === 'graded' ? 'outline' : 'default'}>
                      <Link href={`/learn/${assignment.course?.slug}/${assignment.lesson_id}`}>
                        {assignment.submission?.status === 'graded'
                          ? 'View feedback'
                          : assignment.submission
                            ? 'Update'
                            : 'Open assignment'}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={ClipboardCheck}
            title={assignments.length ? 'No assignments match those filters' : 'No assignments yet'}
            description={
              assignments.length
                ? 'Try a different search or status filter.'
                : 'Assignments from your enrolled courses will appear here.'
            }
            className="m-4 border-0 bg-transparent"
          />
        )}
      </Card>
    </div>
  );
}
