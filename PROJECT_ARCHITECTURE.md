# Learnova LMS — Project Architecture

> Last updated: 2026-11-15
>
> A production-oriented, multi-tenant Learning Management System built with Next.js (App Router),
> Supabase (Postgres, Auth, Storage), TypeScript strict mode, Tailwind CSS and shadcn/ui.

## 1. Current repository state

The repository started as a partial scaffold containing:

- `packages/shared` — a legacy shared types/validation package from an earlier, abandoned
  API + web monorepo attempt (no `apps/` existed).
- `supabase/config.toml` — Supabase CLI project configuration.
- Root `package.json` pointing at workspaces that did not exist.

The legacy package is **preserved for reference but is not part of the build**. The product is now a
single, self-contained Next.js application at the repository root, which matches the required stack
and the suggested `src/` structure in the brief.

## 2. Technology decisions

| Concern            | Decision                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| Framework          | Next.js 16 App Router, React 19, Server Components by default                                                |
| Language           | TypeScript 5.9, `strict`, `noUncheckedIndexedAccess`                                                          |
| Styling            | Tailwind CSS v4 + shadcn/ui primitives (Radix), Lucide icons, CSS variable design tokens, light/dark themes   |
| Database           | Supabase Postgres with enums, FKs, check constraints, indexes, triggers and RLS                               |
| Auth               | Supabase Auth via `@supabase/ssr`, cookie-based sessions, proxy refresh + server-side verification   |
| Mutations          | Server Actions with Zod validation and centralized authorization; Route Handlers for files, PDFs and auth     |
| Reads              | Server Components query Supabase with the user-scoped client so RLS is always enforced                        |
| Client data        | TanStack Query only where live client caching is useful (notifications, quiz timer)                           |
| Forms              | React Hook Form + Zod schemas shared between client and server                                                |
| Charts             | Recharts (client components fed by server-computed aggregates)                                                |
| Rich text          | TipTap (StarterKit + Link + Placeholder)                                                                      |
| Video              | Native HTML5 player + privacy-preserving iframe embeds for YouTube/Vimeo (no extra dependency)                |
| PDF certificates   | `pdf-lib`, generated on demand by a protected Route Handler                                                  |
| Notifications      | In-app notification center, unread counts; persisted in `notifications`                                       |
| Testing            | Vitest (unit + integration), React Testing Library, Playwright (E2E), dedicated RLS verification script       |

## 3. Directory layout

```
src/
  app/
    (auth)/            login, register, forgot-password, reset-password, verify-email
    (public)/          marketing home, catalog, course details, certificate verification
    (admin)/admin/     dashboard, platform (super admin), users, organizations, courses, categories, enrollments, analytics, settings
    (instructor)/instructor/ dashboard, courses (builder), students, assignments, analytics
    (student)/student/ dashboard, my-courses, assignments, certificates, notifications, profile, become-instructor
    learn/[slug]/      distraction-free learning interface + quiz runner
    api/               certificate PDF, storage signed URLs, auth callback
  components/
    ui/                shadcn primitives
    shared/            cross-feature presentation components
    layouts/           public / dashboard shells, sidebar, topbar
    dashboard/         stat cards, empty states, page headers
    forms/             reusable form fields and submit buttons
    tables/            data table pagination / toolbar primitives
    charts/            Recharts wrappers
  features/
    auth/              actions, session helpers
    users/             admin user management, profile
    organizations/     tenant management
    courses/           catalog + authoring actions/queries
    enrollments/       enrollment workflows
    lessons/           lesson content + progress
    quizzes/           quiz authoring, attempt engine, grading
    assignments/       assignment authoring, submission, grading
    notifications/     notification center
    certificates/      issuance (DB function), verification, PDF
    analytics/         role-specific aggregate queries
    platform/          cross-tenant insights for super admins
  lib/
    supabase/          browser.ts, server.ts, admin.ts, middleware.ts
    auth/              requireUser / requireRole / guards
    permissions/       centralized authorization helpers (server-only)
    validations/       Zod schemas
    utils/             cn, formatting, slugs, errors, action results
  types/               generated Supabase database types + app types
  constants/           navigation, labels, prompts
  hooks/               shared client hooks
supabase/
  migrations/          versioned SQL (schema, functions/triggers, RLS, storage)
  seed.sql             idempotent baseline seed (platform + default org)
scripts/
  seed.ts              rich demo data via Admin API (users, courses, assessments, activity)
  verify-rls.ts        automated cross-tenant / role isolation checks using real sessions
tests/
  unit/                pure logic (grading, validations, formatting)
  e2e/                 Playwright role journeys
```

## 4. Multi-tenancy model

- `organizations` is the tenant root. Every tenant-owned row carries `org_id`.
- `profiles.role` is the **platform/primary role** used for routing and global capability checks.
- `organization_members` is the **authoritative tenant membership** (org_admin | instructor | student)
  and is used by RLS to scope access per organization. A user may belong to multiple organizations.
- `super_admin` is platform-level and bypasses tenant scoping through explicit policy branches.
- Instructors are linked to courses by `courses.instructor_id` (owner) and `course_instructors`
  (co-instructors). RLS uses a single `is_course_manager(course_id)` predicate for both.
- RLS predicates are `security definer` SQL functions with `set search_path = ''`, fully qualified
  object names and `stable` volatility. They are the single source of truth for authorization and are
  reused by policies; application code additionally re-checks permissions before privileged
  service-role operations (defense in depth).

### 4.1 Role acquisition is never self-service

Public signup can only ever create a **student** profile (enforced by `handle_new_user` and the
privilege-escalation trigger on `profiles`). Teaching access is requested, not granted:

1. The register form offers "Learn" and "Teach". Choosing Teach creates a normal student account plus
   a pending `instructor_requests` row for the default organization, and notifies that organization's
   admins. The applicant is redirected to `/student/become-instructor`.
2. Existing students can request access from the same page at any time.
3. `instructor_requests` has select/insert policies only. Applicants can see their own row and insert
   one own-organization request while they are an active student (`status = 'pending'`). There is no
   update or delete policy, so self-approval is impossible even with direct API calls.
4. `reviewInstructorRequestAction` verifies the reviewer's admin scope, then uses the service-role
   client to promote the profile to `instructor`, upsert the organization membership, record the
   reviewer/decision, notify the applicant and write an activity log. Approvals are exposed on
   `/admin/users` and `/admin/platform`.

### 4.2 Platform owner dashboard

`/admin/platform` is restricted to `super_admin` (`requireSuperAdmin`; org admins are redirected to
`/admin`). It aggregates cross-tenant data in `src/features/platform/queries.ts`: tenant counts, people
by role, published/draft course counts, enrollments, completion and grading rates, certificates,
recent account growth, per-organization activity, pending instructor requests and the ten most recent
accounts with inline access editing through the shared `UserDialog`. A read-only capability matrix
documents what each role can do, while all actual role changes still flow through the audited admin
actions and Postgres protections.

## 5. Authorization layers (defense in depth)

1. **Proxy** (`src/proxy.ts`, Next 16's middleware convention) refreshes the Supabase session and
   performs coarse route guards. It is not trusted for authorization decisions.
2. **Layout guards** (`requireRole`) verify the user + profile server-side for every dashboard route.
3. **Server Actions / Route Handlers** validate input with Zod and run explicit permission checks
   (course manager, enrollment ownership, attempt ownership, etc.).
4. **Postgres RLS** enforces tenant and record isolation for every table, including direct API access
   with the public anon key.
5. **Rate/size/type validation** for uploads and destructive operations; privilege-escalation triggers
   on `profiles` and `assignment_submissions`.

## 6. Data flow conventions

- Protected reads happen in Server Components using `createServerSupabaseClient()` (user JWT, RLS).
- Mutations are Server Actions returning a discriminated `ActionResult` (`ok`, `error`, optional
  `fieldErrors`). They validate, authorize, mutate, write activity logs/notifications, then
  `revalidatePath`.
- Privileged operations (creating users, grading, reading quiz answer keys) use the service-role
  client **only after** verifying the caller through the user-scoped client and explicit guards.
- Files:
  - `avatars` bucket is public (user-scoped folder upload policy).
  - `course-media` and `submissions` are private. Uploads go through server actions using the admin
    client after authorization; downloads use short-lived signed URLs generated by an authorized
    Route Handler. No client can list or read private buckets directly.
- Quiz answer keys are never selectable by students through RLS; student question payloads are
  sanitized server-side and grading happens server-side.

## 7. Environment variables

See `.env.example`. Required:

| Variable                              | Scope    | Purpose                                  |
| ------------------------------------- | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`            | public   | Supabase project URL                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | public   | Public anon/publishable key              |
| `SUPABASE_SERVICE_ROLE_KEY`           | server   | Admin API + privileged server operations |
| `NEXT_PUBLIC_APP_URL`                 | public   | Canonical app URL for redirects/emails   |
| `SEED_PASSWORD`                       | server   | Demo account password for local seeding  |

Service-role credentials are only imported by `src/lib/supabase/admin.ts`, which is marked
`server-only` and throws if executed in the browser.

## 8. Deployment notes

- Apply `supabase/migrations` with the Supabase CLI or CI (`supabase db push`).
- Set the Auth site URL and redirect allow-list to the production domain.
- Configure SMTP for confirmation/reset emails.
- Create the storage buckets/policies via migration (already versioned).
- Run `npm run build`; deploy to any Next.js-compatible host. Keep `SUPABASE_SERVICE_ROLE_KEY` in
  server-only environment storage.
