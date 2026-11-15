'use client';

import { useState } from 'react';
import { Building2, Loader2, Pencil, Plus } from 'lucide-react';
import { createOrganizationAction, updateOrganizationAction } from '@/features/admin/actions';
import { useDialogFormAction } from '@/lib/use-dialog-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export type OrganizationDialogRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  primary_color: string;
  is_active: boolean;
};

export function OrganizationDialog({ organization }: { organization?: OrganizationDialogRecord }) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(organization);
  const [state, action, pending] = useDialogFormAction(
    editing ? updateOrganizationAction : createOrganizationAction,
    setOpen,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${organization?.name}`}>
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> New organization
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit organization' : 'Create an organization'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update branding and availability. Organization details appear across the catalog and certificates.'
              : 'Organizations are the tenant boundary for users, courses and reporting.'}
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4" noValidate>
          {editing ? <input type="hidden" name="orgId" value={organization!.id} /> : null}
          {state.status === 'error' && state.message ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`org-name-${organization?.id ?? 'new'}`}>Name</Label>
              <Input
                id={`org-name-${organization?.id ?? 'new'}`}
                name="name"
                defaultValue={organization?.name ?? ''}
                placeholder="Lumina Academy"
                required
              />
              {state.fieldErrors?.name ? <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`org-slug-${organization?.id ?? 'new'}`}>Slug</Label>
              <Input
                id={`org-slug-${organization?.id ?? 'new'}`}
                name="slug"
                defaultValue={organization?.slug ?? ''}
                placeholder="lumina-academy"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
                disabled={editing}
              />
              {state.fieldErrors?.slug ? <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`org-desc-${organization?.id ?? 'new'}`}>Description</Label>
              <Textarea
                id={`org-desc-${organization?.id ?? 'new'}`}
                name="description"
                defaultValue={organization?.description ?? ''}
                placeholder="What does this learning organization do?"
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`org-logo-${organization?.id ?? 'new'}`}>Logo URL</Label>
              <Input
                id={`org-logo-${organization?.id ?? 'new'}`}
                name="logoUrl"
                type="url"
                defaultValue={organization?.logo_url ?? ''}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`org-site-${organization?.id ?? 'new'}`}>Website</Label>
              <Input
                id={`org-site-${organization?.id ?? 'new'}`}
                name="websiteUrl"
                type="url"
                defaultValue={organization?.website_url ?? ''}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`org-color-${organization?.id ?? 'new'}`}>Brand colour</Label>
              <Input
                id={`org-color-${organization?.id ?? 'new'}`}
                name="primaryColor"
                type="color"
                defaultValue={organization?.primary_color ?? '#4f46e5'}
                className="h-9 px-1.5"
              />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={organization?.is_active ?? true} className="size-4 rounded border-input" />
              Organization is active
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : editing ? <Pencil /> : <Building2 />}
              {pending ? 'Saving…' : editing ? 'Save changes' : 'Create organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
