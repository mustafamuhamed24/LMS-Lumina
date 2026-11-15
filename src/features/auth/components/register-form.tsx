'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { initialFormState } from '@/lib/form-state';
import { signUpAction } from '@/features/auth/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type AccountType = 'student' | 'instructor';

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUpAction, initialFormState);
  const [accountType, setAccountType] = useState<AccountType>('student');

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.status === 'error' && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {state.status === 'success' && state.message ? (
        <Alert variant="success">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">I want to</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label
            className={cn(
              'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors',
              accountType === 'student' ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/20' : 'hover:bg-muted/40',
            )}
          >
            <input
              type="radio"
              name="accountType"
              value="student"
              checked={accountType === 'student'}
              onChange={() => setAccountType('student')}
              className="sr-only"
            />
            <GraduationCap className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-medium">Learn</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">Student account</span>
            </span>
          </label>
          <label
            className={cn(
              'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors',
              accountType === 'instructor' ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/20' : 'hover:bg-muted/40',
            )}
          >
            <input
              type="radio"
              name="accountType"
              value="instructor"
              checked={accountType === 'instructor'}
              onChange={() => setAccountType('instructor')}
              className="sr-only"
            />
            <BookOpen className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-medium">Teach</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">Instructor request</span>
            </span>
          </label>
        </div>
        {accountType === 'instructor' ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Teaching accounts are reviewed by an organization administrator before instructor tools unlock. You can start
            as a student and keep access to the catalog while your request is pending.
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" autoComplete="name" placeholder="Alex Morgan" required />
        {state.fieldErrors?.fullName ? <p className="text-xs text-destructive">{state.fieldErrors.fullName[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@organization.com" required />
        {state.fieldErrors?.email ? <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required />
        <p className="text-xs text-muted-foreground">Use at least 8 characters with a letter and a number.</p>
        {state.fieldErrors?.password ? <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p> : null}
      </div>

      {accountType === 'instructor' ? (
        <div className="space-y-2">
          <Label htmlFor="instructorNote">What would you like to teach? (optional)</Label>
          <Textarea
            id="instructorNote"
            name="instructorNote"
            rows={3}
            maxLength={500}
            placeholder="Share your subject, experience or the courses you have in mind."
          />
          {state.fieldErrors?.instructorNote ? (
            <p className="text-xs text-destructive">{state.fieldErrors.instructorNote[0]}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <Checkbox id="acceptTerms" name="acceptTerms" className="mt-0.5" />
        <Label htmlFor="acceptTerms" className="text-sm font-normal leading-snug text-muted-foreground">
          I agree to the platform terms of service and privacy policy.
        </Label>
      </div>
      {state.fieldErrors?.acceptTerms ? <p className="text-xs text-destructive">{state.fieldErrors.acceptTerms[0]}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {pending ? 'Creating account…' : accountType === 'instructor' ? 'Create account and request teaching access' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
