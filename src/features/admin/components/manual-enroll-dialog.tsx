'use client';

import { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { manualEnrollAction } from '@/features/enrollments/actions';
import { useDialogFormAction } from '@/lib/use-dialog-form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25';

export function ManualEnrollDialog({
  courses,
  students,
}: {
  courses: { id: string; title: string }[];
  students: { id: string; full_name: string; email: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useDialogFormAction(manualEnrollAction, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus /> Enroll student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll a student</DialogTitle>
          <DialogDescription>Manually place a learner in a course. They are enrolled as active immediately.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {state.status === 'error' && state.message ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="manual-course">Course</Label>
            <select id="manual-course" name="courseId" className={selectClass} required defaultValue="">
              <option value="" disabled>
                Select a course
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-student">Student</Label>
            <select id="manual-student" name="studentId" className={selectClass} required defaultValue="">
              <option value="" disabled>
                Select a student
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} · {student.email}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !courses.length || !students.length}>
              {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
              {pending ? 'Enrolling…' : 'Enroll student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
