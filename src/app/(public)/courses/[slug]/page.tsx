import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  Layers,
  Lock,
  PlayCircle,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { getPublicCourseDetail, getUserEnrollmentForCourse } from '@/features/courses/queries';
import { getSessionUser } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/components/shared/user-avatar';
import { CourseCard } from '@/components/shared/course-card';
import { EnrollButton } from '@/features/enrollments/components/enroll-button';
import { formatDate, formatDuration } from '@/lib/utils';

const DIFFICULTY_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const;

const LESSON_ICON = {
  video: PlayCircle,
  text: FileText,
  pdf: FileText,
  resource: Layers,
  quiz: ClipboardCheck,
  assignment: ClipboardCheck,
} as const;

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getPublicCourseDetail(slug);
  if (!detail) notFound();

  const { course, instructor, curriculum, related } = detail;
  const user = await getSessionUser();
  const enrollment = user ? await getUserEnrollmentForCourse(course.id, user.id) : null;

  let certificate: { id: string; code: string } | null = null;
  if (enrollment) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('certificates')
      .select('id, code')
      .eq('enrollment_id', enrollment.id)
      .maybeSingle();
    certificate = data;
  }

  const sections = new Map<
    string,
    { id: string; title: string; position: number; lessons: typeof curriculum }
  >();
  for (const row of curriculum) {
    const existing = sections.get(row.section_id) ?? {
      id: row.section_id,
      title: row.section_title,
      position: row.section_position,
      lessons: [],
    };
    existing.lessons.push(row);
    sections.set(row.section_id, existing);
  }
  const groupedSections = [...sections.values()].sort((a, b) => a.position - b.position);

  const isActive = enrollment?.status === 'active';
  const isCompleted = enrollment?.status === 'completed';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/courses" className="hover:text-foreground">
          Courses
        </Link>
        <span>/</span>
        <span className="truncate text-foreground/70">{course.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {course.category ? (
              <Link href={`/courses?category=${course.category.slug}`}>
                <Badge variant="outline" className="gap-1.5">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: course.category.color }} />
                  {course.category.name}
                </Badge>
              </Link>
            ) : null}
            <Badge variant="secondary">{DIFFICULTY_LABEL[course.difficulty]}</Badge>
            {course.is_featured ? <Badge variant="info">Featured</Badge> : null}
            {course.organization ? <Badge variant="muted">{course.organization.name}</Badge> : null}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{course.title}</h1>
          {course.subtitle ? <p className="mt-3 text-base leading-relaxed text-muted-foreground">{course.subtitle}</p> : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" /> {formatDuration(course.duration_minutes)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-4" /> {course.lesson_count} lessons
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" /> {course.student_count} learners
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4" /> Certificate of completion
            </span>
          </div>

          {instructor ? (
            <div className="mt-6 flex items-center gap-3 border-y py-4">
              <UserAvatar id={instructor.id} name={instructor.full_name} avatarUrl={instructor.avatar_url} className="size-10" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{instructor.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{instructor.headline ?? 'Course instructor'}</p>
              </div>
            </div>
          ) : null}

          <section className="mt-8">
            <h2 className="text-lg font-semibold tracking-tight">About this course</h2>
            <div className="prose-lesson mt-3 max-w-none text-sm leading-relaxed text-muted-foreground">
              {course.description.split('\n').map((paragraph, index) =>
                paragraph.trim() ? <p key={index}>{paragraph}</p> : null,
              )}
            </div>
          </section>

          {course.learning_objectives.length ? (
            <section className="mt-8">
              <h2 className="text-lg font-semibold tracking-tight">What you&apos;ll learn</h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {course.learning_objectives.map((objective) => (
                  <li key={objective} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Course curriculum</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {groupedSections.length} modules · {course.lesson_count} lessons
                </p>
              </div>
              {!enrollment ? (
                <span className="text-xs text-muted-foreground">Enroll to access all lessons</span>
              ) : null}
            </div>

            {groupedSections.length ? (
              <div className="mt-4 divide-y rounded-xl border bg-card">
                {groupedSections.map((section, sectionIndex) => (
                  <details key={section.id} open={sectionIndex === 0} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold">
                          {sectionIndex + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{section.title}</p>
                          <p className="text-[11px] text-muted-foreground">{section.lessons.length} lessons</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground transition-transform group-open:rotate-90">›</span>
                    </summary>
                    <ul className="space-y-0.5 border-t px-2 py-2">
                      {section.lessons.map((lesson) => {
                        const Icon = LESSON_ICON[lesson.lesson_type] ?? FileText;
                        return (
                          <li key={lesson.lesson_id} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm">
                            <span className="flex min-w-0 items-center gap-2.5">
                              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate text-muted-foreground">{lesson.lesson_title}</span>
                              {lesson.is_preview ? <Badge variant="info">Preview</Badge> : null}
                            </span>
                            <span className="flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground">
                              {lesson.estimated_minutes} min
                              {!enrollment && !lesson.is_preview ? <Lock className="size-3" /> : null}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Curriculum is being finalized.
              </div>
            )}
          </section>

          {course.requirements.length ? (
            <section className="mt-8">
              <h2 className="text-lg font-semibold tracking-tight">Requirements</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {course.requirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {instructor?.bio ? (
            <section className="mt-8 rounded-xl border bg-muted/20 p-5">
              <div className="flex items-center gap-3">
                <UserAvatar id={instructor.id} name={instructor.full_name} avatarUrl={instructor.avatar_url} className="size-10" />
                <div>
                  <p className="text-sm font-semibold">{instructor.full_name}</p>
                  <p className="text-xs text-muted-foreground">{instructor.headline ?? 'Instructor'}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{instructor.bio}</p>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-elevated)]">
            <div className="relative aspect-[16/10] bg-muted">
              {course.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnail_url} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-chart-2/20">
                  <GraduationCap className="size-10 text-primary/50" />
                </div>
              )}
            </div>
            <div className="space-y-4 p-5">
              {isActive || isCompleted ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{isCompleted ? 'Course completed' : 'Your progress'}</span>
                    <span className="text-muted-foreground">{Math.round(Number(enrollment?.progress_percent ?? 0))}%</span>
                  </div>
                  <Progress value={Number(enrollment?.progress_percent ?? 0)} />
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/learn/${course.slug}`}>
                      {isCompleted ? 'Review course' : 'Continue learning'} <ArrowRight />
                    </Link>
                  </Button>
                  {isCompleted && certificate ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/verify/${certificate.code}`}>
                        <Award /> View certificate
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ) : enrollment?.status === 'pending' ? (
                <div className="space-y-3">
                  <Badge variant="warning">Awaiting approval</Badge>
                  <p className="text-sm text-muted-foreground">
                    Your enrollment request has been submitted. You&apos;ll get access once the instructor approves it.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/student/my-courses">View my courses</Link>
                  </Button>
                </div>
              ) : user ? (
                <EnrollButton courseId={course.id} label={course.requires_approval ? 'Request enrollment' : 'Enroll for free'} />
              ) : (
                <Button asChild className="w-full" size="lg">
                  <Link href={`/login?next=/courses/${course.slug}`}>
                    Sign in to enroll <ArrowRight />
                  </Link>
                </Button>
              )}

              <ul className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <BookOpen className="size-3.5" /> {course.lesson_count} lessons
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="size-3.5" /> {formatDuration(course.duration_minutes)} of content
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5" /> {course.requires_approval ? 'Instructor approval required' : 'Instant access'}
                </li>
                <li className="flex items-center gap-2">
                  <Award className="size-3.5" /> Verifiable certificate
                </li>
              </ul>

              {course.updated_at ? (
                <p className="border-t pt-4 text-[11px] text-muted-foreground">Updated {formatDate(course.updated_at, 'MMMM yyyy')}</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-14 border-t pt-10">
          <h2 className="text-xl font-semibold tracking-tight">Other courses in the catalog</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <CourseCard key={item.id} course={item} compact />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
