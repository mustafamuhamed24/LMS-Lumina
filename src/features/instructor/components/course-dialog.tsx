'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { BookOpen, Loader2, Plus } from 'lucide-react';
import { createInstructorCourseAction } from '@/features/instructor/actions';
import { initialFormState, type FormState } from '@/lib/form-state';
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

export function InstructorCourseDialog({
  orgs,
  categories,
}: {
  orgs: { id: string; name: string }[];
  categories: { id: string; name: string; color: string; org_id: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(createInstructorCourseAction, initialFormState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> New course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a course</DialogTitle>
          <DialogDescription>
            Start with the course frame. You will add sections, lessons and assessments in the builder.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4" noValidate>
          {state.status === 'error' && state.message ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-course-org">Organization</Label>
              <select id="new-course-org" name="orgId" className={selectClass} required defaultValue={orgs[0]?.id ?? ''}>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-course-category">Category</Label>
              <select id="new-course-category" name="categoryId" className={selectClass} defaultValue="">
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-course-title">Title</Label>
              <Input id="new-course-title" name="title" placeholder="Product design foundations" required maxLength={140} />
              {state.fieldErrors?.title ? <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-course-subtitle">Subtitle</Label>
              <Input id="new-course-subtitle" name="subtitle" placeholder="A short promise of what learners will achieve" maxLength={200} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-course-description">Description</Label>
              <Textarea id="new-course-description" name="description" rows={4} required maxLength={20000} placeholder="Describe the course, audience and outcomes…" />
              {state.fieldErrors?.description ? (
                <p className="text-xs text-destructive">{state.fieldErrors.description[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-course-difficulty">Difficulty</Label>
              <select id="new-course-difficulty" name="difficulty" className={selectClass} defaultValue="beginner">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-course-duration">Duration (minutes)</Label>
              <Input id="new-course-duration" name="durationMinutes" type="number" min={5} max={20000} defaultValue={120} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-course-thumbnail">Thumbnail URL</Label>
              <Input id="new-course-thumbnail" name="thumbnailUrl" type="url" placeholder="https://…" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-course-objectives">Learning objectives (one per line)</Label>
              <Textarea id="new-course-objectives" name="learningObjectives" rows={3} placeholder={'Apply the core design process\nEvaluate interaction patterns'} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-course-requirements">Requirements (one per line)</Label>
              <Textarea id="new-course-requirements" name="requirements" rows={2} placeholder="No prior experience required" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requiresApproval" className="size-4 rounded border-input" /> Require enrollment approval
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFeatured" className="size-4 rounded border-input" /> Request featured placement
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <BookOpen />}
              {pending ? 'Creating…' : 'Create and open builder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
