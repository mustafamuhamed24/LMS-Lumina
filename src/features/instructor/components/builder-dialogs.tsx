'use client';

import { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ClipboardCheck,
  FileText,
  HelpCircle,
  Layers,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Video,
} from 'lucide-react';
import {
  deleteQuestionAction,
  saveAssignmentAction,
  saveLessonAction,
  saveQuestionAction,
  saveQuizAction,
  saveResourceAction,
  saveSectionAction,
  updateInstructorCourseAction,
} from '@/features/instructor/actions';
import { useDialogFormAction } from '@/lib/use-dialog-form';
import type { FormState } from '@/lib/form-state';
import { ConfirmButton } from '@/components/forms/confirm-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
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

const LESSON_TYPES = [
  { value: 'text', label: 'Reading', icon: FileText },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'pdf', label: 'PDF / document', icon: BookOpen },
  { value: 'resource', label: 'Resource collection', icon: Link2 },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle },
  { value: 'assignment', label: 'Assignment', icon: ClipboardCheck },
];

function Feedback({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <Alert variant={state.status === 'success' ? 'success' : 'destructive'}>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}

export type BuilderCourse = {
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
  status: string;
  lesson_count: number;
};

export function CourseSettingsDialog({
  course,
  categories,
}: {
  course: BuilderCourse;
  categories: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useDialogFormAction(updateInstructorCourseAction, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil /> Course settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Course settings</DialogTitle>
          <DialogDescription>Update the catalog listing and course expectations.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="courseId" value={course.id} />
          <input type="hidden" name="instructorId" value={course.instructor_id} />
          <Feedback state={state} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="settings-title">Title</Label>
              <Input id="settings-title" name="title" defaultValue={course.title} required maxLength={140} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="settings-subtitle">Subtitle</Label>
              <Input id="settings-subtitle" name="subtitle" defaultValue={course.subtitle ?? ''} maxLength={200} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="settings-description">Description</Label>
              <Textarea id="settings-description" name="description" defaultValue={course.description} rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-category">Category</Label>
              <select id="settings-category" name="categoryId" defaultValue={course.category_id ?? ''} className={selectClass}>
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-difficulty">Difficulty</Label>
              <select id="settings-difficulty" name="difficulty" defaultValue={course.difficulty} className={selectClass}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-duration">Duration (minutes)</Label>
              <Input id="settings-duration" name="durationMinutes" type="number" min={5} max={20000} defaultValue={course.duration_minutes} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-thumbnail">Thumbnail URL</Label>
              <Input id="settings-thumbnail" name="thumbnailUrl" type="url" defaultValue={course.thumbnail_url ?? ''} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="settings-objectives">Learning objectives (one per line)</Label>
              <Textarea id="settings-objectives" name="learningObjectives" defaultValue={course.learning_objectives.join('\n')} rows={3} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="settings-requirements">Requirements (one per line)</Label>
              <Textarea id="settings-requirements" name="requirements" defaultValue={course.requirements.join('\n')} rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requiresApproval" defaultChecked={course.requires_approval} className="size-4 rounded border-input" />
              Require enrollment approval
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked={course.is_featured} className="size-4 rounded border-input" />
              Featured course
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              {pending ? 'Saving…' : 'Save settings'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type BuilderSection = { id: string; course_id: string; title: string; position: number };
export type BuilderLesson = {
  id: string;
  course_id: string;
  section_id: string;
  title: string;
  type: string;
  content: string | null;
  video_url: string | null;
  estimated_minutes: number;
  position: number;
  is_preview: boolean;
  is_published: boolean;
};

export function SectionDialog({
  courseId,
  section,
  trigger,
}: {
  courseId: string;
  section?: BuilderSection;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useDialogFormAction(saveSectionAction, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant={section ? 'ghost' : 'outline'}>
            {section ? <Pencil className="size-3.5" /> : <Plus />}
            {section ? null : 'Add section'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{section ? 'Edit section' : 'Add a section'}</DialogTitle>
          <DialogDescription>Sections group lessons into a clear learning sequence.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
          {section ? <input type="hidden" name="sectionId" value={section.id} /> : null}
          <Feedback state={state} />
          <div className="space-y-2">
            <Label htmlFor={`section-title-${section?.id ?? 'new'}`}>Section title</Label>
            <Input
              id={`section-title-${section?.id ?? 'new'}`}
              name="title"
              defaultValue={section?.title ?? ''}
              placeholder="Getting started"
              required
              maxLength={160}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Layers />}
              {pending ? 'Saving…' : section ? 'Save section' : 'Add section'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LessonDialog({
  courseId,
  sections,
  lesson,
  defaultSectionId,
  trigger,
}: {
  courseId: string;
  sections: BuilderSection[];
  lesson?: BuilderLesson;
  defaultSectionId?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useDialogFormAction(saveLessonAction, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant={lesson ? 'ghost' : 'outline'}>
            {lesson ? <Pencil className="size-3.5" /> : <Plus />}
            {lesson ? null : 'Add lesson'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lesson ? 'Edit lesson' : 'Add a lesson'}</DialogTitle>
          <DialogDescription>Lessons carry the actual learning content or an assessment.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="courseId" value={courseId} />
          {lesson ? <input type="hidden" name="lessonId" value={lesson.id} /> : null}
          <Feedback state={state} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`lesson-title-${lesson?.id ?? 'new'}`}>Lesson title</Label>
              <Input
                id={`lesson-title-${lesson?.id ?? 'new'}`}
                name="title"
                defaultValue={lesson?.title ?? ''}
                placeholder="Welcome and course roadmap"
                required
                maxLength={180}
              />
              {state.fieldErrors?.title ? <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lesson-section-${lesson?.id ?? 'new'}`}>Section</Label>
              <select
                id={`lesson-section-${lesson?.id ?? 'new'}`}
                name="sectionId"
                defaultValue={lesson?.section_id ?? defaultSectionId ?? sections[0]?.id ?? ''}
                className={selectClass}
                required
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lesson-type-${lesson?.id ?? 'new'}`}>Type</Label>
              <select id={`lesson-type-${lesson?.id ?? 'new'}`} name="type" defaultValue={lesson?.type ?? 'text'} className={selectClass}>
                {LESSON_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`lesson-video-${lesson?.id ?? 'new'}`}>Video URL</Label>
              <Input
                id={`lesson-video-${lesson?.id ?? 'new'}`}
                name="videoUrl"
                type="url"
                defaultValue={lesson?.video_url ?? ''}
                placeholder="https://www.youtube.com/watch?v=…"
              />
              {state.fieldErrors?.videoUrl ? <p className="text-xs text-destructive">{state.fieldErrors.videoUrl[0]}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`lesson-content-${lesson?.id ?? 'new'}`}>Content</Label>
              <RichTextEditor
                id={`lesson-content-${lesson?.id ?? 'new'}`}
                name="content"
                defaultValue={lesson?.content ?? ''}
                placeholder="Lesson notes, instructions or a transcript…"
              />
              {state.fieldErrors?.content ? <p className="text-xs text-destructive">{state.fieldErrors.content[0]}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lesson-minutes-${lesson?.id ?? 'new'}`}>Estimated minutes</Label>
              <Input
                id={`lesson-minutes-${lesson?.id ?? 'new'}`}
                name="estimatedMinutes"
                type="number"
                min={1}
                max={600}
                defaultValue={lesson?.estimated_minutes ?? 10}
                required
              />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPreview" defaultChecked={lesson?.is_preview ?? false} className="size-4 rounded border-input" />
                Free preview
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublished" defaultChecked={lesson?.is_published ?? true} className="size-4 rounded border-input" />
                Published
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              {pending ? 'Saving…' : lesson ? 'Save lesson' : 'Add lesson'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type BuilderResource = {
  id: string;
  lesson_id: string;
  title: string;
  storage_path: string | null;
  external_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
};

export function ResourceDialog({
  lesson,
  resources,
}: {
  lesson: BuilderLesson;
  resources: BuilderResource[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useDialogFormAction(saveResourceAction, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Lesson resources">
          <Link2 className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resources</DialogTitle>
          <DialogDescription>Attach files or external links to “{lesson.title}”.</DialogDescription>
        </DialogHeader>
        {resources.length ? (
          <ul className="divide-y rounded-lg border">
            {resources.map((resource) => (
              <li key={resource.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{resource.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {resource.file_name ?? resource.external_url ?? 'Resource'}
                  </p>
                </div>
                <form action={`/api/resources/${resource.id}`} method="get">
                  <Button type="submit" size="sm" variant="ghost">
                    Open
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No resources yet.</p>
        )}

        <form action={action} className="space-y-3 border-t pt-4" encType="multipart/form-data">
          <input type="hidden" name="lessonId" value={lesson.id} />
          <Feedback state={state} />
          <div className="space-y-2">
            <Label htmlFor={`resource-title-${lesson.id}`}>Title</Label>
            <Input id={`resource-title-${lesson.id}`} name="title" placeholder="Worksheet or further reading" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`resource-url-${lesson.id}`}>External URL (optional)</Label>
            <Input id={`resource-url-${lesson.id}`} name="externalUrl" type="url" placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`resource-file-${lesson.id}`}>Or upload a file (max 25 MB)</Label>
            <Input id={`resource-file-${lesson.id}`} name="file" type="file" />
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Plus />}
            {pending ? 'Adding…' : 'Add resource'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type BuilderQuestion = {
  id: string;
  quiz_id: string;
  prompt: string;
  type: string;
  points: number;
  position: number;
  explanation: string | null;
  accepted_answers: string[];
  options: { id: string; question_id: string; label: string; is_correct: boolean; position: number }[];
};

export type BuilderQuiz = {
  id: string;
  lesson_id: string;
  title: string;
  instructions: string | null;
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number;
  randomize_questions: boolean;
  randomize_answers: boolean;
  show_results: boolean;
  questions: BuilderQuestion[];
};

function QuestionDialog({
  quizId,
  question,
}: {
  quizId: string;
  question?: BuilderQuestion;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useDialogFormAction(saveQuestionAction, setOpen);
  const [type, setType] = useState(question?.type ?? 'single');
  const [prompt, setPrompt] = useState(question?.prompt ?? '');
  const [points, setPoints] = useState(String(question?.points ?? 1));
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const [accepted, setAccepted] = useState((question?.accepted_answers ?? []).join('\n'));
  const [options, setOptions] = useState(
    question?.options?.map((option) => ({ label: option.label, isCorrect: option.is_correct })) ?? [
      { label: '', isCorrect: true },
      { label: '', isCorrect: false },
    ],
  );

  const payload = useMemo(
    () =>
      JSON.stringify({
        prompt,
        type,
        points: Number(points) || 1,
        explanation,
        acceptedAnswers: accepted
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        options: type === 'short_answer' ? [] : options.map((option) => ({ label: option.label, isCorrect: option.isCorrect })),
      }),
    [prompt, type, points, explanation, accepted, options],
  );

  const changeType = (next: string) => {
    setType(next);
    if (next === 'short_answer') return;
    if (next === 'true_false') {
      setOptions([
        { label: 'True', isCorrect: true },
        { label: 'False', isCorrect: false },
      ]);
      return;
    }
    if (options.length < 2) {
      setOptions([{ label: '', isCorrect: true }, { label: '', isCorrect: false }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {question ? (
          <Button variant="ghost" size="icon-sm" aria-label="Edit question">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            <Plus /> Add question
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{question ? 'Edit question' : 'Add a question'}</DialogTitle>
          <DialogDescription>Answers are graded server-side; learners never receive correct options.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="quizId" value={quizId} />
          {question ? <input type="hidden" name="questionId" value={question.id} /> : null}
          <input type="hidden" name="payload" value={payload} />
          <Feedback state={state} />
          <div className="space-y-2">
            <Label htmlFor={`question-prompt-${question?.id ?? 'new'}`}>Question</Label>
            <Textarea
              id={`question-prompt-${question?.id ?? 'new'}`}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={2}
              required
              placeholder="What does a semantic HTML element communicate?"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`question-type-${question?.id ?? 'new'}`}>Type</Label>
              <select
                id={`question-type-${question?.id ?? 'new'}`}
                value={type}
                onChange={(event) => changeType(event.target.value)}
                className={selectClass}
              >
                <option value="single">Single choice</option>
                <option value="multiple">Multiple choice</option>
                <option value="true_false">True / false</option>
                <option value="short_answer">Short answer</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`question-points-${question?.id ?? 'new'}`}>Points</Label>
              <Input
                id={`question-points-${question?.id ?? 'new'}`}
                type="number"
                min={1}
                max={100}
                value={points}
                onChange={(event) => setPoints(event.target.value)}
              />
            </div>
          </div>

          {type === 'short_answer' ? (
            <div className="space-y-2">
              <Label htmlFor={`question-accepted-${question?.id ?? 'new'}`}>Accepted answers (one per line)</Label>
              <Textarea
                id={`question-accepted-${question?.id ?? 'new'}`}
                value={accepted}
                onChange={(event) => setAccepted(event.target.value)}
                rows={3}
                placeholder={'semantic\nmeaningful'}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Answer options</Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type={type === 'multiple' ? 'checkbox' : 'radio'}
                      checked={option.isCorrect}
                      onChange={() =>
                        setOptions((current) =>
                          current.map((item, itemIndex) => ({
                            ...item,
                            isCorrect: type === 'multiple' ? (itemIndex === index ? !item.isCorrect : item.isCorrect) : itemIndex === index,
                          })),
                        )
                      }
                      aria-label={`Mark option ${index + 1} correct`}
                      className="size-4 shrink-0 rounded border-input"
                    />
                    <Input
                      value={option.label}
                      onChange={(event) =>
                        setOptions((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, label: event.target.value } : item)))
                      }
                      placeholder={`Option ${index + 1}`}
                      disabled={type === 'true_false'}
                    />
                    {type !== 'true_false' && options.length > 2 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        aria-label="Remove option"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
              {type !== 'true_false' && options.length < 8 ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setOptions((current) => [...current, { label: '', isCorrect: false }])}>
                  <Plus /> Add option
                </Button>
              ) : null}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`question-explanation-${question?.id ?? 'new'}`}>Explanation (optional)</Label>
            <Textarea
              id={`question-explanation-${question?.id ?? 'new'}`}
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              rows={2}
              placeholder="Shown after submission when results are enabled."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Check />}
              {pending ? 'Saving…' : 'Save question'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function QuizDialog({
  lesson,
  quiz,
}: {
  lesson: BuilderLesson;
  quiz?: BuilderQuiz;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useDialogFormAction(saveQuizAction, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Quiz settings">
          <HelpCircle className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quiz builder</DialogTitle>
          <DialogDescription>Configure grading rules and author the question bank.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="lessonId" value={lesson.id} />
          {quiz ? <input type="hidden" name="quizId" value={quiz.id} /> : null}
          <Feedback state={state} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`quiz-title-${lesson.id}`}>Quiz title</Label>
              <Input id={`quiz-title-${lesson.id}`} name="title" defaultValue={quiz?.title ?? lesson.title} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`quiz-instructions-${lesson.id}`}>Instructions</Label>
              <Textarea id={`quiz-instructions-${lesson.id}`} name="instructions" defaultValue={quiz?.instructions ?? ''} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`quiz-time-${lesson.id}`}>Time limit (minutes)</Label>
              <Input id={`quiz-time-${lesson.id}`} name="timeLimitMinutes" type="number" min={1} max={480} defaultValue={quiz?.time_limit_minutes ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`quiz-passing-${lesson.id}`}>Passing score (%)</Label>
              <Input id={`quiz-passing-${lesson.id}`} name="passingScore" type="number" min={1} max={100} defaultValue={quiz?.passing_score ?? 70} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`quiz-attempts-${lesson.id}`}>Maximum attempts</Label>
              <Input id={`quiz-attempts-${lesson.id}`} name="maxAttempts" type="number" min={1} max={20} defaultValue={quiz?.max_attempts ?? 3} required />
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-1.5 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="randomizeQuestions" defaultChecked={quiz?.randomize_questions ?? false} className="size-4 rounded border-input" />
                  Randomize questions
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="randomizeAnswers" defaultChecked={quiz?.randomize_answers ?? false} className="size-4 rounded border-input" />
                  Randomize answers
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="showResults" defaultChecked={quiz?.show_results ?? true} className="size-4 rounded border-input" />
                  Show results to learners
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Close
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              {pending ? 'Saving…' : 'Save quiz settings'}
            </Button>
          </DialogFooter>
        </form>

        {quiz ? (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Questions ({quiz.questions.length})</p>
                <p className="text-xs text-muted-foreground">Add, edit or remove questions from the bank.</p>
              </div>
              <QuestionDialog quizId={quiz.id} />
            </div>
            {quiz.questions.length ? (
              <ul className="divide-y rounded-lg border">
                {quiz.questions.map((question, index) => (
                  <li key={question.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm">{question.prompt}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {question.type.replace('_', ' ')} · {question.points} pts
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <QuestionDialog quizId={quiz.id} question={question} />
                      <form action={deleteQuestionAction}>
                        <input type="hidden" name="questionId" value={question.id} />
                        <ConfirmButton
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          message={`Delete the question "${question.prompt.slice(0, 80)}"?`}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Delete question</span>
                        </ConfirmButton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No questions yet. Add at least one before learners attempt this quiz.
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Save the quiz settings first, then add questions.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type BuilderAssignment = {
  id: string;
  lesson_id: string;
  title: string;
  instructions: string;
  due_at: string | null;
  max_points: number;
  grading_criteria: string | null;
};

export function AssignmentDialog({
  lesson,
  assignment,
}: {
  lesson: BuilderLesson;
  assignment?: BuilderAssignment;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useDialogFormAction(saveAssignmentAction, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Assignment settings">
          <ClipboardCheck className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assignment builder</DialogTitle>
          <DialogDescription>Learners submit a written response; you grade it against a point scale.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="lessonId" value={lesson.id} />
          {assignment ? <input type="hidden" name="assignmentId" value={assignment.id} /> : null}
          <Feedback state={state} />
          <div className="space-y-2">
            <Label htmlFor={`assignment-title-${lesson.id}`}>Title</Label>
            <Input id={`assignment-title-${lesson.id}`} name="title" defaultValue={assignment?.title ?? lesson.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`assignment-instructions-${lesson.id}`}>Instructions</Label>
            <Textarea
              id={`assignment-instructions-${lesson.id}`}
              name="instructions"
              defaultValue={assignment?.instructions ?? ''}
              rows={5}
              required
              placeholder="Explain what to submit and how it will be assessed…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`assignment-due-${lesson.id}`}>Due date</Label>
              <Input
                id={`assignment-due-${lesson.id}`}
                name="dueAt"
                type="datetime-local"
                defaultValue={assignment?.due_at ? assignment.due_at.slice(0, 16) : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`assignment-points-${lesson.id}`}>Maximum points</Label>
              <Input
                id={`assignment-points-${lesson.id}`}
                name="maxPoints"
                type="number"
                min={1}
                max={1000}
                defaultValue={assignment?.max_points ?? 100}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`assignment-criteria-${lesson.id}`}>Grading criteria (optional)</Label>
            <Textarea
              id={`assignment-criteria-${lesson.id}`}
              name="gradingCriteria"
              defaultValue={assignment?.grading_criteria ?? ''}
              rows={3}
              placeholder="Rubric or expectations used when grading."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              {pending ? 'Saving…' : 'Save assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
