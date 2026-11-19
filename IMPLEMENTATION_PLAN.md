# Learnova LMS — Implementation Plan

> Status legend: [x] complete & verified · [~] implemented, pending verification · [ ] pending
>
> Last updated: 2026-11-15

## Phase 0 — Repository inspection

- [x] Inspected repository: legacy `packages/shared` + `supabase/config.toml`, no runnable app.
- [x] Confirmed required stack: Next.js App Router + Supabase (not the legacy API/PGlite scaffold).
- [x] Fixed Supabase CLI config (`[inbucket]` → `[local_smtp]`, localhost redirects).
- [x] Started local Supabase (Postgres/Auth/Storage) via Docker.
- [x] Documented architecture, schema and plan.

## Phase 1 — Foundation

- [x] Next.js 16 App Router + TypeScript strict + Tailwind v4 + design tokens.
- [x] shadcn/ui-style primitives, shared layouts, sidebar/topbar, light/dark theme.
- [x] Supabase browser/server/admin clients, env validation, error handling.
- [x] Build verification.

## Phase 2 — Database, auth, tenancy, RLS

- [x] Versioned migrations: schema, indexes, triggers, helper functions, RLS, storage buckets.
- [x] Registration/login/logout/email verification/password reset.
- [x] Profiles, organization membership, role-based redirects.
- [x] Protected layouts + proxy session refresh.
- [x] RLS verification script with real accounts.
- [x] Rich seed data.

## Phase 3 — Administrator

- [x] Dashboard with real aggregates.
- [x] User management (search, pagination, filter, create, edit, role, suspend).
- [x] Organization management (super admin) + org branding.
- [x] Course management (create/edit/publish/archive/soft delete, assign instructor).
- [x] Categories, enrollments, analytics.
- [x] Platform settings.
- [x] Instructor request review (approve/reject) in user management.
- [x] Platform owner dashboard (`/admin/platform`, super admin only): cross-tenant
      insights, growth chart, role distribution, tenant activity, permission model,
      recent-account access editing and pending instructor approvals.

## Phase 4 — Instructor

- [x] Dashboard.
- [x] Course builder: sections, lessons, reordering, resources, thumbnails.
- [x] Student progress table.
- [x] Quiz builder with question bank and options.
- [x] Assignment builder and submission grading.
- [x] Instructor analytics.

## Phase 5 — Student

- [x] Dashboard (continue learning, deadlines, achievements).
- [x] Catalog search/filter/pagination, course details, enrollment.
- [x] Learning interface, resources, progress tracking.
- [x] Quiz attempt engine (timer, multiple types, server grading, attempt history).
- [x] Assignment submission + feedback.
- [x] Certificates + public verification + PDF download.
- [x] Profile management.
- [x] Instructor access requests: Learn/Teach registration choice, `/student/become-instructor`
      request + status page, admin notification and approval workflow. Signup can never
      grant a role directly.

## Phase 6 — Advanced

- [x] Notification center (unread count, mark read/all).
- [x] Analytics across roles.
- [x] Certificates auto-issued at completion.
- [x] Search/filter/pagination across modules.
- [x] Consistent loading/empty/error states.

## Phase 7 — Verification

All checks below were executed locally on 2026-11-15 against a freshly reset database
(`npx supabase db reset` → `npm run db:seed`).

- [x] `npm run typecheck` — passes.
- [x] `npm run lint` — passes with 0 errors and 0 warnings.
- [x] `npm run test` — 4 files, 38 tests passed (Vitest + Testing Library).
- [x] `npm run build` — 36 routes compiled with no warnings (Next.js 16
      `proxy.ts` convention in place).
- [x] `npm run verify:rls` — 42/42 checks passed with real Supabase accounts,
      covering anonymous access, tenant isolation, quiz answer secrecy,
      privilege-escalation guards, instructor-request isolation and storage
      policies.
- [x] Playwright E2E — 13/13 smoke tests passed (Chromium): landing page, catalog,
      course detail navigation, certificate verification page, login form,
      authenticated admin/student logins, anonymous redirects for `/dashboard`
      and `/learn/...`, the Learn/Teach registration selector, the student
      instructor-request page, super-admin platform insights and an org admin
      being redirected away from `/admin/platform`.
- [x] Security review: RLS predicates are security-definer functions with
      `search_path = ''`; quiz questions/options are manager-only; attempts and
      grading go through RPCs; grade/role columns are trigger-protected; private
      buckets have no direct policies and are served by authorized routes.
- [x] Instructor approval exercised end to end against the running app: an org
      admin approved the seeded request, the profile role and membership became
      `instructor`, the pending queue refreshed immediately and the person
      appeared under the instructor filter. Demo data was reseeded afterwards and
      the RLS script now removes its fixture request.

## Known issues / external configuration

- Local Supabase runs through Docker. Production requires a Supabase project and SMTP configuration.
- Email confirmation is enabled in production by default; local config disables confirmation for
  frictionless demo seeding, and the app still supports the verification flow.
- Certificate PDF is generated by `pdf-lib` with built-in Helvetica; non-Latin student names fall back
  gracefully. A custom embedded Unicode font can be added for full internationalization.
- Playwright runs against `http://127.0.0.1:3000`. Next 16 blocks cross-origin dev
  resources by default, which silently prevented client hydration; `next.config.ts`
  now lists `127.0.0.1` and `localhost` in `allowedDevOrigins` so interactive
  client components behave in tests exactly as they do locally.
  user and service-role clients because the image omits `allow_delete_query`). Uploads and
  replacements work; avatar removal clears `profiles.avatar_url` instead of deleting the object.
- Uploads locally require the storage compatibility unique index. Migration
  `20251114000900_storage_compat.sql` skips index creation when run as a non-owner, and
  `npm run db:seed` (via `scripts/storage-compat.ts`) applies it as `supabase_storage_admin`.

