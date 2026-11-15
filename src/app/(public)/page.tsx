import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Layers,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCategories, getFeaturedCourses } from '@/features/courses/queries';
import { CourseCard } from '@/components/shared/course-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber, percent } from '@/lib/utils';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const [statsResult, featured, categories, organizationsResult, categoryCoursesResult] = await Promise.all([
    supabase.rpc('get_public_stats'),
    getFeaturedCourses(6),
    getCategories(),
    supabase.from('organizations').select('id,name,slug').eq('is_active', true).is('deleted_at', null).limit(6),
    supabase.from('courses').select('category_id').eq('status', 'published').is('deleted_at', null),
  ]);

  const stats = Array.isArray(statsResult.data) ? statsResult.data[0] : null;
  const organizations = organizationsResult.data ?? [];
  const categoryCounts = new Map<string, number>();
  for (const row of categoryCoursesResult.data ?? []) {
    if (row.category_id) categoryCounts.set(row.category_id, (categoryCounts.get(row.category_id) ?? 0) + 1);
  }
  const topCategories = categories
    .filter((category) => categoryCounts.has(category.id))
    .sort((a, b) => (categoryCounts.get(b.id) ?? 0) - (categoryCounts.get(a.id) ?? 0))
    .slice(0, 5);

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] surface-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-24">
          <div>
            <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 px-3 py-1 text-primary">
              <Sparkles className="size-3" /> Built for modern learning organizations
            </Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
              Learning that stays organized, measurable and calm.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              Lumina brings course delivery, assessments, learner progress and certification into a single workspace for
              administrators, instructors and students.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/courses">
                  Explore courses <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">Create an account</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t pt-6">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Published courses</dt>
                <dd className="mt-1 text-2xl font-semibold">{formatNumber(stats?.courses ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Active learners</dt>
                <dd className="mt-1 text-2xl font-semibold">{formatNumber(stats?.learners ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Organizations</dt>
                <dd className="mt-1 text-2xl font-semibold">{formatNumber(stats?.organizations ?? 0)}</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative rounded-2xl border bg-card p-5 shadow-[var(--shadow-elevated)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <PlayCircle className="size-4" />
                  </span>
                  Continue learning
                </div>
                <Badge variant="muted">This week</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { title: 'Product design foundations', meta: 'Module 3 · Interaction patterns', progress: 68 },
                  { title: 'TypeScript engineering', meta: 'Module 2 · Type-safe APIs', progress: 42 },
                  { title: 'Data storytelling', meta: 'Completed · Certificate issued', progress: 100 },
                ].map((item) => (
                  <div key={item.title} className="rounded-lg border bg-background/60 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <span className="text-xs font-medium text-muted-foreground">{percent(item.progress)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
                    <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
                <div>
                  <p className="text-lg font-semibold">12</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lessons</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">4</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Assessments</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">2</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Certificates</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-xl border bg-card p-3 shadow-[var(--shadow-elevated)] sm:block">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Award className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold">Certificate verified</p>
                  <p className="text-[10px] text-muted-foreground">Public verification code</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {organizations.length ? (
        <section className="border-b bg-muted/20">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:px-6 md:flex-row md:justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Learning spaces powered by Lumina
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {organizations.map((organization) => (
                <span key={organization.id} className="text-sm font-semibold tracking-tight text-foreground/60">
                  {organization.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Course catalog</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Start with a course that matters</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Every course is structured into modules, lessons and assessments, with clear progress from first lesson to
              certificate.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/courses">
              Browse all courses <ArrowRight />
            </Link>
          </Button>
        </div>

        {featured.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed bg-muted/20 p-10 text-center">
            <BookOpenCheck className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">The catalog is being prepared</p>
            <p className="mt-1 text-sm text-muted-foreground">Published courses will appear here as organizations go live.</p>
          </div>
        )}

        {topCategories.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {topCategories.map((category) => (
              <Link
                key={category.id}
                href={`/courses?category=${category.slug}`}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/30 hover:text-primary"
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
                <span className="text-muted-foreground">{categoryCounts.get(category.id)}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="border-y bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">One platform, three workspaces</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Purpose-built for every role</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Separate dashboards, permissions and workflows — connected by a single, secure data model.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Administrators',
                copy: 'Manage users, organizations, instructors, enrollments and platform analytics with tenant-isolated oversight.',
                points: ['Role & access management', 'Organization branding', 'Platform-wide reporting'],
              },
              {
                icon: Layers,
                title: 'Instructors',
                copy: 'Build structured courses, author lessons and assessments, review submissions and follow learner progress.',
                points: ['Sections, lessons & resources', 'Quiz and assignment builder', 'Grading workflow'],
              },
              {
                icon: GraduationCap,
                title: 'Students',
                copy: 'Learn in a focused interface, track progress, take assessments and earn verifiable certificates.',
                points: ['Guided course player', 'Assignments & feedback', 'Certificates & verification'],
              },
            ].map((role) => (
              <div key={role.title} className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <role.icon className="size-4.5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{role.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{role.copy}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {role.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-emerald-500" /> {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Platform capabilities</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Everything the learning lifecycle needs</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Not a collection of disconnected tools. Courses, lessons, assessments and records share the same
              authorization model and database — so reporting and progress stay trustworthy.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Layers, title: 'Structured courses', copy: 'Sections, ordered lessons, resources and publishing controls.' },
              { icon: ClipboardCheck, title: 'Assessment engine', copy: 'Quizzes with four question types, attempts, timing and server grading.' },
              { icon: BarChart3, title: 'Progress analytics', copy: 'Enrollment trends, completion rates and learner engagement.' },
              { icon: Award, title: 'Certificates', copy: 'Automatic issuance with unique public verification codes.' },
              { icon: Users, title: 'Multi-organization', copy: 'Tenant isolation enforced by Postgres row-level security.' },
              { icon: ShieldCheck, title: 'Secure by design', copy: 'Role checks at every layer, private files and audit trails.' },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border bg-card p-4">
                <feature.icon className="size-4 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">{feature.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feature.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="for-organizations" className="border-t bg-[oklch(0.2_0.04_277)] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:py-20">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">For organizations</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Give every team a learning space they can trust.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Onboard instructors, publish structured programs, monitor completion and issue certificates — all within
              your own organization boundary.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90">
              <Link href="/register">
                Get started <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href="/verify">Verify a certificate</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
