'use client';

import { useActionState } from 'react';
import { Building2, Loader2, Save, Settings2 } from 'lucide-react';
import { updateOrganizationAction, updatePlatformSettingsAction } from '@/features/admin/actions';
import { initialFormState, type FormState } from '@/lib/form-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PlatformSettingsRow } from '@/types/app';

function Feedback({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <Alert variant={state.status === 'success' ? 'success' : 'destructive'}>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}

export function PlatformSettingsForm({ settings }: { settings: PlatformSettingsRow | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePlatformSettingsAction, initialFormState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="size-4" /> Platform settings
        </CardTitle>
        <CardDescription>Applied globally to the public site, registration and enrollment defaults.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4" noValidate>
          <Feedback state={state} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform name</Label>
              <Input id="platform-name" name="platformName" defaultValue={settings?.platform_name ?? 'Learnova LMS'} required />
              {state.fieldErrors?.platformName ? (
                <p className="text-xs text-destructive">{state.fieldErrors.platformName[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-tagline">Tagline</Label>
              <Input id="platform-tagline" name="tagline" defaultValue={settings?.tagline ?? 'Knowledge, structured.'} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-email">Support email</Label>
              <Input
                id="platform-email"
                name="supportEmail"
                type="email"
                defaultValue={settings?.support_email ?? 'support@learnova.test'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-color">Brand colour</Label>
              <Input
                id="platform-color"
                name="primaryColor"
                type="color"
                defaultValue={settings?.primary_color ?? '#4f46e5'}
                className="h-9 px-1.5"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="platform-logo">Logo URL</Label>
              <Input id="platform-logo" name="logoUrl" type="url" defaultValue={settings?.logo_url ?? ''} placeholder="https://…" />
            </div>
          </div>
          <div className="space-y-3 border-t pt-4">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="allowSignups" defaultChecked={settings?.allow_signups ?? true} className="mt-0.5 size-4 rounded border-input" />
              <span>
                <span className="font-medium">Allow public signups</span>
                <span className="block text-xs text-muted-foreground">New accounts join as students in the default organization.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="requireEnrollmentApproval"
                defaultChecked={settings?.require_enrollment_approval ?? false}
                className="mt-0.5 size-4 rounded border-input"
              />
              <span>
                <span className="font-medium">Require enrollment approval by default</span>
                <span className="block text-xs text-muted-foreground">Individual courses can override this setting.</span>
              </span>
            </label>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            {pending ? 'Saving…' : 'Save platform settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function OrganizationSettingsForm({
  organization,
}: {
  organization: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    website_url: string | null;
    primary_color: string;
    is_active: boolean;
  };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateOrganizationAction, initialFormState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4" /> {organization.name}
        </CardTitle>
        <CardDescription>Branding and availability for this organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="orgId" value={organization.id} />
          <Feedback state={state} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`settings-org-name-${organization.id}`}>Name</Label>
              <Input id={`settings-org-name-${organization.id}`} name="name" defaultValue={organization.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`settings-org-slug-${organization.id}`}>Slug</Label>
              <Input id={`settings-org-slug-${organization.id}`} name="slug" defaultValue={organization.slug} disabled />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`settings-org-desc-${organization.id}`}>Description</Label>
              <Textarea
                id={`settings-org-desc-${organization.id}`}
                name="description"
                defaultValue={organization.description ?? ''}
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`settings-org-logo-${organization.id}`}>Logo URL</Label>
              <Input
                id={`settings-org-logo-${organization.id}`}
                name="logoUrl"
                type="url"
                defaultValue={organization.logo_url ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`settings-org-site-${organization.id}`}>Website</Label>
              <Input
                id={`settings-org-site-${organization.id}`}
                name="websiteUrl"
                type="url"
                defaultValue={organization.website_url ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`settings-org-color-${organization.id}`}>Brand colour</Label>
              <Input
                id={`settings-org-color-${organization.id}`}
                name="primaryColor"
                type="color"
                defaultValue={organization.primary_color}
                className="h-9 px-1.5"
              />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={organization.is_active} className="size-4 rounded border-input" />
              Organization is active
            </label>
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            {pending ? 'Saving…' : 'Save organization'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
