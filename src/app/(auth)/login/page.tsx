import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthShell } from '@/components/layouts/auth-shell';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata = { title: 'Sign in' };

const ERROR_MESSAGES: Record<string, string> = {
  link_expired: 'That link is invalid or has expired. Request a new one below.',
  session_expired: 'Your session expired. Please sign in again.',
};

const NOTICE_MESSAGES: Record<string, string> = {
  confirmed: 'Your email is confirmed. Sign in to open your Lumina workspace.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; confirmed?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : undefined;
  const noticeMessage = params.confirmed ? NOTICE_MESSAGES.confirmed : undefined;

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue your learning, teaching or administration workspace."
    >
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
