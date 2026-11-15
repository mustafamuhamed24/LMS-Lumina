import { ShieldCheck } from 'lucide-react';
import { requireStudent } from '@/lib/auth/session';
import { PasswordForm, ProfileForm } from '@/features/profile/components/profile-forms';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Profile' };

export default async function StudentProfilePage() {
  const user = await requireStudent();

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" description="Manage your personal details, photo and account security." />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm font-medium">{user.profile.full_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Student</Badge>
            <Badge variant={user.profile.status === 'active' ? 'success' : 'danger'}>{user.profile.status}</Badge>
            <span className="text-xs text-muted-foreground">
              {user.activeOrg?.name ?? 'No organization'} · joined {formatDate(user.profile.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-xl border bg-primary/[0.04] p-4 text-sm">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-4" />
        </span>
        <div>
          <p className="font-medium">Your account is protected</p>
          <p className="mt-0.5 text-muted-foreground">
            Role, organization and account status are controlled by your administrator. Name changes appear on future
            certificates.
          </p>
        </div>
      </div>

      <ProfileForm
        profile={{
          id: user.id,
          full_name: user.profile.full_name,
          email: user.email,
          headline: user.profile.headline,
          bio: user.profile.bio,
          avatar_url: user.profile.avatar_url,
        }}
      />
      <PasswordForm />
    </div>
  );
}
