# Learnova LMS

A production-oriented, multi-tenant Learning Management System built with the Next.js App Router,
Supabase and Postgres Row Level Security.

Learnova gives one deployment to many organizations while keeping every tenant, course, submission
and certificate isolated. It ships with role-based dashboards for platform owners, organization
admins, instructors and students, a full course builder, secure quizzes, assignment grading,
certificates with public verification, notifications and real database-driven analytics.

**Developer:** Mustafa Muhamed

- **Platform guide (PDF):** [`docs/Learnova-LMS-Platform-Guide.pdf`](docs/Learnova-LMS-Platform-Guide.pdf)
  — regenerate with `npm run docs:pdf`
- **Deployment:** [`DEPLOYMENT.md`](DEPLOYMENT.md) — hosted Supabase, Vercel, owner login and
  instant, verification-free signup
- **Architecture:** [`PROJECT_ARCHITECTURE.md`](PROJECT_ARCHITECTURE.md)
- **Database & RLS:** [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md)
- **Delivery plan & verification:** [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)

## Contents

- [Highlights](#highlights)
- [Tech stack](#tech-stack)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [The platform owner (super admin)](#the-platform-owner-super-admin)
- [Roles and permissions](#roles-and-permissions)
- [Feature tour](#feature-tour)
- [Routes](#routes)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security model](#security-model)
- [Troubleshooting](#troubleshooting)

## Highlights

- **True multi-tenancy** — tenant scope is enforced by Postgres RLS, not only by application code.
- **Four roles** — `super_admin`, `org_admin`, `instructor`, `student`, with separate dashboards.
- **Safe teacher onboarding** — signup can only create students. Teaching access is requested and
  reviewed; nobody can approve their own request.
- **Platform control** — `/admin/platform` gives the platform owner cross-tenant insights, tenant
  activity, a permission matrix, recent-account access editing and instructor-request approvals.
- **Course builder** — sections, ordered lessons, rich text, video, PDFs, resources, previews and
  publishing workflow.
- **Assessments** — secure quizzes with server-side grading, attempt limits, timers and answer-key
  secrecy; assignments with private files, feedback and protected grades.
- **Certificates** — automatic issuance at completion, public verification and server-generated PDFs.
- **Operations** — typed Supabase schema, migrations, idempotent demo seed, live RLS checks,
  unit tests and Playwright journeys.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| UI | Tailwind CSS v4, shadcn/ui-style primitives (Radix), Lucide icons, light/dark themes |
| Data | Supabase Postgres, Auth, Storage, Row Level Security |
| Mutations | Server Actions with Zod validation; Route Handlers for files and PDFs |
| Client state | Server Components by default; TanStack Query where live client caching helps |
| Forms | React Hook Form + Zod schemas shared with the server |
| Charts | Recharts fed by server-computed aggregates |
| Rich text | Tiptap, sanitized with `sanitize-html` |
| PDF | `pdf-lib` (certificates and this guide) |
| Testing | Vitest + Testing Library, Playwright, a live RLS verification script |

## Requirements

- Node.js **20.9+** and npm 10+
- Docker Desktop (for the local Supabase stack)
- Supabase CLI via `npx supabase` (no global install needed)

## Quick start

```bash
npm install
npx supabase start          # Postgres, Auth, Storage, Studio, Mailpit
cp .env.example .env.local  # Windows: Copy-Item .env.example .env.local
npx supabase db reset       # apply migrations + baseline seed
npm run db:seed             # demo tenants, users, courses and assessments
npm run dev
```

Open <http://localhost:3000>.

Copy the values printed by `npx supabase status` into `.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Local API URL, usually `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key; never expose it to the browser |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL, usually `http://localhost:3000` |
| `SEED_PASSWORD` | Optional demo password, defaults to `Passw0rd!` |

Local services:

| Service | URL |
| --- | --- |
| App | <http://localhost:3000> |
| Supabase API | <http://127.0.0.1:54321> |
| Database | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio | <http://127.0.0.1:54323> |
| Mailpit (local inbox) | <http://127.0.0.1:54324> |

## Demo accounts

All seeded accounts use the demo password `Passw0rd!` unless `SEED_PASSWORD` is set differently.

| Email | Role | Name |
| --- | --- | --- |
| `super@learnova.test` | Platform owner (super admin) | Sage Whitfield |
| `admin@learnova.test` | Organization admin, Learnova Academy | Priya Raman |
| `admin@northstar.test` | Organization admin, Northstar Institute | Marcus Bell |
| `maya@learnova.test` | Instructor | Maya Chen |
| `leo@learnova.test` | Instructor | Leo Martins |
| `nina@northstar.test` | Instructor | Nina Patel |
| `student@learnova.test` | Student (completed course + certificate) | Amara Okafor |
| `diego@learnova.test` | Student | Diego Alvarez |
| `sofia@learnova.test` | Student with a pending teacher request | Sofia Rossi |
| `student@northstar.test` | Student in the second tenant | Noah Kim |

The seed also creates two organizations, six courses, 38 lessons, quizzes, assignments, progress,
submissions, notifications, activity logs and a verifiable certificate. Re-run
`npm run db:reset && npm run db:seed` for a clean slate.

## The platform owner (super admin)

A platform owner is a profile with `role = 'super_admin'`. Only this role can open
`/admin/platform`, manage every tenant and grant platform-level roles. Public registration can never
create one.

### Locally

Sign in with `super@learnova.test` / `Passw0rd!`. The local seed always includes this account.

### On a real deployment

Use the bootstrap script. It creates or updates the auth user, promotes the profile, ensures an
organization membership and writes an audit entry.

```bash
npm run admin:create -- owner@example.com "Platform Owner" "S3curePass!" learnova-academy
```

- The password and organization slug are optional.
- If you omit the password, a strong one is generated and printed once.
- If you omit the slug, the first active organization is used.
- Running it again for the same email resets the password and reapplies access, so it doubles as a
  recovery tool.
- It uses the service-role key: run it from a trusted terminal, never from the browser.

Then sign in at `/login`. The owner lands on `/admin`; **Platform control** (`/admin/platform`) is in
the sidebar.

### From the UI (when an owner already exists)

1. Sign in as a platform owner.
2. Open **Admin → Users**.
3. Choose **Add user**, or **Edit** an existing person.
4. Select **Platform administrator** and save.

Only super admins are offered this role. The server action rejects role escalation attempts even if
the request is forged.

### Direct SQL fallback

Role, status, email, default organization and verification fields are protected by the
`profiles_protect_privileges` trigger. If SQL is your only option, use the service role, or disable
the trigger inside a transaction and re-enable it immediately:

```sql
begin;
alter table public.profiles disable trigger profiles_protect_privileges;
update public.profiles
   set role = 'super_admin', status = 'active', email_verified = true
 where email = 'owner@example.com';
alter table public.profiles enable trigger profiles_protect_privileges;
commit;

insert into public.organization_members (org_id, user_id, role, status)
select p.default_org_id, p.id, 'org_admin', 'active'
  from public.profiles p
 where p.email = 'owner@example.com'
on conflict (org_id, user_id) do update set role = 'org_admin', status = 'active';
```

Prefer `npm run admin:create`; it exercises the same service-role path the application uses.

## Roles and permissions

| Capability | Platform owner | Org admin | Instructor | Student |
| --- | :---: | :---: | :---: | :---: |
| All tenants, platform settings, platform roles | ✓ | — | — | — |
| Organization people, branding, categories, enrollments | ✓ | ✓ | — | — |
| Course builder, lessons, quizzes, assignments, grading | ✓ | ✓ | ✓ | — |
| Instructor request approvals | ✓ | ✓ | — | — |
| Learning, submissions and certificates | ✓ | ✓ | ✓ | ✓ |

- `profiles.role` is the primary role used for routing and global capabilities.
- `organization_members.role` is the authoritative per-tenant role used by RLS.
- A user can belong to multiple organizations; `super_admin` has an explicit cross-tenant policy
  branch.
- Suspended accounts are blocked at the session and RLS layers.

## Feature tour

### Platform owner

- Cross-tenant KPIs: active organizations, people, published courses, completion rate.
- Six-month growth chart for new accounts and enrollments.
- People-by-role distribution, grading rate and certificate totals.
- Tenant table with members, courses, enrollments and completion per organization.
- Recent-account access editing (role, organization, status) and a read-only permission matrix.
- Pending instructor requests from every tenant, with approve/reject actions.

### Organization admin

- Real-data dashboard: learners, instructors, courses, enrollments, completion and trends.
- User management with search, filters, pagination, create/edit/suspend and role changes.
- Instructor-request review card at the top of **Users**.
- Organization branding, categories, courses, enrollments, analytics, platform settings and audit
  activity.

### Instructor

- Course builder with sections, ordered lessons, rich text, video, PDFs and resources.
- Quiz builder (single/multiple choice, true/false, short answer), attempt settings and secure
  server-side grading.
- Assignment builder with due dates, points, rubrics, private submissions and feedback.
- Student progress tables and course analytics.

### Student

- Catalog with search, category/difficulty filters and pagination; public course pages and previews.
- Enrollment with optional admin approval.
- Distraction-free learning player, automatic progress and completion.
- Quizzes with timers and attempt history; assignment submissions with files and feedback.
- Certificates with PDF download and a public `/verify` page.
- Notifications, profile management, and **Teach on Learnova** to request instructor access.

## Routes

| Route | Audience |
| --- | --- |
| `/`, `/courses`, `/courses/[slug]`, `/verify` | Public |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Authentication |
| `/admin`, `/admin/platform`, `/admin/users`, `/admin/organizations`, `/admin/courses`, `/admin/categories`, `/admin/enrollments`, `/admin/analytics`, `/admin/settings` | Admin |
| `/instructor`, `/instructor/courses`, `/instructor/courses/[id]`, `/instructor/students`, `/instructor/assignments`, `/instructor/analytics` | Instructor |
| `/student`, `/student/my-courses`, `/student/assignments`, `/student/certificates`, `/student/notifications`, `/student/profile`, `/student/become-instructor` | Student |
| `/learn/[slug]/[lessonId]` | Learning player |
| `/api/certificates/[code]/pdf`, `/api/storage/...` | Protected files |

## Project structure

```
src/
  app/                 App Router routes (public, auth, admin, instructor, student, api)
  components/          UI primitives, layouts, charts, dashboard building blocks
  features/            auth, users, organizations, courses, lessons, quizzes,
                       assignments, certificates, notifications, analytics, platform
  lib/                 Supabase clients, auth guards, scopes, validations, utilities
  types/               Generated Supabase types + application types
  constants/           Navigation and labels
supabase/
  migrations/          Versioned schema, functions/triggers, RLS, storage
  seed.sql             Baseline platform + organization seed
scripts/
  seed.ts              Rich demo data via the Admin API
  create-platform-owner.ts  Bootstrap/promote the super admin
  generate-guide.ts    Builds the PDF platform guide
  verify-rls.ts        Live tenant, role and storage isolation checks
  storage-compat.ts    Local storage compatibility index
tests/
  unit/                Grading, validation and formatting tests
  e2e/                 Playwright role journeys
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js on port 3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Vitest unit and integration tests |
| `npm run test:e2e` | Playwright (starts the dev server if needed) |
| `npm run verify:rls` | Live RLS checks with real signed-in accounts |
| `npm run db:reset` | Recreate the local database from migrations |
| `npm run db:seed` | Storage compatibility + demo data |
| `npm run db:compat` | Apply the storage compatibility index only |
| `npm run db:types` | Regenerate Supabase TypeScript types |
| `npm run admin:create -- <email> [name] [password] [org-slug]` | Create or promote the platform owner |
| `npm run docs:pdf` | Regenerate `docs/Learnova-LMS-Platform-Guide.pdf` |
| `npm run verify:all` | typecheck + lint + unit tests + build |

`npm run db:types` expects the Supabase CLI on `PATH`. If it is not installed globally, use:

```bash
npx supabase gen types typescript --local > src/types/database.ts
```

## Testing

```bash
# Static + unit
npm run typecheck
npm run lint
npm test

# Live checks (requires local Supabase and seeded data)
npx supabase db reset
npm run db:seed
npm run verify:rls
npm run test:e2e
```

Current local snapshot (November 2026): 38 unit tests, 42 live RLS checks and 13 Playwright journeys
pass, and the production build succeeds. Re-run the commands rather than relying on the snapshot.

Playwright runs against `http://127.0.0.1:3000`. Next 16 blocks cross-origin dev resources by default,
so `next.config.ts` lists `127.0.0.1` and `localhost` in `allowedDevOrigins`; without it pages render
but never hydrate in tests.

## Deployment

The full walkthrough is in [`DEPLOYMENT.md`](DEPLOYMENT.md). In short:

1. Create a Supabase project and link it: `npx supabase link --project-ref <ref>`.
2. Push migrations: `npx supabase db push`. Do not create tables by hand.
3. Keep `course-media` / `submissions` private; only `avatars` is public.
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_APP_URL` in the host. Use
   [`.env.production.example`](.env.production.example) as the checklist.
5. In Supabase Auth, set **Site URL** and the redirect allow-list to the deployed domain. Add
   `https://your-domain.com/auth/callback`.
6. Configure custom SMTP if you want reset and invitation mail sent as **Learnova LMS** from your
   domain, then paste the branded files from [`supabase/templates/`](supabase/templates) into
   **Authentication → Emails → Templates**. Signup does not require confirmation mail.
7. Create or recover the platform owner with
   `npm run admin:create -- owner@example.com "Owner"`, then sign in at `/login`.
8. Smoke-test signup (instant access, no verification), password reset, all four roles, enrollment,
   a quiz, an assignment, certificate download and public verification.

`NEXT_PUBLIC_APP_URL` is embedded at build time; changing it requires a redeploy. If it is missing
or still local, the app falls back to the request host, but Supabase still needs the deployed domain
in its redirect allow-list.

The app deploys to any Next.js-compatible host. Keep the service-role key in server-only environment
storage; it bypasses RLS by design.

## Security model

- **RLS everywhere.** Every table has policies; cross-tenant reads return no rows even through direct
  PostgREST calls with the anon key.
- **Security-definer predicates** with `search_path = ''` are the single source of authorization
  truth; application code re-checks before privileged operations.
- **No public privilege escalation.** Signup creates students only; triggers protect role, status,
  email, default organization and verification. Teacher access requires an approved request.
- **Quiz secrecy.** Questions, options and answer keys are manager-only; students receive sanitized
  payloads and the database grades attempts.
- **Private files.** `avatars` is public; `course-media` and `submissions` have no direct policies and
  are served by authorized, short-lived signed URLs.
- **Grade integrity.** Students cannot edit grades, feedback or submission status once graded.
- **Auditability.** Administrative actions and teacher decisions are recorded in `activity_logs`.
- **Least privilege.** Use organization admins for tenant work and keep the platform-owner group
  small.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Registration says signups are disabled | Enable `allow_signups` in **Admin → Settings**. |
| Signup says the email already exists | The address is registered | Sign in instead, or use **Forgot password**. |
| No reset email | Local: open Mailpit at <http://127.0.0.1:54324>. Hosted: check SMTP. |
| Uploads fail after a fresh start | Run `npm run db:seed` or `npm run db:compat` to apply the storage unique index. |
| Client buttons do nothing in Playwright | Keep `127.0.0.1` and `localhost` in `allowedDevOrigins`. |
| Port 3000 is taken | Stop the other process, or run Playwright with `PLAYWRIGHT_PORT`. |
| Demo data looks inconsistent | `npm run db:reset` then `npm run db:seed`. |
| A role change is rejected | Role updates are trigger-protected. Use the admin UI or the service-role bootstrap script. |
| `npm run db:types` cannot find Supabase | Use the `npx supabase gen types ...` form above. |

## License

Internal project. Add a license before distributing outside your organization.
