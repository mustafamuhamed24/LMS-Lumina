'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, CheckCircle2, Download, Loader2, Send, Star } from 'lucide-react';
import { submitAssignmentAction } from '@/features/student/actions';
import { initialFormState, type FormState } from '@/lib/form-state';
import type { AssignmentRow, SubmissionRow } from '@/types/app';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { formatDateTime, isOverdue } from '@/lib/utils';

export function AssignmentSubmission({
  assignment,
  submission,
}: {
  assignment: AssignmentRow;
  submission: SubmissionRow | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(submitAssignmentAction, initialFormState);
  const [content, setContent] = useState(submission?.content_text ?? '');

  useEffect(() => {
    if (state.status === 'success') router.refresh();
  }, [state, router]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {assignment.title}
            {submission ? <StatusBadge status={submission.status} /> : null}
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-3">
            <span>{assignment.max_points} points</span>
            {assignment.due_at ? (
              <span className={isOverdue(assignment.due_at) ? 'text-destructive' : ''}>
                <CalendarClock className="mr-1 inline size-3" /> Due {formatDateTime(assignment.due_at)}
              </span>
            ) : (
              <span>No deadline</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{assignment.instructions}</div>
          {assignment.grading_criteria ? (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Grading criteria</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{assignment.grading_criteria}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {submission?.status === 'graded' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-4 text-amber-500" /> Your grade
            </CardTitle>
            <CardDescription>
              {Number(submission.grade ?? 0)} / {assignment.max_points} points
              {submission.graded_at ? ` · graded ${formatDateTime(submission.graded_at)}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.feedback ? (
              <div className="rounded-lg border bg-emerald-50/50 p-3 text-sm dark:bg-emerald-500/5">{submission.feedback}</div>
            ) : (
              <p className="text-sm text-muted-foreground">No written feedback was provided.</p>
            )}
            {submission.content_text ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your submission</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{submission.content_text}</p>
              </div>
            ) : null}
            {submission.file_name ? (
              <Button asChild variant="outline" size="sm">
                <a href={`/api/submissions/${submission.id}`} target="_blank" rel="noreferrer">
                  <Download /> {submission.file_name}
                </a>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{submission ? 'Update your submission' : 'Submit your work'}</CardTitle>
            <CardDescription>
              Add a written response, attach a file, or both. You can update your work until it is graded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4" noValidate>
              <input type="hidden" name="assignmentId" value={assignment.id} />
              {state.message ? (
                <Alert variant={state.status === 'success' ? 'success' : 'destructive'}>
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              ) : null}
              {submission ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    Submitted {formatDateTime(submission.submitted_at)}
                  </span>
                  {submission.file_name ? (
                    <a href={`/api/submissions/${submission.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Download className="size-3" /> {submission.file_name}
                    </a>
                  ) : null}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="contentText">Written response</Label>
                <Textarea
                  id="contentText"
                  name="contentText"
                  rows={7}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write your response here…"
                  maxLength={50000}
                />
                {state.fieldErrors?.contentText ? <p className="text-xs text-destructive">{state.fieldErrors.contentText[0]}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="submission-file">Attachment (optional, max 25 MB)</Label>
                <Input id="submission-file" name="file" type="file" />
                <p className="text-xs text-muted-foreground">
                  {submission?.file_name ? 'Uploading a new file replaces the previous attachment.' : 'PDF, document, image or archive.'}
                </p>
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Send />}
                {pending ? 'Submitting…' : submission ? 'Update submission' : 'Submit assignment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
