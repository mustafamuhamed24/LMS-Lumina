'use client';

import { useActionState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { enrollInCourseAction } from '@/features/enrollments/actions';
import { initialFormState } from '@/lib/form-state';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function EnrollButton({ courseId, label = 'Enroll now' }: { courseId: string; label?: string }) {
  const [state, action, pending] = useActionState(enrollInCourseAction, initialFormState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="courseId" value={courseId} />
      {state.status === 'error' && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {pending ? 'Enrolling…' : label}
        {!pending ? <ArrowRight /> : null}
      </Button>
    </form>
  );
}
