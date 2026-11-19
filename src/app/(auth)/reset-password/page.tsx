import { AuthShell } from '@/components/layouts/auth-shell';
import { ResetPasswordForm } from '@/features/auth/components/password-forms';

export const metadata = { title: 'Choose a new password' };

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" description="Set a strong password for your Learnova account.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
