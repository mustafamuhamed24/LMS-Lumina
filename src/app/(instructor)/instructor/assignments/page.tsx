import Link from 'next/link';
import { CalendarClock, CheckCircle2, ClipboardCheck, Clock, FileText, Search } from 'lucide-react';
import { requireInstructor } from '@/lib/auth/session';
import { listInstructorAssignments, listInstructorGrading } from '@/features/instructor/queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { GradingDialog } from '@/features/instructor/components/grading-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatDate, formatDateTime, initials, initialsColor, isOverdue } from '@/lib/utils';

export const metadata = { title: 'Assignments & grading' };

export default async function InstructorAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : undefined);
  const search = get('search')?.trim().toLowerCase() ?? '';
  const statusFilter = get('status') ?? '';

  const user = await requireInstructor();
  const [assignments, submissions] = await Promise.all([listInstructorAssignments(user), listInstructorGrading(user)]);

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      !search ||
      (submission.student?.full_name ?? '').toLowerCase().includes(search) ||
      (submission.assignment?.title ?? '').toLowerCase().includes(search) ||
      (submission.assignment?.course?.title ?? '').toLowerCase().includes(search);
    const matchesStatus =
      !statusFilter || (statusFilter === 'pending' ? ['submitted', 'returned'].includes(submission.status) : submission.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const pending = submissions.filter((submission) => ['submitted', 'returned'].includes(submission.status)).length;
  const graded = submissions.filter((submission) => submission.status === 'graded').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assignments & grading"
        description="Track assignment deadlines, review learner submissions and return feedback."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assignments" value={assignments.length} icon={FileText} />
        <StatCard label="Submissions" value={submissions.length} icon={ClipboardCheck} />
        <StatCard label="Awaiting review" value={pending} hint="Submitted or returned" icon={Clock} />
        <StatCard label="Graded" value={graded} hint="Feedback delivered" icon={CheckCircle2} />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Assignment schedule</CardTitle>
          <CardDescription>Every assignment in the courses you manage.</CardDescription>
        </CardHeader>
        {assignments.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="hidden md:table-cell">Points</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead className="text-right">Builder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <p className="max-w-[240px] truncate font-medium">{assignment.title}</p>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[220px] truncate text-sm text-muted-foreground">{assignment.course?.title ?? 'Course'}</p>
                  </TableCell>
                  <TableCell>
                    {assignment.due_at ? (
                      <span className={cn('inline-flex items-center gap-1 text-xs', isOverdue(assignment.due_at) ? 'text-destructive' : 'text-muted-foreground')}>
                        <CalendarClock className="size-3" /> {formatDate(assignment.due_at, 'd MMM yyyy, HH:mm')}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No deadline</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">{assignment.max_points}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="rounded-full bg-muted px-2 py-0.5">{assignment.counts.total} total</span>
                      {assignment.counts.pending ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                          {assignment.counts.pending} pending
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/instructor/courses/${assignment.course_id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={FileText}
            title="No assignments yet"
            description="Add an assignment lesson in the course builder to start collecting submissions."
            className="m-4 border-0 bg-transparent"
          />
        )}
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <form className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="search" defaultValue={get('search') ?? ''} placeholder="Search student, assignment or course…" className="pl-9" />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          >
            <option value="">All submissions</option>
            <option value="pending">Awaiting review</option>
            <option value="graded">Graded</option>
            <option value="returned">Returned</option>
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        {filteredSubmissions.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Score</TableHead>
                <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className={cn('text-[10px] font-semibold', initialsColor(submission.student_id))}>
                          {initials(submission.student?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="max-w-[180px] truncate font-medium">{submission.student?.full_name ?? 'Student'}</p>
                        <p className="max-w-[180px] truncate text-xs text-muted-foreground">{submission.student?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[220px] truncate text-sm">{submission.assignment?.title ?? 'Assignment'}</p>
                    <p className="max-w-[220px] truncate text-xs text-muted-foreground">{submission.assignment?.course?.title}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={submission.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {submission.grade !== null ? (
                      <span className="text-sm font-medium">
                        {submission.grade} / {submission.assignment?.max_points ?? 100}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not graded</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                    {formatDateTime(submission.submitted_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <GradingDialog submission={submission} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={ClipboardCheck}
            title="No submissions match those filters"
            description="Submissions appear here when learners hand in their work."
            className="m-4 border-0 bg-transparent"
          />
        )}
      </Card>
    </div>
  );
}
