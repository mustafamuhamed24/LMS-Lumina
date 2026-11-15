import { ShieldCheck } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminScope } from '@/lib/data/scope';
import { getPlatformSettings } from '@/lib/data/settings';
import { OrganizationSettingsForm, PlatformSettingsForm } from '@/features/admin/components/settings-forms';
import { PasswordForm, ProfileForm } from '@/features/profile/components/profile-forms';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'Settings' };

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const [scope, settings] = await Promise.all([getAdminScope(user), getPlatformSettings()]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Manage platform defaults, organization branding and your own account."
      />

      <div className="rounded-xl border bg-primary/[0.04] p-4 text-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <p className="font-medium">Security and tenancy</p>
            <p className="mt-0.5 text-muted-foreground">
              Role changes, account status and organization boundaries are enforced by database policies and audit logging.
              Platform-level settings are restricted to platform administrators.
            </p>
          </div>
        </div>
      </div>

      {scope.isSuperAdmin ? <PlatformSettingsForm settings={settings} /> : null}

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Organizations</h2>
          <p className="text-xs text-muted-foreground">Branding shown across the catalog, dashboards and certificates.</p>
        </div>
        {scope.organizations.map((organization) => (
          <OrganizationSettingsForm
            key={organization.id}
            organization={{
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              description: organization.description,
              logo_url: organization.logo_url,
              website_url: organization.website_url,
              primary_color: organization.primary_color,
              is_active: organization.is_active,
            }}
          />
        ))}
        {!scope.organizations.length ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">No organizations are available for your account.</CardContent>
          </Card>
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Your account</h2>
          <p className="text-xs text-muted-foreground">Personal details and sign-in security.</p>
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
    </div>
  );
}
