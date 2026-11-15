import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Layers,
  Link2,
  Pencil,
  Plus,
  Send,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { requireInstructor } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCourseBuilder } from '@/features/instructor/queries';
import {
  AssignmentDialog,
  CourseSettingsDialog,
  LessonDialog,
  QuizDialog,
  ResourceDialog,
  SectionDialog,
} from '@/features/instructor/components/builder-dialogs';
import {
  deleteLessonAction,
  deleteSectionAction,
  moveLessonAction,
  moveSectionAction,
  setInstructorCourseStatusAction,
} from '@/features/instructor/actions';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ConfirmButton } from '@/components/forms/confirm-button';
import { SubmitButton } from '@/components/forms/submit-button';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatNumber } from '@/lib/utils';

export const metadata = { title: 'Course builder' };

const lessonIcons = {
  text: FileText,
  video: Video,
  pdf: BookOpen,
  resource: Link2,
  quiz: HelpCircle,
  assignment: ClipboardCheck,
} as const;

export default async function CourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireInstructor();
  const { id } = await params;
  const data = await getCourseBuilder(user, id);
  if (!data) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('id,name')
    .eq('org_id', data.course.org_id)
    .order('name');

  const quizByLesson = new Map(data.quizzes.map((quiz) => [quiz.lesson_id, quiz]));
  const assignmentByLesson = new Map(data.assignments.map((assignment) => [assignment.lesson_id, assignment]));
  const resourcesByLesson = new Map<string, typeof data.resources>();
  for (const resource of data.resources) {
    resourcesByLesson.set(resource.lesson_id, [...(resourcesByLesson.get(resource.lesson_id) ?? []), resource]);
  }

  const isPublished = data.course.status === 'published';
  const canPublish = data.lessons.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href="/instructor/courses">
            <ArrowLeft /> All courses
          </Link>
        </Button>
        <PageHeader
          title={data.course.title}
          description={data.course.subtitle ?? 'Build the curriculum, assessments and learning resources for this course.'}
          actions={
            <>
              {isPublished ? (
                <Button asChild variant="outline">
                  <Link href={`/courses/${data.course.slug}`} target="_blank">
                    <ExternalLink /> View public page
                  </Link>
                </Button>
              ) : null}
              <CourseSettingsDialog
                course={{
                  id: data.course.id,
                  org_id: data.course.org_id,
                  instructor_id: data.course.instructor_id,
                  category_id: data.course.category_id,
                  title: data.course.title,
                  subtitle: data.course.subtitle,
                  description: data.course.description,
                  difficulty: data.course.difficulty,
                  duration_minutes: data.course.duration_minutes,
                  requires_approval: data.course.requires_approval,
                  is_featured: data.course.is_featured,
                  learning_objectives: data.course.learning_objectives,
                  requirements: data.course.requirements,
                  thumbnail_url: data.course.thumbnail_url,
                  status: data.course.status,
                  lesson_count: data.course.lesson_count,
                }}
                categories={categories ?? []}
              />
              <form action={setInstructorCourseStatusAction}>
                <input type="hidden" name="courseId" value={data.course.id} />
                <input type="hidden" name="status" value={isPublished ? 'draft' : 'published'} />
                <SubmitButton
                  variant={isPublished ? 'outline' : 'default'}
                  pendingLabel={isPublished ? 'Unpublishing…' : 'Publishing…'}
                  disabled={!canPublish && !isPublished}
                >
                  {isPublished ? <EyeOff /> : <Send />}
                  {isPublished ? 'Unpublish' : 'Publish course'}
                </SubmitButton>
              </form>
            </>
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Layers className="size-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{data.sections.length}</p>
              <p className="text-xs text-muted-foreground">Sections</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-md bg-chart-2/15 text-chart-2">
              <BookOpen className="size-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{data.lessons.length}</p>
              <p className="text-xs text-muted-foreground">Lessons</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-md bg-chart-3/15 text-chart-3">
              <Users className="size-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{formatNumber(data.course.student_count)}</p>
              <p className="text-xs text-muted-foreground">Enrolled learners</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Clock className="size-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{data.course.duration_minutes} min</p>
              <p className="text-xs text-muted-foreground">Estimated duration</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isPublished && !canPublish ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
          Add at least one lesson before publishing this course.
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              Curriculum <StatusBadge status={data.course.status} />
            </CardTitle>
            <CardDescription>
              Order sections and lessons, then attach resources, quizzes and assignments.
            </CardDescription>
          </div>
          <SectionDialog
            courseId={data.course.id}
            trigger={
              <Button size="sm">
                <Plus /> Add section
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {data.sections.length ? (
            data.sections.map((section, sectionIndex) => {
              const lessons = data.lessons.filter((lesson) => lesson.section_id === section.id);
              return (
                <div key={section.id} className="overflow-hidden rounded-lg border bg-background/60">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-background text-[10px] font-semibold shadow-xs">
                        {sectionIndex + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{section.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <form action={moveSectionAction}>
                        <input type="hidden" name="courseId" value={data.course.id} />
                        <input type="hidden" name="sectionId" value={section.id} />
                        <input type="hidden" name="direction" value="up" />
                        <Button type="submit" variant="ghost" size="icon-sm" aria-label="Move section up" disabled={sectionIndex === 0}>
                          <ArrowUp className="size-3.5" />
                        </Button>
                      </form>
                      <form action={moveSectionAction}>
                        <input type="hidden" name="courseId" value={data.course.id} />
                        <input type="hidden" name="sectionId" value={section.id} />
                        <input type="hidden" name="direction" value="down" />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Move section down"
                          disabled={sectionIndex === data.sections.length - 1}
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                      </form>
                      <SectionDialog
                        courseId={data.course.id}
                        section={section}
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label="Edit section">
                            <Pencil className="size-3.5" />
                          </Button>
                        }
                      />
                      <form action={deleteSectionAction}>
                        <input type="hidden" name="courseId" value={data.course.id} />
                        <input type="hidden" name="sectionId" value={section.id} />
                        <ConfirmButton
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          message={`Delete "${section.title}" and all of its lessons?`}
                        >
                          <Trash2 className="size-3.5" />
                        </ConfirmButton>
                      </form>
                    </div>
                  </div>

                  <div className="divide-y">
                    {lessons.length ? (
                      lessons.map((lesson, lessonIndex) => {
                        const Icon = lessonIcons[lesson.type as keyof typeof lessonIcons] ?? FileText;
                        const quiz = quizByLesson.get(lesson.id);
                        const assignment = assignmentByLesson.get(lesson.id);
                        const resources = resourcesByLesson.get(lesson.id) ?? [];
                        return (
                          <div key={lesson.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:flex-nowrap">
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                <Icon className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="truncate text-sm font-medium">{lesson.title}</p>
                                  {lesson.is_preview ? (
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                                      Preview
                                    </Badge>
                                  ) : null}
                                  {!lesson.is_published ? (
                                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                                      Draft
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                  {lesson.type.replace('_', ' ')} · {lesson.estimated_minutes} min
                                  {resources.length ? ` · ${resources.length} resources` : ''}
                                  {quiz ? ` · ${quiz.questions.length} questions` : ''}
                                  {assignment ? ` · ${assignment.max_points} pts` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="ml-auto flex shrink-0 items-center gap-0.5">
                              <LessonDialog
                                courseId={data.course.id}
                                sections={data.sections}
                                lesson={lesson}
                                trigger={
                                  <Button variant="ghost" size="icon-sm" aria-label="Edit lesson">
                                    <Pencil className="size-3.5" />
                                  </Button>
                                }
                              />
                              {lesson.type === 'quiz' ? <QuizDialog lesson={lesson} quiz={quiz} /> : null}
                              {lesson.type === 'assignment' ? <AssignmentDialog lesson={lesson} assignment={assignment} /> : null}
                              <ResourceDialog lesson={lesson} resources={resources} />
                              <form action={moveLessonAction}>
                                <input type="hidden" name="courseId" value={data.course.id} />
                                <input type="hidden" name="sectionId" value={section.id} />
                                <input type="hidden" name="lessonId" value={lesson.id} />
                                <input type="hidden" name="direction" value="up" />
                                <Button type="submit" variant="ghost" size="icon-sm" aria-label="Move lesson up" disabled={lessonIndex === 0}>
                                  <ArrowUp className="size-3.5" />
                                </Button>
                              </form>
                              <form action={moveLessonAction}>
                                <input type="hidden" name="courseId" value={data.course.id} />
                                <input type="hidden" name="sectionId" value={section.id} />
                                <input type="hidden" name="lessonId" value={lesson.id} />
                                <input type="hidden" name="direction" value="down" />
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Move lesson down"
                                  disabled={lessonIndex === lessons.length - 1}
                                >
                                  <ArrowDown className="size-3.5" />
                                </Button>
                              </form>
                              <form action={deleteLessonAction}>
                                <input type="hidden" name="courseId" value={data.course.id} />
                                <input type="hidden" name="lessonId" value={lesson.id} />
                                <ConfirmButton
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground hover:text-destructive"
                                  message={`Delete the lesson "${lesson.title}"?`}
                                >
                                  <Trash2 className="size-3.5" />
                                </ConfirmButton>
                              </form>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">No lessons in this section yet.</div>
                    )}
                  </div>
                  <div className="border-t bg-muted/20 px-3 py-2">
                    <LessonDialog
                      courseId={data.course.id}
                      sections={data.sections}
                      defaultSectionId={section.id}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Plus /> Add lesson
                        </Button>
                      }
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={Layers}
              title="Start with a section"
              description="Sections organise your curriculum into a logical sequence. Add one, then fill it with lessons."
              action={<SectionDialog courseId={data.course.id} />}
              className="border-0 bg-transparent"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="size-3.5" /> Learners see the curriculum only after the course is published.
        </span>
        <span className={cn('inline-flex items-center gap-1.5', canPublish ? 'text-emerald-600 dark:text-emerald-400' : '')}>
          <BookOpen className="size-3.5" /> {data.lessons.length} lessons ready
        </span>
      </div>
    </div>
  );
}
