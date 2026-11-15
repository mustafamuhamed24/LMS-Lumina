import { AuthShell } from '@/components/layouts/auth-shell';
import { ForgotPasswordForm } from '@/features/auth/components/password-forms';

export const metadata = { title: 'Reset password' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email address associated with your account and we'll send a secure reset link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
