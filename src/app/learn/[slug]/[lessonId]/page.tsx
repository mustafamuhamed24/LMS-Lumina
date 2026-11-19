import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Link2,
  Lock,
  PlayCircle,
  Video,
} from 'lucide-react';
import { requireStudent } from '@/lib/auth/session';
import { getLearnData } from '@/features/student/queries';
import { markLessonCompleteAction, startQuizAttemptAction } from '@/features/student/actions';
import { QuizRunner } from '@/features/student/components/quiz-runner';
import { AssignmentSubmission } from '@/features/student/components/assignment-submission';
import { RichTextContent } from '@/components/shared/rich-text-content';
import { ProtectedEmbed, ProtectedVideo } from '@/components/shared/protected-video';
import { Brand } from '@/components/brand/learnova-logo';
import { SubmitButton } from '@/components/forms/submit-button';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn, formatDate, formatDuration, percent } from '@/lib/utils';

export const metadata = { title: 'Lesson' };

const typeIcons = {
  text: FileText,
  video: Video,
  pdf: BookOpen,
  resource: Link2,
  quiz: HelpCircle,
  assignment: ClipboardCheck,
} as const;

function videoEmbed(url: string) {
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/i);
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export default async function LearnLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug, lessonId }, query] = await Promise.all([params, searchParams]);
  const attemptParam = typeof query.attempt === 'string' ? query.attempt : undefined;
  const user = await requireStudent();
  const data = await getLearnData(user, slug, lessonId, attemptParam);
  if (!data) notFound();

  if (data.locked) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="border-b">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <Brand />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted">
            <Lock className="size-6 text-muted-foreground" />
          </span>
          <h1 className="mt-4 text-xl font-semibold">{data.course.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.enrollment?.status === 'pending'
              ? 'Your enrollment request is awaiting approval. You will get access as soon as an administrator or instructor approves it.'
              : data.enrollment?.status === 'rejected' || data.enrollment?.status === 'cancelled'
                ? 'Your enrollment for this course is not active. Contact your organization if you think this is a mistake.'
                : 'You need to be enrolled in this course to access the lessons.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/student/my-courses">
                <ArrowLeft /> My courses
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/courses/${slug}`}>View course details</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const {
    course,
    enrollment,
    sections,
    lessons,
    currentLesson,
    completedLessonIds,
    resources,
    quiz,
    quizAttempts,
    quizAttempt,
    assignment,
    submission,
    previousLesson,
    nextLesson,
    position,
  } = data;
  const completedSet = new Set(completedLessonIds);
  const isComplete = completedSet.has(currentLesson.id);
  const CurrentTypeIcon = typeIcons[currentLesson.type] ?? FileText;
  const embedUrl = currentLesson.video_url ? videoEmbed(currentLesson.video_url) : null;
  const directVideo = currentLesson.video_url && !embedUrl ? currentLesson.video_url : null;
  const watermark = user.profile.email;
  const attemptsUsed = quizAttempts.length;
  const passingAttempt = quizAttempts.find((attempt) => attempt.passed);

  const curriculum = (
    <div className="space-y-4">
      {sections.map((section) => {
        const sectionLessons = lessons.filter((lesson) => lesson.section_id === section.id);
        if (!sectionLessons.length) return null;
        return (
          <div key={section.id}>
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{section.title}</p>
            <ul className="space-y-0.5">
              {sectionLessons.map((lesson) => {
                const Icon = typeIcons[lesson.type] ?? FileText;
                const active = lesson.id === currentLesson.id;
                const done = completedSet.has(lesson.id);
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/learn/${course.slug}/${lesson.id}`}
                      className={cn(
                        'flex items-start gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                        active ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="mt-0.5 size-3.5 shrink-0 opacity-50" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2">{lesson.title}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] opacity-70">
                          <Icon className="size-2.5" /> {lesson.type} · {lesson.estimated_minutes} min
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-dvh bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Brand compact />
            <Separator orientation="vertical" className="h-5" />
            <Link href="/student/my-courses" className="hidden truncate text-xs text-muted-foreground hover:text-foreground sm:block">
              <ArrowLeft className="mr-1 inline size-3" /> My courses
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{course.title}</p>
              <p className="text-[10px] text-muted-foreground">
                Lesson {position.index} of {position.total} · {percent(enrollment.progress_percent)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href={`/courses/${course.slug}`}>Course page</Link>
            </Button>
          </div>
        </div>
        <Progress value={Number(enrollment.progress_percent)} className="h-0.5 rounded-none" />
      </header>

      <div className="mx-auto flex max-w-7xl items-start gap-0 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="sticky top-[57px] hidden max-h-[calc(100dvh-73px)] w-72 shrink-0 overflow-y-auto rounded-xl border bg-card p-3 lg:block">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-xs font-semibold">Course contents</p>
            <Badge variant="secondary">{completedLessonIds.length}/{lessons.length}</Badge>
          </div>
          {curriculum}
        </aside>

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:px-0 lg:py-0">
          <details className="mb-4 rounded-xl border bg-card p-3 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium">Course contents</summary>
            <div className="mt-3 max-h-80 overflow-y-auto">{curriculum}</div>
          </details>

          <article className="overflow-hidden rounded-xl border bg-card">
            <header className="border-b px-4 py-5 sm:px-6">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CurrentTypeIcon className="size-3" /> {currentLesson.type}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" /> {currentLesson.estimated_minutes} min
                </span>
                {currentLesson.is_preview ? <Badge variant="secondary">Preview</Badge> : null}
                {isComplete ? (
                  <Badge variant="success" className="ml-auto">
                    Completed
                  </Badge>
                ) : null}
              </div>
              <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{currentLesson.title}</h1>
            </header>

            <div className="space-y-5 px-4 py-5 sm:px-6">
              {currentLesson.type === 'video' && currentLesson.video_url ? (
                embedUrl ? (
                  <ProtectedEmbed src={embedUrl} title={currentLesson.title} watermark={watermark} />
                ) : directVideo ? (
                  <ProtectedVideo src={directVideo} title={currentLesson.title} watermark={watermark} />
                ) : null
              ) : null}

              {currentLesson.content ? (
                <RichTextContent value={currentLesson.content} />
              ) : currentLesson.type === 'text' ? (
                <p className="text-sm text-muted-foreground">This lesson does not have any content yet.</p>
              ) : null}

              {resources.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lesson resources</p>
                  <ul className="divide-y rounded-lg border">
                    {resources.map((resource) => (
                      <li key={resource.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded bg-muted text-muted-foreground">
                            <Download className="size-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{resource.title}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {resource.file_name ?? (resource.external_url ? new URL(resource.external_url).hostname : 'Resource')}
                            </p>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline" className="shrink-0">
                          <a
                            href={resource.storage_path ? `/api/resources/${resource.id}` : (resource.external_url ?? '#')}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {resource.storage_path ? <Download /> : <ExternalLink />} Open
                          </a>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {currentLesson.type === 'quiz' ? (
                <div className="space-y-4 border-t pt-5">
                  {!quiz ? (
                    <Alert>
                      <HelpCircle />
                      <AlertTitle>Quiz not configured</AlertTitle>
                      <AlertDescription>Your instructor has not added questions to this quiz yet.</AlertDescription>
                    </Alert>
                  ) : quizAttempt ? (
                    <QuizRunner attempt={quizAttempt} />
                  ) : (
                    <div className="rounded-xl border p-5">
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <HelpCircle className="size-5" />
                        </span>
                        <div>
                          <p className="font-semibold">{quiz.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {quiz.instructions ?? 'Answer every question and submit when you are ready.'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="rounded-full border px-2 py-0.5">Passing score {quiz.passing_score}%</span>
                            <span className="rounded-full border px-2 py-0.5">Attempts {attemptsUsed}/{quiz.max_attempts}</span>
                            {quiz.time_limit_minutes ? (
                              <span className="rounded-full border px-2 py-0.5">{quiz.time_limit_minutes} min limit</span>
                            ) : null}
                          </div>
                          {attemptsUsed < quiz.max_attempts ? (
                            <form action={startQuizAttemptAction} className="mt-4">
                              <input type="hidden" name="quizId" value={quiz.id} />
                              <SubmitButton pendingLabel="Starting…">
                                <PlayCircle /> {attemptsUsed ? 'Start another attempt' : 'Start quiz'}
                              </SubmitButton>
                            </form>
                          ) : (
                            <p className="mt-3 text-xs text-destructive">You have used all available attempts.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {quizAttempts.length ? (
                    <div className="rounded-lg border">
                      <div className="border-b px-3 py-2 text-xs font-semibold">Your attempts</div>
                      <ul className="divide-y">
                        {quizAttempts.map((attempt) => (
                          <li key={attempt.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                            <span>Attempt {attempt.attempt_number}</span>
                            <span className="text-muted-foreground">
                              {attempt.status === 'submitted'
                                ? `${Number(attempt.score ?? 0)}% · ${attempt.passed ? 'Passed' : 'Not passed'} · ${formatDate(attempt.submitted_at, 'd MMM yyyy, HH:mm')}`
                                : 'In progress'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {passingAttempt ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <Award className="size-4" /> Quiz requirement satisfied.
                    </div>
                  ) : null}
                </div>
              ) : null}

              {currentLesson.type === 'assignment' ? (
                <div className="border-t pt-5">
                  {assignment ? (
                    <AssignmentSubmission assignment={assignment} submission={submission} />
                  ) : (
                    <Alert>
                      <ClipboardCheck />
                      <AlertTitle>Assignment not configured</AlertTitle>
                      <AlertDescription>Your instructor has not published the assignment details yet.</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : null}

              {currentLesson.type === 'resource' && !resources.length ? (
                <Alert>
                  <Link2 />
                  <AlertTitle>No resources yet</AlertTitle>
                  <AlertDescription>Your instructor has not attached any resources to this lesson.</AlertDescription>
                </Alert>
              ) : null}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                {previousLesson ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/learn/${course.slug}/${previousLesson.id}`}>
                      <ChevronLeft /> Previous
                    </Link>
                  </Button>
                ) : null}
                {!isComplete && currentLesson.type !== 'quiz' && currentLesson.type !== 'assignment' ? (
                  <form action={markLessonCompleteAction}>
                    <input type="hidden" name="lessonId" value={currentLesson.id} />
                    <SubmitButton variant="success" size="sm" pendingLabel="Saving…">
                      <CheckCircle2 /> Mark complete
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
              {nextLesson ? (
                <Button asChild size="sm">
                  <Link href={`/learn/${course.slug}/${nextLesson.id}`}>
                    Next lesson <ChevronRight />
                  </Link>
                </Button>
              ) : isComplete ? (
                <Button asChild size="sm">
                  <Link href="/student/certificates">
                    <Award /> View certificate
                  </Link>
                </Button>
              ) : null}
            </footer>
          </article>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
            <span>
              {course.instructor?.full_name ? `Instructor: ${course.instructor.full_name}` : 'Learnova LMS'}
            </span>
            <span>{formatDuration(course.duration_minutes)} · {course.difficulty}</span>
          </div>
        </main>
      </div>
    </div>
  );
}
