'use client';

import { useState } from 'react';
import { Loader2, Pencil, Plus, UserPlus } from 'lucide-react';
import { createUserAction, updateUserAction } from '@/features/admin/actions';
import { useDialogFormAction } from '@/lib/use-dialog-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export type UserDialogRecord = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  default_org_id: string | null;
  headline: string | null;
};

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'org_admin', label: 'Organization administrator' },
  { value: 'super_admin', label: 'Platform administrator' },
];

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25';

export function UserDialog({
  orgs,
  user,
  allowSuperAdmin,
  defaultOrgId,
}: {
  orgs: { id: string; name: string }[];
  user?: UserDialogRecord;
  allowSuperAdmin: boolean;
  defaultOrgId?: string;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(user);
  const [state, action, pending] = useDialogFormAction(editing ? updateUserAction : createUserAction, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${user?.full_name}`}>
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button size="sm">
            <UserPlus /> Add person
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit account' : 'Add a person'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update profile, role, organization and account status. Role changes take effect immediately.'
              : 'Create a verified account and place the person in an organization. They can reset their password after signing in.'}
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4" noValidate>
          {editing ? <input type="hidden" name="userId" value={user!.id} /> : null}
          {state.status === 'error' && state.message ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`fullName-${user?.id ?? 'new'}`}>Full name</Label>
              <Input
                id={`fullName-${user?.id ?? 'new'}`}
                name="fullName"
                defaultValue={user?.full_name ?? ''}
                placeholder="Alex Morgan"
                required
              />
              {state.fieldErrors?.fullName ? <p className="text-xs text-destructive">{state.fieldErrors.fullName[0]}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`email-${user?.id ?? 'new'}`}>Email address</Label>
              <Input
                id={`email-${user?.id ?? 'new'}`}
                name="email"
                type="email"
                defaultValue={user?.email ?? ''}
                placeholder="alex@organization.com"
                required
              />
              {state.fieldErrors?.email ? <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p> : null}
            </div>
            {!editing ? (
              <div className="space-y-2">
                <Label htmlFor="password">Temporary password</Label>
                <Input id="password" name="password" type="password" minLength={8} placeholder="At least 8 characters" required />
                {state.fieldErrors?.password ? <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p> : null}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor={`role-${user?.id ?? 'new'}`}>Role</Label>
              <select id={`role-${user?.id ?? 'new'}`} name="role" defaultValue={user?.role ?? 'student'} className={selectClass}>
                {ROLES.filter((role) => allowSuperAdmin || role.value !== 'super_admin').map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`orgId-${user?.id ?? 'new'}`}>Organization</Label>
              <select
                id={`orgId-${user?.id ?? 'new'}`}
                name="orgId"
                defaultValue={user?.default_org_id ?? defaultOrgId ?? orgs[0]?.id ?? ''}
                className={selectClass}
                required
              >
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.orgId ? <p className="text-xs text-destructive">{state.fieldErrors.orgId[0]}</p> : null}
            </div>
            {editing ? (
              <div className="space-y-2">
                <Label htmlFor={`status-${user?.id}`}>Account status</Label>
                <select id={`status-${user?.id}`} name="status" defaultValue={user?.status ?? 'active'} className={selectClass}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            ) : null}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`headline-${user?.id ?? 'new'}`}>Headline (optional)</Label>
              <Input
                id={`headline-${user?.id ?? 'new'}`}
                name="headline"
                defaultValue={user?.headline ?? ''}
                placeholder="Learning experience designer"
                maxLength={160}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : editing ? <Pencil /> : <Plus />}
              {pending ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
