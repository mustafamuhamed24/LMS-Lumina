'use client';

import { useState } from 'react';
import { FolderTree, Loader2, Pencil, Plus } from 'lucide-react';
import { saveCategoryAction } from '@/features/admin/actions';
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

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25';

export type CategoryDialogRecord = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  color: string;
};

export function CategoryDialog({
  orgs,
  category,
  defaultOrgId,
}: {
  orgs: { id: string; name: string }[];
  category?: CategoryDialogRecord;
  defaultOrgId?: string;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(category);
  const [state, action, pending] = useDialogFormAction(saveCategoryAction, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${category?.name}`}>
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> New category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit category' : 'Create a category'}</DialogTitle>
          <DialogDescription>Categories organise the catalog and power course distribution reporting.</DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4" noValidate>
          {editing ? <input type="hidden" name="categoryId" value={category!.id} /> : null}
          {state.status === 'error' && state.message ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`cat-org-${category?.id ?? 'new'}`}>Organization</Label>
              <select
                id={`cat-org-${category?.id ?? 'new'}`}
                name="orgId"
                defaultValue={category?.org_id ?? defaultOrgId ?? orgs[0]?.id ?? ''}
                className={selectClass}
                required
              >
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cat-name-${category?.id ?? 'new'}`}>Name</Label>
              <Input
                id={`cat-name-${category?.id ?? 'new'}`}
                name="name"
                defaultValue={category?.name ?? ''}
                placeholder="Product design"
                required
              />
              {state.fieldErrors?.name ? <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cat-color-${category?.id ?? 'new'}`}>Colour</Label>
              <Input
                id={`cat-color-${category?.id ?? 'new'}`}
                name="color"
                type="color"
                defaultValue={category?.color ?? '#6366f1'}
                className="h-9 px-1.5"
              />
              {state.fieldErrors?.color ? <p className="text-xs text-destructive">{state.fieldErrors.color[0]}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`cat-desc-${category?.id ?? 'new'}`}>Description</Label>
              <Textarea
                id={`cat-desc-${category?.id ?? 'new'}`}
                name="description"
                defaultValue={category?.description ?? ''}
                rows={3}
                maxLength={300}
                placeholder="What belongs in this category?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : editing ? <Pencil /> : <FolderTree />}
              {pending ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
