'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { initialFormState } from '@/lib/form-state';
import { signInAction } from '@/features/auth/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslator } from '@/lib/i18n/client';

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, initialFormState);
  const t = useTranslator();

  return (
    <form action={action} className="space-y-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.status === 'error' && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">{t('login.email')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@organization.com"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        {state.fieldErrors?.email ? <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('login.password')}</Label>
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            {t('login.forgot')}
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        {state.fieldErrors?.password ? <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p> : null}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {pending ? t('login.pending') : t('login.submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t('login.createAccount')}
        </Link>
      </p>
    </form>
  );
}
