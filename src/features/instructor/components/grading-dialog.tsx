'use client';

import { useState } from 'react';
import { Check, ClipboardCheck, Download, Loader2 } from 'lucide-react';
import { gradeSubmissionAction } from '@/features/instructor/actions';
import { useDialogFormAction } from '@/lib/use-dialog-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/utils';

export type GradingSubmission = {
  id: string;
  status: string;
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
  content_text: string | null;
  storage_path: string | null;
  file_name: string | null;
  student: { full_name: string; email: string } | null;
  assignment: { title: string; max_points: number } | null;
};

export function GradingDialog({ submission }: { submission: GradingSubmission }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useDialogFormAction(gradeSubmissionAction, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={submission.status === 'graded' ? 'outline' : 'default'}>
          <ClipboardCheck /> {submission.status === 'graded' ? 'Review grade' : 'Grade'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Grade submission</DialogTitle>
          <DialogDescription>
            {submission.student?.full_name ?? 'Student'} · {submission.assignment?.title ?? 'Assignment'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Submitted {formatDateTime(submission.submitted_at)}</p>
            {submission.content_text ? (
              <p className="mt-2 whitespace-pre-wrap text-sm">{submission.content_text}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No written response was provided.</p>
            )}
            {submission.file_name ? (
              <Button asChild variant="outline" size="sm" className="mt-3">
                <a href={`/api/submissions/${submission.id}`} target="_blank" rel="noreferrer">
                  <Download /> {submission.file_name}
                </a>
              </Button>
            ) : null}
          </div>

          <form action={action} className="space-y-4" noValidate>
            <input type="hidden" name="submissionId" value={submission.id} />
            {state.message ? (
              <Alert variant={state.status === 'success' ? 'success' : 'destructive'}>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`grade-${submission.id}`}>Score (out of {submission.assignment?.max_points ?? 100})</Label>
                <Input
                  id={`grade-${submission.id}`}
                  name="grade"
                  type="number"
                  min={0}
                  max={submission.assignment?.max_points ?? 100}
                  step="0.5"
                  defaultValue={submission.grade ?? ''}
                  required
                />
                {state.fieldErrors?.grade ? <p className="text-xs text-destructive">{state.fieldErrors.grade[0]}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`status-${submission.id}`}>Status</Label>
                <select
                  id={`status-${submission.id}`}
                  name="status"
                  defaultValue={submission.status === 'returned' ? 'returned' : 'graded'}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
                >
                  <option value="graded">Graded</option>
                  <option value="returned">Returned for revision</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`feedback-${submission.id}`}>Feedback</Label>
              <Textarea
                id={`feedback-${submission.id}`}
                name="feedback"
                rows={4}
                defaultValue={submission.feedback ?? ''}
                placeholder="Explain the score and suggest next steps…"
              />
              {state.fieldErrors?.feedback ? <p className="text-xs text-destructive">{state.fieldErrors.feedback[0]}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Check />}
                {pending ? 'Saving…' : 'Save grade'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
