import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthShell } from '@/components/layouts/auth-shell';
import { LoginForm } from '@/features/auth/components/login-form';
import { getTranslator } from '@/lib/i18n/server';

export const metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; confirmed?: string }>;
}) {
  const [params, { t }] = await Promise.all([searchParams, getTranslator()]);

  const errorMessage =
    params.error === 'link_expired'
      ? t('login.linkExpired')
      : params.error === 'session_expired'
        ? t('login.sessionExpired')
        : undefined;
  const noticeMessage = params.confirmed ? t('login.confirmed') : undefined;

  return (
    <AuthShell title={t('login.title')} description={t('login.description')}>
      <div className="space-y-4">
        {noticeMessage ? (
          <Alert variant="success">
            <AlertDescription>{noticeMessage}</AlertDescription>
          </Alert>
        ) : null}
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        <LoginForm next={params.next} />
      </div>
    </AuthShell>
  );
}
