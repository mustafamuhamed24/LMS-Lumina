import { AuthShell } from '@/components/layouts/auth-shell';
import { ResendVerificationForm } from '@/features/auth/components/resend-verification-form';

export const metadata = { title: 'Verify your email' };

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify your email"
      description="Didn't receive the verification email? Enter your address and we'll send another one."
    >
      <ResendVerificationForm />
    </AuthShell>
  );
}
