'use client';

import { useActionState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import { initialFormState } from '@/lib/form-state';
import { resendVerificationAction } from '@/features/auth/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ResendVerificationForm() {
  const [state, action, pending] = useActionState(resendVerificationAction, initialFormState);

  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <Alert variant={state.status === 'error' ? 'destructive' : 'success'}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" placeholder="you@organization.com" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <MailCheck />}
        {pending ? 'Sending…' : 'Resend verification email'}
      </Button>
    </form>
  );
}
