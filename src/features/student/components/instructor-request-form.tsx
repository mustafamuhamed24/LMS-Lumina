'use client';

import { useActionState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { requestInstructorAccessAction } from '@/features/student/actions';
import { initialFormState } from '@/lib/form-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function InstructorRequestForm() {
  const [state, action, pending] = useActionState(requestInstructorAccessAction, initialFormState);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message ? (
        <Alert variant={state.status === 'success' ? 'success' : 'destructive'}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="message">What would you like to teach? (optional)</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          maxLength={500}
          placeholder="Share your subject, experience or the courses you have in mind."
        />
        {state.fieldErrors?.message ? <p className="text-xs text-destructive">{state.fieldErrors.message[0]}</p> : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Send />}
        {pending ? 'Submitting…' : 'Request instructor access'}
      </Button>
    </form>
  );
}
