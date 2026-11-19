# Learnova LMS — Database Schema

> Supabase Postgres. All application tables live in `public` and are protected by
> row-level security. Migrations are in [`supabase/migrations`](supabase/migrations)
> and are applied in filename order.

## Entity overview

```
auth.users
   └─ profiles (1:1) ── organization_members ── organizations
                          │                        ├─ categories
                          │                        └─ courses
                          │                             ├─ course_sections ─ lessons
                          │                             │                     ├─ lesson_resources
                          │                             │                     ├─ quizzes ─ questions ─ quiz_options
                          │                             │                     └─ assignments
                          │                             ├─ course_instructors
                          │                             └─ enrollments ─ lesson_progress
                          │                                  ├─ quiz_attempts ─ quiz_answers
                          │                                  └─ certificates
                          ├─ notifications
                          ├─ activity_logs (audit)
                          └─ instructor_requests (teaching access workflow)
platform_settings (single row)
```

## Enums

| Enum | Values |
| --- | --- |
| `user_role` | `super_admin`, `org_admin`, `instructor`, `student` |
| `account_status` | `active`, `suspended` |
| `member_status` | `active`, `invited`, `suspended` |
| `course_status` | `draft`, `published`, `archived` |
| `difficulty_level` | `beginner`, `intermediate`, `advanced` |
| `lesson_type` | `video`, `text`, `pdf`, `resource`, `quiz`, `assignment` |
| `enrollment_status` | `pending`, `active`, `completed`, `rejected`, `cancelled` |
| `question_type` | `single`, `multiple`, `true_false`, `short_answer` |
| `submission_status` | `submitted`, `graded`, `returned` |
| `notification_type` | `enrollment`, `lesson`, `assignment`, `deadline`, `quiz`, `grade`, `feedback`, `completion`, `system` |

## Tables

### Tenancy and identity

| Table | Purpose | Key columns / constraints |
| --- | --- | --- |
| `organizations` | Tenant root. | `slug` unique, `primary_color` hex, `is_active`, `deleted_at` soft delete. |
| `platform_settings` | Singleton platform config (`id = true`). | `allow_signups`, `require_enrollment_approval`, branding. Public read, super-admin write. |
| `profiles` | Application user, 1:1 with `auth.users`. | `role`, `status`, `default_org_id`, `email_verified`. Protected columns cannot be changed by users. |
| `organization_members` | User ↔ organization membership. | `unique (org_id, user_id)`, role limited to `org_admin`/`instructor`/`student`. Active membership drives tenant scope. |
| `instructor_requests` | Teaching-access applications from registered students. | `status` `pending`/`approved`/`rejected`, `message`, `reviewed_by`, `reviewed_at`; one pending request per user (partial unique index). Never writes `profiles.role` by itself. |

### Catalog and content

| Table | Purpose | Key columns / constraints |
| --- | --- | --- |
| `categories` | Per-tenant course categories. | `unique (org_id, slug)`, hex `color`. |
| `courses` | Course metadata. | `unique (org_id, slug)`, `status`, `instructor_id`, `published_at`, `deleted_at`, `lesson_count`, `student_count` (trigger-maintained counters). |
| `course_instructors` | Co-instructors. | PK `(course_id, user_id)`. |
| `course_sections` | Ordered curriculum sections. | `position`. |
| `lessons` | Learning units. | `content` (sanitized rich-text HTML or legacy plain text), `video_url`, `is_preview`, `is_published`, `position`. Tenant must match the course. |
| `lesson_resources` | Attachments or external links. | `storage_path` (private bucket) or `external_url`; check requires at least one. |

### Learning and assessment

| Table | Purpose | Key columns / constraints |
| --- | --- | --- |
| `enrollments` | Student ↔ course. | `unique (course_id, student_id)`, `status`, `progress_percent`; created only via `enroll_in_course`. |
| `lesson_progress` | Per-lesson completion. | `unique (enrollment_id, lesson_id)`, `completed_at`. |
| `quizzes` | Quiz settings, one per quiz lesson. | `lesson_id` unique, passing score, max attempts, randomization, time limit. |
| `questions` | Quiz questions. | `type`, `points`, `accepted_answers`; manager-only RLS (never exposed to students). |
| `quiz_options` | Answer options. | `is_correct`; manager-only RLS. |
| `quiz_attempts` | Attempt lifecycle. | `status` `in_progress`/`submitted`, `expires_at`, score, passed; created via RPC. |
| `quiz_answers` | Per-question answers and grading. | `selected_option_ids`, `answer_text`, `is_correct`, `points_awarded`; written by the grading RPC. |
| `assignments` | Assignment lesson settings. | `lesson_id` unique, `due_at`, `max_points`, grading criteria. |
| `assignment_submissions` | Student submission + grade. | One per student/assignment, text and/or private file; students may edit until graded. Grade fields protected by trigger. |

### Communication and audit

| Table | Purpose | Key columns / constraints |
| --- | --- | --- |
| `notifications` | Per-user inbox. | `type`, `link`, `read_at`; users read/update only their own rows. |
| `certificates` | Issued completion certificates. | `enrollment_id` unique, `code` unique, denormalized student/course/instructor/org names for verification. |
| `activity_logs` | Admin-visible audit trail. | `action`, `entity_type`, `entity_id`, `metadata`; written with the service role where needed. |

## Database functions

### Authorization predicates (security definer, `search_path = ''`)

These are the only primitives used by RLS policies, which prevents recursive
policy evaluation and keeps tenant checks consistent.

`is_super_admin`, `is_active_user`, `is_org_member`, `is_org_admin`,
`is_course_manager`, `is_enrolled`, `can_view_course`, `can_view_lesson`,
`is_admin_of_user`, `is_instructor_of_student`, `can_view_profile`,
`current_user_org_ids`, `can_access_lesson_content`, `get_course_curriculum`,
`is_quiz_manager`, `is_assignment_manager`, `can_view_attempt`,
`can_author_in_org`, `is_active_member_of`.

### Data-integrity and security triggers

| Trigger / function | Effect |
| --- | --- |
| `handle_new_user` | Creates a `profiles` row and a default student membership on signup. |
| `handle_user_confirmed` | Marks `profiles.email_verified` after auth confirmation using the `learnova.system_update` flag. |
| `protect_profile_privileges` | Blocks user-scoped changes to `role`, `status`, `email`, `default_org_id`, `email_verified`. |
| `protect_submission_grades` | Blocks students from editing grades/feedback/status after grading. |
| `validate_*_tenant` | Ensures course/section/lesson/quiz/assignment/enrollment/progress/attempt/answer rows share one organization. |
| `protect_enrollment_state` | Restricts student-initiated enrollment changes; progress is RPC-managed. |
| `refresh_course_lesson_count` / `refresh_course_student_count` | Maintain denormalized `courses.lesson_count` and `student_count`. |
| `set_updated_at` | Generic `updated_at` maintenance. |

### RPCs

| Function | Caller | Purpose |
| --- | --- | --- |
| `enroll_in_course(p_course_id)` | authenticated student | Validates visibility/approval, creates the enrollment and notification. |
| `record_lesson_progress(p_lesson_id)` | enrolled student | Upserts progress, recalculates percentage, completes the course and issues a certificate/notification when all published lessons are done. |
| `start_quiz_attempt(p_quiz_id)` | enrolled student | Enforces max attempts and creates an attempt with an expiry. |
| `get_quiz_attempt(p_attempt_id)` | attempt owner/manager | Returns sanitized questions/options (no answer keys) plus attempt metadata. |
| `submit_quiz_attempt(p_attempt_id, p_answers)` | attempt owner | Server-side grading, expiry checks, attempt completion and best-effort lesson progress. |
| `verify_certificate(p_code)` | public | Returns limited certificate verification fields. |
| `get_course_metrics(p_course_ids)` | public | Aggregate ratings/enrollment counts for catalog cards (no private rows). |
| `get_public_stats()` | public | Landing-page platform aggregates. |

## RLS policy map

| Area | Read | Write |
| --- | --- | --- |
| Organizations | Public (active, non-deleted) | Super admin insert/delete; org admin update own org. |
| Platform settings | Public | Super admin only. |
| Profiles | Self, admins of the user, instructors of the student | Self update (non-protected columns); super admin delete. |
| Memberships | Self, org admins, super admin | Org admins / super admin. |
| Categories | Public | Org admin / super admin. |
| Courses | Published/public or members/managers | Course managers and org admins; super admin delete. |
| Sections / lessons / resources | Managers, enrolled students, previews for published content | Course managers only. |
| Enrollments | Student's own, course managers, admins | Managers/admins; student creation only through RPC. |
| Lesson progress | Student's own, course managers | Student own rows, scoped to an active enrollment. |
| Quizzes / assignments | Enrolled students and managers | Managers only. |
| Questions / options | Managers only | Managers only. |
| Attempts / answers | Attempt owner (sanitized) and managers | RPC only. |
| Submissions | Student's own, course managers | Student until graded; managers grade. |
| Notifications | Own rows | Own rows (mark read/delete). |
| Certificates | Owner, managers, admins | Issued by RPC. |
| Activity logs | Org admins / super admin | Service role (trusted server code). |
| Instructor requests | Applicant, org admins, super admin | Applicant insert only (own row, own org, active student, `status = 'pending'`). No user update/delete: approvals and rejections run in server actions with the service role after an explicit scope check, so nobody can approve themselves. |

## Storage

| Bucket | Public | Access model |
| --- | --- | --- |
| `avatars` | Yes | Public read. Authenticated users may insert/update objects under `avatars/{auth.uid()}/...`. |
| `course-media` | No | No direct policies. Authorized server routes use the service-role client after checking enrollment/management. |
| `submissions` | No | No direct policies. Downloads go through `/api/submissions/[id]`; uploads through the submission action. |

Local development note: storage-api 1.27.x issues `ON CONFLICT (name, bucket_id)`
while the local versioned schema only has partial unique indexes. Migration
`20251114000900_storage_compat.sql` and `npm run db:compat` add a compatible
unique index after storage starts. Hosted Supabase already has it.

## Migrations

| File | Contents |
| --- | --- |
| `20251114000100_schema.sql` | Enums, tables, indexes, `updated_at` triggers. |
| `20251114000200_functions.sql` | Authz predicates, auth triggers, integrity triggers, enrollment/progress/certificate RPCs. |
| `20251114000300_rls.sql` | All RLS policies and grants. |
| `20251114000400_storage.sql` | Buckets and avatar policies. |
| `20251114000500_public_metrics.sql` | Public aggregate RPCs. |
| `20251114000600_course_counters.sql` | Denormalized course counters. |
| `20251114000700_quiz_attempts.sql` | Secure quiz attempt RPCs and grants. |
| `20251114000800_profile_trigger_fix.sql` | Email-verification trigger fix. |
| `20251114000900_storage_compat.sql` | Local storage unique index (safe no-op elsewhere). |
| `20251114001000_instructor_requests.sql` | Instructor request table, pending-unique index, RLS policies and grants. |

## Seed data

`scripts/seed.ts` creates ten demo auth users (password `Passw0rd!`) across two
tenants, six courses, 38 lessons, quizzes, assignments, enrollments, progress,
attempts, submissions, notifications, activity logs, a pending instructor
request for `sofia@learnova.test`, and certificate `LUM-A1B2C3D4E5F6`. See the seed
output for the full account list.
