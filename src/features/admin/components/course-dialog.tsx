'use client';

import { useState } from 'react';
import { BookOpen, Loader2, Pencil, Plus } from 'lucide-react';
import { saveCourseAction } from '@/features/admin/actions';
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

export type CourseDialogRecord = {
  id: string;
  org_id: string;
  instructor_id: string;
  category_id: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  difficulty: string;
  duration_minutes: number;
  requires_approval: boolean;
  is_featured: boolean;
  learning_objectives: string[];
  requirements: string[];
  thumbnail_url: string | null;
};

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25';

export function CourseDialog({
  orgs,
  instructors,
  categories,
  course,
  defaultOrgId,
  defaultOpen = false,
}: {
  orgs: { id: string; name: string }[];
  instructors: { id: string; full_name: string; email: string; default_org_id: string | null }[];
  categories: { id: string; name: string; org_id: string }[];
  course?: CourseDialogRecord;
  defaultOrgId?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const editing = Boolean(course);
  const [state, action, pending] = useDialogFormAction(saveCourseAction, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${course?.title}`}>
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> New course
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit course' : 'Create a course'}</DialogTitle>
          <DialogDescription>
            Course metadata and ownership. The assigned instructor builds sections, lessons, quizzes and assignments.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4" noValidate>
          {editing ? <input type="hidden" name="courseId" value={course!.id} /> : null}
          {state.status === 'error' && state.message ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`course-org-${course?.id ?? 'new'}`}>Organization</Label>
              <select
                id={`course-org-${course?.id ?? 'new'}`}
                name="orgId"
                defaultValue={course?.org_id ?? defaultOrgId ?? orgs[0]?.id ?? ''}
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
              <Label htmlFor={`course-instructor-${course?.id ?? 'new'}`}>Instructor</Label>
              <select
                id={`course-instructor-${course?.id ?? 'new'}`}
                name="instructorId"
                defaultValue={course?.instructor_id ?? ''}
                className={selectClass}
                required
              >
                <option value="">Select an instructor</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.full_name} · {instructor.email}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.instructorId ? (
                <p className="text-xs text-destructive">{state.fieldErrors.instructorId[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`course-title-${course?.id ?? 'new'}`}>Title</Label>
              <Input
                id={`course-title-${course?.id ?? 'new'}`}
                name="title"
                defaultValue={course?.title ?? ''}
                placeholder="Product design foundations"
                required
                maxLength={140}
              />
              {state.fieldErrors?.title ? <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`course-subtitle-${course?.id ?? 'new'}`}>Subtitle</Label>
              <Input
                id={`course-subtitle-${course?.id ?? 'new'}`}
                name="subtitle"
                defaultValue={course?.subtitle ?? ''}
                placeholder="A short promise of what learners will achieve"
                maxLength={200}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`course-desc-${course?.id ?? 'new'}`}>Description</Label>
              <Textarea
                id={`course-desc-${course?.id ?? 'new'}`}
                name="description"
                defaultValue={course?.description ?? ''}
                rows={4}
                placeholder="Describe the course, audience and outcomes…"
                required
                maxLength={20000}
              />
              {state.fieldErrors?.description ? (
                <p className="text-xs text-destructive">{state.fieldErrors.description[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`course-category-${course?.id ?? 'new'}`}>Category</Label>
              <select
                id={`course-category-${course?.id ?? 'new'}`}
                name="categoryId"
                defaultValue={course?.category_id ?? ''}
                className={selectClass}
              >
                <option value="">Uncategorised</option>
                {categories.map((category) => {
                  const org = orgs.find((item) => item.id === category.org_id);
                  return (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {org ? ` · ${org.name}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`course-difficulty-${course?.id ?? 'new'}`}>Difficulty</Label>
              <select
                id={`course-difficulty-${course?.id ?? 'new'}`}
                name="difficulty"
                defaultValue={course?.difficulty ?? 'beginner'}
                className={selectClass}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`course-duration-${course?.id ?? 'new'}`}>Duration (minutes)</Label>
              <Input
                id={`course-duration-${course?.id ?? 'new'}`}
                name="durationMinutes"
                type="number"
                min={5}
                max={20000}
                defaultValue={course?.duration_minutes ?? 120}
                required
              />
              {state.fieldErrors?.durationMinutes ? (
                <p className="text-xs text-destructive">{state.fieldErrors.durationMinutes[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`course-thumb-${course?.id ?? 'new'}`}>Thumbnail URL</Label>
              <Input
                id={`course-thumb-${course?.id ?? 'new'}`}
                name="thumbnailUrl"
                type="url"
                defaultValue={course?.thumbnail_url ?? ''}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`course-objectives-${course?.id ?? 'new'}`}>Learning objectives (one per line)</Label>
              <Textarea
                id={`course-objectives-${course?.id ?? 'new'}`}
                name="learningObjectives"
                defaultValue={course?.learning_objectives?.join('\n') ?? ''}
                rows={3}
                placeholder={'Apply the core design process\nEvaluate interaction patterns'}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`course-requirements-${course?.id ?? 'new'}`}>Requirements (one per line)</Label>
              <Textarea
                id={`course-requirements-${course?.id ?? 'new'}`}
                name="requirements"
                defaultValue={course?.requirements?.join('\n') ?? ''}
                rows={2}
                placeholder="No prior experience required"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="requiresApproval"
                defaultChecked={course?.requires_approval ?? false}
                className="size-4 rounded border-input"
              />
              Require enrollment approval
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked={course?.is_featured ?? false} className="size-4 rounded border-input" />
              Feature in catalog
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : editing ? <Pencil /> : <BookOpen />}
              {pending ? 'Saving…' : editing ? 'Save changes' : 'Create course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
